var width  = 680;         // width of the svg element
var height = 580;         // height of the svg element
var margin = {            // used mainly for padding the axes' labels
    top: 10,
    right: 20,
    bottom: 40,
    left: 80
}
var radius = 3;           // circle radius for plotted points
var x_cat;                // chosen plot parameter for x-axis
var y_cat;                // chosen plot parameter for y-axis
var x_range;              // used for "auto-range" for chosen x category
var y_range;              // used for "auto-range" for chosen x category
var x_scale;              // function to convert x data to svg pixels
var y_scale;              // function to convert y data to svg pixels
var parameter_list = [];  // flow data column names

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

// A tooltip for displaying the point's event values
var tooltip = d3.select("body")
    .append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("z-index", "100")
    .style("visibility", "hidden");

// load the CSV data
d3.csv("986d883313.csv", function(error, data) {
    // Grab our column names
    for (var key in data[0]) {
        if (key != "category") {
            parameter_list.push(key);
        }
    }

    // Choose random x & y categories
    x_cat = parameter_list[Math.floor(Math.random()*parameter_list.length)];
    y_cat = parameter_list[Math.floor(Math.random()*parameter_list.length)];

    // Update the axes' labels with the new categories
    x_label.text(x_cat);
    y_label.text(y_cat);

    // Get the new ranges to calculate the axes' scaling
    x_range = d3.extent(data, function(d) { return parseInt(d[x_cat]);});
    y_range = d3.extent(data, function(d) { return parseInt(d[y_cat]);});

    // Pad ranges by 5% so the points aren't right on the edge
    x_range[0] = Math.round(x_range[0]*.90);
    x_range[1] = Math.round(x_range[1]*1.02);
    y_range[0] = Math.round(y_range[0]*.90);
    y_range[1] = Math.round(y_range[1]*1.02);

    // Update scaling functions for determining placement of the x and y axes
    x_scale = d3.scale.linear().domain(x_range).range([0, width-margin.left-margin.right]);
    y_scale = d3.scale.linear().domain(y_range).range([0, -(height-margin.top-margin.bottom)]);

    // Update axes with the proper scaling
    x_axis.call(d3.svg.axis().scale(x_scale).orient("bottom"));
    y_axis.call(d3.svg.axis().scale(y_scale).orient("left"));

    // Plot the data points as SVG circle elements
    plot_area.selectAll("circle").data(data).enter()
        .append("circle")
            .attr("cx", function (d) { return x_scale(d[x_cat]); })
            .attr("cy", function (d) { return y_scale(d[y_cat]); })
            .attr("r", radius)
            .on("mouseover", function(d) {  // setup our mouseover
                tooltip.style("visibility", "visible");
                tooltip.text(d[x_cat] + ", " + d[y_cat]);
            })
            .on("mousemove", function(){return tooltip.style("top",
                (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10) + "px");})
            .on("mouseout", function(){return tooltip.style("visibility", "hidden");});
});
