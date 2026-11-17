/* =====================================
   DASHBOARD PEMILIK KOS
   INDAH KOST
===================================== */

function renderDashboardPemilik() {
    const reports = visibleReports();

    const total = reports.length;
    const menunggu = countByStatus(reports, "Menunggu");
    const diproses = countByStatus(reports, "Diproses");
    const selesai = countByStatus(reports, "Selesai");

    const latest = reports.slice(0, 7);

    $("#pageContent").innerHTML = `
        <section class="welcome-banner">
            <p>HALO, PEMILIK KOS</p>
            <h2>Selamat datang, ${escapeHTML(currentUser.name)}!</h2>
            <small>
                Pantau seluruh laporan kerusakan fasilitas
                dari penghuni INDAH KOST.
            </small>
        </section>

        <section class="stats-grid">

            <div class="stat-card">
                <div class="stat-icon">▤</div>
                <p>Total Laporan</p>
                <h2>${total}</h2>
            </div>

            <div class="stat-card">
                <div class="stat-icon">◷</div>
                <p>Menunggu</p>
                <h2>${menunggu}</h2>
            </div>

            <div class="stat-card">
                <div class="stat-icon">↻</div>
                <p>Diproses</p>
                <h2>${diproses}</h2>
            </div>

            <div class="stat-card">
                <div class="stat-icon">✓</div>
                <p>Selesai</p>
                <h2>${selesai}</h2>
            </div>

        </section>

        <section class="panel">

            <div class="panel-head">
                <div>
                    <h3>Laporan Terbaru</h3>
                    <p>
                        Laporan kerusakan yang dikirim oleh
                        seluruh penghuni kos.
                    </p>
                </div>

                <button class="btn btn-light" id="lihatSemuaPemilik">
                    Semua Laporan →
                </button>
            </div>

            ${reportTable(latest, true)}

        </section>

        <section class="quick-card">
            <div>
                <p class="eyebrow">PANTAU KONDISI KOS</p>
                <h3>Kelola laporan penghuni dengan mudah.</h3>
                <p>
                    Periksa laporan yang masuk dan perbarui
                    status penanganan kerusakan.
                </p>
            </div>

            <button class="btn btn-primary" id="kelolaLaporanPemilik">
                Kelola Laporan →
            </button>
        </section>
    `;

    $("#lihatSemuaPemilik").addEventListener("click", () => {
        renderPage("semua");
    });

    $("#kelolaLaporanPemilik").addEventListener("click", () => {
        renderPage("update");
    });

    bindReportActions();
}
