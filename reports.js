// /* ===============================
//    AUTOMATED REPORT ENGINE
// =============================== */

// const BASE_PATH = "./";

// let DB = {};

// document.addEventListener("DOMContentLoaded", () => {
//     loadExcel();
// });

// /* ===============================
//    LOAD EXCEL
// =============================== */

// async function loadExcel(){

// /* ---------- DEMOGRAPHY ---------- */
// const demoRes = await fetch(BASE_PATH + "data/VillageReports.xlsx");
// const demoBuf = await demoRes.arrayBuffer();

// const demoWB = XLSX.read(demoBuf,{type:"array"});

// DB.demography =
// XLSX.utils.sheet_to_json(
// demoWB.Sheets[demoWB.SheetNames[0]]
// ).map(normalizeKeys);


// /* ---------- CASTE ---------- */
// const casteRes =
// await fetch(BASE_PATH + "data/Caste data.xlsx");

// const casteBuf = await casteRes.arrayBuffer();

// const casteWB = XLSX.read(casteBuf,{type:"array"});

// DB.caste =
// XLSX.utils.sheet_to_json(
// casteWB.Sheets[casteWB.SheetNames[0]]
// ).map(normalizeKeys);

// console.log("Demography:",DB.demography.length);
// console.log("Caste:",DB.caste.length);

// populateAssemblies();
// }


// /* ===============================
//    NORMALIZER
// =============================== */

// function normalizeKeys(row){

// let obj={};

// Object.keys(row).forEach(k=>{

// const key =
// k.replace(/\n/g,"")
// .replace(/\r/g,"")
// .replace(/\s+/g," ")
// .trim()
// .toLowerCase();

// obj[key]=row[k];

// });

// return obj;
// }


// /* ===============================
//    DROPDOWNS
// =============================== */

// function populateAssemblies(){

// const assemblies=[
// ...new Set(DB.demography.map(r=>r["assembly"]))
// ].filter(Boolean);

// repAssembly.innerHTML=
// `<option>Select Assembly</option>`;

// assemblies.forEach(a=>{
// repAssembly.innerHTML+=`<option>${a}</option>`;
// });

// repAssembly.onchange=populateMandals;
// }


// function populateMandals(){

// const A=repAssembly.value.toLowerCase();

// const mandals=[
// ...new Set(
// DB.demography
// .filter(r=>
// (r["assembly"]||"")
// .toLowerCase()
// .includes(A))
// .map(r=>r["mandal"])
// )
// ].filter(Boolean);

// repMandal.innerHTML=
// `<option>Select Mandal</option>`;

// mandals.forEach(m=>{
// repMandal.innerHTML+=`<option>${m}</option>`;
// });

// repMandal.onchange=populatePanchayats;
// }


// function populatePanchayats(){

// const A=repAssembly.value.toLowerCase();
// const M=repMandal.value.toLowerCase();

// const villages=[
// ...new Set(
// DB.demography
// .filter(r=>
// (r["assembly"]||"").toLowerCase().includes(A) &&
// (r["mandal"]||"").toLowerCase().includes(M)
// )
// .map(r=>r["village"])
// )
// ].filter(Boolean);

// repPanchayat.innerHTML=
// `<option>Select Panchayat</option>`;

// villages.forEach(v=>{
// repPanchayat.innerHTML+=`<option>${v}</option>`;
// });
// }


// /* ===============================
//    LOAD REPORT
// =============================== */

// function loadReport(){

// const A = repAssembly.value.trim().toLowerCase();
// const M = repMandal.value.trim().toLowerCase();
// const V = repPanchayat.value.trim().toLowerCase();

// reportOutput.innerHTML = "";

// /* ================= DEMOGRAPHY ================= */

// const demo = DB.demography.find(r =>
// (r["assembly"]||"").toLowerCase() === A &&
// (r["mandal"]||"").toLowerCase() === M &&
// (r["village"]||"").toLowerCase() === V
// );


// /* ================= CASTE ================= */

// const caste = DB.caste.filter(r => {

// const asmMatch =
// normalizeText(r["assembly"]) ===
// normalizeText(A);

// const mandalMatch =
// normalizeText(r["mandal"]) ===
// normalizeText(M);

// const villageMatch =
// normalizeText(r["village"]) ===
// normalizeText(V);

// return asmMatch && mandalMatch && villageMatch;

// });

// console.log("Matched caste:", caste.length);

// console.log("Matched caste:", caste.length);

// buildDemography(demo);
// buildCaste(caste);

// }


// /* ===============================
//    DEMOGRAPHY
// =============================== */

// function buildDemography(d){

// if(!d){
// reportOutput.innerHTML=
// "<div class='card'>No Data</div>";
// return;
// }

// reportOutput.innerHTML=`

// <div class="report-structure">

// <div class="card">
// <h3>Sarpanch Information</h3>
// <p>${d["sarpanch name"]||"-"}</p>
// </div>

