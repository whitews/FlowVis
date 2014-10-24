app.directive('scatterplot', function() {
    function link(scope, el, attr) {
        var width = 620;         // width of the svg element
        var height = 580;         // height of the svg element
        scope.canvas_width = 540;   // width of the canvas
        scope.canvas_height = 540;  // height of the canvas
        var margin = {            // used mainly for positioning the axes' labels
            top: 0,
            right: 0,
            bottom: height - scope.canvas_height,
            left: width - scope.canvas_width
        };
        scope.x_cat;                // chosen plot parameter for x-axis
        scope.y_cat;                // chosen plot parameter for y-axis
        scope.x_transform;          // chosen transform for x-data
        scope.y_transform;          // chosen transform for y-data
        scope.show_heat = false;    // whether to show heat map
        scope.x_pre_scale;          // pre-scale factor for x data
        scope.y_pre_scale;          // pre-scale factor for y data
        var x_data;               // x data series to plot
        var y_data;               // y data series to plot
        var x_range;              // used for "auto-range" for chosen x category
        var y_range;              // used for "auto-range" for chosen y category
        var x_scale;              // function to convert x data to svg pixels
        var y_scale;              // function to convert y data to svg pixels
        var flow_data;            // FCS data
        scope.parameter_list = [];  // flow data column names
        var subsample_count = 40000;  // Number of events to subsample

        // Transition variables
        scope.prev_position = [];         // prev_position [x, y, color] pairs
        scope.transition_count = 0;       // used to cancel old transitions

        scope.$watch('data', function(data) {
            if (!data) {
                return;
            }

            // reset parameter list
            scope.parameter_list = [];

            data = d3.csv.parse(data);
            scope.plot_data = data.slice(0, subsample_count);

            // Grab our column names
            for (var key in scope.plot_data[0]) {
                if (key != "category") {
                    scope.parameter_list.push(key);
                }
            }

            scope.x_cat = scope.parameter_list[0];
            scope.y_cat = scope.parameter_list[0];

            scope.x_transform = 'lin';
            scope.y_transform = 'lin';

            scope.x_pre_scale = '1';
            scope.y_pre_scale = '1';

            // render initial data points
            scope.prev_position = scope.plot_data.map(function (d) {
                return [scope.canvas_width / 2, scope.canvas_height / 2, "rgba(96, 96, 212, 1.0)"];
            });
            scope.prev_position.forEach(scope.circle);

            scope.render_plot();
        });

        scope.svg = d3.select("#scatterplot")
            .append("svg")
            .attr("width", width)
            .attr("height", height);

        // create canvas for plot, it'll just be square as the axes will be drawn
        // using svg...will have a top and right margin though
        d3.select("#scatterplot")
            .append("canvas")
            .attr("id", "canvas_plot")
            .attr("width", scope.canvas_width)
            .attr("height", scope.canvas_height);

        var canvas = document.getElementById("canvas_plot");

        scope.ctx = canvas.getContext('2d');

        // render circle [x,y,color]
        scope.circle = function (pos) {
            scope.ctx.strokeStyle = pos[2];
            scope.ctx.globalAlpha = 1;
            scope.ctx.lineWidth = 1;
            scope.ctx.beginPath();
            scope.ctx.arc(pos[0], pos[1], 1.5, 0, 2 * Math.PI, false);
            scope.ctx.stroke();
        };

        var plot_area = scope.svg.append("g")
            .attr("id", "plot-area");

        scope.x_axis = plot_area.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + margin.left + "," + scope.canvas_height + ")");

        scope.y_axis = plot_area.append("g")
            .attr("class", "axis")
            .attr("transform", "translate(" + margin.left + "," + 0 + ")");

        scope.x_label = scope.svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "translate(" + (scope.canvas_width / 2 + margin.left) + "," + (height - 3) + ")");

        scope.y_label = scope.svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "translate(" + margin.left / 4 + "," + (scope.canvas_height / 2) + ") rotate(-90)");

        // Heat map stuff
        scope.heat_map_data = [];
        d3.select("#scatterplot")
            .append("canvas")
            .attr("id", "heat_map_canvas")
            .attr("width", scope.canvas_width)
            .attr("height", scope.canvas_height);

        var heat_map_canvas = document.getElementById("heat_map_canvas");
        scope.heat_map_ctx = heat_map_canvas.getContext('2d');

        var heat_cfg = {
            canvas: heat_map_canvas,
            radius: 5
        };

        scope.heat_map = heat.create(heat_cfg);
    }

    return {
        link: link,
        controller: 'ScatterController',
        restrict: 'E',
        replace: true,
        templateUrl: 'directives/scatter.html',
        scope: {
            data: '='
        }
    };
});
