function inputOnChange() { //onchange EventListener for input
    /// ketika input text di isi maka secara otomatis akan menghilangkan angka 0 di depan jika merupakan
    ///bilangan satuan
    let inputs = document.querySelectorAll('input');
    inputs.forEach((input) => {
        if (input.type == 'number') {
            input.onchange = () => {
                let inputVal = Number(input.value);
                let isInt = Number.isInteger(inputVal);
                if (input.parentNode.classList.contains('arrival-time') || input.id == 'switchT') //min 0 : arrival time
                {
                    if (!isInt || (isInt && inputVal < 0)) {
                        input.value = 0;
                    } else {
                        input.value = inputVal;
                    }
                } else //min 1 : time quantum, priority, process time
                {
                    if (!isInt || (isInt && inputVal < 1)) {
                        input.value = 1;
                    } else {
                        input.value = inputVal;
                    }
                }
            }
        }
    });
}

//panggil fungsi input on change
inputOnChange();
let process = 7;

function setInput(input) {
    // membuat looping untuk mengambil value dari semua input text
    for (let i = 1; i <= process; i++) {
        // panggil attribut process ID dalam class Input 
        // yang akan di instansiasikan dalam parameter
        // dan tambahkan value i  dari looping yg dikurangi 1
        input.processId.push(i - 1);
        // console.log(i - 1)
        //inisialiasi untuk melakukan selector class dalam table
        //seleksi row & kolom 1
        let rowCells1 = document.querySelector(".main-table").rows[2 * i - 1].cells;
        // seleksi row dan kolom 2
        let rowCells2 = document.querySelector(".main-table").rows[2 * i].cells;
        //ambil semua value yang ada pada input text arrival time pada kolom ke 2
        //dan tambahkan ke dalam array priority
        input.priority.push(Number(rowCells1[1].firstElementChild.value));
        console.log(rowCells1[1]);
        // ambil semua value yang ada pada input text process time pada kolom ke 3
        // dan tambahkan ke dalam array arrivalTime
        input.arrivalTime.push(Number(rowCells1[2].firstElementChild.value));
        console.log(rowCells2[2]);
        let ptn = Number(rowCells2.length);
        let pta = [];
        for (let j = 0; j < ptn; j++) {
            pta.push(Number(rowCells2[j].firstElementChild.value));
            // console.log(rowCells2[j]);
        }
        //push element pta pada list proccess time
        input.processTime.push(pta);
        //push nilai ptn pada list proccessTimeLength
        input.processTimeLength.push(ptn);
        // console.log(ptn)
    }
    // total burst time for each process
    input.totalBurstTime = new Array(process).fill(0);
    input.processTime.forEach((e1, i) => {
        e1.forEach((e2, j) => {
            if (j % 2 == 0) {
                input.totalBurstTime[i] += e2;
            }
        });
    });

    input.contextSwitch = Number(document.querySelector('#switchT').value);
}

//for set util 
function setUtility(input, utility) {
    //input value ke dalam attribut dari class utility
    utility.remainingProcessTime = input.processTime.slice();
    utility.remainingBurstTime = input.totalBurstTime.slice();
    utility.remainingTimeRunning = new Array(process).fill(0);
    utility.currentProcessIndex = new Array(process).fill(0);
    utility.start = new Array(process).fill(false);
    utility.done = new Array(process).fill(false);
    utility.returnTime = input.arrivalTime.slice();
}

