/* =====================================
   INDAH KOST - FITUR LAPORAN
===================================== */

/* FORM BUAT LAPORAN */

function renderFormLaporan() {
    $("#pageContent").innerHTML = `
        <section class="panel">
            <div class="panel-head">
                <div>
                    <h3>Buat Laporan Kerusakan</h3>
                    <p>Isi informasi fasilitas yang mengalami kerusakan.</p>
                </div>
            </div>

            <form id="reportForm" class="report-form">

                <label for="facility">Nama fasilitas</label>
                <select id="facility" required>
                    <option value="">Pilih fasilitas</option>
                    <option>Kamar Mandi</option>
                    <option>Tempat Tidur</option>
                    <option>Lemari</option>
                    <option>Pintu</option>
                    <option>Jendela</option>
                    <option>Listrik</option>
                    <option>Air</option>
                    <option>AC / Kipas</option>
                    <option>Fasilitas Umum</option>
                    <option>Lainnya</option>
                </select>

                <label for="location">Lokasi kerusakan</label>
                <input id="location" type="text"
                    placeholder="Contoh: Kamar 2B" required>

                <label for="description">Deskripsi kerusakan</label>
                <textarea id="description" rows="4"
                    placeholder="Jelaskan kerusakan fasilitas..."
                    required></textarea>

                <label for="priority">Tingkat prioritas</label>
                <select id="priority" required>
                    <option value="Rendah">Rendah</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Tinggi">Tinggi</option>
                </select>

                <label for="reportPhoto">Foto kerusakan (opsional)</label>
                <input id="reportPhoto" type="file"
                    accept="image/jpeg,image/png,image/webp">

                <div id="photoPreview" class="photo-preview"></div>

                <button class="btn btn-primary" type="submit">
                    Kirim Laporan →
                </button>

            </form>
        </section>
    `;

    $("#reportPhoto").addEventListener("change", previewReportPhoto);
    $("#reportForm").addEventListener("submit", submitReport);
}


/* PREVIEW FOTO */

function previewReportPhoto(event) {
    const file = event.target.files[0];
    const preview = $("#photoPreview");

    window.selectedPhoto = null;
    preview.innerHTML = "";

    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        showToast("Format foto harus JPG, PNG, atau WEBP.");
        event.target.value = "";
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast("Ukuran foto maksimal 5 MB.");
        event.target.value = "";
        return;
    }

    window.selectedPhoto = file;

    const image = document.createElement("img");
    image.src = URL.createObjectURL(file);
    image.alt = "Preview foto kerusakan";
    image.style.maxWidth = "180px";
    image.style.borderRadius = "12px";

    preview.appendChild(image);
}


/* SIMPAN FOTO KE SUPABASE STORAGE */

