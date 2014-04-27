app.controller(
    'MainController',
    ['$scope', '$http', function ($scope, $http) {
        $http.get('../../data/example.csv').success(function(data){
            $scope.scatterplot_data = data;
        }).error(function(err){
            throw err;
        });

        // file reader stuff
        $scope.fileReaderSupported = window.FileReader != null;

        function setupReader(obj) {
            var reader = new FileReader();
            reader.addEventListener("loadend", function(evt) {
                var preheader = evt.target.result;

                if (preheader.substr(0, 3) != 'FCS') {
                    return;
                }

                // The following uses the FCS standard offset definitions
                obj.text_begin = parseInt(preheader.substr(10, 8));
                obj.text_end = parseInt(preheader.substr(18, 8));
                obj.data_begin = parseInt(preheader.substr(26, 8));
                obj.data_end = parseInt(preheader.substr(34, 8));

                parseFcsText(obj);
                parseFcsData(obj);
            });
            var blob = obj.file.slice(0, 58);
            reader.readAsBinaryString(blob);
        }

        function parseFcsText(obj) {
            var reader = new FileReader();
            reader.addEventListener("loadend", function(evt) {
                var delimiter = evt.target.result[0];
                var non_paired_list = evt.target.result.split(delimiter);
                obj.metadata = [];
                obj.channels = [];

                var pnn_pattern = /\$P(\d+)N/i;
                var pns_pattern = /\$P(\d+)S/i;
                var pnb_pattern = /\$P(\d+)B/i;
                var date_pattern = /^\$DATE$/i;

                // first match will be empty string since the FCS TEXT
                // segment starts with the delimiter, so we'll start at
                // the 2nd index
                for (var i = 1; i < non_paired_list.length; i+=2) {
                    obj.metadata.push(
                        {
                            key: non_paired_list[i],
                            value: non_paired_list[i+1]
                        }
                    );

                    var pnn_result = pnn_pattern.exec(non_paired_list[i]);
                    var pns_result = pns_pattern.exec(non_paired_list[i]);
                    var pnb_result = pnb_pattern.exec(non_paired_list[i]);
                    var date_result = date_pattern.exec(non_paired_list[i]);

                    var index = null;

                    if (date_result) {
                        obj.date = non_paired_list[i+1];
                    }

                    if (pnn_result) {
                        for (var j = 0; j < obj.channels.length; j++) {
                            if (obj.channels[j].channel == pnn_result[1]) {
                                index = j;
                                break;
                            }
                        }
                        if (index != null) {
                            obj.channels[index].pnn = non_paired_list[i+1];
                        } else {
                            obj.channels.push(
                                {
                                    'channel': pnn_result[1],
                                    'pnn': non_paired_list[i+1]
                                }
                            );
                        }
                    } else if (pns_result) {
                        for (var k = 0; k < obj.channels.length; k++) {
                            if (obj.channels[k].channel == pns_result[1]) {
                                index = k;
                                break;
                            }
                        }
                        if (index != null) {
                            obj.channels[index].pns = non_paired_list[i+1];
                        } else {
                            obj.channels.push(
                                {
                                    'channel': pns_result[1],
                                    'pns': non_paired_list[i+1]
                                }
                            );
                        }
                    } else if (pnb_result) {
                        for (var l = 0; l < obj.channels.length; l++) {
                            if (obj.channels[l].channel == pnb_result[1]) {
                                index = l;
                                break;
                            }
                        }
                        if (index != null) {
                            obj.channels[index].pnb = non_paired_list[i+1];
                        } else {
                            obj.channels.push(
                                {
                                    'channel': pns_result[1],
                                    'pns': non_paired_list[i+1]
                                }
                            );
                        }
                    }
                }

                // Now check our channels for missing PnS fields, since
                // they are optional in the FCS file. Add empty strings,
                // where they are missing
                for (var m = 0; m < obj.channels.length; m++) {
                    if (! obj.channels[l].pns) {
                        obj.channels[m].pns = "";
                    }
                }

                // Using $apply here to trigger template update
                $scope.$apply(function () {
                    $scope.fcs_file = obj;
                });
            });

            var blob = obj.file.slice(obj.text_begin, obj.text_end);
            reader.readAsBinaryString(blob);
        }

        function parseFcsData(obj) {
            var reader = new FileReader();
            reader.addEventListener("loadend", function(evt) {
                var tot_result = $scope.fcs_file.metadata.filter(
                    function(d) {
                        if (d.key === '$TOT') {
                            return d
                        }
                    }
                );
                $scope.fcs_file.event_count = tot_result[0].value.trim();
                console.log($scope.fcs_file.event_count);
            });

            var blob = obj.file.slice(obj.data_begin, obj.data_end);
            reader.readAsBinaryString(blob);
        }

        $scope.onFileSelect = function($files) {

            $scope.current_acquisition_date = "";

            for (var i = 0; i < $files.length; i++) {
                setupReader({
                    filename: $files[i].name,
                    file: $files[i],
                    date: "",
                    metadata: {},
                    selected: false,
                    acquisition_date: null
                });
            }
        };
    }
]);