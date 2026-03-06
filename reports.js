let DB = { demography: [], caste: [] };
let reportCharts = { gender: null, caste: null };

Chart.register(ChartDataLabels);

const std = str => (str || "").toString().replace(/[^a-z0-9]/gi, "").toLowerCase();

function show(id) {
  document.querySelectorAll(".main > div").forEach(d => d.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", () => { 
  setTimeout(loadData, 300); 
});

/* ===============================
   LOAD EXCEL FILES
=============================== */

async function loadData() {

const out = document.getElementById("reportOutput");

try {

const repoBase = "./data/";

const fetchFile = async (name) => {
    let res = await fetch(`${repoBase}${name}`);
    if (!res.ok) throw new Error(`Missing ${name}`);
    return XLSX.read(await res.arrayBuffer(), { type: "array" });
};

const demoWB = await fetchFile("VillageReports.xlsx");

DB.demography = XLSX.utils.sheet_to_json(
    demoWB.Sheets[demoWB.SheetNames[0]]
).map(normalizeRow);

const casteWB = await fetchFile("caste_data.xlsx");

DB.caste = XLSX.utils.sheet_to_json(
    casteWB.Sheets[casteWB.SheetNames[0]]
).map(normalizeRow);

populateAssemblies();

}
catch(e){
if(out){
out.innerHTML=`<div class="card" style="color:red">Error: ${e.message}</div>`;
}
}

}

/* ===============================
   NORMALIZE HEADERS
=============================== */

function normalizeRow(row) {

let obj = {};

Object.keys(row).forEach(k => {

let clean = k.replace(/[\n\r]+/g,' ').trim().toLowerCase();

if(clean.includes("assembl")) clean = "assembly";
if(clean.includes("mandal")) clean = "mandal";
if(clean.includes("village") || clean.includes("panchayat")) clean = "village";

obj[clean] = row[k];

});

return obj;

}

/* ===============================
   POPULATE DROPDOWNS
=============================== */

function populateAssemblies(){

let uniqueAsm = [...new Set(DB.demography.map(r=>r.assembly))]
.filter(Boolean)
.sort();

const sel = document.getElementById("repAssembly");

sel.innerHTML =
`<option value="">Select Assembly</option>` +
uniqueAsm.map(a=>`<option>${a}</option>`).join('');

sel.onchange = ()=>{

const A = std(sel.value);

const mandals = [...new Set(
DB.demography
.filter(r=>std(r.assembly)===A)
.map(r=>r.mandal)
)]
.filter(Boolean)
.sort();

const mSel = document.getElementById("repMandal");

mSel.innerHTML =
`<option value="">Select Mandal</option>` +
mandals.map(m=>`<option>${m}</option>`).join('');

mSel.onchange = ()=>{

const M = std(mSel.value);

const vils = [...new Set(
DB.demography
.filter(r=>std(r.assembly)===A && std(r.mandal)===M)
.map(r=>r.village)
)]
.filter(Boolean)
.sort();

document.getElementById("repPanchayat").innerHTML =
`<option value="">Select Village</option>` +
vils.map(v=>`<option>${v}</option>`).join('');

};

};

}

/* ===============================
   GENERATE REPORT
=============================== */