function CPUSchedule(input, utility, output) {
    function updateReadyQueue(currentTimeLog) {
        let candidatesRemain = currentTimeLog.remain.filter((element) => input.arrivalTime[element] <= currentTimeLog.time);
        if (candidatesRemain.length > 0) {
            currentTimeLog.move.push(0);
        }
        let candidatesBlock = currentTimeLog.block.filter((element) => utility.returnTime[element] <= currentTimeLog.time);
        if (candidatesBlock.length > 0) {
            currentTimeLog.move.push(5);
        }
        let candidates = candidatesRemain.concat(candidatesBlock);
        candidates.sort((a, b) => utility.returnTime[a] - utility.returnTime[b]);
        candidates.forEach(element => {
            moveElement(element, currentTimeLog.remain, currentTimeLog.ready);
            moveElement(element, currentTimeLog.block, currentTimeLog.ready);
        });
        output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
        currentTimeLog.move = [];
    }

    function moveElement(value, from, to) { //if present in from and not in to
        let index = from.indexOf(value);
        if (index != -1) {
            from.splice(index, 1);
        }
        if (to.indexOf(value) == -1) {
            to.push(value);
        }
    }
    let currentTimeLog = new TimeLog();
    currentTimeLog.remain = input.processId;
    output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
    currentTimeLog.move = [];
    currentTimeLog.time++;
    let lastFound = -1;
    while (utility.done.some((element) => element == false)) {
        updateReadyQueue(currentTimeLog);
        let found = -1;
        if (currentTimeLog.running.length == 1) {
            found = currentTimeLog.running[0];
        } else if (currentTimeLog.ready.length > 0) {
            if (input.algorithm == 'rr') {
                found = currentTimeLog.ready[0];
                utility.remainingTimeRunning[found] = Math.min(utility.remainingProcessTime[found][utility.currentProcessIndex[found]], input.timeQuantum);
            } else {
                let candidates = currentTimeLog.ready;
                candidates.sort((a, b) => a - b);
                candidates.sort((a, b) => {
                    return utility.returnTime[a] - utility.returnTime[b];
                });
                found = candidates[0];
            }
            moveElement(found, currentTimeLog.ready, currentTimeLog.running);
            currentTimeLog.move.push(1);
            output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
            currentTimeLog.move = [];
            if (utility.start[found] == false) {
                utility.start[found] = true;
                output.responseTime[found] = currentTimeLog.time - input.arrivalTime[found];
            }
        }
        currentTimeLog.time++;
        if (found != -1) {
            output.schedule.push([found + 1, 1]);
            utility.remainingProcessTime[found][utility.currentProcessIndex[found]]--;
            utility.remainingBurstTime[found]--;
            if (utility.remainingProcessTime[found][utility.currentProcessIndex[found]] == 0) {
                utility.currentProcessIndex[found]++;
                if (utility.currentProcessIndex[found] == input.processTimeLength[found]) {
                    utility.done[found] = true;
                    output.completionTime[found] = currentTimeLog.time;
                    moveElement(found, currentTimeLog.running, currentTimeLog.terminate);
                    currentTimeLog.move.push(2);
                } else {
                    utility.returnTime[found] = currentTimeLog.time + input.processTime[found][utility.currentProcessIndex[found]];
                    utility.currentProcessIndex[found]++;
                    moveElement(found, currentTimeLog.running, currentTimeLog.block);
                    currentTimeLog.move.push(4);
                }
                output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
                currentTimeLog.move = [];
                if (currentTimeLog.running.length == 0) { //context switch
                    output.schedule.push([-2, input.contextSwitch]);
                    for (let i = 0; i < input.contextSwitch; i++, currentTimeLog.time++) {
                        updateReadyQueue(currentTimeLog);
                    }
                    if (input.contextSwitch > 0) {
                        output.contextSwitches++;
                    }
                }
                lastFound = -1;
            }

        } else {
            output.schedule.push([-1, 1]);
            lastFound = -1;
        }
        output.timeLog.push(JSON.parse(JSON.stringify(currentTimeLog)));
    }
    output.schedule.pop();
}

function reduceSchedule(schedule) {
    let newSchedule = [];
    let currentScheduleElement = schedule[0][0];
    let currentScheduleLength = schedule[0][1];
    for (let i = 1; i < schedule.length; i++) {
        if (schedule[i][0] == currentScheduleElement) {
            currentScheduleLength += schedule[i][1];
        } else {
            newSchedule.push([currentScheduleElement, currentScheduleLength]);
            currentScheduleElement = schedule[i][0];
            currentScheduleLength = schedule[i][1];
        }
    }
    newSchedule.push([currentScheduleElement, currentScheduleLength]);
    return newSchedule;
}

function reduceTimeLog(timeLog) {
    let timeLogLength = timeLog.length;
    let newTimeLog = [],
        j = 0;
    for (let i = 0; i < timeLogLength - 1; i++) {
        if (timeLog[i] != timeLog[i + 1]) {
            newTimeLog.push(timeLog[j]);
        }
        j = i + 1;
    }
    if (j == timeLogLength - 1) {
        newTimeLog.push(timeLog[j]);
    }
    return newTimeLog;
}

