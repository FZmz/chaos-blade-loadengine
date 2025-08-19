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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.871855880353501, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "获取食物"], "isController": false}, {"data": [1.0, 500, 1500, "支付"], "isController": false}, {"data": [1.0, 500, 1500, "preseveother"], "isController": false}, {"data": [1.0, 500, 1500, "Login"], "isController": false}, {"data": [1.0, 500, 1500, "查票"], "isController": false}, {"data": [1.0, 500, 1500, "进站"], "isController": false}, {"data": [1.0, 500, 1500, "查看所有订单"], "isController": false}, {"data": [1.0, 500, 1500, "获取乘客信息"], "isController": false}, {"data": [1.0, 500, 1500, "托运"], "isController": false}, {"data": [0.5, 500, 1500, "查换乘票"], "isController": false}, {"data": [0.6857142857142857, 500, 1500, "订票"], "isController": false}, {"data": [0.5, 500, 1500, "查便宜票"], "isController": false}, {"data": [1.0, 500, 1500, "取票"], "isController": false}, {"data": [1.0, 500, 1500, "查票2"], "isController": false}, {"data": [0.49514563106796117, 500, 1500, "查快速票"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 1471, 0, 0.0, 334.02379333786587, 6, 1581, 35.0, 1221.0, 1279.1999999999996, 1367.3199999999995, 12.19249386645448, 10.884954967135801, 7.602112654167496], "isController": false}, "titles": ["Label", "#Samples", "FAIL", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions/s", "Received", "Sent"], "items": [{"data": ["获取食物", 106, 0, 0.0, 29.537735849056606, 24, 51, 29.0, 34.0, 37.29999999999998, 50.71999999999997, 0.8937153263747197, 0.8263062814065056, 0.41631075261791145], "isController": false}, {"data": ["支付", 104, 0, 0.0, 13.076923076923077, 9, 28, 12.0, 16.0, 17.75, 27.750000000000014, 0.8854077983994552, 0.4331926826153584, 0.48247807764345313], "isController": false}, {"data": ["preseveother", 103, 0, 0.0, 71.76699029126215, 47, 152, 63.0, 103.0, 134.59999999999997, 151.92, 0.9000349528137015, 0.43771231103635094, 0.8815772047579518], "isController": false}, {"data": ["Login", 5, 0, 0.0, 155.6, 120, 282, 125.0, 282.0, 282.0, 282.0, 0.6406149903907751, 0.4929732543241512, 0.18517777065983346], "isController": false}, {"data": ["查票", 107, 0, 0.0, 297.7289719626169, 217, 448, 295.0, 359.4, 380.79999999999995, 444.4000000000001, 0.8991898887357558, 0.6575030620777169, 0.4996475065338331], "isController": false}, {"data": ["进站", 105, 0, 0.0, 17.42857142857142, 11, 47, 16.0, 24.400000000000006, 31.099999999999966, 46.639999999999986, 0.8926749642930014, 0.41233911924862277, 0.4254154126708835], "isController": false}, {"data": ["查看所有订单", 105, 0, 0.0, 16.91428571428571, 12, 45, 15.0, 22.0, 27.099999999999966, 44.339999999999975, 0.8925914906277893, 0.7278456002677774, 0.6624702469503124], "isController": false}, {"data": ["获取乘客信息", 105, 0, 0.0, 8.457142857142857, 6, 20, 8.0, 11.0, 12.0, 19.579999999999984, 0.8931989281612862, 0.7702096226234528, 0.4265373787801454], "isController": false}, {"data": ["托运", 105, 0, 0.0, 14.333333333333336, 11, 28, 13.0, 20.0, 23.0, 27.75999999999999, 0.8926218428815533, 0.7025910208618477, 0.7104363300277988], "isController": false}, {"data": ["查换乘票", 103, 0, 0.0, 1245.6699029126212, 1075, 1473, 1242.0, 1336.6, 1357.0, 1471.5999999999997, 0.8913504391848038, 1.6678593932542944, 0.5092187567608498], "isController": false}, {"data": ["订票", 105, 0, 0.0, 535.6857142857144, 426, 908, 523.0, 617.4, 640.1999999999998, 900.9199999999997, 0.8888738391730934, 0.4070698273891659, 0.8610965316989342], "isController": false}, {"data": ["查便宜票", 104, 0, 0.0, 1204.0000000000007, 991, 1425, 1196.5, 1315.5, 1356.0, 1424.95, 0.877067222142574, 1.6410749976808319, 0.49934588916906314], "isController": false}, {"data": ["取票", 105, 0, 0.0, 18.476190476190467, 11, 66, 16.0, 29.0, 32.69999999999999, 64.73999999999995, 0.8926673751328374, 0.4123356137088204, 0.42715528692879917], "isController": false}, {"data": ["查票2", 106, 0, 0.0, 39.75471698113207, 31, 67, 37.0, 48.89999999999999, 55.64999999999999, 66.78999999999998, 0.8935721812434141, 0.4066451527924131, 0.4973985774499473], "isController": false}, {"data": ["查快速票", 103, 0, 0.0, 1212.7281553398059, 978, 1581, 1202.0, 1329.8, 1416.3999999999999, 1577.1999999999994, 0.8922615799093878, 1.669505065533581, 0.5079965830929425], "isController": false}]}, function(index, item){
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
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 1471, 0, "", "", "", "", "", "", "", "", "", ""], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}, {"data": [], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
