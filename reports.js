/* ===============================
   AUTOMATED REPORT ENGINE (PDF DASHBOARD EDITION)
=============================== */

let DB = { demography: [], caste: [] };
let reportCharts = { gender: null, caste: null };

// Register the datalabels plugin globally for Chart.js
Chart.register(ChartDataLabels);

const std = str => (str || "").toString().replace(/[^a-z0-9]/gi, "").toLowerCase();

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(loadData, 200);
});

async function loadData() {
    const out = document.getElementById("reportOutput");
    try {
        if (out) out.innerHTML = `<div><h3 style="color:#2563eb;">⏳ Hunting for data files...</h3></div>`;

        // --- 1. FETCH DEMOGRAPHY ---
        let demoUrl = "data/VillageReports.xlsx";
        let demoRes = await fetch(demoUrl);
        
        // If relative path fails, try the absolute GitHub Pages URL
        if (!demoRes.ok) {
            demoUrl = "https://hari2252.github.io/politicalintelligencesystem/data/VillageReports.xlsx";
            demoRes = await fetch(demoUrl);
        }
        
        if (!demoRes.ok) throw new Error(`Could not find Demography file. Tried: ${demoUrl} | Status: ${demoRes.status}`);
        
        const demoWB = XLSX.read(await demoRes.arrayBuffer(), { type: "array" });
        DB.demography = XLSX.utils.sheet_to_json(demoWB.Sheets[demoWB.SheetNames[0]]).map(normalizeRow);

        // --- 2. FETCH CASTE DATA ---
        let casteUrl = "data/caste_data.xlsx";
        let casteRes = await fetch(casteUrl);
        
        // Fallback 1: Try with a space (just in case)
        if (!casteRes.ok) {
            casteUrl = "data/Caste data.xlsx";
            casteRes = await fetch(casteUrl);
        }
        // Fallback 2: Try absolute GitHub Pages URL
        if (!casteRes.ok) {
            casteUrl = "https://hari2252.github.io/politicalintelligencesystem/data/caste_data.xlsx";
            casteRes = await fetch(casteUrl);
        }

        if (!casteRes.ok) throw new Error(`Could not find Caste file. Tried: ${casteUrl} | Status: ${casteRes.status}`);
        
        const casteWB = XLSX.read(await casteRes.arrayBuffer(), { type: "array" });
        DB.caste = XLSX.utils.sheet_to_json(casteWB.Sheets[casteWB.SheetNames[0]]).map(normalizeRow);

        // SUCCESS
        if (out) out.innerHTML = `
            <div class="card" style="text-align:center; padding: 40px; color:#64748b;">
                <span style="font-size:40px;">📊</span>
                <h3>✅ Data Successfully Loaded!</h3>
                <p>Select an Assembly, Mandal, and Village to generate the PDF report.</p>
            </div>`;
            
        populateAssemblies();

    } catch (error) {
        console.error("FETCH ERROR:", error);
        if (out) out.innerHTML = `
            <div class="card" style="border-left: 5px solid #ef4444; background: #fee2e2; padding: 20px;">
                <h3 style="color: #dc2626; margin-top:0;">❌ Deployment Blocked</h3>
                <p><b>Error:</b> ${error.message}</p>
                <hr style="border-color:#fca5a5;">
                <p><b>How to fix this:</b></p>
                <ol>
                    <li>Go to your repository on GitHub.com</li>
                    <li>Click <b>Settings</b>.</li>
                    <li>Scroll to the very bottom to the "Danger Zone".</li>
                    <li>Ensure your repository visibility is set to <b>Public</b>. If it is Private, your site cannot fetch the Excel files!</li>
                </ol>
            </div>`;
    }
}

function normalizeRow(row) {
    let obj = {};
    Object.keys(row).forEach(k => {
        let cleanKey = k.replace(/[\n\r]+/g, '').trim().toLowerCase();
        if (cleanKey.includes("assembl")) cleanKey = "assembly";
        if (cleanKey.includes("panchayat")) cleanKey = "panchayat";
        if (cleanKey.includes("village")) cleanKey = "village";
        obj[cleanKey] = row[k];
    });
    return obj;
}

