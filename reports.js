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


/* ---------- LOAD EXCEL ---------- */

function loadExcel(){

    fetch("data/VillageReports.xlsx")
    .then(res => res.arrayBuffer())
    .then(data => {

        workbook = XLSX.read(data,{type:"array"});

        const mainSheet =
            workbook.SheetNames[0];

        const worksheet =
            workbook.Sheets[mainSheet];

        villageData =
            XLSX.utils.sheet_to_json(worksheet);

        console.log("Village Data:", villageData);

        populateAssemblies();

    });

}


/* ---------- DROPDOWNS ---------- */

function populateAssemblies(){

    const assemblies =
        [...new Set(
            villageData.map(r=>r.Assembly)
        )];

    repAssembly.innerHTML =
        `<option>Select Assembly</option>`;

    assemblies.forEach(a=>{
        if(a)
        repAssembly.innerHTML+=`<option>${a}</option>`;
    });

    repAssembly.onchange = populateMandals;
}


function populateMandals(){

    const mandals =
        [...new Set(
            villageData
            .filter(r=>r.Assembly===repAssembly.value)
            .map(r=>r.Mandal)
        )];

    repMandal.innerHTML=
        `<option>Select Mandal</option>`;

    mandals.forEach(m=>{
        repMandal.innerHTML+=`<option>${m}</option>`;
    });

    repMandal.onchange = populatePanchayats;
}


function populatePanchayats(){

    const pans =
        [...new Set(
            villageData
            .filter(r=>
                r.Assembly===repAssembly.value &&
                r.Mandal===repMandal.value
            )
            .map(r=>r.Panchayat)
        )];

    repPanchayat.innerHTML=
        `<option>Select Panchayat</option>`;

    pans.forEach(p=>{
        repPanchayat.innerHTML+=`<option>${p}</option>`;
    });
}


/* ---------- LOAD REPORT ---------- */

function loadReport(){

    const row =
        villageData.find(r=>
            r.Assembly===repAssembly.value &&
            r.Mandal===repMandal.value &&
            r.Panchayat===repPanchayat.value
        );

    if(!row){
        reportOutput.innerHTML="No Data Found";
        return;
    }

    buildSummary(row);
    buildCasteChart(row);
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