// <div class="card">
// <h3>Voter Summary</h3>
// <p>Total: ${d["total voters"]||0}</p>
// </div>

// <div class="card">
// <h3>Gender Wise Age</h3>
// <canvas id="genderAgeChart"></canvas>
// </div>

// <div class="card" id="casteContainer">
// <h3>Prominent Castes</h3>
// </div>

// </div>
// `;

// setTimeout(()=>{
// new Chart(
// document.getElementById("genderAgeChart"),
// {
// type:"bar",
// data:{
// labels:["18-24","25-44","45-59","60+"],
// datasets:[
// {
// label:"Female",
// data:[
// d["18-24 (f) voters"]||0,
// d["25-44 (f) voters"]||0,
// d["45-59 (f) voters"]||0,
// d["60+ (f) voters"]||0
// ]},
// {
// label:"Male",
// data:[
// d["18-24 (m) voters"]||0,
// d["25-44 (m) voters"]||0,
// d["45-59 (m) voters"]||0,
// d["60+ (m) voters"]||0
// ]}
// ]
// }
// });
// },100);

// }


// /* ===============================
//    CASTE
// =============================== */

// function buildCaste(rows){

// const box=document.getElementById("casteContainer");

// if(!rows.length){
// box.innerHTML+="<p>No caste data</p>";
// return;
// }

// const top=
// rows.sort((a,b)=>
// (b["votes"]||0)-(a["votes"]||0)
// ).slice(0,6);

// let html="<table><tr><th>Caste</th><th>Votes</th></tr>";

// top.forEach(r=>{
// html+=`<tr>
// <td>${r["caste"]}</td>
// <td>${r["votes"]}</td>
// </tr>`;
// });

// html+="</table><canvas id='casteChart'></canvas>";

// box.innerHTML+=html;

// setTimeout(()=>{
// new Chart(
// document.getElementById("casteChart"),
// {
// type:"pie",
// data:{
// labels:top.map(r=>r["caste"]),
// datasets:[{
// data:top.map(r=>r["votes"])
// }]
// }
// });
// },100);

// }
// function normalizeText(v){
// return (v || "")
// .toString()
// .toLowerCase()
// .replace(/\./g,"")
// .replace(/mandal/g,"")
// .replace(/municipality/g,"")
// .replace(/rural/g,"")
// .replace(/urban/g,"")
// .replace(/\s+/g," ")
// .trim();
// }

/* ===============================
   AUTOMATED REPORT ENGINE
=============================== */

let DB = {};
let workbook;

document.addEventListener("DOMContentLoaded", () => {
    loadExcel();
});


/* ===============================
   LOAD EXCEL
=============================== */

async function loadExcel(){

const response = await fetch("data/VillageReports.xlsx");
const buffer = await response.arrayBuffer();

workbook = XLSX.read(buffer,{type:"array"});

const sheetNames = workbook.SheetNames;

/* DEMOGRAPHY = FIRST SHEET */
DB.demography = XLSX.utils.sheet_to_json(
    workbook.Sheets[sheetNames[0]]
).map(r=>normalizeKeys(r));

/* CASTE = EXACT SHEET NAME MATCH */
const casteSheetName = sheetNames.find(s =>
    s.trim().toLowerCase() === "caste data"
);

if(casteSheetName){
    DB.caste = XLSX.utils.sheet_to_json(
        workbook.Sheets[casteSheetName]
    ).map(r=>normalizeKeys(r));
}else{
    DB.caste = [];
}

console.log("Sheets:", sheetNames);
console.log("Caste Sheet:", casteSheetName);
console.log("Caste Rows:", DB.caste.length);

populateAssemblies();
}


/* ===============================
   COLUMN NORMALIZER
=============================== */

function normalizeKeys(row){

let obj={};

Object.keys(row).forEach(k=>{

const cleanKey =
k.replace(/\n/g,"")
.replace(/\r/g,"")
.replace(/\s+/g," ")
.trim()
.toLowerCase();

obj[cleanKey]=row[k];

});

return obj;
}


/* ===============================
   DROPDOWNS
=============================== */

function populateAssemblies(){

const assemblies=[...new Set(
DB.demography.map(r=>r["assembly"]?.trim())
)].filter(Boolean);

repAssembly.innerHTML=`<option value="">Select Assembly</option>`;

assemblies.forEach(a=>{
repAssembly.innerHTML+=`<option>${a}</option>`;
});

repAssembly.onchange=populateMandals;
}


function populateMandals(){

const A=repAssembly.value.trim().toLowerCase();

const mandals=[...new Set(
DB.demography
.filter(r=>r["assembly"]?.trim().toLowerCase()===A)
.map(r=>r["mandal"]?.trim())
)].filter(Boolean);

repMandal.innerHTML=`<option value="">Select Mandal</option>`;

mandals.forEach(m=>{
repMandal.innerHTML+=`<option>${m}</option>`;
});

repMandal.onchange=populatePanchayats;
}


