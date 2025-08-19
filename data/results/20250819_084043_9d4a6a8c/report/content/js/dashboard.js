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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.8940375891121193, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "获取食物"], "isController": false}, {"data": [1.0, 500, 1500, "支付"], "isController": false}, {"data": [1.0, 500, 1500, "preseveother"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "查票"], "isController": false}, {"data": [1.0, 500, 1500, "进站"], "isController": false}, {"data": [1.0, 500, 1500, "查看所有订单"], "isController": false}, {"data": [1.0, 500, 1500, "获取乘客信息"], "isController": false}, {"data": [1.0, 500, 1500, "托运"], "isController": false}, {"data": [0.5, 500, 1500, "查换乘票"], "isController": false}, {"data": [0.9864864864864865, 500, 1500, "订票"], "isController": false}, {"data": [0.5, 500, 1500, "查便宜票"], "isController": false}, {"data": [1.0, 500, 1500, "取票"], "isController": false}, {"data": [1.0, 500, 1500, "查票2"], "isController": false}, {"data": [0.4953271028037383, 500, 1500, "查快速票"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1543, 0, 0.0, 314.91056383668104, 8, 1509, 36.0, 1210.6000000000001, 1281.8, 1402.0, 12.844632392115077, 11.445579467838472, 8.010368367491342], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["获取食物", 112, 0, 0.0, 33.04464285714286, 28, 69, 32.0, 38.0, 43.349999999999994, 67.05000000000007, 0.9432532129562566, 0.8721193799583958, 0.43938650642591254], "isController": false}, {"data": ["支付", 109, 0, 0.0, 15.788990825688067, 11, 61, 14.0, 21.0, 23.0, 58.40000000000015, 0.9251400441351214, 0.45263199424970296, 0.5041290474876932], "isController": false}, {"data": ["preseveother", 108, 0, 0.0, 51.833333333333314, 34, 120, 47.5, 71.30000000000003, 83.64999999999999, 118.82999999999996, 0.9373454031019189, 0.4558574323679255, 0.9181224993273679], "isController": false}, {"data": ["Login", 5, 0, 0.0, 143.6, 120, 227, 124.0, 227.0, 227.0, 227.0, 0.6360513929525506, 0.48946142348301747, 0.18385860577534666], "isController": false}, {"data": ["查票", 112, 0, 0.0, 215.1160714285715, 168, 304, 208.5, 255.0, 266.04999999999995, 302.31000000000006, 0.9414612824047611, 0.6884222196420766, 0.5231362008674894], "isController": false}, {"data": ["进站", 110, 0, 0.0, 19.227272727272727, 12, 48, 17.0, 25.0, 37.0, 47.45, 0.9336275674758105, 0.43125570255474455, 0.444931887625191], "isController": false}, {"data": ["查看所有订单", 110, 0, 0.0, 18.027272727272727, 13, 37, 17.0, 23.0, 29.44999999999999, 36.56, 0.9335324869305452, 0.7612301040888724, 0.692856142643764], "isController": false}, {"data": ["获取乘客信息", 111, 0, 0.0, 9.35135135135135, 8, 20, 9.0, 11.799999999999997, 13.0, 19.639999999999986, 0.9356192788145451, 0.8067888898371517, 0.44679475326202395], "isController": false}, {"data": ["托运", 110, 0, 0.0, 18.327272727272728, 13, 43, 17.0, 24.0, 26.44999999999999, 42.78, 0.9335800247823062, 0.7348295898188855, 0.7430348830054487], "isController": false}, {"data": ["查换乘票", 108, 0, 0.0, 1241.4444444444441, 1030, 1494, 1245.0, 1402.2, 1422.4, 1491.57, 0.9283375022563759, 1.7370652581508892, 0.5303490613476366], "isController": false}, {"data": ["订票", 111, 0, 0.0, 405.8018018018017, 341, 541, 403.0, 460.6, 485.59999999999997, 538.9599999999999, 0.9321855973126181, 0.4267432553012807, 0.9030547973965988], "isController": false}, {"data": ["查便宜票", 108, 0, 0.0, 1188.3518518518517, 996, 1489, 1188.0, 1326.5, 1359.65, 1483.7799999999997, 0.927508351869187, 1.7354550802552364, 0.5280638370505234], "isController": false}, {"data": ["取票", 110, 0, 0.0, 18.281818181818185, 13, 46, 17.0, 24.0, 26.44999999999999, 44.57000000000001, 0.9335800247823062, 0.43123374191604574, 0.44673262904622074], "isController": false}, {"data": ["查票2", 112, 0, 0.0, 39.45535714285715, 31, 81, 38.0, 45.7, 52.0, 79.96000000000004, 0.9431737797689225, 0.42921775524640415, 0.5250088422541853], "isController": false}, {"data": ["查快速票", 107, 0, 0.0, 1205.9065420560748, 970, 1509, 1186.0, 1325.6, 1364.3999999999999, 1501.96, 0.935494588120093, 1.7505176093741803, 0.5326106883535295], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1543, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
