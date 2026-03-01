/* =================================
   AUTOMATED REPORT ENGINE
================================= */

let villageData = [];
let workbook;


/* ---------- INIT ---------- */

document.addEventListener("DOMContentLoaded", () => {

    loadExcel();

    document.querySelector(".primary")
        .addEventListener("click", loadReport);

    document.querySelector(".warning")
        .addEventListener("click", resetReport);

});


/* ===============================
   MASTER DATA STORE
================================*/
let DB = {};
let workbook;


/* ===============================
   LOAD COMPLETE EXCEL
================================*/
async function loadExcel(){

    const response =
        await fetch("data/Village Reports.xlsx");

    const buffer =
        await response.arrayBuffer();

    workbook =
        XLSX.read(buffer,{type:"array"});

    /* LOAD EACH SHEET */

    DB.demography =
        XLSX.utils.sheet_to_json(
            workbook.Sheets["demography"]
        );

    DB.data =
        XLSX.utils.sheet_to_json(
            workbook.Sheets["data"]
        );

    DB.field =
        XLSX.utils.sheet_to_json(
            workbook.Sheets["Raw Data - Field Input"]
        );

    DB.leaders =
        XLSX.utils.sheet_to_json(
            workbook.Sheets["Key Leaders - past"]
        );

    DB.caste =
        XLSX.utils.sheet_to_json(
            workbook.Sheets["Caste"]
        );

    DB.election =
        XLSX.utils.sheet_to_json(
            workbook.Sheets["F20-2024"]
        );

    console.log("DATABASE LOADED", DB);

    populateAssemblies();
}

/* ---------- DROPDOWNS ---------- */

function populateAssemblies(){

 const assemblies =
 [...new Set(
   DB.demography.map(r=>r.Assembly)
 )];

 repAssembly.innerHTML =
 `<option>Select Assembly</option>`;

 assemblies.forEach(a=>{
   if(a)
   repAssembly.innerHTML +=
   `<option>${a}</option>`;
 });

 repAssembly.onchange = populateMandals;
}


function populateMandals(){

 const mandals =
 [...new Set(
   DB.demography
   .filter(r =>
      r.Assembly === repAssembly.value
   )
   .map(r=>r.Mandal)
 )];

 repMandal.innerHTML =
 `<option>Select Mandal</option>`;

 mandals.forEach(m=>{
   repMandal.innerHTML +=
   `<option>${m}</option>`;
 });

 repMandal.onchange = populatePanchayats;
}


function populatePanchayats(){

 const pans =
 [...new Set(
   DB.demography
   .filter(r =>
      r.Assembly === repAssembly.value &&
      r.Mandal === repMandal.value
   )
   .map(r=>r.Village)
 )];

 repPanchayat.innerHTML =
 `<option>Select Panchayat</option>`;

 pans.forEach(p=>{
   repPanchayat.innerHTML+=
   `<option>${p}</option>`;
 });
}


/* ---------- LOAD REPORT ---------- */

function loadReport(){

 const A = repAssembly.value;
 const M = repMandal.value;
 const V = repPanchayat.value;

 const demo =
   DB.demography.find(r =>
     r.Assembly===A &&
     r.Mandal===M &&
     r.Village===V
   );

 const caste =
   DB.caste.filter(r =>
     r.Assembly===A &&
     r["Village / Ward"]===V
   );

 buildDemography(demo);
 buildCaste(caste);
}

/* ---------- SUMMARY CARDS ---------- */

function buildSummary(row){

    let html =
    `<h3>${row.Panchayat} Intelligence Report</h3>
     <div class="grid">`;

    Object.keys(row).forEach(key=>{

        if(
            key !== "Assembly" &&
            key !== "Mandal" &&
            key !== "Panchayat" &&
            !key.toLowerCase().includes("caste")
        ){
            html+=`
            <div class="card">
              <div class="sub">${key}</div>
              <div class="kpi">${row[key]}</div>
            </div>`;
        }

    });

    html+=`</div>
            <br>
            <canvas id="casteChart"></canvas>`;

    reportOutput.innerHTML = html;
}


/* ---------- CASTE CHART ---------- */

let casteChart;

function buildCasteChart(row){

    /* Detect caste columns automatically */
    const casteKeys =
        Object.keys(row)
        .filter(k =>
            k.toLowerCase().includes("caste") ||
            k.toLowerCase().includes("kapu") ||
            k.toLowerCase().includes("bc") ||
            k.toLowerCase().includes("sc") ||
            k.toLowerCase().includes("st")
        );

    const labels = casteKeys;
    const values = casteKeys.map(k=>row[k]);

    if(casteChart) casteChart.destroy();

    casteChart = new Chart(
        document.getElementById("casteChart"),
        {
            type:"pie",
            data:{
                labels:labels,
                datasets:[{
                    data:values
                }]
            }
        }
    );
}


/* ---------- RESET ---------- */

function resetReport(){

    repAssembly.value="";
    repMandal.innerHTML=`<option>Select Mandal</option>`;
    repPanchayat.innerHTML=`<option>Select Panchayat</option>`;

    reportOutput.innerHTML=
        `<h3>Report Preview Area</h3>
         <p>Select location and click Load Report</p>`;
}

database = {
   demography: [],
   data: [],
   field: [],
   leaders: [],
   caste: [],
   election: []
}

function buildDemography(d){

reportOutput.innerHTML += `

<h3>Demographics</h3>

<div class="grid">

<div class="card">
<div class="sub">18-24</div>
<div class="kpi">${d["18-24"]}</div>
</div>

<div class="card">
<div class="sub">25-44</div>
<div class="kpi">${d["25-44"]}</div>
</div>

<div class="card">
<div class="sub">45-59</div>
<div class="kpi">${d["45-59"]}</div>
</div>

<div class="card">
<div class="sub">60+</div>
<div class="kpi">${d["60+"]}</div>
</div>

</div>
`;
}

function buildCaste(rows){

let html =
`<h3>Prominent Castes</h3>
<table>
<tr>
<th>Caste</th>
<th>Votes</th>
</tr>`;

rows
.sort((a,b)=>b.Votes-a.Votes)
.slice(0,6)
.forEach(r=>{
 html+=`
 <tr>
 <td>${r.Caste}</td>
 <td>${r.Votes}</td>
 </tr>`;
});

html+=`</table>`;

reportOutput.innerHTML += html;
}