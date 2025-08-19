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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.8937293729372937, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "获取食物"], "isController": false}, {"data": [1.0, 500, 1500, "支付"], "isController": false}, {"data": [1.0, 500, 1500, "preseveother"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "查票"], "isController": false}, {"data": [1.0, 500, 1500, "进站"], "isController": false}, {"data": [1.0, 500, 1500, "查看所有订单"], "isController": false}, {"data": [1.0, 500, 1500, "获取乘客信息"], "isController": false}, {"data": [1.0, 500, 1500, "托运"], "isController": false}, {"data": [0.4953271028037383, 500, 1500, "查换乘票"], "isController": false}, {"data": [0.9953703703703703, 500, 1500, "订票"], "isController": false}, {"data": [0.5, 500, 1500, "查便宜票"], "isController": false}, {"data": [1.0, 500, 1500, "取票"], "isController": false}, {"data": [1.0, 500, 1500, "查票2"], "isController": false}, {"data": [0.5, 500, 1500, "查快速票"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1515, 0, 0.0, 322.8442244224416, 7, 1502, 36.0, 1232.0, 1283.0, 1365.84, 12.59592440782527, 11.249098435278565, 7.85666075756379], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["获取食物", 109, 0, 0.0, 31.495412844036696, 26, 44, 31.0, 37.0, 40.0, 44.0, 0.917207314097224, 0.8480321853516102, 0.42725379768005456], "isController": false}, {"data": ["支付", 108, 0, 0.0, 15.50925925925926, 10, 35, 14.0, 21.10000000000001, 23.549999999999997, 34.45999999999998, 0.9235821303961141, 0.45186977278169255, 0.503280106211945], "isController": false}, {"data": ["preseveother", 107, 0, 0.0, 52.177570093457945, 35, 97, 48.0, 76.2, 86.6, 96.60000000000001, 0.9263828645143416, 0.4505260415313888, 0.9073847784256686], "isController": false}, {"data": ["Login", 5, 0, 0.0, 153.4, 120, 251, 128.0, 251.0, 251.0, 251.0, 0.6364562118126273, 0.48977294424643586, 0.1839756237270876], "isController": false}, {"data": ["查票", 109, 0, 0.0, 242.44954128440372, 177, 340, 233.0, 294.0, 322.5, 339.70000000000005, 0.9152664768958192, 0.6692623707920834, 0.5085806888219933], "isController": false}, {"data": ["进站", 108, 0, 0.0, 20.388888888888886, 13, 82, 17.0, 29.10000000000001, 37.19999999999999, 80.46999999999994, 0.9235268464123547, 0.4265900374541443, 0.44011826274338783], "isController": false}, {"data": ["查看所有订单", 108, 0, 0.0, 18.12962962962963, 12, 65, 16.0, 24.10000000000001, 31.099999999999994, 63.019999999999925, 0.9234873619044361, 0.7530390109279338, 0.6854007764134488], "isController": false}, {"data": ["获取乘客信息", 108, 0, 0.0, 8.981481481481481, 7, 20, 8.0, 11.0, 13.0, 19.549999999999983, 0.9228560686331476, 0.7957831138701849, 0.44069982183750894], "isController": false}, {"data": ["托运", 108, 0, 0.0, 18.166666666666668, 12, 42, 16.0, 25.10000000000001, 30.549999999999997, 41.45999999999998, 0.9234557767289144, 0.7268606992612354, 0.7349770097988919], "isController": false}, {"data": ["查换乘票", 107, 0, 0.0, 1254.5514018691595, 1058, 1502, 1254.0, 1344.4, 1376.8, 1500.8, 0.9175806742074075, 1.7169380863512018, 0.5242038031360677], "isController": false}, {"data": ["订票", 108, 0, 0.0, 416.3425925925925, 343, 595, 417.0, 473.1, 480.55, 585.9099999999996, 0.9198926791874281, 0.42119326529960394, 0.891146032962821], "isController": false}, {"data": ["查便宜票", 108, 0, 0.0, 1215.2037037037037, 1000, 1427, 1208.0, 1343.0, 1366.1, 1426.19, 0.9144173129677922, 1.7110183978858333, 0.5206106381447488], "isController": false}, {"data": ["取票", 108, 0, 0.0, 18.620370370370374, 13, 61, 17.0, 26.0, 29.099999999999994, 58.749999999999915, 0.9234794654079983, 0.4265681515019368, 0.4418993535643742], "isController": false}, {"data": ["查票2", 109, 0, 0.0, 40.697247706422004, 32, 94, 38.0, 48.0, 55.0, 92.60000000000008, 0.9170221179004401, 0.4173167059976612, 0.5104517648469246], "isController": false}, {"data": ["查快速票", 105, 0, 0.0, 1211.8190476190473, 1047, 1393, 1220.0, 1292.2, 1338.8999999999999, 1392.88, 0.9088705768298595, 1.700641227126757, 0.5174526819255938], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1515, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