function outputAverageTimes(output) {
    let avgct = 0;
    output.completionTime.forEach((element) => {
        avgct += element;
    });
    avgct /= process;
    let avgtat = 0;
    output.turnAroundTime.forEach((element) => {
        avgtat += element;
    });
    avgtat /= process;
    let avgwt = 0;
    output.waitingTime.forEach((element) => {
        avgwt += element;
    });
    avgwt /= process;
    let avgrt = 0;
    output.responseTime.forEach((element) => {
        avgrt += element;
    });
    avgrt /= process;
    return [avgct, avgtat, avgwt, avgrt];
}

function setResult(input, output) {
    //set turn around time and waiting time
    for (let i = 0; i < process; i++) {
        output.turnAroundTime[i] = output.completionTime[i] - input.arrivalTime[i];
        output.waitingTime[i] = output.turnAroundTime[i] - input.totalBurstTime[i];
    }
    output.schedule = reduceSchedule(output.schedule);
    output.timeLog = reduceTimeLog(output.timeLog);
    output.averageTimes = outputAverageTimes(output);
}

//mengambil detik
function getSeconds(sec) {
    return (new Date(0, 0, 0, 0, sec / 60, sec % 60));
}

function showGrantChart(output, outputDiv) {
    let ganttChartHeading = document.createElement("h3");
    ganttChartHeading.innerHTML = "Gant Chart";
    ganttChartHeading.className = "text-center";
    outputDiv.appendChild(ganttChartHeading);
    let ganttChartData = [];
    let startGantt = 0;
    output.schedule.forEach((element) => {
        if (element[0] == -2) { //context switch
            ganttChartData.push([
                "Time",
                "CS",
                "blue",
                getSeconds(startGantt),
                getSeconds(startGantt + element[1])
            ]);

        } else if (element[0] == -1) { //nothing
            ganttChartData.push([
                "Time",
                "Empty",
                "black",
                getSeconds(startGantt),
                getSeconds(startGantt + element[1])
            ]);

        } else { //process 
            ganttChartData.push([
                "Time",
                "P" + element[0],
                "",
                getSeconds(startGantt),
                getSeconds(startGantt + element[1])
            ]);
        }
        startGantt += element[1];
    });
    let ganttChart = document.createElement("div");
    ganttChart.id = "gantt-chart";
    ganttChart.className = "container";

    google.charts.load("current", { packages: ["timeline"] });
    google.charts.setOnLoadCallback(drawGanttChart);

    function drawGanttChart() {
        var container = document.getElementById("gantt-chart");
        var chart = new google.visualization.Timeline(container);
        var dataTable = new google.visualization.DataTable();

        dataTable.addColumn({ type: "string", id: "Gantt Chart" });
        dataTable.addColumn({ type: "string", id: "Process" });
        dataTable.addColumn({ type: 'string', id: 'style', role: 'style' });
        dataTable.addColumn({ type: "date", id: "Start" });
        dataTable.addColumn({ type: "date", id: "End" });
        dataTable.addRows(ganttChartData);
        let ganttWidth = '100%';
        if (startGantt >= 20) {
            ganttWidth = 0.05 * startGantt * screen.availWidth;
        }
        var options = {
            width: ganttWidth,
            timeline: {
                showRowLabels: false,
                avoidOverlappingGridLines: false
            }
        };
        chart.draw(dataTable, options);
    }
    outputDiv.appendChild(ganttChart);
}

