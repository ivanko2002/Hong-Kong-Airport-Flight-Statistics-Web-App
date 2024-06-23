
window.onload = () => {

//Setting max and min dates
const datePicker = document.getElementById("date");
function getDate(days) {
    let date;
    if (days !== undefined) {
        date = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    } else {
        date = new Date();
    }
    const offset = date.getTimezoneOffset();
    date = new Date(date.getTime() - (offset*60*1000));
    return date.toISOString().split("T")[0];
};
datePicker.min = getDate(-91);
datePicker.max = getDate(-1);

//Fetch airport code and name
// [{
//       "iata_code": "AAA",
//       "name": "Anaa Airport",
//       "continent": "OC",
//       "iso_country": "PF",
//       "iso_region": "PF-U-A",
//       "municipality": "Anaa"
//     }]
var airport = {};
fetch("iata.json")
.then((response) => {
    response.json().then(lines =>{
        lines.forEach(item => {
            const {iata_code, name, municipality} = item;
            var nm = name+', '+municipality;
            airport[iata_code]=nm;
        });
    })
})
.catch(error => {
    console.log('Error:', error);
});


//Check date validity
var b = document.getElementById("b");
b.addEventListener("click", function(){
    var dateInput = document.getElementById("date");
    var selectedDate = dateInput.value;
    var text =document.getElementById("a1");
    text.style.display = "block";
    document.getElementById("a2").innerHTML = "";
    
    if (selectedDate == ""){
        document.getElementById("a2").innerHTML += "Please enter a date to search";
    }
    
    else if (selectedDate<datePicker.min) {
        document.getElementById("a2").innerHTML += "Select a date after "+datePicker.min;
    }
    
    else if (selectedDate>datePicker.max) {
        document.getElementById("a2").innerHTML += "Select any date before today";
    }
    else {
        text.style.display = "none";
        var se = document.getElementById("stat");
        se.style.display="";
        var de = document.getElementById("data");
        de.style.display="";
    };
});


const f = document.getElementById("myform");
f.addEventListener("submit", function(e){
    e.preventDefault();
    var dateInput = document.getElementById("date");
    var selectedDate = new Date(dateInput.value);
    var year = selectedDate.getFullYear().toString();
    var month = (selectedDate.getMonth() + 1).toString();
    var day = selectedDate.getDate().toString();
    var date = year + "-" + month + "-" + day;
    var formatteddate = year + "-" + month.padStart(2, '0') + "-" + day.padStart(2, '0');
    console.log("Selected date:", date);
    fetch(`flight.php?date=${date}&lang=en&cargo=false&arrival=true`)
    .then(response =>{
        if (response.status == 200) {
            response.json().then( data =>{
                
                document.getElementById("rh").innerHTML = "Arrival";
                document.getElementById("rh").style.border = "1px solid black";
                document.getElementById("rh").style.borderStyle = "double";
                document.getElementById("rh").style.borderWidth = "5px";
                console.log(response);
                document.getElementById("stat").innerHTML = "Flight Statistics on " + formatteddate.toString();
                const arrivalFlightsCount = data[0].list.length;
                console.log('Total number of arrival flights:', arrivalFlightsCount);
                document.getElementById("ta").innerHTML = "Total Flights:&nbsp&nbsp&nbsp"+arrivalFlightsCount;
                const uniqueOrigins = new Set();
                const e = data[0].list;

                e.forEach(entry => {
                  const origin = entry.origin[0];
                  uniqueOrigins.add(origin);
                });
                const uniqueOriginsCount = uniqueOrigins.size;
                console.log('Total unique origins:', uniqueOriginsCount);
                document.getElementById("oa").innerHTML = "Origins:&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp"+uniqueOriginsCount;

                const specialCases = {};
                e.forEach(entry => {
                  const status = entry.status;
                  if (!status.startsWith('At gate')) {
                    if (specialCases[status]) {
                      specialCases[status]++;
                    } else {
                      specialCases[status] = 1;
                    }
                  }
                });
                
                var s="";
                for (const caseName in specialCases) {
                    s += caseName + ':'+ specialCases[caseName] +'; ';
                    console.log(caseName + ' :', specialCases[caseName]);
                }
                console.log('Special cases:',s);
                if (s.endsWith("; ")) s = s.slice(0,-2);
                document.getElementById("sca").innerHTML="Special Cases:&nbsp&nbsp"+s;

                const histogram = {};

                for (let i = -1; i <= 24; i++) {
                    if (i === -1) {
                        histogram['prev'] = 0;
                    } else if (i === 24) {
                        histogram['next'] = 0;
                    } else {
                        histogram[i.toString().padStart(2, '0')] = 0;
                    }
                }

                e.forEach(entry => {
                  const status = entry.status;
                  
                  if (status.startsWith('At gate')) {
                    const atime = status.split('At gate ')[1].split(':');
                    const atimeHour = atime[0];
                    const atimeMin = atime[1].split(" ");
                    if (atime[1].length == 2){
                        histogram[atimeHour]++;
                    }
                    else{
                        var t = atimeMin[1].substring(1,11).split('/');
                        var ad = t[2]+'-'+t[1]+'-'+t[0];
                        var adt = new Date(ad);
                        if (adt<selectedDate) histogram['prev']++;
                        else histogram['next']++;
                    }
                  }
                });

                document.getElementById("ah").innerHTML = "Arrival Time";

                const chartContainer = document.getElementById('achart');
                chartContainer.innerHTML =  "";
                const orderedKeys = ['prev','00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', 'next'];
                
                orderedKeys.forEach(key => {
                  if (histogram.hasOwnProperty(key)  && ((key == 'prev' && histogram[key] !== 0) || key !== 'prev') && ((key == 'next' && histogram[key] !== 0) || key !== 'next') ) {
                    const value = histogram[key];
                    const row = document.createElement('div');
                    row.classList.add('row');
                
                    const keyElement = document.createElement('div');
                    keyElement.classList.add('key');
                    keyElement.textContent = key;
                    row.appendChild(keyElement);
                
                    const barContainer = document.createElement('div');
                    barContainer.classList.add('bar-container');
                
                    const bar = document.createElement('div');
                    bar.classList.add('bar');
                    bar.style.width = value*4.6 + 'px';
                    bar.style.backgroundColor = 'green';
                    barContainer.appendChild(bar);
                
                    const valueElement = document.createElement('div');
                    valueElement.classList.add('value');
                    valueElement.textContent = value;
                    barContainer.appendChild(valueElement);
                    if (value!==0) row.appendChild(barContainer);
                
                    chartContainer.appendChild(row);
                  }
                
                });
                
                const acount = {};
                e.forEach(entry => {
                    const origins = entry.origin[0];
                        if (acount.hasOwnProperty(origins)) {
                            acount[origins] += 1;
                        } else {
                            acount[origins] = 1;
                        }
                });

                const sortedacount = Object.entries(acount).sort((a, b) => b[1] - a[1]);
                const toptena = sortedacount.slice(0, 10);
                const toptenawithname = toptena.map(([code, count]) => [code, count, airport[code]]);
                console.log(toptenawithname);
                
                //adjust table length
                var re = document.getElementById('rt');
                re.style.display = "inline-table";
                re.style.marginLeft = "20px";
                const tableBody = document.getElementById("rtBody");
                tableBody.innerHTML = "";
                toptenawithname.forEach(([code, count, name]) => {
                const row = document.createElement("tr");
                const codeCell = document.createElement("td");
                codeCell.style.textAlign = 'left';
                codeCell.style.fontWeight = 'bold';
                const nameCell = document.createElement("td");
                const countCell = document.createElement("td");
                countCell.style.textAlign = 'center';
                codeCell.textContent = code;
                nameCell.textContent = name;
                nameCell.style.textAlign = 'left';
                countCell.textContent = count;
                row.appendChild(codeCell);
                row.appendChild(nameCell);
                row.appendChild(countCell);
                tableBody.appendChild(row);
                });


            });
        }
        else{
            console.log(response.status)
        }
    })
    .catch(err => {
            console.log("error");
        }
    );

    fetch(`flight.php?date=${date}&lang=en&cargo=false&arrival=false`)
    .then(response =>{
        if (response.status == 200) {
            response.json().then( data =>{
                document.getElementById("lh").innerHTML = "Departure";
                document.getElementById("lh").style.border = "1px solid black";
                document.getElementById("lh").style.borderStyle = "double";
                document.getElementById("lh").style.borderWidth = "5px";
                const depFlightsCount = data[0].list.length;
                document.getElementById("tf").innerHTML = "Total Flights:&nbsp&nbsp&nbsp"+depFlightsCount;

                const uniqueDest = new Set();
                const d = data[0].list;
                d.forEach(entry => {
                  const dest = entry.destination[0];
                  uniqueDest.add(dest);
                });
                const uniqueDestCount = uniqueDest.size;
                console.log('Total unique dest:', uniqueDestCount);
                document.getElementById("td").innerHTML = "Destinations:&nbsp&nbsp&nbsp&nbsp"+uniqueDestCount;

                const specialCasesD = {};
                d.forEach(entry => {
                  const statusD = entry.status;
                  if (!statusD.startsWith('Dep')) {
                    if (specialCasesD[statusD]) {
                      specialCasesD[statusD]++;
                    } else {
                      specialCasesD[statusD] = 1;
                    }
                  }
                });
                var sd="";
                for (const caseNameD in specialCasesD) {
                    sd += caseNameD + ':'+ specialCasesD[caseNameD] +'; ';
                    console.log(caseNameD + ' :', specialCasesD[caseNameD]);
                }
                console.log('Special cases:',sd);
                if (sd.endsWith("; ")) sd = sd.slice(0,-2);
                document.getElementById("scd").innerHTML="Special Cases:&nbsp&nbsp"+sd;
                const histogramD = {};

                for (let i = -1; i <= 24; i++) {
                    if (i === -1) {
                        histogramD['prev'] = 0;
                    } else if (i === 24) {
                        histogramD['next'] = 0;
                    } else {
                        histogramD[i.toString().padStart(2, '0')] = 0;
                    }
                }

                d.forEach(entry => {
                  const statusD = entry.status;
                  
                  if (statusD.startsWith('Dep')) {
                    const dtime = statusD.split('Dep ')[1].split(':');
                    const dtimeHour = dtime[0];
                    const dtimeMin = dtime[1].split(" ");
                    if (dtime[1].length == 2){
                        histogramD[dtimeHour]++;
                    }
                    else{
                        var dt = dtimeMin[1].substring(1,11).split('/');
                        var dd = dt[2]+'-'+dt[1]+'-'+dt[0];
                        var ddt = new Date(dd);
                        if (ddt<selectedDate) histogramD['prev']++;
                        else histogramD['next']++;
                    }
                  }
                });

                document.getElementById("dh").innerHTML = "Departure Time";

                const chartContainer = document.getElementById('dchart');
                const orderedKeys = ['prev','00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', 'next'];
                chartContainer.innerHTML =  "";
                orderedKeys.forEach(key => {
                  if (histogramD.hasOwnProperty(key) && ((key == 'prev' && histogramD[key] !== 0) || key !== 'prev') && ((key == 'next' && histogramD[key] !== 0) || key !== 'next')){
                    const value = histogramD[key];

                    const row = document.createElement('div');
                    row.classList.add('row');
                
                    const keyElement = document.createElement('div');
                    keyElement.classList.add('key');
                    keyElement.textContent = key;
                    row.appendChild(keyElement);
                
                    const barContainer = document.createElement('div');
                    barContainer.classList.add('bar-container');
                
                    const bar = document.createElement('div');
                    bar.classList.add('bar');
                    bar.style.width = value*4.6 + 'px';
                    bar.style.backgroundColor = 'green';
                    barContainer.appendChild(bar);
                    
                    const valueElement = document.createElement('div');
                    valueElement.classList.add('value');
                    valueElement.textContent = value;
                    barContainer.appendChild(valueElement);

                    if (value!==0) row.appendChild(barContainer);
                
                    chartContainer.appendChild(row);
                  }

                
                });

                const dcount = {};
                d.forEach(entry => {
                    const dests = entry.destination[0];
                        if (dcount.hasOwnProperty(dests)) {
                            dcount[dests] += 1;
                        } else {
                            dcount[dests] = 1;
                        }
                });

                const sorteddcount = Object.entries(dcount).sort((a, b) => b[1] - a[1]);
                const toptend = sorteddcount.slice(0, 10);
                const toptendwithname = toptend.map(([code, count]) => [code, count, airport[code]]);
                console.log(toptendwithname);

                //set lt and rt same pos
                var le = document.getElementById('lt');
                le.style.display = "inline-table";
                le.style.marginLeft = "20px";
                const tableBody = document.getElementById("ltBody");
                tableBody.innerHTML = "";
                toptendwithname.forEach(([code, count, name]) => {
                const row = document.createElement("tr");
                const codeCell = document.createElement("td");
                codeCell.style.fontWeight = 'bold';
                const nameCell = document.createElement("td");
                const countCell = document.createElement("td");
                countCell.style.textAlign = 'center';
                codeCell.textContent = code;
                codeCell.style.textAlign = 'left';
                nameCell.textContent = name;
                nameCell.style.textAlign = 'left';
                countCell.textContent = count;
                row.appendChild(codeCell);
                row.appendChild(nameCell);
                row.appendChild(countCell);
                tableBody.appendChild(row);
                });

            });
        }
        else{
            console.log(response.status)
        }
    })
    .catch(err => {
            console.log("error");
        }
    );

    dateInput.value='';
    
});

//Clear when clicked on input field
f.addEventListener("click", function(e){
    console.log(datePicker.value);
    if (datePicker.value==""){
        var se = document.getElementById("stat");
        se.style.display="none";
        var de = document.getElementById("data");
        de.style.display="none";
    }
});
};


