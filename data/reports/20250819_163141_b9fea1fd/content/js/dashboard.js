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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.8585376930063578, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "获取食物"], "isController": false}, {"data": [1.0, 500, 1500, "支付"], "isController": false}, {"data": [1.0, 500, 1500, "preseveother"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [0.990506329113924, 500, 1500, "查票"], "isController": false}, {"data": [1.0, 500, 1500, "进站"], "isController": false}, {"data": [1.0, 500, 1500, "查看所有订单"], "isController": false}, {"data": [1.0, 500, 1500, "获取乘客信息"], "isController": false}, {"data": [1.0, 500, 1500, "托运"], "isController": false}, {"data": [0.49038461538461536, 500, 1500, "查换乘票"], "isController": false}, {"data": [0.5284810126582279, 500, 1500, "订票"], "isController": false}, {"data": [0.4968152866242038, 500, 1500, "查便宜票"], "isController": false}, {"data": [1.0, 500, 1500, "取票"], "isController": false}, {"data": [1.0, 500, 1500, "查票2"], "isController": false}, {"data": [0.49673202614379086, 500, 1500, "查快速票"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 2202, 0, 0.0, 339.38010899182467, 6, 1829, 33.0, 1199.4, 1261.0, 1374.8199999999988, 12.202150060955336, 10.90110213135875, 7.617744886332151], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["获取食物", 158, 0, 0.0, 28.202531645569604, 22, 82, 27.0, 33.099999999999994, 35.14999999999995, 75.50999999999996, 0.8852234909180552, 0.8185220496985759, 0.4123550831717894], "isController": false}, {"data": ["支付", 157, 0, 0.0, 13.445859872611464, 9, 50, 12.0, 19.0, 23.0, 49.41999999999999, 0.8902649246960624, 0.4355690696022727, 0.48512483201211215], "isController": false}, {"data": ["preseveother", 156, 0, 0.0, 80.50000000000003, 47, 184, 71.0, 114.30000000000001, 136.0, 175.4500000000001, 0.8875184188518015, 0.4316251685431613, 0.8693173575276923], "isController": false}, {"data": ["Login", 5, 0, 0.0, 137.8, 113, 210, 125.0, 210.0, 210.0, 210.0, 0.6346788525006347, 0.488405210713379, 0.18346185580096472], "isController": false}, {"data": ["查票", 158, 0, 0.0, 324.31645569620247, 235, 815, 314.5, 407.29999999999995, 443.04999999999995, 652.7499999999991, 0.8838122514278043, 0.6463237623132387, 0.4911027061156452], "isController": false}, {"data": ["进站", 157, 0, 0.0, 17.044585987261136, 11, 66, 15.0, 22.0, 28.0, 60.77999999999989, 0.890254828356601, 0.4112212244264377, 0.4242620666386926], "isController": false}, {"data": ["查看所有订单", 157, 0, 0.0, 16.643312101910816, 12, 43, 15.0, 24.200000000000017, 29.0, 41.25999999999996, 0.8899974490518977, 0.725730341756186, 0.6605449817182053], "isController": false}, {"data": ["获取乘客信息", 158, 0, 0.0, 8.189873417721529, 6, 17, 8.0, 10.099999999999994, 12.0, 15.819999999999993, 0.8853673433936466, 0.7634564103677637, 0.4227974911323176], "isController": false}, {"data": ["托运", 157, 0, 0.0, 13.452229299363058, 10, 57, 12.0, 15.0, 18.299999999999983, 43.65999999999971, 0.8901589245519439, 0.7005140118527212, 0.7084760971775725], "isController": false}, {"data": ["查换乘票", 156, 0, 0.0, 1242.051282051282, 1007, 1829, 1223.5, 1364.0, 1429.3500000000001, 1686.5000000000018, 0.881141869489333, 1.648699044864807, 0.5033867125500584], "isController": false}, {"data": ["订票", 158, 0, 0.0, 623.7341772151899, 469, 1139, 604.5, 740.3999999999999, 800.3499999999996, 1099.4699999999998, 0.8825878817332239, 0.40409576811679204, 0.8550070104290606], "isController": false}, {"data": ["查便宜票", 157, 0, 0.0, 1187.2611464968159, 987, 1501, 1185.0, 1312.4, 1358.4999999999998, 1499.84, 0.8847911723764815, 1.6555657573840612, 0.5037434116166881], "isController": false}, {"data": ["取票", 157, 0, 0.0, 20.382165605095533, 12, 159, 15.0, 28.200000000000017, 44.69999999999996, 138.69999999999956, 0.8901690187162289, 0.41118158774685176, 0.42595978434663295], "isController": false}, {"data": ["查票2", 158, 0, 0.0, 38.03164556962025, 29, 111, 36.0, 46.0, 50.0, 86.21999999999986, 0.8853673433936466, 0.4029113105678119, 0.4928314313812291], "isController": false}, {"data": ["查快速票", 153, 0, 0.0, 1174.1503267973858, 978, 1678, 1170.0, 1282.2, 1311.8999999999999, 1521.9400000000023, 0.8784319129146715, 1.6436677098045631, 0.5001228566691929], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 2202, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
