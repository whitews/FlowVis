var width  = 630;         // width of the svg element
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
var x_scale_canvas;       // function to convert x data to canvas pixels
var y_scale_canvas;       // function to convert y data to canvas pixels
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

// A tooltip for displaying the point's event values
var tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("z-index", "100")
    .style("visibility", "hidden");

// Heat map stuff
var heat_map_canvas = d3.select("#scatterplot")
    .append("canvas")
    .attr("width", width)
    .attr("height", height);

var heat_cfg = {
    canvas: heat_map_canvas[0][0],
    translate: [margin.left, height-margin.bottom]
};

var heat_map = heat.create(heat_cfg);

function asinh(number) {
    number = number * 0.001;
    return Math.log(number + Math.sqrt(number * number + 1));
}

// load the CSV data
d3.csv("example.csv", function(error, data) {
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

    // Transform data by asinh
    for (var i = 0, len = data.length; i < len; i++) {
        data[i][x_cat] = asinh(data[i][x_cat]);
        data[i][y_cat] = asinh(data[i][y_cat]);
    }

    // Get the new ranges to calculate the axes' scaling
    x_range = d3.extent(data, function(d) { return parseFloat(d[x_cat]);});
    y_range = d3.extent(data, function(d) { return parseFloat(d[y_cat]);});

    // Update scaling functions for determining placement of the x and y axes
    x_scale = d3.scale.linear().domain(x_range).range([0, width-margin.left-margin.right]);
    y_scale = d3.scale.linear().domain(y_range).range([0, -(height-margin.top-margin.bottom)]);

    // Update axes with the proper scaling
    x_axis.call(d3.svg.axis().scale(x_scale).orient("bottom"));
    y_axis.call(d3.svg.axis().scale(y_scale).orient("left"));

    // Plot the data points in the canvas & calculate density
    var heat_map_data = [];
    var dx, dy;
    data.forEach(function (d) {
        dx = x_scale(d[x_cat]);
        dy = y_scale(d[y_cat]);

        ctx.strokeStyle = "rgba(0, 85, 221, 0.8)";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(dx, dy, 1.5, 0, 2*Math.PI, false);
        ctx.stroke();

        heat_map_data.push({x:dx, y:dy})
    });

    heat_map.set_data(heat_map_data);
    heat_map.colorize();
});