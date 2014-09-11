app.controller('ScatterController', ['$scope', function ($scope) {

    function asinh(number) {
        return Math.log(number + Math.sqrt(number * number + 1));
    }

    $scope.render_plot = function () {
        // Get user select transform
        x_transform = $("#x_transform_select").val();
        y_transform = $("#y_transform_select").val();

        // Get user pre-scale value
        x_pre_scale = parseFloat($("#x_scale_select").val());
        y_pre_scale = parseFloat($("#y_scale_select").val());

        // Determine whether user wants to see the heat map
        show_heat = $("#heat_map_checkbox").is(':checked');

        // Update the axes' labels with the new categories
        $scope.x_label.text($scope.x_cat);
        $scope.y_label.text($scope.y_cat);

        x_data = [];
        y_data = [];

        // Transform data by asinh, but scale down first
        for (var i = 0, len = $scope.plot_data.length; i < len; i++) {
            switch (x_transform) {
                case 'lin':
                    x_data[i] = $scope.plot_data[i][$scope.x_cat] * x_pre_scale;
                    break;
                case 'asinh':
                    x_data[i] = asinh($scope.plot_data[i][$scope.x_cat] * x_pre_scale);
                    break;
                default:
                    x_data[i] = $scope.plot_data[i][$scope.x_cat] * x_pre_scale;
            }
            switch (y_transform) {
                case 'lin':
                    y_data[i] = $scope.plot_data[i][$scope.y_cat] * y_pre_scale;
                    break;
                case 'asinh':
                    y_data[i] = asinh($scope.plot_data[i][$scope.y_cat] * y_pre_scale);
                    break;
                default:
                    y_data[i] = $scope.plot_data[i][$scope.y_cat] * y_pre_scale;
            }
        }

        // Get the new ranges to calculate the axes' scaling
        x_range = d3.extent(x_data, function (d) {
            return parseFloat(d);
        });
        y_range = d3.extent(y_data, function (d) {
            return parseFloat(d);
        });

        // pad ranges a bit, keeps the data points from overlapping the plot's edge
        x_range[0] = x_range[0] - (x_range[1] - x_range[0]) * 0.01;
        x_range[1] = x_range[1] + (x_range[1] - x_range[0]) * 0.01;
        y_range[0] = y_range[0] - (y_range[1] - y_range[0]) * 0.01;
        y_range[1] = y_range[1] + (y_range[1] - y_range[0]) * 0.01;

        // Update scaling functions for determining placement of the x and y axes
        x_scale = d3.scale.linear().domain(x_range).range([0, $scope.canvas_width]);
        y_scale = d3.scale.linear().domain(y_range).range([$scope.canvas_height, 0]);

        // Update axes with the proper scaling
        $scope.x_axis.call(d3.svg.axis().scale(x_scale).orient("bottom"));
        $scope.y_axis.call(d3.svg.axis().scale(y_scale).orient("left"));

        // Clear heat map canvas before the transitions
        $scope.heat_map_ctx.clearRect(
            0, 0, $scope.heat_map_ctx.canvas.width, $scope.heat_map_ctx.canvas.height);
        $scope.heat_map_data = [];

        transition(++$scope.transition_count);
    };

    function transition(count) {
        // calculate next positions
        var next_position = [];
        for (var i = 0, len = $scope.plot_data.length; i < len; i++) {
            var x = x_scale(x_data[i]);
            var y = y_scale(y_data[i]);
            var color = "rgba(96, 96, 212, 1.0)";

            next_position.push([x, y, color]);
        }

        var interpolator = d3.interpolate($scope.prev_position, next_position);

        // run transition
        d3.timer(function (t) {
            // Clear canvas
            // Use the identity matrix while clearing the canvas
            $scope.ctx.clearRect(0, 0, $scope.ctx.canvas.width, $scope.ctx.canvas.height);

            // abort old transition
            if (count < $scope.transition_count) return true;

            if (t > 2000) {
                $scope.prev_position = next_position;
                $scope.prev_position.forEach($scope.circle);

                if (show_heat) {
                    $scope.heat_map_ctx.clearRect(
                        0,
                        0,
                        $scope.heat_map_ctx.canvas.width,
                        $scope.heat_map_ctx.canvas.height
                    );

                    $scope.prev_position.forEach(function (pos) {
                        $scope.heat_map_data.push({x: pos[0], y: pos[1]});
                    });

                    $scope.heat_map.set_data($scope.heat_map_data);
                    $scope.heat_map.colorize();
                }

                return true
            }

            $scope.prev_position = interpolator(t / 2000);
            $scope.prev_position.forEach($scope.circle);

            return false;
        });
    }
}]);
