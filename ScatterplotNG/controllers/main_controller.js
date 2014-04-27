app.controller(
    'MainController',
    ['$scope', '$http', function ($scope, $http) {
        $http.get('../../data/example.csv').success(function(data){
            $scope.scatterplot_data = data;
        }).error(function(err){
            throw err;
        });
    }
]);