function showTimeLine(result, resultDiv) {
    let timelineHeading = document.createElement("h3");
    timelineHeading.innerHTML = "Timeline Chart";
    timelineHeading.className = "text-center";
    resultDiv.appendChild(timelineHeading);
    let timeLineData = [];
    let startTimeLine = 0;
    result.schedule.forEach((e) => {
        if (e[0] >= 0) {
            timeLineData.push([
                "P" + e[0],
                getSeconds(startTimeLine),
                getSeconds(startTimeLine + e[1])
            ]);
        }
        startTimeLine += e[1];
    });
    timeLineData.sort((a, b) => parseInt(a[0].substring(1, a[0].length)) - parseInt(b[0].substring(1, b[0].length)));
    let timeLineChart = document.createElement("div");
    timeLineChart.id = "timeline-chart";
    timeLineChart.className = "container";

    google.charts.load("current", { packages: ["timeline"] });
    google.charts.setOnLoadCallback(drawTimeLine);

    function drawTimeLine() {
        var container = document.getElementById("timeline-chart");
        var chart = new google.visualization.Timeline(container);
        var dataTable = new google.visualization.DataTable();

        dataTable.addColumn({ type: "string", id: "Process" });
        dataTable.addColumn({ type: "date", id: "Start" });
        dataTable.addColumn({ type: "date", id: "End" });
        dataTable.addRows(timeLineData);

        let timeLineWidth = '100%';
        if (startTimeLine >= 20) {
            timeLineWidth = 0.05 * startTimeLine * screen.availWidth;
        }
        var options = {
            width: timeLineWidth
        }
        chart.draw(dataTable, options);
    }
    resultDiv.appendChild(timeLineChart);

}

function showFinalTable(input, output, outputDiv) {
    let finalTableHeading = document.createElement("h3");
    finalTableHeading.innerHTML = "Final Table";
    finalTableHeading.className = "text-center";
    outputDiv.appendChild(finalTableHeading);
    let table = document.createElement("table");
    table.classList.add("final-table");
    table.className = "container table-bordered";
    let thead = table.createTHead();
    let row = thead.insertRow(0);
    let headings = [
        "Process",
        "Arrival Time",
        "Total Burst Time",
        "Completion Time",
        "Turn Around Time",
        "Waiting Time",
        "Response Time",
    ];
    headings.forEach((element, index) => {
        let cell = row.insertCell(index);
        cell.innerHTML = element;
    });
    let tbody = table.createTBody();
    for (let i = 0; i < process; i++) {
        let row = tbody.insertRow(i);
        let cell = row.insertCell(0);
        cell.innerHTML = "P" + (i + 1);
        cell = row.insertCell(1);
        cell.innerHTML = input.arrivalTime[i];
        cell = row.insertCell(2);
        cell.innerHTML = input.totalBurstTime[i];
        cell = row.insertCell(3);
        cell.innerHTML = output.completionTime[i];
        cell = row.insertCell(4);
        cell.innerHTML = output.turnAroundTime[i];
        cell = row.insertCell(5);
        cell.innerHTML = output.waitingTime[i];
        cell = row.insertCell(6);
        cell.innerHTML = output.responseTime[i];
    }
    outputDiv.appendChild(table);

    let tbt = 0;
    input.totalBurstTime.forEach((element) => (tbt += element));
    let lastct = 0;
    output.completionTime.forEach((element) => (lastct = Math.max(lastct, element)));

    let cpu = document.createElement("p");
    cpu.className = "text-center";
    cpu.innerHTML = "CPU Utilization : " + (tbt / lastct) * 100 + "%";
    outputDiv.appendChild(cpu);

    let tp = document.createElement("p");
    tp.className = "text-center";
    tp.innerHTML = "Throughput : " + process / lastct;
    outputDiv.appendChild(tp);
    if (input.contextSwitch > 0) {

        let cs = document.createElement("p");
        cs.innerHTML = "Number of Context Switches : " + (output.contextSwitches - 1);
        cs.className = "text-center";
        outputDiv.appendChild(cs);
    }
}

function showResult(input, result, resultDiv) {
    showGrantChart(result, resultDiv);
    resultDiv.insertAdjacentHTML("beforeend", "<hr>");
    showTimeLine(result, resultDiv);
    resultDiv.insertAdjacentHTML("beforeend", '<hr>');
    showFinalTable(input, result, resultDiv);
    resultDiv.insertAdjacentHTML("beforeend", "<hr>");

}

function result() {
    let result = document.getElementById("result");
    result.innerHTML = "";
    //instansiasi class
    let mainInput = new InputValue();
    let mainUtility = new Utility();
    let mainResult = new Result();
    setInput(mainInput);
    setUtility(mainInput, mainUtility);
    CPUSchedule(mainInput, mainUtility, mainResult);
    setResult(mainInput, mainResult);
    showResult(mainInput, mainResult, result);
}


///jika tombol calculate di click maka akan menjalankan fungsi  ini
document.getElementById("calc").onclick = () => {
    result();
};


document.getElementById("reset").onclick = () => {
    window.location.reload();
}