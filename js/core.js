/* =====================================
   INDAH KOST - FUNGSI UTAMA
===================================== */

window.$ = (selector) => document.querySelector(selector);

window.currentUser = null;
window.activePage = "dashboard";
window.selectedPhoto = null;
window.allReportsData = [];

function escapeHTML(value = "") {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function todayLabel() {
    return new Date().toLocaleDateString("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}

function initials(name = "U") {
    return name.trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word[0])
        .join("")
        .toUpperCase();
}

function roleLabel(role) {
    return role === "pemilik" ? "Pemilik Kos" : "Anak Kos";
}

function showToast(message) {
    const el = $("#toast");
    if (!el) return;

    el.textContent = message;
    el.classList.add("show");

    clearTimeout(window.toastTimer);

    window.toastTimer = setTimeout(() => {
        el.classList.remove("show");
    }, 2800);
}

function statusClass(status) {
    if (status === "Selesai") return "status-selesai";
    if (status === "Diproses") return "status-diproses";
    return "status-menunggu";
}

function statusBadge(status) {
    return `<span class="status ${statusClass(status)}">${escapeHTML(status)}</span>`;
}

/* =====================================
   AMBIL PROFIL PENGGUNA
===================================== */

async function loadCurrentProfile() {
    const { data: authData, error: authError } =
        await window.supabaseClient.auth.getUser();

    if (authError || !authData.user) {
        window.currentUser = null;
        return null;
    }

    const { data: profile, error } = await window.supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

    if (error || !profile) {
        console.error("Gagal mengambil profil:", error);
        return null;
    }

    window.currentUser = {
        id: profile.id,
        name: profile.nama_lengkap,
        username: profile.username,
        email: authData.user.email,
        role: profile.role,
        room: profile.nomor_kamar || "-"
    };

    return window.currentUser;
}

/* =====================================
   AMBIL SEMUA LAPORAN DARI SUPABASE
===================================== */

async function loadReports() {
    const { data: reports, error } = await window.supabaseClient
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Gagal mengambil laporan:", error);
        showToast("Gagal memuat laporan.");
        return [];
    }

    const userIds = [...new Set(reports.map(r => r.user_id))];

    let profiles = [];

    if (userIds.length) {
        const result = await window.supabaseClient
            .from("profiles")
            .select("id, nama_lengkap, username, nomor_kamar")
            .in("id", userIds);

        if (result.error) {
            console.error("Gagal mengambil data pelapor:", result.error);
        } else {
            profiles = result.data || [];
        }
    }

    const reportIds = reports.map(r => r.id);
    let histories = [];

    if (reportIds.length) {
        const result = await window.supabaseClient
            .from("report_history")
            .select("*")
            .in("report_id", reportIds)
            .order("created_at", { ascending: true });

        if (result.error) {
            console.error("Gagal mengambil riwayat:", result.error);
        } else {
            histories = result.data || [];
        }
    }

    window.allReportsData = reports.map(report => {
        const profile = profiles.find(p => p.id === report.user_id);

        return {
            id: report.id,
            userId: report.user_id,
            reporterName: profile?.nama_lengkap || "Pengguna",
            facility: report.facility,
            location: report.location,
            description: report.description,
            priority: report.priority,
            photo: report.photo_url,
            status: report.status,
            createdAt: report.created_at,

            history: histories
                .filter(h => h.report_id === report.id)
                .map(h => ({
                    status: h.status,
                    note: h.note,
                    date: h.created_at,
                    by: h.updated_by
                }))
        };
    });

    return window.allReportsData;
}

function visibleReports() {
    if (!window.currentUser) return [];

    if (window.currentUser.role === "pemilik") {
        return window.allReportsData;
    }

    return window.allReportsData.filter(
        report => report.userId === window.currentUser.id
    );
}

function findReport(id) {
    return window.allReportsData.find(
        report => String(report.id) === String(id)
    );
}

function countByStatus(reports, status) {
    return reports.filter(r => r.status === status).length;
}

/* =====================================
   TABEL LAPORAN
===================================== */

function reportTable(reports, owner = false) {
    if (!reports.length) {
        return `
            <div class="empty-state">
                <div class="empty-icon">▤</div>
                Belum ada laporan yang tersimpan.
            </div>
        `;
    }

    return `
        <div class="table-wrap">
            <table class="report-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        ${owner ? "<th>PELAPOR</th>" : ""}
                        <th>FASILITAS</th>
                        <th>LOKASI</th>
                        <th>TANGGAL</th>
                        <th>PRIORITAS</th>
                        <th>STATUS</th>
                        <th>AKSI</th>
                    </tr>
                </thead>
                <tbody>
                    ${reports.map(report => `
                        <tr>
                            <td>#${report.id}</td>
                            ${owner ? `<td>${escapeHTML(report.reporterName)}</td>` : ""}
                            <td class="report-title">${escapeHTML(report.facility)}</td>
                            <td>${escapeHTML(report.location)}</td>
                            <td>${formatDate(report.createdAt)}</td>
                            <td>
                                <span class="priority ${escapeHTML(report.priority)}">
                                    ${escapeHTML(report.priority)}
                                </span>
                            </td>
                            <td>${statusBadge(report.status)}</td>
                            <td>
                                <div class="inline-actions">
                                    <button class="small-btn" data-detail="${report.id}">
                                        Detail
                                    </button>
                                    ${owner ? `
                                        <button class="small-btn" data-update="${report.id}">
                                            Update
                                        </button>
                                    ` : ""}
                                </div>
                            </td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function bindReportActions() {
    document.querySelectorAll("[data-detail]").forEach(button => {
        button.addEventListener("click", () => {
            renderDetail(button.dataset.detail);
        });
    });

    document.querySelectorAll("[data-update]").forEach(button => {
        button.addEventListener("click", () => {
            renderPage("update", {
                reportId: button.dataset.update
            });
        });
    });
}

/* =====================================
   NAVIGASI SESUAI ROLE
===================================== */

function navItems(role) {
    if (role === "anak") {
        return [
            ["dashboard", "⌂", "Dashboard"],
            ["buat", "＋", "Lapor Kerusakan"],
            ["semua", "▤", "Semua Laporan"],
            ["riwayat", "◷", "Riwayat Laporan"],
            ["hubungi", "☎", "Hubungi Pemilik Kos"]
        ];
    }

    return [
        ["dashboard", "⌂", "Dashboard"],
        ["semua", "▤", "Semua Laporan"],
        ["update", "↻", "Update Status"],
        ["riwayat", "◷", "Riwayat Laporan"]
    ];
}

function renderMenu() {
    const items = navItems(window.currentUser.role);

    $("#sideNav").innerHTML = items.map(([id, icon, label]) => `
        <button class="nav-link ${window.activePage === id ? "active" : ""}"
                data-page="${id}">
            <span class="nav-icon">${icon}</span>
            ${label}
        </button>
    `).join("");

    $("#sideNav").querySelectorAll("[data-page]").forEach(button => {
        button.addEventListener("click", () => {
            renderPage(button.dataset.page);
            $("#sidebar").classList.remove("open");
        });
    });
}

async function renderPage(page, data = {}) {
    if (!window.currentUser) return;

    const allowed = window.currentUser.role === "anak"
        ? ["dashboard", "buat", "semua", "riwayat", "hubungi"]
        : ["dashboard", "semua", "update", "riwayat"];

    if (!allowed.includes(page)) page = "dashboard";

    window.activePage = page;

    const titles = {
        dashboard: "Dashboard",
        buat: "Lapor Kerusakan",
        semua: "Semua Laporan",
        riwayat: "Riwayat Laporan",
        update: "Update Status",
        hubungi: "Hubungi Pemilik Kos"
    };

    $("#pageHeading").textContent = titles[page] || "Dashboard";

    renderMenu();

    await loadReports();

    if (page === "dashboard") {
        if (window.currentUser.role === "anak") {
            renderDashboardAnak();
        } else {
            renderDashboardPemilik();
        }
    }

    if (page === "buat") renderFormLaporan();
    if (page === "semua") renderSemuaLaporan();
    if (page === "riwayat") renderRiwayat();
    if (page === "update") renderUpdateStatus(data.reportId || "");
    if (page === "hubungi") renderHubungi();
}

/* =====================================
   MASUK KE APLIKASI
===================================== */

async function enterApp() {
    if (!window.currentUser) return;

    $("#authView").hidden = true;
    $("#appView").hidden = false;

    $("#sideName").textContent = window.currentUser.name;
    $("#sideRole").textContent = roleLabel(window.currentUser.role);

    $("#sideAvatar").textContent = initials(window.currentUser.name);
    $("#topAvatar").textContent = initials(window.currentUser.name);

    $("#todayDate").textContent = todayLabel();

    await renderPage("dashboard");
}
