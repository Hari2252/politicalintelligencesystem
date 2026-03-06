/* ===============================
   AUTOMATED REPORT ENGINE (FIXED)
=============================== */

let DB = {
    demography: [],
    caste: []
};

// Store chart instances globally to destroy them later
let reportCharts = {
    gender: null,
    caste: null
};

/* ===============================
   INIT & DATA LOADING
=============================== */

document.addEventListener("DOMContentLoaded", () => {
    loadData();
});

async function loadData() {
    try {
        console.log("1. Attempting to contact the data folder...");

        /* -------- TEST DEMOGRAPHY -------- */
        const demoRes = await fetch("data/VillageReports.xlsx");
        console.log("2. Demography Server Response:", demoRes.status, demoRes.statusText);
        
        if (!demoRes.ok) throw new Error("Server rejected VillageReports.xlsx (Check spelling, caps, or folder path)");
        
        const demoBuf = await demoRes.arrayBuffer();
        const demoWB = XLSX.read(demoBuf, { type: "array" });
        DB.demography = XLSX.utils.sheet_to_json(demoWB.Sheets[demoWB.SheetNames[0]]).map(normalize);

        /* -------- TEST CASTE -------- */
        // NOTE: If you renamed the file to remove the space, update the string below!
        const casteRes = await fetch("data/caste_data.xlsx"); 
        console.log("3. Caste Server Response:", casteRes.status, casteRes.statusText);
        
        if (!casteRes.ok) throw new Error("Server rejected Caste data.xlsx (Check for spaces in filename or caps)");

        const casteBuf = await casteRes.arrayBuffer();
        const casteWB = XLSX.read(casteBuf, { type: "array" });
        DB.caste = XLSX.utils.sheet_to_json(casteWB.Sheets[casteWB.SheetNames[0]]).map(normalize);

        console.log("4. SUCCESS! Data loaded into memory.");
        populateAssemblies();

    } catch (error) {
        console.error("CRITICAL FETCH ERROR:", error);
        alert("Fetch Failed: " + error.message);
    }
}

