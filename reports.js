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

/* AUTO PICK FIRST TWO SHEETS */

const sheetNames = workbook.SheetNames;

DB.demography = XLSX.utils.sheet_to_json(
workbook.Sheets[sheetNames[0]]
).map(r=>normalizeKeys(r));

DB.caste = XLSX.utils.sheet_to_json(
workbook.Sheets[sheetNames[1]]
).map(r=>normalizeKeys(r));

console.log("Sheets Found:", sheetNames);
console.log("Demography:", DB.demography);
console.log("Caste:", DB.caste);

populateAssemblies();
}


/* ===============================
   COLUMN NORMALIZER ⭐ FIX
=============================== */

function normalizeKeys(row){

let obj={};

Object.keys(row).forEach(k=>{
obj[k.trim().toLowerCase()] = row[k];
});

return obj;
}


/* ===============================
   DROPDOWNS
=============================== */

function populateAssemblies(){

const assemblies=[
...new Set(
DB.demography.map(r=>r["assembly"])
)
];

repAssembly.innerHTML=
`<option value="">Select Assembly</option>`;

assemblies.forEach(a=>{
if(a)
repAssembly.innerHTML+=`<option>${a}</option>`;
});

repAssembly.onchange=populateMandals;
}


function populateMandals(){

const mandals=[
...new Set(
DB.demography
.filter(r=>r["assembly"]===repAssembly.value)
.map(r=>r["mandal"])
)
];

repMandal.innerHTML=
`<option value="">Select Mandal</option>`;

mandals.forEach(m=>{
repMandal.innerHTML+=`<option>${m}</option>`;
});

repMandal.onchange=populatePanchayats;
}


function populatePanchayats(){

const villages=[
...new Set(
DB.demography
.filter(r=>
r["assembly"]===repAssembly.value &&
r["mandal"]===repMandal.value
)
.map(r=>r["village"])
)
];

repPanchayat.innerHTML=
`<option value="">Select Panchayat</option>`;

villages.forEach(v=>{
repPanchayat.innerHTML+=`<option>${v}</option>`;
});
}


/* ===============================
   LOAD REPORT
=============================== */

function loadReport(){

const A=repAssembly.value;
const M=repMandal.value;
const V=repPanchayat.value;

reportOutput.innerHTML="";

const demo=
DB.demography.find(r=>
r["assembly"]===A &&
r["mandal"]===M &&
r["village"]===V
);

const caste=
DB.caste.filter(r=>
r["assembly"]===A &&
(
r["village / ward"]===V ||
r["village"]===V
)
);

buildDemography(demo);
buildCaste(caste);
}


/* ===============================
   DEMOGRAPHY
=============================== */

function buildDemography(d){

if(!d){
reportOutput.innerHTML+="<h3>No Demography Data</h3>";
return;
}

reportOutput.innerHTML+=`

<h3>Demographics</h3>

<div class="grid">

<div class="card"><b>18-24</b><br>${d["18-24"]||0}</div>
<div class="card"><b>25-44</b><br>${d["25-44"]||0}</div>
<div class="card"><b>45-59</b><br>${d["45-59"]||0}</div>
<div class="card"><b>60+</b><br>${d["60+"]||0}</div>

</div>
`;
}


/* ===============================
   CASTE
=============================== */

function buildCaste(rows){

if(!rows.length){
reportOutput.innerHTML+="<p>No caste data</p>";
return;
}

let html=`
<h3>Prominent Castes</h3>
<table border="1" width="100%">
<tr>
<th>Caste</th>
<th>Votes</th>
</tr>
`;

rows
.sort((a,b)=>(b["votes"]||0)-(a["votes"]||0))
.slice(0,6)
.forEach(r=>{
html+=`
<tr>
<td>${r["caste"]||"-"}</td>
<td>${r["votes"]||0}</td>
</tr>`;
});

html+="</table>";

reportOutput.innerHTML+=html;
}


/* ===============================
   RESET
=============================== */

function resetReport(){

repAssembly.value="";
repMandal.innerHTML=`<option>Select Mandal</option>`;
repPanchayat.innerHTML=`<option>Select Panchayat</option>`;

reportOutput.innerHTML=
`<h3>Report Preview Area</h3>
<p>Select location and click Load Report</p>`;
}