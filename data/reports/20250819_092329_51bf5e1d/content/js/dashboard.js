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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.8913043478260869, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "获取食物"], "isController": false}, {"data": [1.0, 500, 1500, "支付"], "isController": false}, {"data": [1.0, 500, 1500, "preseveother"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "查票"], "isController": false}, {"data": [1.0, 500, 1500, "进站"], "isController": false}, {"data": [1.0, 500, 1500, "查看所有订单"], "isController": false}, {"data": [1.0, 500, 1500, "获取乘客信息"], "isController": false}, {"data": [1.0, 500, 1500, "托运"], "isController": false}, {"data": [0.4953271028037383, 500, 1500, "查换乘票"], "isController": false}, {"data": [0.9675925925925926, 500, 1500, "订票"], "isController": false}, {"data": [0.5, 500, 1500, "查便宜票"], "isController": false}, {"data": [1.0, 500, 1500, "取票"], "isController": false}, {"data": [1.0, 500, 1500, "查票2"], "isController": false}, {"data": [0.49528301886792453, 500, 1500, "查快速票"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1518, 0, 0.0, 322.347167325428, 7, 1538, 35.0, 1210.0, 1272.0, 1352.6699999999996, 12.537476151539929, 11.200025022816058, 7.818637945790695], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["获取食物", 109, 0, 0.0, 31.477064220183493, 25, 72, 30.0, 36.0, 46.5, 70.80000000000007, 0.9174929714987964, 0.8482962986734229, 0.4273868627001229], "isController": false}, {"data": ["支付", 108, 0, 0.0, 14.13888888888889, 10, 28, 13.0, 19.0, 22.0, 27.909999999999997, 0.9214152255334397, 0.45080959764868483, 0.5020993123512298], "isController": false}, {"data": ["preseveother", 107, 0, 0.0, 56.82242990654207, 36, 142, 51.0, 83.2, 92.79999999999993, 141.68, 0.9273141688405107, 0.45097896101813895, 0.9082969837373361], "isController": false}, {"data": ["Login", 5, 0, 0.0, 152.0, 121, 241, 130.0, 241.0, 241.0, 241.0, 0.6323510813203491, 0.48661391804729986, 0.1827889844441634], "isController": false}, {"data": ["查票", 110, 0, 0.0, 252.23636363636365, 184, 361, 250.5, 305.6, 330.0499999999999, 359.9, 0.9228962161255139, 0.674843278064435, 0.5128202607181811], "isController": false}, {"data": ["进站", 108, 0, 0.0, 16.92592592592593, 12, 46, 15.5, 22.300000000000026, 26.549999999999997, 44.64999999999995, 0.9213759213759214, 0.42559649493243246, 0.43909321253071254], "isController": false}, {"data": ["查看所有订单", 108, 0, 0.0, 16.85185185185185, 12, 37, 15.0, 23.0, 27.64999999999999, 36.91, 0.9213130416979458, 0.7512660056814304, 0.6837870231351941], "isController": false}, {"data": ["获取乘客信息", 108, 0, 0.0, 8.83333333333333, 7, 16, 8.0, 11.0, 12.0, 15.819999999999993, 0.9225880302745554, 0.795551983137141, 0.4405718230510328], "isController": false}, {"data": ["托运", 108, 0, 0.0, 15.194444444444446, 12, 41, 14.0, 18.10000000000001, 21.0, 39.91999999999996, 0.9213287608128168, 0.7251865050929007, 0.7332841211547321], "isController": false}, {"data": ["查换乘票", 107, 0, 0.0, 1232.7102803738323, 1045, 1512, 1247.0, 1333.2, 1380.0, 1503.3600000000001, 0.9177695626442056, 1.7172915263923079, 0.5243117130340432], "isController": false}, {"data": ["订票", 108, 0, 0.0, 449.78703703703707, 368, 578, 449.0, 496.1, 504.75, 575.93, 0.9181253241067405, 0.4203840425780619, 0.8894339077284049], "isController": false}, {"data": ["查便宜票", 108, 0, 0.0, 1196.2685185185185, 992, 1444, 1202.0, 1293.3, 1324.55, 1436.3499999999997, 0.9113155008016202, 1.7052144201966077, 0.5188446650071724], "isController": false}, {"data": ["取票", 108, 0, 0.0, 18.555555555555557, 12, 76, 16.0, 27.0, 35.29999999999998, 73.83999999999992, 0.9213287608128168, 0.425574710805139, 0.44087020781082054], "isController": false}, {"data": ["查票2", 110, 0, 0.0, 39.59999999999998, 31, 83, 37.5, 47.0, 51.349999999999966, 81.24000000000001, 0.9245406713846257, 0.4207382352199566, 0.5146368971574578], "isController": false}, {"data": ["查快速票", 106, 0, 0.0, 1202.849056603774, 1001, 1538, 1189.5, 1316.6, 1356.1, 1534.9199999999996, 0.9096526156803515, 1.7021039873463888, 0.5178979247477001], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1518, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
