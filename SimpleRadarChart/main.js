var width = 550;
var height = 550;
var margin = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10
};
var axes;
var parameter_list = [];  // flow data column names
var parameter_extent_dict = {};
var parameter_scale_functions = {};  // functions for scaling the parameters
var max_of_the_maxes = 0;

var svg = d3.select("#radarchart")
    .append('svg')
    .attr('width', width)
    .attr('height', height + margin.top + margin.bottom);

var chart = svg.append("g")
    .attr('id', 'body')
    .attr("transform", "translate(" + width/2 + ", " + (height/2 + margin.top) + ")");

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
                    .range([0, (height / 2) - 20]);
        }
    }

    axes = chart.selectAll('.axis')
        .data(parameter_list)
        .enter().append('g')
            .attr("transform", function (d, i) {
                return "rotate(" + ((i / parameter_list.length * 360) - 90) +
                    ") translate(" + parameter_scale_functions[d](parameter_extent_dict[d][1]) + ")";
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
                    " translate(" + 0 + ", " + -5 + ")";
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
        // For the radar chart, the end is the beginning!
        // We must add the first element to the end to close the path!
        series_array.push(series_array[0]);

        var lineFunction = d3.svg.line.radial()
            .radius(function (d, i ) {
                if (i === parameter_list.length)
                    i = 0;
                return parameter_scale_functions[parameter_list[i]](d);
            })
            .angle(function (d, i) {
                if (i === parameter_list.length) {
                    i = 0;
                } //close the line
                return (i / parameter_list.length) * 2 * Math.PI;
            });

        series.append('path')
            .attr("class", "data-line")
            .attr("d", lineFunction(series_array));
    });
});