function populatePanchayats(){

const A=repAssembly.value.trim().toLowerCase();
const M=repMandal.value.trim().toLowerCase();

const villages=[...new Set(
DB.demography
.filter(r=>
r["assembly"]?.trim().toLowerCase()===A &&
r["mandal"]?.trim().toLowerCase()===M
)
.map(r=>r["village"]?.trim())
)].filter(Boolean);

repPanchayat.innerHTML=`<option value="">Select Panchayat</option>`;

villages.forEach(v=>{
repPanchayat.innerHTML+=`<option>${v}</option>`;
});
}


/* ===============================
   LOAD REPORT
=============================== */

function loadReport(){

const A=repAssembly.value.trim().toLowerCase();
const M=repMandal.value.trim().toLowerCase();
const V=repPanchayat.value.trim().toLowerCase();

reportOutput.innerHTML="";

/* DEMOGRAPHY MATCH */
const demo =
DB.demography.find(r=>
r["assembly"]?.trim().toLowerCase()===A &&
r["mandal"]?.trim().toLowerCase()===M &&
r["village"]?.trim().toLowerCase()===V
);

/* CASTE MATCH */
const caste =
DB.caste.filter(r=>{

const assemblyMatch =
r["assembly"]?.trim().toLowerCase()===A;

const mandalMatch =
r["mandal / municpality"]?.trim().toLowerCase()===M;

const villageMatch =
r["village / ward"]?.trim().toLowerCase()===V;

return assemblyMatch && mandalMatch && villageMatch;

});

console.log("Filtered caste rows:", caste);

buildDemography(demo);
buildCaste(caste);
}


/* ===============================
   DEMOGRAPHY
=============================== */

function buildDemography(d){

if(!d){
reportOutput.innerHTML="<div class='card'><h3>No Demography Data</h3></div>";
return;
}

reportOutput.innerHTML = `
<div class="report-structure">

<div class="card section-sarpanch">
<h3>Sarpanch Information</h3>
<div class="grid">
<div class="card"><b>Name</b><br>${d["sarpanch name"]||"-"}</div>
<div class="card"><b>Party</b><br>${d["sarpanch party"]||"-"}</div>
<div class="card"><b>Caste</b><br>${d["sarpanch caste"]||"-"}</div>
<div class="card"><b>Mobile</b><br>${d["sarpanch mobile no"]||"-"}</div>
<div class="card"><b>Reservation</b><br>${d["reservation"]||"-"}</div>
</div>
</div>

<div class="section-row">

<div class="card">
<h3>Voter Summary</h3>
<p><b>Male:</b> ${d["male voters"]||0}</p>
<p><b>Female:</b> ${d["female voters"]||0}</p>
<p><b>Total:</b> ${d["total voters"]||0}</p>
<p><b>SC:</b> ${d["sc"]||0}</p>
<p><b>ST:</b> ${d["st"]||0}</p>
</div>

<div class="card">
<h3>Gender Wise Age Distribution</h3>
<canvas id="genderAgeChart"></canvas>
</div>

</div>

<div class="card section-caste" id="casteContainer">
<h3>Prominent Castes</h3>
</div>

</div>
`;

const f=[
d["18-24 (f) voters"]||0,
d["25-44 (f) voters"]||0,
d["45-59 (f) voters"]||0,
d["60+ (f) voters"]||0
];

const m=[
d["18-24 (m) voters"]||0,
d["25-44 (m) voters"]||0,
d["45-59 (m) voters"]||0,
d["60+ (m) voters"]||0
];

setTimeout(()=>{
new Chart(
document.getElementById("genderAgeChart"),
{
type:"bar",
data:{
labels:["18-24","25-44","45-59","60+"],
datasets:[
{label:"Female",data:f},
{label:"Male",data:m}
]
}
});
},100);

}


/* ===============================
   CASTE
=============================== */

function buildCaste(rows){

if(!rows.length){
document.getElementById("casteContainer").innerHTML += "<p>No caste data</p>";
return;
}

const top = rows
.sort((a,b)=>(b["votes"]||0)-(a["votes"]||0))
.slice(0,6);

let html=`
<table border="1" width="100%">
<tr><th>Caste</th><th>Votes</th></tr>
`;

top.forEach(r=>{
html+=`
<tr>
<td>${r["caste"]||"-"}</td>
<td>${r["votes"]||0}</td>
</tr>`;
});

html+=`</table>
<canvas id="casteChart"></canvas>`;

document.getElementById("casteContainer").innerHTML+=html;

setTimeout(()=>{
new Chart(
document.getElementById("casteChart"),
{
type:"pie",
data:{
labels:top.map(r=>r["caste"]),
datasets:[{data:top.map(r=>r["votes"])}]
}
});
},100);

}