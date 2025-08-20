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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.8330345501955672, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "获取食物"], "isController": false}, {"data": [0.9885844748858448, 500, 1500, "支付"], "isController": false}, {"data": [1.0, 500, 1500, "preseveother"], "isController": false}, {"data": [0.9, 500, 1500, "Login"], "isController": false}, {"data": [0.9136363636363637, 500, 1500, "查票"], "isController": false}, {"data": [1.0, 500, 1500, "进站"], "isController": false}, {"data": [1.0, 500, 1500, "查看所有订单"], "isController": false}, {"data": [1.0, 500, 1500, "获取乘客信息"], "isController": false}, {"data": [1.0, 500, 1500, "托运"], "isController": false}, {"data": [0.4379310344827586, 500, 1500, "查换乘票"], "isController": false}, {"data": [0.4772209567198178, 500, 1500, "订票"], "isController": false}, {"data": [0.41954022988505746, 500, 1500, "查便宜票"], "isController": false}, {"data": [0.9886104783599089, 500, 1500, "取票"], "isController": false}, {"data": [0.9954545454545455, 500, 1500, "查票2"], "isController": false}, {"data": [0.43103448275862066, 500, 1500, "查快速票"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 6136, 0, 0.0, 417.15987614080876, 6, 5803, 47.0, 1344.3000000000002, 1441.1499999999996, 1850.63, 10.39251386712961, 9.289269911504425, 6.492547410234154], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["获取食物", 439, 0, 0.0, 33.674259681093375, 23, 132, 32.0, 43.0, 51.0, 69.20000000000005, 0.7508650341481103, 0.6943283392541636, 0.3497681848521959], "isController": false}, {"data": ["支付", 438, 0, 0.0, 41.94977168949773, 10, 1579, 19.5, 43.10000000000002, 58.29999999999973, 1559.22, 0.7593567312293258, 0.37152121322841036, 0.41379009377535525], "isController": false}, {"data": ["preseveother", 435, 0, 0.0, 85.41839080459765, 53, 187, 81.0, 116.40000000000003, 128.2, 150.19999999999993, 0.7652576543357563, 0.3721663201750065, 0.7495638938464488], "isController": false}, {"data": ["Login", 5, 0, 0.0, 286.6, 136, 775, 162.0, 775.0, 775.0, 775.0, 0.6519754857217369, 0.5017155104968053, 0.18846166384143956], "isController": false}, {"data": ["查票", 440, 0, 0.0, 426.8750000000001, 258, 1583, 387.0, 571.3000000000002, 710.4999999999999, 969.5399999999998, 0.7465978891641497, 0.546758344079818, 0.41485761614687616], "isController": false}, {"data": ["进站", 439, 0, 0.0, 32.15945330296126, 13, 454, 24.0, 50.0, 66.0, 209.8000000000029, 0.7605274145013001, 0.35123909448730234, 0.36243884597327586], "isController": false}, {"data": ["查看所有订单", 439, 0, 0.0, 21.640091116173128, 11, 101, 19.0, 32.0, 40.0, 77.60000000000014, 0.7575286963604111, 0.6177113881454525, 0.5622283293299927], "isController": false}, {"data": ["获取乘客信息", 439, 0, 0.0, 9.931662870159457, 6, 41, 8.0, 15.0, 19.0, 30.600000000000023, 0.7509485215380247, 0.6475464301934334, 0.35860725296102935], "isController": false}, {"data": ["托运", 439, 0, 0.0, 33.537585421412295, 14, 263, 24.0, 55.0, 77.0, 234.2000000000005, 0.7575927533405699, 0.5962409475000302, 0.6029668886450825], "isController": false}, {"data": ["查换乘票", 435, 0, 0.0, 1373.2988505747123, 1060, 3016, 1325.0, 1538.6000000000004, 1851.0, 2820.7199999999984, 0.7635235823473348, 1.426330752491983, 0.43619267155585045], "isController": false}, {"data": ["订票", 439, 0, 0.0, 961.5899772209566, 561, 5803, 867.0, 1298.0, 1491.0, 3188.400000000045, 0.7500337429759083, 0.34344623313064765, 0.7265951885079112], "isController": false}, {"data": ["查便宜票", 435, 0, 0.0, 1395.5563218390796, 1080, 3316, 1345.0, 1595.2000000000003, 1728.0, 3226.84, 0.7610509851673788, 1.4218005624341736, 0.4332936761255682], "isController": false}, {"data": ["取票", 439, 0, 0.0, 53.268792710706144, 13, 2062, 24.0, 50.0, 65.0, 1996.0000000000005, 0.7578386235302851, 0.35005631731428205, 0.3626376225877341], "isController": false}, {"data": ["查票2", 440, 0, 0.0, 60.57045454545454, 31, 1963, 45.0, 72.90000000000003, 93.89999999999998, 189.84999999999962, 0.7485641179192639, 0.3406551552249775, 0.41668119845115276], "isController": false}, {"data": ["查快速票", 435, 0, 0.0, 1335.1586206896552, 1013, 2619, 1292.0, 1528.8000000000002, 1642.5999999999995, 2319.999999999998, 0.7650880642744327, 1.4293100263251852, 0.4355921303437444], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 6136, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
