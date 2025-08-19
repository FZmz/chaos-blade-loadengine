/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 100.0, "KoPercent": 0.0};
    var dataset = [
        {
            "label" : "FAIL",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "PASS",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.8675847457627118, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "获取食物"], "isController": false}, {"data": [1.0, 500, 1500, "支付"], "isController": false}, {"data": [1.0, 500, 1500, "preseveother"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "查票"], "isController": false}, {"data": [1.0, 500, 1500, "进站"], "isController": false}, {"data": [1.0, 500, 1500, "查看所有订单"], "isController": false}, {"data": [1.0, 500, 1500, "获取乘客信息"], "isController": false}, {"data": [1.0, 500, 1500, "托运"], "isController": false}, {"data": [0.5, 500, 1500, "查换乘票"], "isController": false}, {"data": [0.5955882352941176, 500, 1500, "订票"], "isController": false}, {"data": [0.4925373134328358, 500, 1500, "查便宜票"], "isController": false}, {"data": [1.0, 500, 1500, "取票"], "isController": false}, {"data": [1.0, 500, 1500, "查票2"], "isController": false}, {"data": [0.5, 500, 1500, "查快速票"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 944, 0, 0.0, 329.6080508474576, 7, 1517, 33.5, 1217.0, 1268.75, 1353.2999999999997, 12.110016420361248, 10.735698129938937, 7.554340832339132], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["获取食物", 68, 0, 0.0, 27.632352941176467, 23, 42, 27.0, 34.0, 36.099999999999994, 42.0, 0.8948781386534717, 0.8275874973680055, 0.4168524141969785], "isController": false}, {"data": ["支付", 67, 0, 0.0, 13.447761194029846, 10, 36, 12.0, 15.200000000000003, 25.999999999999943, 36.0, 0.8995945111308037, 0.440133642652864, 0.490208727745106], "isController": false}, {"data": ["preseveother", 67, 0, 0.0, 74.16417910447758, 49, 155, 68.0, 102.2, 113.19999999999999, 155.0, 0.8988341986289424, 0.4371283505050912, 0.8804010754148723], "isController": false}, {"data": ["Login", 5, 0, 0.0, 152.0, 118, 244, 125.0, 244.0, 244.0, 244.0, 0.638814360546825, 0.491587613389549, 0.18465727609556662], "isController": false}, {"data": ["查票", 68, 0, 0.0, 307.14705882352945, 230, 429, 303.0, 367.1, 384.84999999999997, 429.0, 0.8911137611553027, 0.6514810466327694, 0.49515989267321026], "isController": false}, {"data": ["进站", 67, 0, 0.0, 17.46268656716418, 12, 37, 16.0, 26.0, 32.0, 37.0, 0.899497892221357, 0.41549072560615413, 0.42866696426174045], "isController": false}, {"data": ["查看所有订单", 68, 0, 0.0, 16.352941176470587, 12, 39, 15.0, 21.1, 23.549999999999997, 39.0, 0.8934202228295144, 0.7285213731080513, 0.6630853216312803], "isController": false}, {"data": ["获取乘客信息", 68, 0, 0.0, 8.308823529411766, 7, 15, 8.0, 9.0, 10.549999999999997, 15.0, 0.8952905086040052, 0.7720132022434927, 0.42753619014390476], "isController": false}, {"data": ["托运", 68, 0, 0.0, 13.455882352941176, 12, 20, 13.0, 16.0, 17.549999999999997, 20.0, 0.8934789178393577, 0.7032656325962132, 0.7111184746475357], "isController": false}, {"data": ["查换乘票", 64, 0, 0.0, 1225.4531250000002, 1019, 1383, 1216.5, 1323.0, 1361.25, 1383.0, 0.8646779074794638, 1.617893428447903, 0.49398103112840464], "isController": false}, {"data": ["订票", 68, 0, 0.0, 566.0147058823529, 441, 804, 558.5, 650.4, 716.75, 804.0, 0.8879834939538771, 0.4067033776019222, 0.8602340097678184], "isController": false}, {"data": ["查便宜票", 67, 0, 0.0, 1202.5074626865678, 1002, 1517, 1203.0, 1330.4, 1359.1999999999998, 1517.0, 0.8856108070954609, 1.6570608460887726, 0.5042100591178259], "isController": false}, {"data": ["取票", 68, 0, 0.0, 18.411764705882366, 13, 55, 16.5, 24.1, 31.949999999999974, 55.0, 0.8934906577667989, 0.4127158995348593, 0.4275492405329409], "isController": false}, {"data": ["查票2", 68, 0, 0.0, 39.47058823529412, 30, 79, 37.0, 48.400000000000006, 56.84999999999998, 79.0, 0.8945485161018732, 0.4070894614291728, 0.4979420450957693], "isController": false}, {"data": ["查快速票", 63, 0, 0.0, 1215.412698412698, 986, 1392, 1228.0, 1327.2, 1354.4, 1392.0, 0.8789552988448016, 1.6447031389516713, 0.5004208390883977], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": []}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 944, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