/* ===============================
   NORMALIZER (Cleans messy Excel keys)
=============================== */
/* ===============================
   NORMALIZER (Aggressive Cleaning)
=============================== */
function normalize(row) {
    let obj = {};
    Object.keys(row).forEach(k => {
        // Remove line breaks, extra spaces, and make lowercase
        const cleanKey = k.replace(/[\n\r]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase(); 
        obj[cleanKey] = (typeof row[k] === "string") ? row[k].trim() : row[k];
    });
    return obj;
}

/* ===============================
   DROPDOWN LOGIC
=============================== */

function populateAssemblies() {
    // Get unique assemblies
    const assemblies = [...new Set(DB.demography.map(r => r["assembly"]))].filter(Boolean).sort();
    
    const asmSelect = document.getElementById("repAssembly");
    asmSelect.innerHTML = `<option value="">Select Assembly</option>`;
    
    assemblies.forEach(a => {
        asmSelect.innerHTML += `<option value="${a}">${a}</option>`;
    });

    asmSelect.onchange = populateMandals;
}

function populateMandals() {
    const A = document.getElementById("repAssembly").value;
    
    const mandals = [...new Set(
        DB.demography.filter(r => r["assembly"] === A).map(r => r["mandal"])
    )].filter(Boolean).sort();

    const manSelect = document.getElementById("repMandal");
    manSelect.innerHTML = `<option value="">Select Mandal</option>`;
    
    mandals.forEach(m => {
        manSelect.innerHTML += `<option value="${m}">${m}</option>`;
    });

    manSelect.onchange = populateVillages;
}

function populateVillages() {
    const A = document.getElementById("repAssembly").value;
    const M = document.getElementById("repMandal").value;

    const villages = [...new Set(
        DB.demography.filter(r => r["assembly"] === A && r["mandal"] === M).map(r => r["village"])
    )].filter(Boolean).sort();

    const panSelect = document.getElementById("repPanchayat");
    panSelect.innerHTML = `<option value="">Select Village/Panchayat</option>`;
    
    villages.forEach(v => {
        panSelect.innerHTML += `<option value="${v}">${v}</option>`;
    });
}

/* ===============================
   MAIN REPORT GENERATOR
=============================== */

// We attach this to window so HTML onclick="loadReport()" can find it
/* ===============================
   MAIN REPORT GENERATOR
=============================== */
window.loadReport = function() {
    const A_raw = document.getElementById("repAssembly").value;
    const M_raw = document.getElementById("repMandal").value;
    const V_raw = document.getElementById("repPanchayat").value;
    const output = document.getElementById("reportOutput");

    if (!A_raw || !M_raw || !V_raw) {
        alert("Please select Assembly, Mandal, and Village first.");
        return;
    }

    // Convert selections to lowercase for safe matching
    const A = A_raw.toLowerCase();
    const M = M_raw.toLowerCase();
    const V = V_raw.toLowerCase();

    // 1. FIND DEMOGRAPHY DATA (Case-insensitive match)
    const demo = DB.demography.find(r => 
        (r["assembly"] || "").toLowerCase() === A && 
        (r["mandal"] || "").toLowerCase() === M && 
        (r["village"] || "").toLowerCase() === V
    );

    // 2. FIND CASTE DATA (Case-insensitive match across both village/panchayat columns)
    const casteData = DB.caste.filter(r => {
        const rowA = (r["assembly"] || "").toLowerCase();
        const rowM = (r["mandal"] || "").toLowerCase();
        const rowP = (r["panchayat"] || "").toLowerCase();
        const rowV = (r["village"] || "").toLowerCase();

        return rowA === A && rowM === M && (rowP === V || rowV === V);
    });

    output.innerHTML = ""; // Clear previous report

    buildDemography(demo);
    buildCaste(casteData);
};

/* ===============================
   BUILD SECTIONS
=============================== */

function buildDemography(d) {
    const output = document.getElementById("reportOutput");

    if (!d) {
        output.innerHTML += `<div class='card' style='color:red'><h3>❌ No Demography Data Found for this Location</h3></div>`;
        return;
    }

    output.innerHTML += `
    <div class="report-structure">
        <div class="card section-sarpanch">
            <h3>Sarpanch Information</h3>
            <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:10px;">
                <div class="card p-2"><b>Name</b><br>${d["sarpanch name"] || "-"}</div>
                <div class="card p-2"><b>Party</b><br>${d["sarpanch party"] || "-"}</div>
                <div class="card p-2"><b>Caste</b><br>${d["sarpanch caste"] || "-"}</div>
                <div class="card p-2"><b>Mobile</b><br>${d["sarpanch mobile no"] || "-"}</div>
                <div class="card p-2"><b>Reservation</b><br>${d["reservation"] || "-"}</div>
            </div>
        </div>

        <div class="section-row">
            <div class="card">
                <h3>Voter Summary</h3>
                <p><b>Male:</b> ${d["male voters"] || 0}</p>
                <p><b>Female:</b> ${d["female voters"] || 0}</p>
                <p><b>Total:</b> ${d["total voters"] || 0}</p>
                <hr>
                <p><b>SC:</b> ${d["sc"] || 0}</p>
                <p><b>ST:</b> ${d["st"] || 0}</p>
            </div>

            <div class="card">
                <h3>Gender Wise Age Distribution</h3>
                <div style="height:250px"><canvas id="genderAgeChart"></canvas></div>
            </div>
        </div>

        <div class="card section-caste" id="casteContainer">
            <h3>Prominent Castes</h3>
        </div>
    </div>
    `;

    // --- RENDER GENDER CHART ---
    const ctx = document.getElementById("genderAgeChart");
    if(reportCharts.gender) reportCharts.gender.destroy(); // Destroy old chart

    const f = [ d["18-24 (f) voters"]||0, d["25-44 (f) voters"]||0, d["45-59 (f) voters"]||0, d["60+ (f) voters"]||0 ];
    const m = [ d["18-24 (m) voters"]||0, d["25-44 (m) voters"]||0, d["45-59 (m) voters"]||0, d["60+ (m) voters"]||0 ];

    reportCharts.gender = new Chart(ctx, {
        type: "bar",
        data: {
            labels: ["18-24", "25-44", "45-59", "60+"],
            datasets: [
                { label: "Female", data: f, backgroundColor: "#3b82f6" },
                { label: "Male", data: m, backgroundColor: "#ef4444" }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

function buildCaste(rows) {
    const container = document.getElementById("casteContainer");

    if (!rows || rows.length === 0) {
        container.innerHTML += "<p style='color:gray'>No detailed caste data available for this location.</p>";
        return;
    }

    // Sort by votes and take top 8
    const top = rows
        .sort((a, b) => (Number(b["votes"]) || 0) - (Number(a["votes"]) || 0))
        .slice(0, 8);

    let html = `
    <div style="display:flex; flex-wrap:wrap; gap:20px;">
        <div style="flex:1; min-width:250px;">
            <table style="width:100%; border-collapse:collapse; font-size:14px;">
                <tr style="background:#f1f5f9; text-align:left;">
                    <th style="padding:8px;">Caste</th>
                    <th style="padding:8px;">Category</th>
                    <th style="padding:8px;">Votes</th>
                </tr>
    `;

    top.forEach(r => {
        html += `
        <tr style="border-bottom:1px solid #eee;">
            <td style="padding:8px;">${r["caste"]}</td>
            <td style="padding:8px;">${r["category"] || "-"}</td>
            <td style="padding:8px;"><b>${r["votes"]}</b></td>
        </tr>`;
    });

    html += `</table></div>
        <div style="flex:1; min-width:250px; height:250px;">
            <canvas id="castePieChart"></canvas>
        </div>
    </div>`;

    container.innerHTML += html;

    // --- RENDER CASTE CHART ---
    const ctx = document.getElementById("castePieChart");
    if(reportCharts.caste) reportCharts.caste.destroy(); // Destroy old chart

    reportCharts.caste = new Chart(ctx, {
        type: "doughnut",
        data: {
            labels: top.map(r => r["caste"]),
            datasets: [{
                data: top.map(r => r["votes"]),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#C9CBCF', '#537bc4'
                ]
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

window.resetReport = function() {
    document.getElementById("repAssembly").value = "";
    document.getElementById("repMandal").innerHTML = `<option>Select Mandal</option>`;
    document.getElementById("repPanchayat").innerHTML = `<option>Select Village/Panchayat</option>`;
    document.getElementById("reportOutput").innerHTML = `
        <div class="card">
            <h3>Report Preview Area</h3>
            <p>Select location and click Load Report</p>
        </div>`;
};