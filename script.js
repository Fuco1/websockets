function WebSocketTest() {
    if ("WebSocket" in window) {
        var ws = new ab.Session(
            "ws://localhost:1337/",
            function() {
                ws.subscribe('all', function (topic, data) {
                    console.log(data);
                    data = JSON.parse(data);
                    switch (data.type) {
                    case 'INIT':
                        var msgDiv = document.getElementById("topic");
                        var content = document.createElement("p");
                        content.innerHTML = JSON.stringify(data.workers);
                        msgDiv.appendChild(content);

                        data.workers.sort();
                        var tableDiv = document.getElementById("workertable");
                        var table = document.createElement("table");
                        var cp = document.createAttribute("cellpadding");
                        cp.value = 1;
                        table.setAttributeNode(cp);
                        var cp = document.createAttribute("cellspacing");
                        cp.value = 1;
                        table.setAttributeNode(cp);
                        var cp = document.createAttribute("border");
                        cp.value = 1;
                        table.setAttributeNode(cp);
                        data.workers.forEach(function (e) {
                            var tr = document.createElement("tr");
                            var td = document.createElement("td");
                            td.innerHTML = e;
                            tr.appendChild(td);
                            table.appendChild(tr);
                        });

                        tableDiv.appendChild(table);
                        break;
                    case 'NEW_WORKER':
                        var table = document.getElementById("workertable").getElementsByTagName("table")[0];
                        var tr = document.createElement("tr");
                        var td = document.createElement("td");
                        td.innerHTML = data.worker;
                        tr.appendChild(td);
                        table.appendChild(tr);
                        sortData(table);
                        break;
                    case 'REMOVE_WORKER':
                        var table = document.getElementById("workertable").getElementsByTagName("table")[0];
                        var rowData = table.getElementsByTagName("tr");
                        for (var i = 0; i < rowData.length; i++) {
                            var row = rowData[i];
                            if (row.getElementsByTagName("td")[0].innerHTML == data.worker) {
                                table.removeChild(row);
                            }
                        };
                        break;
                    }
                });
            });

        ws.onmessage = function (event)
        {
            var msgDiv = document.getElementById("message");
            msgDiv.innerHTML = event.data;
        };

    } else {
        alert("Websockets not supported");
    }
}


function sortData(table) {
    // Read table row nodes.
    var rowData = table.getElementsByTagName('tr');

    for(var i = 0; i < rowData.length - 1; i++) {
        for(var j = 0; j < rowData.length - (i + 1); j++) {

            //Swap row nodes if short condition matches
            if(rowData.item(j).getElementsByTagName('td').item(0).innerHTML >
               rowData.item(j+1).getElementsByTagName('td').item(0).innerHTML) {
                table.insertBefore(rowData.item(j+1),rowData.item(j));
            }
        }
    }
}
