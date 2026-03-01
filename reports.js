/* =========================================
   AUTOMATED INTELLIGENCE REPORT ENGINE
========================================= */

let DB = {};
let workbook;

/* =========================================
   INIT
========================================= */

document.addEventListener("DOMContentLoaded", () => {

    loadExcel();

    document.querySelector(".primary")
        .addEventListener("click", loadReport);

    document.querySelector(".warning")
        .addEventListener("click", resetReport);

});


/* =========================================
   LOAD COMPLETE EXCEL (ALL SHEETS)
========================================= */

async function loadExcel() {

    try {

        const response = await fetch("data/VillageReports.xlsx");
        const buffer = await response.arrayBuffer();

        workbook = XLSX.read(buffer, { type: "array" });

        DB.demography = XLSX.utils.sheet_to_json(
            workbook.Sheets["demography"] || []
        );

        DB.data = XLSX.utils.sheet_to_json(
            workbook.Sheets["data"] || []
        );

        DB.field = XLSX.utils.sheet_to_json(
            workbook.Sheets["Raw Data - Field Input"] || []
        );

        DB.leaders = XLSX.utils.sheet_to_json(
            workbook.Sheets["Key Leaders - past"] || []
        );

        DB.caste = XLSX.utils.sheet_to_json(
            workbook.Sheets["Caste"] || []
        );

        DB.election = XLSX.utils.sheet_to_json(
            workbook.Sheets["F20-2024"] || []
        );

        console.log("Database Loaded:", DB);

        populateAssemblies();

    } catch (err) {
        console.error("Excel Load Failed:", err);
    }
}


/* =========================================
   DROPDOWN LOGIC
========================================= */

function populateAssemblies() {

    const assemblies = [...new Set(
        DB.demography.map(r => r.Assembly).filter(Boolean)
    )];

    repAssembly.innerHTML = `<option value="">Select Assembly</option>`;

    assemblies.forEach(a => {
        repAssembly.innerHTML += `<option>${a}</option>`;
    });

    repAssembly.onchange = populateMandals;
}


function populateMandals() {

    const mandals = [...new Set(
        DB.demography
            .filter(r => r.Assembly === repAssembly.value)
            .map(r => r.Mandal)
            .filter(Boolean)
    )];

    repMandal.innerHTML = `<option value="">Select Mandal</option>`;

    mandals.forEach(m => {
        repMandal.innerHTML += `<option>${m}</option>`;
    });

    repMandal.onchange = populatePanchayats;
}


function populatePanchayats() {

    const villages = [...new Set(
        DB.demography
            .filter(r =>
                r.Assembly === repAssembly.value &&
                r.Mandal === repMandal.value
            )
            .map(r => r.Village)
            .filter(Boolean)
    )];

    repPanchayat.innerHTML = `<option value="">Select Panchayat</option>`;

    villages.forEach(v => {
        repPanchayat.innerHTML += `<option>${v}</option>`;
    });
}


/* =========================================
   LOAD REPORT (MASTER FILTER)
========================================= */

function loadReport() {

    const A = repAssembly.value;
    const M = repMandal.value;
    const V = repPanchayat.value;

    if (!A || !M || !V) {
        alert("Please select Assembly, Mandal and Panchayat");
        return;
    }

    reportOutput.innerHTML = ""; // Clear old report

    const demo = DB.demography.find(r =>
        r.Assembly === A &&
        r.Mandal === M &&
        r.Village === V
    );

    const caste = DB.caste.filter(r =>
        r.Assembly === A &&
        (r["Village / Ward"] === V || r.Village === V)
    );

    buildDemography(demo);
    buildCaste(caste);
}


/* =========================================
   DEMOGRAPHY SECTION
========================================= */

function buildDemography(d) {

    if (!d) {
        reportOutput.innerHTML += "<p>No Demography Data Found</p>";
        return;
    }

    reportOutput.innerHTML += `
        <h3>Demographics</h3>

        <div class="grid">

            <div class="card">
                <div class="sub">18-24</div>
                <div class="kpi">${d["18-24"] || 0}</div>
            </div>

            <div class="card">
                <div class="sub">25-44</div>
                <div class="kpi">${d["25-44"] || 0}</div>
            </div>

            <div class="card">
                <div class="sub">45-59</div>
                <div class="kpi">${d["45-59"] || 0}</div>
            </div>

            <div class="card">
                <div class="sub">60+</div>
                <div class="kpi">${d["60+"] || 0}</div>
            </div>

        </div>
    `;
}


/* =========================================
   CASTE SECTION
========================================= */

function buildCaste(rows) {

    if (!rows || rows.length === 0) {
        reportOutput.innerHTML += "<p>No Caste Data Found</p>";
        return;
    }

    let html = `
        <h3>Prominent Castes</h3>
        <table style="width:100%; border-collapse:collapse;">
            <tr style="background:#1e293b;color:white;">
                <th style="padding:8px;">Caste</th>
                <th style="padding:8px;">Votes</th>
            </tr>
    `;

    rows
        .sort((a, b) => (b.Votes || 0) - (a.Votes || 0))
        .slice(0, 6)
        .forEach(r => {
            html += `
                <tr>
                    <td style="padding:8px;">${r.Caste || "-"}</td>
                    <td style="padding:8px;">${r.Votes || 0}</td>
                </tr>
            `;
        });

    html += `</table>`;

    reportOutput.innerHTML += html;
}


/* =========================================
   RESET
========================================= */

function resetReport() {

    repAssembly.value = "";
    repMandal.innerHTML = `<option>Select Mandal</option>`;
    repPanchayat.innerHTML = `<option>Select Panchayat</option>`;

    reportOutput.innerHTML =
        `<h3>Report Preview Area</h3>
         <p>Select location and click Load Report</p>`;
}