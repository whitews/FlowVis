var width  = 680;          // width of the svg element
var height = 580;          // height of the svg element
var margin = {             // used mainly for padding the axes' labels
    top: 10,
    right: 20,
    bottom: 40,
    left: 80
};
var radius = 3;            // circle radius for plotted points

// 1st set of axes
var x1_cat;                // chosen plot parameter for x1-axis
var y1_cat;                // chosen plot parameter for y1-axis
var x1_range;              // used for "auto-range" for chosen x category
var y1_range;              // used for "auto-range" for chosen x category

// 2nd set of axes
var x2_cat;                // chosen plot parameter for x2-axis
var y2_cat;                // chosen plot parameter for y2-axis
var x2_range;              // used for "auto-range" for chosen x category
var y2_range;              // used for "auto-range" for chosen x category

var x_scale;              // function to convert x data to svg pixels
var y_scale;              // function to convert y data to svg pixels
var x_range;              // used for "auto-range" for chosen x category
var y_range;              // used for "auto-range" for chosen x category
var lines;                 // svg line elements for the data point transitions
var flow_data;             // flow data array
var parameter_list = [];   // flow data column names
var transition_ms = 2000;  // default time in milliseconds for the plot animation

var svg = d3.select("#scatterplot")
    .append("svg")
    .attr("width" , width)
    .attr("height" , height);

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

// load the CSV and save the data
d3.csv("../data/986d883313.csv", function(error, data) {
    flow_data = data;

    // Grab our column names while we're here
    for (var key in flow_data[0]) {
        if (key != "category") {
            parameter_list.push(key);
        }
    }

    // Populate x & y select options, both get all the columns
    for (var i in parameter_list) {
        $("#x1List_select")
            .append($('<option></option>')
                .attr("value", parameter_list[i])
                .text(parameter_list[i]));
        $("#y1List_select")
            .append($('<option></option>')
                .attr("value", parameter_list[i])
                .text(parameter_list[i]));
        
        $("#x2List_select")
            .append($('<option></option>')
                .attr("value", parameter_list[i])
                .text(parameter_list[i]));
        $("#y2List_select")
            .append($('<option></option>')
                .attr("value", parameter_list[i])
                .text(parameter_list[i]));
    }

    // Initialize our plot points (line elements)
    //   - note the initial positions are at (0, 0)
    lines = plot_area.selectAll("line").data(flow_data);

    lines.enter()
        .append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", 0)
        .attr("y2", 0)
        .attr("stroke-width", 6)
        .attr("stroke-linecap", "round")
        .attr("opacity", 0.3)
        .attr("stroke", "#1f77b4");

    // Might as well show the user an initial plot!
    plot();
});

function plot() {
    // Get current x & y categories from the select option
    x1_cat = $("#x1List_select").val();
    y1_cat = $("#y1List_select").val();
    x2_cat = $("#x2List_select").val();
    y2_cat = $("#y2List_select").val();

    // Update the axes' labels with the new categories
    x_label.text(x1_cat + " -> " + x2_cat);
    y_label.text(y1_cat + " -> " + y2_cat);

    // Get the new ranges to calculate the axes' scaling
    x1_range = d3.extent(flow_data, function(d) { return parseInt(d[x1_cat]);});
    y1_range = d3.extent(flow_data, function(d) { return parseInt(d[y1_cat]);});
    x2_range = d3.extent(flow_data, function(d) { return parseInt(d[x2_cat]);});
    y2_range = d3.extent(flow_data, function(d) { return parseInt(d[y2_cat]);});
    
    // Pad ranges by 5% so the points aren't right on the edge
    x_range = [];
    y_range = [];

    if (x1_range[0] < x2_range[0]) {
        x_range.push(x1_range[0]);
    } else {
        x_range.push(x2_range[0]);
    }

    if (x1_range[1] > x2_range[1]) {
        x_range.push(x1_range[1]);
    } else {
        x_range.push(x2_range[1]);
    }

    if (y1_range[0] < y2_range[0]) {
        y_range.push(y1_range[0]);
    } else {
        y_range.push(y2_range[0]);
    }

    if (y1_range[1] > y2_range[1]) {
        y_range.push(y1_range[1]);
    } else {
        y_range.push(y2_range[1]);
    }
    
    // Update scaling functions for determining placement of the x and y axes
    x_scale = d3.scale.linear().domain(x_range).range([0, width-margin.left-margin.right]);
    y_scale = d3.scale.linear().domain(y_range).range([0, -(height-margin.top-margin.bottom)]);
    
    // Update axes with the proper scaling
    x_axis.call(d3.svg.axis().scale(x_scale).orient("bottom"));
    y_axis.call(d3.svg.axis().scale(y_scale).orient("left"));

    // Update the cx & cy attributes of our lines
    lines.transition().duration(transition_ms)
        .attr("x1", function (d) { return x_scale(d[x1_cat]); })
        .attr("y1", function (d) { return y_scale(d[y1_cat]); })
        .attr("x2", function (d) { return x_scale(d[x2_cat]); })
        .attr("y2", function (d) { return y_scale(d[y2_cat]); });
}