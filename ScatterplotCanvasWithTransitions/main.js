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
var x_transform;          // chosen transform for x-data
var y_transform;          // chosen transform for y-data
var show_heat = false;    // whether to show heat map
var x_pre_scale;          // pre-scale factor for x data
var y_pre_scale;          // pre-scale factor for y data
var x_data;               // x data series to plot
var y_data;               // y data series to plot
var x_range;              // used for "auto-range" for chosen x category
var y_range;              // used for "auto-range" for chosen y category
var x_scale;              // function to convert x data to svg pixels
var y_scale;              // function to convert y data to svg pixels
var flow_data;            // FCS data
var parameter_list = [];  // flow data column names
var subsample_count = 10000;  // Number of events to subsample

// Transition variables
var prev_position = [];         // prev_position [x, y, color] pairs
var transition_count = 0;       // used to cancel old transitions

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

// Heat map stuff
var heat_map_data = [];
d3.select("#scatterplot")
    .append("canvas")
    .attr("id", "heat_map_canvas")
    .attr("width", canvas_width)
    .attr("height", canvas_height);

var heat_map_canvas = document.getElementById("heat_map_canvas");
var heat_map_ctx = heat_map_canvas.getContext('2d');

var heat_cfg = {
    canvas: heat_map_canvas,
    radius: 5
};

var heat_map = heat.create(heat_cfg);

function asinh(number) {
    return Math.log(number + Math.sqrt(number * number + 1));
}

// load the CSV data
d3.csv("../data/example_fcs_data.csv", function(error, data) {
    flow_data = data.slice(0, subsample_count);

    // Grab our column names
    for (var key in data[0]) {
        if (key != "category") {
            parameter_list.push(key);
        }
    }

    // Populate x & y select options, both get all the parameter_list
    for (var i in parameter_list) {
        $("#xList_select")
            .append($('<option></option>')
                .attr("value", parameter_list[i])
                .text(parameter_list[i]));
        $("#yList_select")
            .append($('<option></option>')
                .attr("value", parameter_list[i])
                .text(parameter_list[i]));
    }

    // render initial data points
    prev_position = flow_data.map(function (d) {
        return [canvas_width/2, canvas_height/2, "rgba(96, 96, 212, 1.0)"]; });
    prev_position.forEach(circle);

    plot();
});

function plot() {
    // Get current x & y categories from the select option
    x_cat = $("#xList_select").val();
    y_cat = $("#yList_select").val();

    // Get user select transform
    x_transform = $("#x_transform_select").val();
    y_transform = $("#y_transform_select").val();

    // Get user pre-scale value
    x_pre_scale = parseFloat($("#x_scale_select").val());
    y_pre_scale = parseFloat($("#y_scale_select").val());

    // Determine whether user wants to see the heat map
    show_heat = $("#heat_map_checkbox").is(':checked');

    // Update the axes' labels with the new categories
    x_label.text(x_cat);
    y_label.text(y_cat);

    x_data = [];
    y_data = [];

    // Transform data by asinh, but scale down first
    for (var i = 0, len = flow_data.length; i < len; i++) {
        switch (x_transform) {
            case 'lin':
                x_data[i] = flow_data[i][x_cat] * x_pre_scale;
                break;
            case 'asinh':
                x_data[i] = asinh(flow_data[i][x_cat] * x_pre_scale);
                break;
            default:
                x_data[i] = flow_data[i][x_cat] * x_pre_scale;
        }
        switch (y_transform) {
            case 'lin':
                y_data[i] = flow_data[i][y_cat] * y_pre_scale;
                break;
            case 'asinh':
                y_data[i] = asinh(flow_data[i][y_cat] * y_pre_scale);
                break;
            default:
                y_data[i] = flow_data[i][y_cat] * y_pre_scale;
        }
    }

    // Get the new ranges to calculate the axes' scaling
    x_range = d3.extent(x_data, function(d) { return parseFloat(d);});
    y_range = d3.extent(y_data, function(d) { return parseFloat(d);});

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

    // Clear heat map canvas before the transitions
    heat_map_ctx.clearRect(
        0, 0, heat_map_ctx.canvas.width, heat_map_ctx.canvas.height);
    heat_map_data = [];

    transition(++transition_count);
}

function transition(count) {
    // calculate next positions
    var next_position = [];
    for (var i = 0, len = flow_data.length; i < len; i++) {
        var x = x_scale(x_data[i]);
        var y = y_scale(y_data[i]);
        var color = "rgba(96, 96, 212, 1.0)";

        next_position.push([x, y, color]);
    }

    var interpolator = d3.interpolate(prev_position, next_position);

    // run transition
    d3.timer(function(t) {
        // Clear canvas
        // Use the identity matrix while clearing the canvas
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // abort old transition
        if (count < transition_count) return true;

        if (t > 2000) {
            prev_position = next_position;
            prev_position.forEach(circle);

            if (show_heat) {
                heat_map_ctx.clearRect(
                    0,
                    0,
                    heat_map_ctx.canvas.width,
                    heat_map_ctx.canvas.height
                );

                prev_position.forEach(function(pos) {
                    heat_map_data.push({x:pos[0], y:pos[1]});
                });

                heat_map.set_data(heat_map_data);
                heat_map.colorize();
            }

            return true
        }

        prev_position = interpolator(t/2000);
        prev_position.forEach(circle);

        return false;
    });
}

// render circle [x,y,color]
function circle(pos) {
    ctx.strokeStyle = pos[2];
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], 1.5, 0, 2*Math.PI, false);
    ctx.stroke();
}