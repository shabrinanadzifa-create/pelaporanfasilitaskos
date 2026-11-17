/* =====================================
   INDAH KOST - RIWAYAT LAPORAN
===================================== */

function renderRiwayat() {
    const reports = visibleReports();
    const isOwner = currentUser.role === "pemilik";

    $("#pageContent").innerHTML = `
        <section class="panel">

            <div class="panel-head">
                <div>
                    <h3>Riwayat Laporan</h3>
                    <p>
                        ${isOwner
                            ? "Riwayat perkembangan seluruh laporan penghuni."
                            : "Riwayat laporan kerusakan yang kamu buat."}
                    </p>
                </div>
            </div>

            <div class="history-list">
                ${reports.length === 0
                    ? `<div class="empty-state">
                        Belum ada riwayat laporan.
                       </div>`
                    : reports.map(report => `
                        <div class="history-card">

                            <div class="history-card-head">
                                <div>
                                    <h4>${escapeHTML(report.facility)}</h4>
                                    <small>
                                        ${escapeHTML(report.location)}
                                        • ${formatDate(report.createdAt)}
                                    </small>
                                </div>

                                ${statusBadge(report.status)}
                            </div>

                            <p>${escapeHTML(report.description)}</p>

                            <div class="history-timeline">
                                ${report.history.length === 0
                                    ? `<p>Belum ada perubahan status.</p>`
                                    : report.history.map(item => `
                                        <div class="history-item">
                                            <span class="history-dot"></span>
                                            <div>
                                                <b>${escapeHTML(item.status)}</b>
                                                <p>${escapeHTML(item.note || "Tidak ada catatan.")}</p>
                                                <small>${formatDate(item.createdAt)}</small>
                                            </div>
                                        </div>
                                    `).join("")}
                            </div>

                            <button
                                class="btn btn-light"
                                data-detail="${report.id}">
                                Lihat Detail
                            </button>

                        </div>
                    `).join("")
                }
            </div>

        </section>
    `;

    document.querySelectorAll("[data-detail]").forEach(button => {
        button.addEventListener("click", () => {
            renderDetail(button.dataset.detail);
        });
    });
}