function populateAssemblies() {
    let uniqueAsm = {};
    DB.demography.forEach(r => { if (r.assembly) uniqueAsm[std(r.assembly)] = r.assembly.trim(); });
    const asmSelect = document.getElementById("repAssembly");
    asmSelect.innerHTML = `<option value="">Select Assembly</option>`;
    Object.values(uniqueAsm).sort().forEach(a => { asmSelect.innerHTML += `<option value="${a}">${a}</option>`; });
    asmSelect.onchange = populateMandals;
}

function populateMandals() {
    const A = std(document.getElementById("repAssembly").value);
    let uniqueMan = {};
    DB.demography.forEach(r => { if (std(r.assembly) === A && r.mandal) uniqueMan[std(r.mandal)] = r.mandal.trim(); });
    const manSelect = document.getElementById("repMandal");
    manSelect.innerHTML = `<option value="">Select Mandal</option>`;
    Object.values(uniqueMan).sort().forEach(m => { manSelect.innerHTML += `<option value="${m}">${m}</option>`; });
    manSelect.onchange = populateVillages;
}

function populateVillages() {
    const A = std(document.getElementById("repAssembly").value);
    const M = std(document.getElementById("repMandal").value);
    let uniqueVil = {};
    DB.demography.forEach(r => { if (std(r.assembly) === A && std(r.mandal) === M && r.village) uniqueVil[std(r.village)] = r.village.trim(); });
    const panSelect = document.getElementById("repPanchayat");
    panSelect.innerHTML = `<option value="">Select Village/Panchayat</option>`;
    Object.values(uniqueVil).sort().forEach(v => { panSelect.innerHTML += `<option value="${v}">${v}</option>`; });
}

