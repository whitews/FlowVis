app.controller(
    'MainController',
    ['$scope', '$http', function ($scope, $http) {
        $scope.duration = 0;
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

                // save obj to scope so it's available to parse data section
                $scope.fcs_file = obj;

                // Finally, save binary parsing info for easier access
                var tot_result = $scope.fcs_file.metadata.filter(
                    function(d) {
                        if (d.key === '$TOT') {
                            return d
                        }
                    }
                );
                $scope.fcs_file.event_count = tot_result[0].value.trim();

                // verify list mode
                var mode_result = $scope.fcs_file.metadata.filter(
                    function(d) {
                        if (d.key === '$MODE') {
                            return d
                        }
                    }
                );
                $scope.fcs_file.mode = mode_result[0].value.trim();
                if (!$scope.fcs_file.mode == "L") {
                    return;
                }

                // check byte order
                var byte_order_result = $scope.fcs_file.metadata.filter(
                    function(d) {
                        if (d.key === '$BYTEORD') {
                            return d
                        }
                    }
                );
                $scope.fcs_file.byte_order = byte_order_result[0].value.trim();
                if ($scope.fcs_file.byte_order[0] === "1") {
                    $scope.fcs_file.little_endian = true;
                } else {
                    $scope.fcs_file.little_endian = false;
                }

                var event_bit_count = 0;
                $scope.fcs_file.channels.forEach(function (channel) {
                    event_bit_count += +channel.pnb;
                });
                $scope.fcs_file.event_bit_count = event_bit_count;

                // add channel headers to event_data
                var headers = [];
                var param_string = null;
                $scope.fcs_file.channels.forEach(function(channel) {
                    param_string = channel.pnn + ' ' + channel.pns;
                    headers.push(param_string.trim());
                });
                $scope.fcs_file.event_data = headers.join(',');
                $scope.fcs_file.event_data += '\r\n';

                parseFcsData(obj);
            });

            var blob = obj.file.slice(obj.text_begin, obj.text_end);
            reader.readAsBinaryString(blob);
        }

        function parseFcsData(obj) {
            // validate data segment length matches total events
            var total_bytes = (obj.data_end - obj.data_begin + 1);
            var event_bytes = ($scope.fcs_file.event_bit_count / 8);
            if (total_bytes/ event_bytes != $scope.fcs_file.event_count) {
                return;
            }

            var blob_begin = null;
            var blob_end = null;

            var chunk_size = 500;  // chunk size is in number of events
            var subsample_count = 30000
            for (var i = 0; i < $scope.fcs_file.event_count; i = i + chunk_size) {
                if (i > subsample_count) {
                    break;
                }

                blob_begin = obj.data_begin + (event_bytes * i);
                blob_end = blob_begin + (chunk_size * event_bytes);
                var blob = obj.file.slice(blob_begin, blob_end);

                var reader = new FileReader();
                var update_scope = false;
                if (i + chunk_size >= $scope.fcs_file.event_count - 1 || i >= subsample_count) {
                    update_scope = true
                }
                reader.onloadend = function (update_scope) {
                    return function(evt) {
                        var byte_offset = 0;
                        var value_length = null;  // in bytes
                        var value = null;

                        // create DataView to read events in chunked blob
                        var data_view = new DataView(evt.target.result.slice(
                                    byte_offset,
                                    chunk_size * event_bytes)
                                );
                        for (var j = 0; j < chunk_size; j++) {
                            var event_data = [];

                            // add CSV data for this event
                            $scope.fcs_file.channels.forEach(function(channel) {
                                value_length = parseInt(channel.pnb) / 8;

                                value = data_view.getFloat32(
                                    byte_offset,
                                    $scope.fcs_file.little_endian
                                );
                                event_data.push(value);
                                byte_offset = byte_offset + value_length;
                            });

                            $scope.fcs_file.event_data += event_data.join(',');
                            $scope.fcs_file.event_data += "\r\n";
                        }
                        if (update_scope) {
                            end_time = new Date().getTime();
                            $scope.duration = end_time - $scope.start_time;
                            console.log($scope.duration);
                            $scope.$apply();
                        }
                    }
                }(update_scope);

                reader.readAsArrayBuffer(blob);
            }
        }

        $scope.onFileSelect = function($files) {

            for (var i = 0; i < $files.length; i++) {
                $scope.start_time = new Date().getTime();
                setupReader({
                    filename: $files[i].name,
                    file: $files[i],
                    date: "",
                    metadata: {},
                    selected: false,
                    acquisition_date: null,
                    event_bit_count: null,
                    event_data: ''
                });
                break;  // only read one file
            }
            $scope.$apply();
        };
    }
]);