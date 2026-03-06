/* ===============================
   AUTOMATED REPORT ENGINE
=============================== */

let DB = { demography: [], caste: [] };
let reportCharts = { gender: null, caste: null };



const std = str => (str || "").toString().replace(/[^a-z0-9]/gi,"").toLowerCase();

document.addEventListener("DOMContentLoaded", () => {
    loadData();
});

/* ===============================
   LOAD EXCEL DATA
=============================== */

async function loadData(){

const out = document.getElementById("reportOutput");

try{

if(out) out.innerHTML=`<div class="card">⏳ Loading Excel data...</div>`;


/* ---------- DEMOGRAPHY ---------- */

const demoRes = await fetch("data/VillageReports.xlsx");

if(!demoRes.ok){
throw new Error("VillageReports.xlsx not found in /data folder");
}

const demoWB = XLSX.read(
await demoRes.arrayBuffer(),
{type:"array"}
);

DB.demography = XLSX.utils.sheet_to_json(
demoWB.Sheets[demoWB.SheetNames[0]]
).map(normalizeRow);


/* ---------- CASTE DATA ---------- */

const casteRes = await fetch("data/caste_data.xlsx");

if(!casteRes.ok){
throw new Error("caste_data.xlsx not found in /data folder");
}

const casteWB = XLSX.read(
await casteRes.arrayBuffer(),
{type:"array"}
);

DB.caste = XLSX.utils.sheet_to_json(
casteWB.Sheets[casteWB.SheetNames[0]]
).map(normalizeRow);


/* ---------- SUCCESS ---------- */

if(out){
out.innerHTML=`
<div class="card" style="text-align:center">
<h3>✅ Data Loaded Successfully</h3>
<p>Select Assembly → Mandal → Village</p>
</div>
`;
}

populateAssemblies();

}catch(err){

console.error(err);

if(out){
out.innerHTML=`
<div class="card" style="color:red">
<h3>❌ Data Loading Failed</h3>
<p>${err.message}</p>
</div>
`;
}

}

}


/* ===============================
   NORMALIZE EXCEL HEADERS
=============================== */

function normalizeRow(row){

let obj={};

Object.keys(row).forEach(k=>{

let key=k.replace(/[\n\r]+/g,'').trim().toLowerCase();

if(key.includes("assembl")) key="assembly";
if(key.includes("mandal")) key="mandal";
if(key.includes("village")) key="village";
if(key.includes("panchayat")) key="panchayat";

obj[key]=row[k];

});

return obj;

}


/* ===============================
   POPULATE ASSEMBLY
=============================== */

function populateAssemblies(){

let unique={};

DB.demography.forEach(r=>{
if(r.assembly)
unique[std(r.assembly)] = r.assembly.trim();
});

const sel=document.getElementById("repAssembly");

sel.innerHTML=`<option value="">Select Assembly</option>`;

Object.values(unique)
.sort()
.forEach(a=>{
sel.innerHTML+=`<option value="${a}">${a}</option>`;
});

sel.onchange=populateMandals;

}


/* ===============================
   POPULATE MANDALS
=============================== */

function populateMandals(){

const A=std(document.getElementById("repAssembly").value);

let unique={};

DB.demography.forEach(r=>{
if(std(r.assembly)===A && r.mandal)
unique[std(r.mandal)] = r.mandal.trim();
});

const sel=document.getElementById("repMandal");

sel.innerHTML=`<option value="">Select Mandal</option>`;

Object.values(unique)
.sort()
.forEach(m=>{
sel.innerHTML+=`<option value="${m}">${m}</option>`;
});

sel.onchange=populateVillages;

}


/* ===============================
   POPULATE VILLAGES
=============================== */

function populateVillages(){

const A=std(document.getElementById("repAssembly").value);
const M=std(document.getElementById("repMandal").value);

let unique={};

DB.demography.forEach(r=>{
if(std(r.assembly)===A && std(r.mandal)===M && r.village)
unique[std(r.village)] = r.village.trim();
});

const sel=document.getElementById("repPanchayat");

sel.innerHTML=`<option value="">Select Village</option>`;

Object.values(unique)
.sort()
.forEach(v=>{
sel.innerHTML+=`<option value="${v}">${v}</option>`;
});

}


/* ===============================
   GENERATE REPORT
=============================== */

