var width  = 620;         // width of the svg element
var height = 580;         // height of the svg element
var canvas_width = 540;   // width of the canvas
var canvas_height = 540;  // height of the canvas
var margin = {            // used mainly for positioning the axes' labels
    top: 0,
    right: 0,
    bottom: height - canvas_height,
    left: width - canvas_width
};
var x_cat;                // chosen plot parameter for x-axis
var y_cat;                // chosen plot parameter for y-axis
var x_range;              // used for "auto-range" for chosen x category
var y_range;              // used for "auto-range" for chosen y category
var x_scale;              // function to convert x data to svg pixels
var y_scale;              // function to convert y data to svg pixels
var parameter_list = [];  // flow data column names
var radius = 1.5;
var subsample_count = 15000;

var svg = d3.select("#scatterplot")
    .append("svg")
    .attr("width" , width)
    .attr("height" , height);

// create canvas for plot, it'll just be square as the axes will be drawn
// using svg...will have a top and right margin though
d3.select("#scatterplot")
    .append("canvas")
    .attr("id", "canvas_plot")
    .attr("width", canvas_width)
    .attr("height", canvas_height);

var canvas = document.getElementById("canvas_plot");

var ctx = canvas.getContext('2d');

var plot_area = svg.append("g")
    .attr("id", "plot-area");

var x_axis = plot_area.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + margin.left + "," + canvas_height + ")");

var y_axis = plot_area.append("g")
    .attr("class", "axis")
    .attr("transform", "translate(" + margin.left + "," + 0 + ")");

var x_label = svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "translate(" + (canvas_width/2 + margin.left) + "," + (height-3) + ")");

var y_label = svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "translate(" + margin.left/4 + "," + (canvas_height/2) + ") rotate(-90)");

// Sub-selection stuff
var p1 = false;
var p2 = [0, 0];

var drag = d3.behavior.drag()
    .on("drag", function(d,i) {
        p2 = [d3.event.x, d3.event.y];

        if (!p1) p1 = p2;

        // sweeper
        ctx.strokeStyle = "#0f8";
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
    })
    .on("dragend", function(d, i) {
        p1 = false;
    });

d3.select("canvas")
  .call(drag);

// load the CSV data
d3.csv("../data/example.csv", function(error, data) {
    // Check if data length is shorter than our subsample count, if so
    // reset the subsample count so we don't iterate out of bounds
    if (data.length < subsample_count) {
        subsample_count = data.length;
    }

    // Grab our column names
    for (var key in data[0]) {
        if (key != "category") {
            parameter_list.push(key);
        }
    }

    // Choose random x & y categories
    x_cat = parameter_list[0];
    y_cat = parameter_list[1];

    // Update the axes' labels with the new categories
    x_label.text(x_cat);
    y_label.text(y_cat);

    // Get the new ranges to calculate the axes' scaling
    x_range = d3.extent(data.slice(0, subsample_count), function(d) {
        return parseFloat(d[x_cat]);
    });
    y_range = d3.extent(data.slice(0, subsample_count), function(d) {
        return parseFloat(d[y_cat]);
    });

    // pad ranges a bit, keeps the data points from overlapping the plot's edge
    x_range[0] = x_range[0] - (x_range[1] - x_range[0]) * 0.01;
    x_range[1] = x_range[1] + (x_range[1] - x_range[0]) * 0.01;
    y_range[0] = y_range[0] - (y_range[1] - y_range[0]) * 0.01;
    y_range[1] = y_range[1] + (y_range[1] - y_range[0]) * 0.01;

    // Update scaling functions for determining placement of the x and y axes
    x_scale = d3.scale.linear().domain(x_range).range([0, canvas_width]);
    y_scale = d3.scale.linear().domain(y_range).range([canvas_height, 0]);

    // Update axes with the proper scaling
    x_axis.call(d3.svg.axis().scale(x_scale).orient("bottom"));
    y_axis.call(d3.svg.axis().scale(y_scale).orient("left"));

    // Plot the data points in the canvas
    var dx, dy;
    for (var i = 0; i < subsample_count; i++) {
        dx = x_scale(data[i][x_cat]);
        dy = y_scale(data[i][y_cat]);

        ctx.strokeStyle = "rgba(96, 96, 212, 1.0)";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(dx, dy, radius, 0, 2*Math.PI, false);
        ctx.stroke();
    }
});