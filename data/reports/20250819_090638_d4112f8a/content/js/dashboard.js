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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.8903479973736047, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "获取食物"], "isController": false}, {"data": [1.0, 500, 1500, "支付"], "isController": false}, {"data": [1.0, 500, 1500, "preseveother"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "查票"], "isController": false}, {"data": [1.0, 500, 1500, "进站"], "isController": false}, {"data": [1.0, 500, 1500, "查看所有订单"], "isController": false}, {"data": [1.0, 500, 1500, "获取乘客信息"], "isController": false}, {"data": [1.0, 500, 1500, "托运"], "isController": false}, {"data": [0.5, 500, 1500, "查换乘票"], "isController": false}, {"data": [0.9409090909090909, 500, 1500, "订票"], "isController": false}, {"data": [0.5, 500, 1500, "查便宜票"], "isController": false}, {"data": [1.0, 500, 1500, "取票"], "isController": false}, {"data": [1.0, 500, 1500, "查票2"], "isController": false}, {"data": [0.5, 500, 1500, "查快速票"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1523, 0, 0.0, 321.8404464871968, 7, 1469, 36.0, 1221.2000000000003, 1279.0, 1378.04, 12.589273905568048, 11.238864010216902, 7.852926406890623], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["获取食物", 110, 0, 0.0, 31.727272727272727, 26, 57, 30.0, 38.900000000000006, 43.0, 56.120000000000005, 0.9269324434781876, 0.8570257397552898, 0.4317839604873979], "isController": false}, {"data": ["支付", 108, 0, 0.0, 14.342592592592597, 10, 41, 13.0, 18.10000000000001, 22.099999999999994, 40.45999999999998, 0.9278589654372535, 0.45396224773834376, 0.5056106471816284], "isController": false}, {"data": ["preseveother", 107, 0, 0.0, 56.504672897196265, 36, 138, 50.0, 83.0, 89.79999999999998, 135.28000000000006, 0.9213653428856818, 0.4480858796455757, 0.902470155189784], "isController": false}, {"data": ["Login", 5, 0, 0.0, 147.2, 117, 212, 138.0, 212.0, 212.0, 212.0, 0.6333122229259025, 0.4873535465484484, 0.1830668144395187], "isController": false}, {"data": ["查票", 110, 0, 0.0, 229.709090909091, 185, 348, 228.0, 267.6, 279.9, 344.37, 0.9248827080565692, 0.6762958473817412, 0.5139240828947147], "isController": false}, {"data": ["进站", 108, 0, 0.0, 18.148148148148152, 13, 44, 16.0, 25.300000000000026, 32.55, 43.91, 0.9278111388881729, 0.4285690123965877, 0.44215999587639493], "isController": false}, {"data": ["查看所有订单", 108, 0, 0.0, 17.5, 12, 39, 16.0, 24.0, 26.549999999999997, 38.099999999999966, 0.9275880135015588, 0.7563828039783219, 0.6884442287706882], "isController": false}, {"data": ["获取乘客信息", 110, 0, 0.0, 8.772727272727275, 7, 14, 8.0, 11.0, 12.0, 13.89, 0.927221538513411, 0.799547479011076, 0.44278450423150195], "isController": false}, {"data": ["托运", 108, 0, 0.0, 17.037037037037045, 13, 39, 15.0, 22.200000000000017, 28.19999999999999, 38.81999999999999, 0.9276597206713508, 0.7301696629503015, 0.7383229222140145], "isController": false}, {"data": ["查换乘票", 107, 0, 0.0, 1259.336448598131, 1112, 1469, 1246.0, 1373.0, 1411.1999999999998, 1466.2, 0.9107468123861566, 1.7041508536123453, 0.5202996926229508], "isController": false}, {"data": ["订票", 110, 0, 0.0, 430.4363636363637, 352, 591, 419.5, 503.9, 519.1499999999999, 589.13, 0.9233222814454191, 0.4227248761908759, 0.8944684601502497], "isController": false}, {"data": ["查便宜票", 108, 0, 0.0, 1199.4999999999998, 1032, 1381, 1198.5, 1300.3000000000002, 1342.3, 1380.82, 0.9177664284439611, 1.7172270282213176, 0.5225174099441692], "isController": false}, {"data": ["取票", 108, 0, 0.0, 18.129629629629644, 13, 54, 16.5, 23.10000000000001, 30.299999999999983, 53.099999999999966, 0.9276358170496027, 0.4284880287738888, 0.4438882327678763], "isController": false}, {"data": ["查票2", 110, 0, 0.0, 40.90909090909091, 31, 102, 39.0, 49.70000000000002, 54.0, 101.56, 0.926815294137472, 0.4217733662774042, 0.5159030445882412], "isController": false}, {"data": ["查快速票", 106, 0, 0.0, 1210.5471698113206, 1035, 1419, 1208.5, 1318.2, 1376.1499999999999, 1417.1799999999998, 0.9128880850880593, 1.7082758068509667, 0.51973999375619], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1523, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
