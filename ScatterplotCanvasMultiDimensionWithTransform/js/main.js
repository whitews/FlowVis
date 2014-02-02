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
    flow_data = data;

    // Grab our column names
    for (var key in data[0]) {
        if (key != "category") {
            parameter_list.push(key);
        }
    }

    // Populate x & y select options, both get all the columns
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

    plot();
});

// Heat map stuff
var heat_map_canvas = d3.select("#scatterplot")
    .append("canvas")
    .attr("width", width)
    .attr("height", height);

var heat_map_ctx = heat_map_canvas[0][0].getContext('2d');

var heat_cfg = {
    canvas: heat_map_canvas[0][0],
    translate: [margin.left, height-margin.bottom]
};

var heat_map = heat.create(heat_cfg);

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

    // Update scaling functions for determining placement of the x and y axes
    x_scale = d3.scale.linear().domain(x_range).range([0, width-margin.left-margin.right]);
    y_scale = d3.scale.linear().domain(y_range).range([0, -(height-margin.top-margin.bottom)]);

    // Update axes with the proper scaling
    x_axis.call(d3.svg.axis().scale(x_scale).orient("bottom"));
    y_axis.call(d3.svg.axis().scale(y_scale).orient("left"));

    // Clear canvas
    // Use the identity matrix while clearing the canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();
    
    // Clear heat map canvas
    // Use the identity matrix while clearing the canvas
    heat_map_ctx.save();
    heat_map_ctx.setTransform(1, 0, 0, 1, 0, 0);
    heat_map_ctx.clearRect(
        0, 0, heat_map_ctx.canvas.width, heat_map_ctx.canvas.height);
    heat_map_ctx.restore();

    // Plot the data points in the canvas
    var heat_map_data = [];
    for (var i = 0; i < flow_data.length; i++) {
        dx = x_scale(x_data[i]);
        dy = y_scale(y_data[i]);

        ctx.strokeStyle = "rgba(96, 96, 212, 1.0)";
        ctx.lineWidth = 1;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(dx, dy, 1.5, 0, 2*Math.PI, false);
        ctx.stroke();

        heat_map_data.push({x:dx, y:dy});
    }

    if (show_heat) {
        heat_map.set_data(heat_map_data);
        heat_map.colorize();
    }
}