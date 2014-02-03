var width  = 680;         // width of the svg element
var height = 580;         // height of the svg element
var margin = {            // used mainly for padding the axes' labels
    top: 10,
    right: 20,
    bottom: 40,
    left: 80
};
var x_cat;                // chosen plot parameter for x-axis
var y_cat;                // chosen plot parameter for y-axis
var x_transform;          // chosen transform for x-data
var y_transform;          // chosen transform for y-data
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

// load the CSV data
d3.csv("example_fcs_data.csv", function(error, data) {
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
    prev_position = flow_data.map(function (d) { return ['0','0',"rgba(96, 96, 212, 0.8)"]; });
    prev_position.forEach(circle);

    plot();
});

function asinh(number) {
    return Math.log(number + Math.sqrt(number * number + 1));
}

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

    transition(++transition_count);
}

function transition(count) {
    // Get the new ranges to calculate the axes' scaling
    x_range = d3.extent(x_data, function(d) { return parseFloat(d);});
    y_range = d3.extent(y_data, function(d) { return parseFloat(d);});

    // Update scaling functions for determining placement of the x and y axes
    x_scale = d3.scale.linear().domain(x_range).range([0, width-margin.left-margin.right]);
    y_scale = d3.scale.linear().domain(y_range).range([0, -(height-margin.top-margin.bottom)]);

    // Update axes with the proper scaling
    x_axis.call(d3.svg.axis().scale(x_scale).orient("bottom"));
    y_axis.call(d3.svg.axis().scale(y_scale).orient("left"));

    // calculate next positions
    var next_position = [];
    for (var i = 0, len = flow_data.length; i < len; i++) {
        var x = x_scale(x_data[i]);
        var y = y_scale(y_data[i]);
        var color = "rgba(96, 96, 212, 0.8)";

        next_position.push([x, y, color]);
    }

    var transition = d3.interpolate(prev_position, next_position);

    // run transition
    d3.timer(function(t) {
        // Clear canvas
        // Use the identity matrix while clearing the canvas
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.restore();

        // abort old transition
        if (count < transition_count) return true;

        if (t > 2000) {
            prev_position = next_position;
            prev_position.forEach(circle);
            return true
        }

        prev_position = transition(t/2000);
        prev_position.forEach(circle);
    });
}

// render circle [x,y,color]
function circle(pos) {
    ctx.strokeStyle = pos[2];
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1.0;
    ctx.beginPath();
    ctx.arc(pos[0], pos[1], 1.5, 0, 2*Math.PI, false);
    ctx.stroke();
}