async function uploadReportPhoto(file) {
    const fileName =
        `${currentUser.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;

    const { error } = await supabaseClient.storage
        .from("foto-laporan")
        .upload(fileName, file, {
            upsert: false
        });

    if (error) throw error;

    const { data } = supabaseClient.storage
        .from("foto-laporan")
        .getPublicUrl(fileName);

    return data.publicUrl;
}


/* SIMPAN LAPORAN */

async function submitReport(event) {
    event.preventDefault();

    if (currentUser.role !== "anak") {
        showToast("Hanya anak kos yang dapat membuat laporan.");
        return;
    }

    const button = $("#reportForm button[type='submit']");
    button.disabled = true;
    button.textContent = "Mengirim laporan...";

    try {
        let photoUrl = null;

        if (window.selectedPhoto) {
            photoUrl = await uploadReportPhoto(window.selectedPhoto);
        }

        const reportData = {
            user_id: currentUser.id,
            facility: $("#facility").value,
            location: $("#location").value.trim(),
            description: $("#description").value.trim(),
            priority: $("#priority").value,
            photo_url: photoUrl,
            status: "Menunggu"
        };

        const { data, error } = await supabaseClient
            .from("reports")
            .insert(reportData)
            .select()
            .single();

        if (error) throw error;

        const { error: historyError } = await supabaseClient
            .from("report_history")
            .insert({
                report_id: data.id,
                status: "Menunggu",
                note: "Laporan berhasil dibuat.",
                updated_by: currentUser.id
            });

        if (historyError) throw historyError;

        window.selectedPhoto = null;

        showToast("Laporan berhasil dikirim!");

        await renderPage("semua");

    } catch (error) {
        console.error(error);
        showToast("Gagal mengirim laporan: " + error.message);

    } finally {
        button.disabled = false;
        button.textContent = "Kirim Laporan →";
    }
}


/* SEMUA LAPORAN */

function renderSemuaLaporan() {
    const reports = visibleReports();
    const isOwner = currentUser.role === "pemilik";

    $("#pageContent").innerHTML = `
        <section class="panel">

            <div class="panel-head">
                <div>
                    <h3>Semua Laporan</h3>
                    <p>
                        ${isOwner
                            ? "Daftar laporan dari seluruh penghuni kos."
                            : "Daftar laporan kerusakan yang kamu buat."}
                    </p>
                </div>

                <span class="total-label">${reports.length} Laporan</span>
            </div>

            ${reportTable(reports, isOwner)}

        </section>
    `;

    bindReportActions();
}


/* DETAIL LAPORAN */

function renderDetail(id) {
    const report = findReport(id);

    if (!report) {
        showToast("Laporan tidak ditemukan.");
        return;
    }

    const isOwner = currentUser.role === "pemilik";

    $("#pageContent").innerHTML = `
        <section class="panel">

            <div class="panel-head">
                <div>
                    <h3>Detail Laporan #${report.id}</h3>
                    <p>Informasi lengkap kerusakan fasilitas kos.</p>
                </div>

                <button class="btn btn-light" id="backReport">
                    ← Kembali
                </button>
            </div>

            <div class="detail-grid">

                <div class="detail-item">
                    <small>Pelapor</small>
                    <b>${escapeHTML(report.reporterName)}</b>
                </div>

                <div class="detail-item">
                    <small>Fasilitas</small>
                    <b>${escapeHTML(report.facility)}</b>
                </div>

                <div class="detail-item">
                    <small>Lokasi</small>
                    <b>${escapeHTML(report.location)}</b>
                </div>

                <div class="detail-item">
                    <small>Tanggal</small>
                    <b>${formatDate(report.createdAt)}</b>
                </div>

                <div class="detail-item">
                    <small>Prioritas</small>
                    <b>${escapeHTML(report.priority)}</b>
                </div>

                <div class="detail-item">
                    <small>Status</small>
                    ${statusBadge(report.status)}
                </div>

            </div>

            <div class="detail-description">
                <h4>Deskripsi Kerusakan</h4>
                <p>${escapeHTML(report.description)}</p>
            </div>

            ${report.photo ? `
                <div class="detail-description">
                    <h4>Foto Kerusakan</h4>
                    <img src="${escapeHTML(report.photo)}"
                        alt="Foto kerusakan"
                        style="max-width:100%;width:350px;border-radius:12px;">
                </div>
            ` : ""}

            ${isOwner ? `
                <button class="btn btn-primary" id="detailUpdate">
                    Update Status →
                </button>
            ` : ""}

        </section>
    `;

    $("#backReport").addEventListener("click", () => {
        renderPage("semua");
    });

    if (isOwner) {
        $("#detailUpdate").addEventListener("click", () => {
            renderPage("update", { reportId: report.id });
        });
    }
}


/* FORM UPDATE STATUS */

function renderUpdateStatus(reportId = "") {
    if (currentUser.role !== "pemilik") {
        renderPage("dashboard");
        return;
    }

    const reports = visibleReports();

    const selectedReport = reportId
        ? findReport(reportId)
        : null;

    $("#pageContent").innerHTML = `
        <section class="panel">

            <div class="panel-head">
                <div>
                    <h3>Update Status Laporan</h3>
                    <p>Pilih laporan untuk memperbarui penanganannya.</p>
                </div>
            </div>

            <form id="updateStatusForm">

                <label for="updateReportId">Pilih laporan</label>

                <select id="updateReportId" required>
                    <option value="">Pilih laporan</option>

                    ${reports.map(report => `
                        <option value="${report.id}"
                            ${selectedReport && String(selectedReport.id) === String(report.id) ? "selected" : ""}>
                            #${report.id} - ${escapeHTML(report.facility)}
                            (${escapeHTML(report.status)})
                        </option>
                    `).join("")}

                </select>

                <div id="updateReportInfo"></div>

                <label for="newStatus">Status baru</label>

                <select id="newStatus" required>
                    <option value="Menunggu">Menunggu</option>
                    <option value="Diproses">Diproses</option>
                    <option value="Selesai">Selesai</option>
                </select>

                <label for="statusNote">Catatan penanganan</label>

                <textarea id="statusNote" rows="4"
                    placeholder="Masukkan catatan penanganan..."
                    required></textarea>

                <button class="btn btn-primary" type="submit">
                    Simpan Perubahan →
                </button>

            </form>

        </section>
    `;

    $("#updateReportId").addEventListener("change", showSelectedReport);

    if (selectedReport) {
        $("#newStatus").value = selectedReport.status;
        showSelectedReport();
    }

    $("#updateStatusForm").addEventListener("submit", saveStatusUpdate);
}


/* INFORMASI LAPORAN YANG DIPILIH */

function showSelectedReport() {
    const report = findReport($("#updateReportId").value);
    const info = $("#updateReportInfo");

    if (!report) {
        info.innerHTML = "";
        return;
    }

    info.innerHTML = `
        <div class="detail-description">
            <b>${escapeHTML(report.facility)}</b>
            <p>${escapeHTML(report.description)}</p>
            <p>Pelapor: ${escapeHTML(report.reporterName)}</p>
            <p>Status sekarang: ${escapeHTML(report.status)}</p>
        </div>
    `;
}


/* SIMPAN PERUBAHAN STATUS */

async function saveStatusUpdate(event) {
    event.preventDefault();

    if (currentUser.role !== "pemilik") {
        showToast("Akses ditolak.");
        return;
    }

    const reportId = $("#updateReportId").value;
    const status = $("#newStatus").value;
    const note = $("#statusNote").value.trim();

    const report = findReport(reportId);

    if (!report || !note) {
        showToast("Lengkapi data perubahan status.");
        return;
    }

    const button = $("#updateStatusForm button[type='submit']");
    button.disabled = true;
    button.textContent = "Menyimpan...";

    try {
        const { error: updateError } = await supabaseClient
            .from("reports")
            .update({ status })
            .eq("id", reportId);

        if (updateError) throw updateError;

        const { error: historyError } = await supabaseClient
            .from("report_history")
            .insert({
                report_id: reportId,
                status,
                note,
                updated_by: currentUser.id
            });

        if (historyError) throw historyError;

        showToast("Status laporan berhasil diperbarui!");

        await renderPage("semua");

    } catch (error) {
        console.error(error);
        showToast("Gagal memperbarui status: " + error.message);

    } finally {
        button.disabled = false;
        button.textContent = "Simpan Perubahan →";
    }
}


/* HUBUNGI PEMILIK KOS */

function renderHubungi() {
    const nomorPemilik = "6281234567890";

    $("#pageContent").innerHTML = `
        <section class="panel">
            <div class="panel-head">
                <div>
                    <h3>Hubungi Pemilik Kos</h3>
                    <p>Hubungi pemilik jika mengalami kendala.</p>
                </div>
            </div>

            <div class="quick-card">
                <div>
                    <p class="eyebrow">BUTUH BANTUAN?</p>
                    <h3>Hubungi Ibu Indah</h3>
                    <p>
                        Sampaikan kendala penggunaan sistem
                        melalui WhatsApp.
                    </p>
                </div>

                <button class="btn btn-primary" id="contactOwner">
                    Hubungi via WhatsApp
                </button>
            </div>
        </section>
    `;

    $("#contactOwner").addEventListener("click", () => {
        const message = encodeURIComponent(
            "Halo Ibu Indah, saya ingin menyampaikan kendala terkait sistem INDAH KOST."
        );

        window.open(
            `https://wa.me/${nomorPemilik}?text=${message}`,
            "_blank"
        );
    });
}
