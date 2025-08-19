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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.877950101146325, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "获取食物"], "isController": false}, {"data": [1.0, 500, 1500, "支付"], "isController": false}, {"data": [1.0, 500, 1500, "preseveother"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [0.9953271028037384, 500, 1500, "查票"], "isController": false}, {"data": [1.0, 500, 1500, "进站"], "isController": false}, {"data": [1.0, 500, 1500, "查看所有订单"], "isController": false}, {"data": [1.0, 500, 1500, "获取乘客信息"], "isController": false}, {"data": [1.0, 500, 1500, "托运"], "isController": false}, {"data": [0.49514563106796117, 500, 1500, "查换乘票"], "isController": false}, {"data": [0.7757009345794392, 500, 1500, "订票"], "isController": false}, {"data": [0.5, 500, 1500, "查便宜票"], "isController": false}, {"data": [1.0, 500, 1500, "取票"], "isController": false}, {"data": [1.0, 500, 1500, "查票2"], "isController": false}, {"data": [0.49019607843137253, 500, 1500, "查快速票"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1483, 0, 0.0, 330.01281186783496, 7, 1541, 34.0, 1226.0, 1294.8, 1376.16, 12.388685613085393, 11.033436541923546, 7.72457299028453], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["获取食物", 107, 0, 0.0, 29.70093457943925, 25, 56, 28.0, 35.2, 39.39999999999998, 54.96000000000002, 0.9063034676695295, 0.8379469050160085, 0.4221745645296539], "isController": false}, {"data": ["支付", 106, 0, 0.0, 14.433962264150942, 10, 60, 13.0, 19.299999999999997, 23.0, 57.54999999999974, 0.9005947323704333, 0.4406230087085811, 0.4907537701784197], "isController": false}, {"data": ["preseveother", 103, 0, 0.0, 65.3883495145631, 41, 317, 56.0, 89.60000000000001, 107.39999999999999, 309.03999999999877, 0.8975174493076916, 0.43648797827659225, 0.8791113297418113], "isController": false}, {"data": ["Login", 5, 0, 0.0, 155.6, 122, 272, 125.0, 272.0, 272.0, 272.0, 0.6434178355424012, 0.4951301312572385, 0.18598796808647536], "isController": false}, {"data": ["查票", 107, 0, 0.0, 273.7102803738318, 201, 572, 264.0, 336.0, 353.2, 556.4800000000004, 0.9045107188746871, 0.6613937442939744, 0.5026041006247041], "isController": false}, {"data": ["进站", 106, 0, 0.0, 18.198113207547184, 12, 33, 17.0, 26.0, 28.64999999999999, 33.0, 0.9004952723998199, 0.415951429536245, 0.4291422782530392], "isController": false}, {"data": ["查看所有订单", 106, 0, 0.0, 17.405660377358494, 12, 48, 15.0, 24.299999999999997, 28.299999999999983, 47.0199999999999, 0.9004340771824908, 0.7342406781712694, 0.6682909166588799], "isController": false}, {"data": ["获取乘客信息", 107, 0, 0.0, 8.570093457943928, 7, 20, 8.0, 11.0, 12.0, 19.840000000000003, 0.9065799061223798, 0.781748102642638, 0.4329273184510193], "isController": false}, {"data": ["托运", 106, 0, 0.0, 14.490566037735846, 11, 35, 13.5, 17.299999999999997, 22.299999999999983, 34.579999999999956, 0.9004799728156989, 0.7087762286029817, 0.7166906033640572], "isController": false}, {"data": ["查换乘票", 103, 0, 0.0, 1249.1844660194179, 1042, 1535, 1250.0, 1360.8, 1378.6, 1530.7199999999993, 0.8876708550941965, 1.6609153890239068, 0.5071166506153368], "isController": false}, {"data": ["订票", 107, 0, 0.0, 505.33644859813086, 405, 783, 498.0, 569.4, 600.5999999999999, 778.7600000000001, 0.9022683194198499, 0.41316359147061305, 0.8740724344379796], "isController": false}, {"data": ["查便宜票", 105, 0, 0.0, 1217.2285714285715, 1050, 1393, 1218.0, 1355.6, 1374.4, 1392.76, 0.8918712307822985, 1.6688327502548204, 0.5077743433067188], "isController": false}, {"data": ["取票", 106, 0, 0.0, 17.490566037735856, 12, 45, 16.0, 25.599999999999994, 32.0, 44.50999999999995, 0.9004723232185938, 0.4159408289867138, 0.4308900765401475], "isController": false}, {"data": ["查票2", 107, 0, 0.0, 40.66355140186917, 31, 96, 38.0, 48.2, 57.599999999999994, 95.28000000000002, 0.9061806602415353, 0.4123829957739799, 0.5044169690797609], "isController": false}, {"data": ["查快速票", 102, 0, 0.0, 1224.7352941176478, 1058, 1541, 1207.5, 1351.4, 1384.6499999999999, 1540.97, 0.899034859635979, 1.6821785068970077, 0.511852854656031], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1483, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