window.loadReport=function(){

const A_val=document.getElementById("repAssembly").value;
const M_val=document.getElementById("repMandal").value;
const V_val=document.getElementById("repPanchayat").value;

const output=document.getElementById("reportOutput");

if(!A_val||!M_val||!V_val){
alert("Select Assembly, Mandal and Village");
return;
}

const A=std(A_val);
const M=std(M_val);
const V=std(V_val);


/* ---------- FIND DEMOGRAPHY ---------- */

const demo=DB.demography.find(r=>
std(r.assembly)===A &&
std(r.mandal)===M &&
std(r.village)===V
);

if(!demo){
output.innerHTML=`<div class="card">No demography data found</div>`;
return;
}


/* ---------- FIND CASTE ---------- */

const casteData=DB.caste.filter(r=>
std(r.assembly)===A &&
std(r.mandal)===M &&
(std(r.village)===V || std(r.panchayat)===V)
);


/* ---------- TOP CASTES ---------- */

const topCastes=casteData
.sort((a,b)=>(Number(b.votes)||0)-(Number(a.votes)||0))
.slice(0,7);

let casteRows="";

if(topCastes.length===0){
casteRows="<tr><td colspan='3'>No caste data</td></tr>";
}else{

topCastes.forEach(r=>{
casteRows+=`
<tr>
<td>${r.caste}</td>
<td>${r.category||"-"}</td>
<td style="text-align:right">${r.votes||0}</td>
</tr>
`;
});

}

let totalVotes = topCastes.reduce((sum,r)=>sum + Number(r.votes||0),0);

let percentageList = "";

topCastes
.sort((a,b)=>b.votes-a.votes)
.forEach(r=>{

let pct = ((r.votes/totalVotes)*100).toFixed(1);

percentageList += `
<tr>
<td>${r.caste}</td>
<td>${pct}%</td>
</tr>
`;

});


/* ===============================
   DASHBOARD HTML
=============================== */

output.innerHTML=`

<div class="pdf-dashboard">

<div class="pdf-header">
<h2>${demo.village}</h2>
<p>${demo.assembly} | ${demo.mandal}</p>
</div>

<div class="kpi-row-mini">

<div class="kpi-mini">
<strong>${demo["total voters"]||0}</strong>
<span>Total</span>
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

<h3 class="pdf-section-title">🏛️ Leadership & Sarpanch</h3>

<div class="pdf-section-content">

<table class="pdf-table">

<tr>
<td>Name</td>
<td>${demo["sarpanch name"] || "-"}</td>
</tr>

<tr>
<td>Party</td>
<td>${demo["sarpanch party"] || "-"}</td>
</tr>

<tr>
<td>Caste</td>
<td>${demo["sarpanch caste"] || "-"}</td>
</tr>

<tr>
<td>Mobile</td>
<td>${demo["sarpanch mobile no"] || "-"}</td>
</tr>

<tr>
<td>Reservation</td>
<td>${demo["reservation"] || "-"}</td>
</tr>

</table>

</div>

</div>


<div class="pdf-section">

<h3 class="pdf-section-title">Caste Distribution</h3>

<div style="display:grid;grid-template-columns:1fr 200px;gap:20px">

<div style="height:250px">
<canvas id="castePieChart"></canvas>
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

</div>
`;


/* ===============================
   CHART
=============================== */

reportCharts.caste=new Chart(
document.getElementById("castePieChart"),
{
type:"pie",
data:{
labels:topCastes.map(r=>r.caste),
datasets:[{
data:topCastes.map(r=>r.votes),
backgroundColor:[
"#3b82f6",
"#8b5cf6",
"#ec4899",
"#f59e0b",
"#10b981",
"#64748b",
"#ef4444"
]
}]
},
options:{
responsive:true,
maintainAspectRatio:false,
plugins:{
legend:{
display:false
}
}
}
});
});

}

};


/* ===============================
   RESET
=============================== */

window.resetReport=function(){

document.getElementById("repAssembly").value="";
document.getElementById("repMandal").innerHTML=`<option>Select Mandal</option>`;
document.getElementById("repPanchayat").innerHTML=`<option>Select Village</option>`;

document.getElementById("reportOutput").innerHTML=`
<div class="card" style="text-align:center">
<h3>Ready for Analysis</h3>
</div>
`;

};