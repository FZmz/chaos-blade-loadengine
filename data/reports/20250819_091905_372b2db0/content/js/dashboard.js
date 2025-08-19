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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.8923927178153446, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "获取食物"], "isController": false}, {"data": [1.0, 500, 1500, "支付"], "isController": false}, {"data": [1.0, 500, 1500, "preseveother"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "查票"], "isController": false}, {"data": [1.0, 500, 1500, "进站"], "isController": false}, {"data": [1.0, 500, 1500, "查看所有订单"], "isController": false}, {"data": [1.0, 500, 1500, "获取乘客信息"], "isController": false}, {"data": [1.0, 500, 1500, "托运"], "isController": false}, {"data": [0.5, 500, 1500, "查换乘票"], "isController": false}, {"data": [0.9681818181818181, 500, 1500, "订票"], "isController": false}, {"data": [0.5, 500, 1500, "查便宜票"], "isController": false}, {"data": [1.0, 500, 1500, "取票"], "isController": false}, {"data": [1.0, 500, 1500, "查票2"], "isController": false}, {"data": [0.5, 500, 1500, "查快速票"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1538, 0, 0.0, 317.38556566970175, 7, 1485, 36.0, 1204.0, 1262.05, 1363.61, 12.734634396760866, 11.36211179754581, 7.946815448713703], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["获取食物", 110, 0, 0.0, 31.863636363636374, 25, 92, 29.0, 40.70000000000002, 43.44999999999999, 89.91000000000001, 0.9330573745461948, 0.8626887453135073, 0.43463707779153804], "isController": false}, {"data": ["支付", 110, 0, 0.0, 14.472727272727273, 10, 33, 13.0, 19.0, 22.899999999999977, 32.78, 0.9338257141644382, 0.4568815261683433, 0.5088620590856997], "isController": false}, {"data": ["preseveother", 109, 0, 0.0, 54.559633027522935, 36, 136, 51.0, 69.0, 77.0, 135.20000000000005, 0.9355179250384077, 0.45496867838781935, 0.916332498841331], "isController": false}, {"data": ["Login", 5, 0, 0.0, 153.2, 124, 231, 132.0, 231.0, 231.0, 231.0, 0.6303580433686333, 0.4850802130610186, 0.18221287191124558], "isController": false}, {"data": ["查票", 110, 0, 0.0, 239.2090909090909, 189, 354, 230.0, 287.9, 296.45, 353.67, 0.9311302227940679, 0.6808641761402113, 0.5173956023142818], "isController": false}, {"data": ["进站", 110, 0, 0.0, 17.66363636363636, 12, 59, 16.0, 23.0, 27.899999999999977, 56.47000000000001, 0.9336751150117982, 0.4312776654302545, 0.4449545469978101], "isController": false}, {"data": ["查看所有订单", 110, 0, 0.0, 16.418181818181807, 12, 34, 15.0, 20.0, 27.0, 33.56, 0.9336117193732919, 0.7612947125749011, 0.6929149479723651], "isController": false}, {"data": ["获取乘客信息", 110, 0, 0.0, 8.954545454545451, 7, 24, 8.0, 11.900000000000006, 13.449999999999989, 23.78, 0.9333423839261471, 0.8048255127019414, 0.4457074470116074], "isController": false}, {"data": ["托运", 110, 0, 0.0, 15.345454545454546, 12, 33, 14.0, 19.900000000000006, 20.44999999999999, 32.010000000000005, 0.9336513406384478, 0.7348857231978407, 0.7430916431839208], "isController": false}, {"data": ["查换乘票", 108, 0, 0.0, 1238.0740740740735, 1054, 1485, 1236.0, 1363.1, 1378.65, 1480.6799999999998, 0.9196890088647801, 1.720882568806363, 0.5254082716659144], "isController": false}, {"data": ["订票", 110, 0, 0.0, 426.2272727272727, 349, 592, 423.0, 482.70000000000005, 506.45, 585.95, 0.9301538981904278, 0.42585259703196343, 0.901086588871977], "isController": false}, {"data": ["查便宜票", 110, 0, 0.0, 1190.6727272727276, 991, 1430, 1189.5, 1290.0, 1339.6, 1426.92, 0.9254040229836709, 1.7315751927574516, 0.5268657669916798], "isController": false}, {"data": ["取票", 110, 0, 0.0, 17.990909090909092, 12, 71, 16.0, 22.80000000000001, 32.44999999999999, 69.02000000000001, 0.9336513406384478, 0.4312666837128768, 0.44676675479769473], "isController": false}, {"data": ["查票2", 110, 0, 0.0, 40.48181818181817, 32, 101, 38.0, 47.900000000000006, 56.44999999999999, 99.79, 0.9328516426669381, 0.42452037644804014, 0.5192631214064011], "isController": false}, {"data": ["查快速票", 106, 0, 0.0, 1184.8207547169811, 1032, 1403, 1174.0, 1289.6, 1347.0, 1402.93, 0.9191654671268275, 1.7198447607568372, 0.5233139329442777], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1538, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
