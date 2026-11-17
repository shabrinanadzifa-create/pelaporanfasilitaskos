/* =====================================
   DASHBOARD ANAK KOS
   INDAH KOST
===================================== */

function renderDashboardAnak() {
    const reports = visibleReports();

    const total = reports.length;
    const menunggu = countByStatus(reports, "Menunggu");
    const diproses = countByStatus(reports, "Diproses");
    const selesai = countByStatus(reports, "Selesai");

    const latest = reports.slice(0, 5);

    $("#pageContent").innerHTML = `
        <section class="welcome-banner">
            <p>SELAMAT DATANG DI INDAH KOST</p>
            <h2>Halo, ${escapeHTML(currentUser.name)}!</h2>
            <small>
                Pantau laporan kerusakan fasilitas kos kamu
                dengan mudah melalui sistem ini.
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
                    <p>Daftar laporan kerusakan yang kamu buat.</p>
                </div>

                <button class="btn btn-light" id="lihatSemuaAnak">
                    Semua Laporan →
                </button>
            </div>

            ${reportTable(latest, false)}
        </section>

        <section class="quick-card">
            <div>
                <p class="eyebrow">ADA FASILITAS YANG RUSAK?</p>
                <h3>Laporkan kerusakan sekarang.</h3>
                <p>
                    Sampaikan masalah fasilitas agar pemilik kos
                    dapat segera mengetahuinya.
                </p>
            </div>

            <button class="btn btn-primary" id="buatLaporanAnak">
                + Buat Laporan
            </button>
        </section>
    `;

    $("#lihatSemuaAnak").addEventListener("click", () => {
        renderPage("semua");
    });

    $("#buatLaporanAnak").addEventListener("click", () => {
        renderPage("buat");
    });

    bindReportActions();
}
