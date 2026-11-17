/* =====================================
   INDAH KOST - LOGOUT
===================================== */

async function logout() {
    const konfirmasi = confirm("Apakah kamu yakin ingin keluar?");

    if (!konfirmasi) return;

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error(error);
        showToast("Gagal keluar dari akun.");
        return;
    }

    window.currentUser = null;
    window.selectedPhoto = null;
    window.allReportsData = [];

    location.reload();
}
