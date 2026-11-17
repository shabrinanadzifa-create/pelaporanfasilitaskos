/* =====================================
   LOGIN DAN REGISTER SUPABASE
===================================== */

function authMode(register = false) {
    $("#loginForm").hidden = register;
    $("#registerForm").hidden = !register;
    $("#loginSwitch").hidden = register;

    $("#authEyebrow").textContent = register
        ? "BUAT AKUN BARU"
        : "SELAMAT DATANG";

    $("#authTitle").textContent = register
        ? "Daftar akun anak kos"
        : "Masuk ke akun";

    $("#authSubtitle").textContent = register
        ? "Buat akun untuk mulai melaporkan kerusakan."
        : "Silakan login untuk melanjutkan ke sistem.";
}

function togglePassword(inputId, buttonId) {
    const input = $("#" + inputId);
    const button = $("#" + buttonId);

    input.type = input.type === "password" ? "text" : "password";
    button.textContent = input.type === "password"
        ? "Lihat"
        : "Sembunyikan";
}

/* =====================================
   LOGIN
===================================== */

async function login(event) {
    event.preventDefault();

    const email = $("#loginUsername").value.trim().toLowerCase();
    const password = $("#loginPassword").value;
    const selectedRole = $("#loginRole").value;

    $("#loginMessage").textContent = "Memeriksa akun...";

    const { error } = await window.supabaseClient.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        $("#loginMessage").textContent =
            "Email atau password tidak sesuai.";
        return;
    }

    const profile = await loadCurrentProfile();

    if (!profile) {
        await window.supabaseClient.auth.signOut();

        $("#loginMessage").textContent =
            "Profil akun tidak ditemukan. Hubungi pemilik kos.";
        return;
    }

    if (profile.role !== selectedRole) {
        await window.supabaseClient.auth.signOut();
        window.currentUser = null;

        $("#loginMessage").textContent =
            "Pilihan jenis akun tidak sesuai dengan akun kamu.";
        return;
    }

    $("#loginMessage").textContent = "";
    $("#loginForm").reset();

    await enterApp();
}

/* =====================================
   DAFTAR AKUN ANAK KOS
===================================== */

async function register(event) {
    event.preventDefault();

    const name = $("#registerName").value.trim();
    const room = $("#registerRoom").value.trim();
    const username = $("#registerUsername").value.trim().toLowerCase();
    const email = $("#registerEmail").value.trim().toLowerCase();
    const password = $("#registerPassword").value;

    if (!name || !room || !username || !email || !password) {
        $("#registerMessage").textContent =
            "Semua kolom wajib diisi.";
        return;
    }

    if (username.includes(" ")) {
        $("#registerMessage").textContent =
            "Username tidak boleh mengandung spasi.";
        return;
    }

    if (password.length < 6) {
        $("#registerMessage").textContent =
            "Password minimal 6 karakter.";
        return;
    }

    $("#registerMessage").textContent = "Membuat akun...";

    const { data, error } = await window.supabaseClient.auth.signUp({
        email,
        password,
        options: {
            data: {
                nama_lengkap: name,
                username: username,
                nomor_kamar: room
            }
        }
    });

    if (error) {
        $("#registerMessage").textContent = error.message;
        return;
    }

    $("#registerForm").reset();

    if (data.session) {
        $("#registerMessage").textContent = "";
        await loadCurrentProfile();
        showToast("Akun berhasil dibuat.");
        await enterApp();
    } else {
        authMode(false);
        $("#loginUsername").value = email;

        $("#loginMessage").textContent =
            "Pendaftaran berhasil. Periksa email untuk konfirmasi akun, jika diminta.";
    }
}

/* =====================================
   PEMULIHAN SESSION
===================================== */

async function initAuth() {
    const { data, error } =
        await window.supabaseClient.auth.getSession();

    if (error) {
        console.error("Gagal memeriksa session:", error);
    }

    if (data.session) {
        const profile = await loadCurrentProfile();

        if (profile) {
            await enterApp();
            return;
        }
    }

    $("#authView").hidden = false;
    $("#appView").hidden = true;
}

document.addEventListener("DOMContentLoaded", () => {
    $("#loginForm").addEventListener("submit", login);
    $("#registerForm").addEventListener("submit", register);

    $("#showRegister").addEventListener("click", () => authMode(true));
    $("#showLogin").addEventListener("click", () => authMode(false));

    $("#toggleLoginPassword").addEventListener("click", () => {
        togglePassword("loginPassword", "toggleLoginPassword");
    });

    $("#toggleRegisterPassword").addEventListener("click", () => {
        togglePassword("registerPassword", "toggleRegisterPassword");
    });

    $("#menuToggle").addEventListener("click", () => {
        $("#sidebar").classList.toggle("open");
    });

    initAuth();
});