window.loadReport = function() {
    const A_val = document.getElementById("repAssembly").value;
    const M_val = document.getElementById("repMandal").value;
    const V_val = document.getElementById("repPanchayat").value;
    const output = document.getElementById("reportOutput");

    if (!A_val || !M_val || !V_val) {
        alert("Please select Assembly, Mandal, and Village first.");
        return;
    }

    const A = std(A_val), M = std(M_val), V = std(V_val);

    const demo = DB.demography.find(r => std(r.assembly) === A && std(r.mandal) === M && std(r.village) === V);
    const casteData = DB.caste.filter(r => std(r.assembly) === A && std(r.mandal) === M && (std(r.panchayat) === V || std(r.village) === V));

    if (!demo) {
        output.innerHTML = `<div class='card' style='color:red'><h3>❌ No Demography Data Found</h3></div>`;
        return;
    }

    // Process Top Castes
    const topCastes = casteData.sort((a, b) => (Number(b["votes"]) || 0) - (Number(a["votes"]) || 0)).slice(0, 7);
    let casteRows = topCastes.length ? "" : "<tr><td colspan='3'>No caste data available</td></tr>";
    
    topCastes.forEach(r => {
        casteRows += `<tr>
            <td>${r["caste"]}</td>
            <td>${r["category"] || "-"}</td>
            <td style="text-align:right;">${r["votes"]}</td>
        </tr>`;
    });

    // Generate Dashboard HTML
    output.innerHTML = `
    <div class="pdf-dashboard" id="printableDashboard">
        
        <div class="pdf-header">
            <h2>Panchayat Report: ${demo["village"] || V_val}</h2>
            <p>Assembly: ${demo["assembly"] || A_val} | Mandal: ${demo["mandal"] || M_val}</p>
        </div>

        <div class="kpi-row-mini">
            <div class="kpi-mini"><strong>${demo["total voters"] || 0}</strong><span>Total Voters</span></div>
            <div class="kpi-mini"><strong>${demo["male voters"] || 0}</strong><span>Male</span></div>
            <div class="kpi-mini"><strong>${demo["female voters"] || 0}</strong><span>Female</span></div>
            <div class="kpi-mini"><strong>${demo["sc"] || 0}</strong><span>SC Voters</span></div>
            <div class="kpi-mini"><strong>${demo["st"] || 0}</strong><span>ST Voters</span></div>
        </div>

        <div class="pdf-grid">
            <div class="pdf-section">
                <h3 class="pdf-section-title">🏛️ Leadership & Sarpanch</h3>
                <div class="pdf-section-content">
                    <table class="pdf-table">
                        <tr><td>Name</td><td>${demo["sarpanch name"] || "N/A"}</td></tr>
                        <tr><td>Party</td><td><span style="background:#2563eb; color:white; padding:2px 6px; border-radius:4px;">${demo["sarpanch party"] || "-"}</span></td></tr>
                        <tr><td>Caste</td><td>${demo["sarpanch caste"] || "-"}</td></tr>
                        <tr><td>Mobile</td><td>${demo["sarpanch mobile no"] || "-"}</td></tr>
                        <tr><td>Reservation</td><td>${demo["reservation"] || "-"}</td></tr>
                    </table>
                </div>
            </div>

            <div class="pdf-section">
                <h3 class="pdf-section-title">📊 Age-Wise Electors</h3>
                <div class="pdf-section-content" style="height: 200px;">
                    <canvas id="genderAgeChart"></canvas>
                </div>
            </div>
        </div>

        <div class="pdf-grid">
            <div class="pdf-section">
                <h3 class="pdf-section-title">👥 Prominent Castes</h3>
                <table class="pdf-table">
                    <thead>
                        <tr><th>Caste</th><th>Category</th><th style="text-align:right;">Votes</th></tr>
                    </thead>
                    <tbody>${casteRows}</tbody>
                </table>
            </div>

            <div class="pdf-section">
                <h3 class="pdf-section-title">🥧 Caste Distribution</h3>
                <div class="pdf-section-content" style="height: 250px;">
                    <canvas id="castePieChart"></canvas>
                </div>
            </div>
        </div>

    </div>
    `;

    // Render Charts
    if(reportCharts.gender) reportCharts.gender.destroy(); 
    if(reportCharts.caste) reportCharts.caste.destroy(); 

    const f = [ demo["18-24 (f) voters"]||0, demo["25-44 (f) voters"]||0, demo["45-59 (f) voters"]||0, demo["60+ (f) voters"]||0 ];
    const m = [ demo["18-24 (m) voters"]||0, demo["25-44 (m) voters"]||0, demo["45-59 (m) voters"]||0, demo["60+ (m) voters"]||0 ];
    
    reportCharts.gender = new Chart(document.getElementById("genderAgeChart"), {
        type: "bar",
        data: { 
            labels: ["18-24", "25-44", "45-59", "60+"], 
            datasets: [ 
                { label: "Female", data: f, backgroundColor: "#ec4899" }, 
                { label: "Male", data: m, backgroundColor: "#0ea5e9" } 
            ] 
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { datalabels: { display: false } } } // Hide percentages on bar chart
    });

    if (topCastes.length > 0) {
        reportCharts.caste = new Chart(document.getElementById("castePieChart"), {
            type: "pie",
            data: { 
                labels: topCastes.map(r => r["caste"]), 
                datasets: [{ 
                    data: topCastes.map(r => r["votes"]), 
                    backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b', '#ef4444']
                }] 
            },
            options: { 
                responsive: true, 
                maintainAspectRatio: false, 
                plugins: { 
                    legend: { position: 'right' },
                    // This is the magic block that calculates and displays the percentages!
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold', size: 12 },
                        formatter: (value, context) => {
                            const dataset = context.chart.data.datasets[0];
                            const total = dataset.data.reduce((acc, curr) => acc + curr, 0);
                            const percentage = ((value / total) * 100).toFixed(1) + "%";
                            // Only show label if slice is bigger than 4% so text doesn't overlap
                            return (value / total) > 0.04 ? percentage : '';
                        }
                    }
                } 
            }
        });
    }
};

window.resetReport = function() {
    document.getElementById("repAssembly").value = "";
    document.getElementById("repMandal").innerHTML = `<option>Select Mandal</option>`;
    document.getElementById("repPanchayat").innerHTML = `<option>Select Village/Panchayat</option>`;
    document.getElementById("reportOutput").innerHTML = `
        <div class="card" style="text-align:center; padding: 40px; color:#64748b;">
            <span style="font-size:40px;">📊</span>
            <h3>Ready for Analysis</h3>
            <p>Select an Assembly, Mandal, and Village to generate the report.</p>
        </div>`;
};