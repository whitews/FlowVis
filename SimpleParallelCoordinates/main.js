var width = 960;
var height = 540;
var margin = {
    top: 10,
    right: 20,
    bottom: 10,
    left: 20
};
var axes;
var parameter_list = [];  // flow data column names
var parameter_extent_dict = {};
var parameter_scale_functions = {};  // functions for scaling the parameters
var max_of_the_maxes = 0;

var svg = d3.select("#parallelplot")
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);

var chart = svg.append("g")
    .attr('id', 'body')
    .attr("transform", "translate(" + margin.left + ", " + (height) + ")");

// load the CSV data
d3.csv("../data/986d883313.csv", function(error, data) {
    // A couple other things going on here:
    //    1) Grabbing our parameter names from the header row
    //    2) Calculate the extent (min, max) for each parameter
    //    3) Create a scaling function for each parameter
    //       based on the extent
    for (var key in data[0]) {
        if (key != "category" && key != "Time-T") {
            parameter_list.push(key);

            parameter_extent_dict[key] =
                d3.extent(data, function(d) { return parseInt(d[key]); });

            max_of_the_maxes = Math.max(max_of_the_maxes, parameter_extent_dict[key][1]);

            parameter_scale_functions[key] =
                d3.scale.linear().domain(
                        parameter_extent_dict[key])
                    .range([0, (-height+margin.bottom)]);
        }
    }

    axes = chart.selectAll('.axis')
        .data(parameter_list)
        .enter().append('g')
            .attr("transform", function (d, i) {
                return "rotate(-90) translate(0, " + (width*i/parameter_list.length) + ")";
            })
            .attr("class", "axis");
    axes.append('line')
            .attr("x2", function (d) {
                return -1 * parameter_scale_functions[d](parameter_extent_dict[d][1]);
            });
    axes.append('text')
            .text(function (d) {
                return d;
            })
            .attr("text-anchor", "middle")
            .attr("transform", function () {
                return "rotate(" + 90 + ")" +
                    " translate(" + 0 + ", " + 20 + ")";
            });

    data.forEach(function (row) {
        var series = chart.append("g")
            .attr('class', 'series')
            .style('stroke', function () {
                //console.log(d);
                return "steelblue";
            });

        var series_array = [];
        for (var i=0; i < parameter_list.length; i++) {
            series_array.push(row[parameter_list[i]]);
        }

        var lineFunction = d3.svg.line()
            .x(function (d, i ) {
                return (width * i / parameter_list.length);
            })
            .y(function (d, i) {
                return parameter_scale_functions[parameter_list[i]](d);
            });

        series.append('path')
            .attr("class", "data-line")
            .attr("d", lineFunction(series_array));
    });
});