window.loadReport = function(){

const A_raw = document.getElementById("repAssembly").value;
const V_raw = document.getElementById("repPanchayat").value;

const out = document.getElementById("reportOutput");

if(!A_raw || !V_raw) return alert("Select Location");

const A = std(A_raw);
const V = std(V_raw);

const demo = DB.demography.find(r =>
std(r.assembly) === A && std(r.village) === V
);

const castes = DB.caste
.filter(r => std(r.assembly) === A && std(r.village) === V)
.map(r=>({...r,votes:Number(r.votes)||0}))
.sort((a,b)=>b.votes-a.votes);

if(!demo){
out.innerHTML="No data found.";
return;
}

/* ===== Caste calculations ===== */

let validCastes = castes.filter(c => c.caste && c.votes);

let totalVotes = validCastes.reduce((sum,c)=>sum + c.votes,0) || 1;

let topCastes = validCastes.slice(0,6);

let percentageList = "";

topCastes.forEach(c=>{

let pct = ((c.votes/totalVotes)*100).toFixed(1);

percentageList += `
<tr>
<td>${c.caste}</td>
<td>${pct}%</td>
</tr>
`;

});

/* ===== Dashboard HTML ===== */

out.innerHTML = `
<div class="pdf-dashboard">

<div class="pdf-header">
<h2>PANCHAYAT REPORT: ${V_raw.toUpperCase()}</h2>

<div class="sarpanch-sub">
<strong>Sarpanch:</strong> ${demo["sarpanch name"]||"N/A"} |
<strong>Party:</strong> ${demo["sarpanch party"]||"N/A"} |
<strong>Mobile:</strong> ${demo["sarpanch mobile no"]||"N/A"}
</div>

</div>

<div class="kpi-row-mini">

<div class="kpi-mini">
<strong>${demo["total voters"]||0}</strong>
<span>Total Voters</span>
</div>

<div class="kpi-mini">
<strong>${demo["male voters"]||0}</strong>
<span>Male</span>
</div>

<div class="kpi-mini">
<strong>${demo["female voters"]||0}</strong>
<span>Female</span>
</div>

<div class="kpi-mini">
<strong>${demo.sc||0}</strong>
<span>SC</span>
</div>

<div class="kpi-mini">
<strong>${demo.st||0}</strong>
<span>ST</span>
</div>

</div>

<div class="pdf-grid">

<div class="pdf-section">
<div class="pdf-section-title">Age Wise Electors</div>
<div class="pdf-section-content" style="height:220px;">
<canvas id="ageChart"></canvas>
</div>
</div>

<div class="pdf-section">

<div class="pdf-section-title">Caste Distribution</div>

<div style="display:grid;grid-template-columns:1fr 220px;gap:20px;align-items:center">

<div style="height:260px">
<canvas id="castePie"></canvas>
</div>

<div>

<table class="pdf-table">

<thead>
<tr>
<th>Caste</th>
<th>%</th>
</tr>
</thead>

<tbody>
${percentageList}
</tbody>

</table>

</div>

</div>

</div>

</div>

<div class="pdf-section">

<div class="pdf-section-title">Prominent Castes Detail</div>

<div class="pdf-section-content">

<table class="pdf-table">

<thead>
<tr>
<th>Caste Name</th>
<th>Category</th>
<th style="text-align:right">Votes</th>
</tr>
</thead>

<tbody>

${castes.slice(0,8).map(c=>`
<tr>
<td>${c.caste}</td>
<td>${c.category}</td>
<td style="text-align:right">${c.votes}</td>
</tr>
`).join('')}

</tbody>

</table>

</div>

</div>

<div class="pdf-section">

<div class="pdf-section-title">Retro: Election Comparison</div>

<div class="pdf-section-content">

<div class="retro-container">

<div class="retro-card">
<div class="retro-year">2019 AE</div>
<div class="retro-stat"><span>YSRCP %</span><strong>${demo["2019 ae ysrcp %"] || "N/A"}</strong></div>
<div class="retro-stat"><span>TDP %</span><strong>${demo["2019 ae tdp %"] || "N/A"}</strong></div>
</div>

<div class="retro-card">
<div class="retro-year">2014 AE</div>
<div class="retro-stat"><span>TDP %</span><strong>${demo["2014 ae tdp %"] || "N/A"}</strong></div>
<div class="retro-stat"><span>YSRCP %</span><strong>${demo["2014 ae ysrcp %"] || "N/A"}</strong></div>
</div>

</div>

</div>

</div>

</div>
`;

renderCharts(demo, topCastes);

};

/* ===============================
   CHARTS
=============================== */

function renderCharts(d,c){

/* AGE CHART */

const ctx1 = document.getElementById("ageChart");

if(reportCharts.gender) reportCharts.gender.destroy();

reportCharts.gender = new Chart(ctx1,{
type:'bar',
data:{
labels:["18-24","25-44","45-59","60+"],
datasets:[
{
label:"Female",
data:[
d["18-24 (f) voters"]||0,
d["25-44 (f) voters"]||0,
d["45-59 (f) voters"]||0,
d["60+ (f) voters"]||0
],
backgroundColor:"#f472b6"
},
{
label:"Male",
data:[
d["18-24 (m) voters"]||0,
d["25-44 (m) voters"]||0,
d["45-59 (m) voters"]||0,
d["60+ (m) voters"]||0
],
backgroundColor:"#60a5fa"
}
]
},
options:{
responsive:true,
maintainAspectRatio:false,
plugins:{ datalabels:{ display:false } }
}
});

/* CASTE PIE */

const ctx2 = document.getElementById("castePie");

if(reportCharts.caste) reportCharts.caste.destroy();

reportCharts.caste = new Chart(ctx2,{
type:"pie",
data:{
labels:c.map(r=>r.caste),
datasets:[{
data:c.map(r=>r.votes),
backgroundColor:[
"#3b82f6",
"#8b5cf6",
"#ec4899",
"#f59e0b",
"#10b981",
"#64748b"
]
}]
},
options:{
responsive:true,
maintainAspectRatio:false,
plugins:{
legend:{display:false},
datalabels:{display:false}
}
}
});

}

/* ===============================
   RESET
=============================== */

window.resetReport = function(){

document.getElementById("repAssembly").value="";
document.getElementById("repMandal").innerHTML="";
document.getElementById("repPanchayat").innerHTML="";

document.getElementById("reportOutput").innerHTML=
`<div class="card" style="text-align:center"><h3>Ready for Analysis</h3></div>`;

};