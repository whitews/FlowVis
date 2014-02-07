var width  = 680;         // width of the svg element
var height = 580;         // height of the svg element
var margin = {            // used mainly for padding the axes' labels
    top: 10,
    right: 20,
    bottom: 40,
    left: 80
};
var radius = 1;           // circle radius for plotted points
var x_cat;                // chosen plot parameter for x-axis
var y_cat;                // chosen plot parameter for y-axis
var x_range;              // used for "auto-range" for chosen x category
var y_range;              // used for "auto-range" for chosen x category
var x_scale;              // function to convert x data to svg pixels
var y_scale;              // function to convert y data to svg pixels
var flow_data;            // FCS data
var parameter_list = [];  // flow data column names

var svg = d3.select("#scatterplot")
    .append("svg")
    .attr("width" , width)
    .attr("height" , height);

var canvas = d3.select("#scatterplot")
    .append("canvas")
    .attr("width", width)
    .attr("height", height);

var ctx = canvas[0][0].getContext('2d');
ctx.translate(margin.left, height-margin.bottom);

var plot_area = svg.append("g")
    .attr("id", "plot-area")
    .attr("transform", "translate(" + margin.left + ", " + (height - margin.bottom) + ")");

var x_axis = plot_area.append("g")
    .attr("class", "axis");

var y_axis = plot_area.append("g")
    .attr("class", "axis");

var x_label = svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "translate(" + ((width+margin.right)/2) + "," + height + ")");

var y_label = svg.append("text")
    .attr("class", "axis-label")
    .attr("transform", "translate(" + margin.left/4 + "," + height/2 + ") rotate(-90)");

// Sub-selection stuff
var p1 = false;
var p2 = [0, 0];

var drag = d3.behavior.drag()
    .on("drag", function(d,i) {
        p2 = [d3.event.x, d3.event.y];

        if (!p1) p1 = p2;

        // sweeper
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.strokeStyle = "#0f8";
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]);
        ctx.lineTo(p2[0], p2[1]);
        ctx.stroke();
        ctx.restore();
    })
    .on("dragend", function(d, i) {
        p1 = false;
    });

d3.select("canvas")
  .call(drag);

// load the CSV data
d3.csv("../data/example.csv", function(error, data) {
    flow_data = data;

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
    x_range = d3.extent(data, function(d) { return parseFloat(d[x_cat]);});
    y_range = d3.extent(data, function(d) { return parseFloat(d[y_cat]);});

    // Update scaling functions for determining placement of the x and y axes
    x_scale = d3.scale.linear().domain(x_range).range([0, width-margin.left-margin.right]);
    y_scale = d3.scale.linear().domain(y_range).range([0, -(height-margin.top-margin.bottom)]);

    // Update axes with the proper scaling
    x_axis.call(d3.svg.axis().scale(x_scale).orient("bottom"));
    y_axis.call(d3.svg.axis().scale(y_scale).orient("left"));

    // Plot the data points in the canvas
    data.forEach(function (d) {
        dx = x_scale(d[x_cat]);
        dy = y_scale(d[y_cat]);

        ctx.strokeStyle = "rgba(96, 96, 212, 1.0)";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(dx, dy, 1.5, 0, 2*Math.PI, false);
        ctx.stroke();
    });
});