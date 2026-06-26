// ==========================================
// app.js – Shared Utilities & Data Store
// ==========================================

const firebaseConfig = {
    apiKey: "AIzaSyAquXEzHXgbp-036enXnJdN9kn2IFA6CUU",
    authDomain: "rm-pondok-marisa-final.firebaseapp.com",
    projectId: "rm-pondok-marisa-final",
    storageBucket: "rm-pondok-marisa-final.firebasestorage.app",
    messagingSenderId: "638351696963",
    appId: "1:638351696963:web:ad266be827925976ba20f6",
    measurementId: "G-4C0X7LZ9Z8"
};

// Initialize Firebase dengan penanganan error yang aman
let db = null;
try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();

        // Aktifkan Offline Persistence agar tidak melambat saat koneksi tidak stabil
        db.enablePersistence().catch(err => console.warn('[MarisaPOS] Persistence failed:', err.code));

        console.log('[MarisaPOS] Firebase Firestore terhubung:', firebaseConfig.projectId);
    }
} catch (e) {
    console.error('[MarisaPOS] Firebase gagal init, pakai localStorage:', e.message);
    db = null;
}

const DB = {
    _cache: {},
    async load(key) {
        // Ambil secara instan dari lokal agar UI tidak lag
        const raw = localStorage.getItem(key);
        let localData = null;
        if (raw) {
            try {
                localData = JSON.parse(raw);
                DB._cache[key] = localData; // Init in-memory cache
            } catch (e) { }
        }

        // FIX #3: Jika localStorage kosong dan Firebase tersedia, tunggu data Firebase
        // agar halaman tidak render dengan data default saat pertama kali buka
        if (!localData && db) {
            try {
                const docSnap = await db.collection('PondokMarisaPOS').doc(key).get();
                if (docSnap.exists) {
                    const data = docSnap.data().data;
                    localStorage.setItem(key, JSON.stringify(data));
                    DB._cache[key] = data;
                    return data;
                }
            } catch (e) {
                console.warn(`[DB.load] firebase error untuk ${key}:`, e.message);
            }
            return getDefault(key);
        }

        // Kalau data lokal sudah ada, sinkron Firebase di background (non-blocking)
        if (db) {
            (async () => {
                try {
                    const docSnap = await db.collection('PondokMarisaPOS').doc(key).get();
                    if (docSnap.exists) {
                        const data = docSnap.data().data;
                        localStorage.setItem(key, JSON.stringify(data));
                        DB._cache[key] = data;
                    }
                } catch (e) {
                    console.warn(`[DB.load] background sync error untuk ${key}:`, e.message);
                }
            })();
        }

        return localData || getDefault(key);
    },

    async save(key, data) {
        // Optimistic update: simpan ke lokal instan
        localStorage.setItem(key, JSON.stringify(data));
        DB._cache[key] = data;

        // Background sync tanpa await agar UI ga macet!
        if (db) {
            db.collection('PondokMarisaPOS').doc(key).set({
                data: data,
                updatedAt: new Date().toISOString()
            }).catch(e => console.warn(`[DB.save] firebase gagal sinkron ${key}:`, e.message));
        }

        return true; // langsung true
    },

    listen(key, callback) {
        if (!db) return;
        return db.collection('PondokMarisaPOS').doc(key).onSnapshot((docSnap) => {
            if (docSnap.exists) {
                const data = docSnap.data().data;
                const oldDataStr = JSON.stringify(DB._cache[key] || null);
                const newDataStr = JSON.stringify(data);

                if (oldDataStr !== newDataStr) {
                    localStorage.setItem(key, newDataStr);
                    DB._cache[key] = data;
                    callback(data);
                }
            }
        }, err => console.warn('Listen err:', err));
    }
};

function getDefault(key) {
    if (key === 'produk') return [
        { id: 1, nama: 'Ayam Goreng Kalasan', harga: 20000, kategori: 'Makanan', variasi: ['Dada', 'Paha'] },
        { id: 2, nama: 'Nasi Ayam Kremes', harga: 25000, kategori: 'Makanan', variasi: ['Dada', 'Paha'] },
        { id: 3, nama: 'Es Teh Manis', harga: 5000, kategori: 'Minuman' },
        { id: 4, nama: 'Es Jeruk', harga: 7000, kategori: 'Minuman' },
        { id: 5, nama: 'Air Putih', harga: 1000, kategori: 'Minuman' },
        { id: 6, nama: 'Ayam Ungkep', harga: 18000, kategori: 'Makanan' },
    ];
    if (key === 'transaksi') return [];
    if (key === 'kategori') return ['Makanan', 'Minuman', 'Cemilan', 'Paket', 'Lainnya'];
    if (key === 'pengaturan') return {
        merchantName: 'RM.PONDOK MARISA 2008',
        address: 'Perumahan Bukit Dago, Jl. Ps. Jengkol Jl. Pendidikan Blok BDU No.81.',
        phone: '085101191675',
        footer: 'Terimakasih sudah order di Rm.Pondok marisa. Jangan lupa untuk langsung di buka ya supaya tidak lembab! Kami juga menerima orderan nasi box untuk berbagai acara.',
        logo: '',
        taxRate: 10,
        bankName: 'BCA',
        bankAccount: '1234567890',
        adminPin: '011105',
        bluetoothPrinter: null,
        instagram: '',
        googleMaps: '',
        tiktok: '',
        goFood: '',
        grabFood: ''
    };
    return [];
}

// Format Rupiah - Added fallback for safety
function formatRp(num) {
    const val = num ? Number(num) : 0;
    return 'Rp ' + val.toLocaleString('id-ID');
}

// Format tanggal
function formatTanggal(iso) {
    if (!iso) return '-';
    try {
        const d = new Date(iso);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch (e) {
        return '-';
    }
}

function formatWaktu(iso) {
    if (!iso) return '-';
    try {
        const d = new Date(iso);
        return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
        return '-';
    }
}

// Generate ID unik
function genId() {
    return Date.now() + Math.floor(Math.random() * 1000);
}

// Nomor faktur
function genNomorFaktur() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `INV-${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${String(genId()).slice(-4)}`;
}

// sidebar active link — support indigo, emerald, dan teal sidebar
function setActiveNav(page) {
    const sidebar = document.getElementById('sidebar');
    // Deteksi warna sidebar
    let activeClass, inactiveText, inactiveHover;
    if (sidebar && sidebar.classList.contains('bg-emerald-800')) {
        activeClass = ['bg-emerald-700', 'text-white', 'shadow-xl', 'shadow-emerald-900/20'];
        inactiveText = 'text-emerald-100';
        inactiveHover = 'hover:bg-emerald-700/50';
    } else if (sidebar && sidebar.classList.contains('bg-teal-800')) {
        activeClass = ['bg-teal-700', 'text-white', 'shadow-xl', 'shadow-teal-900/20'];
        inactiveText = 'text-teal-100';
        inactiveHover = 'hover:bg-teal-700/50';
    } else {
        // fallback indigo
        activeClass = ['bg-indigo-700', 'text-white', 'shadow-xl', 'shadow-indigo-900/20'];
        inactiveText = 'text-indigo-100';
        inactiveHover = 'hover:bg-indigo-700/50';
    }

    document.querySelectorAll('.nav-link').forEach(el => {
        el.classList.remove('bg-emerald-700', 'bg-teal-700', 'bg-indigo-700', 'text-white', 'shadow-lg', 'shadow-xl', 'shadow-emerald-900/20', 'shadow-teal-900/20', 'shadow-indigo-900/20');
        el.classList.add(inactiveText, inactiveHover);
    });
    const active = document.querySelector(`.nav-link[data-page="${page}"]`);
    if (active) {
        active.classList.add(...activeClass);
        active.classList.remove(inactiveText, inactiveHover);
    }
}

// ==========================================
// Authentication / PIN Gate for Admin Pages
// ==========================================
// DINONAKTIFKAN: Digantikan oleh auth.js (sistem login terpusat dengan role kasir/admin)
// PIN gate lama tidak lagi digunakan. Semua auth ditangani oleh auth.js.
// ==========================================

// ==========================================
// Session Timeout — Auto Logout (semua role)
// ==========================================
(function () {
    const TIMEOUT_MS = 30 * 60 * 1000; // 30 menit tidak aktif → logout
    const WARNING_MS = 25 * 60 * 1000;
    const isPublic = window.location.pathname.includes('menu.html') ||
        window.location.pathname.includes('menu-hub.html') ||
        window.location.pathname.includes('qrcode.html') ||
        window.location.pathname.includes('login.html');
    if (isPublic) return;

    let timeoutTimer, warningTimer, warningBanner;

    function isLoggedIn() {
        return !!sessionStorage.getItem('user_role');
    }

    function resetTimers() {
        if (!isLoggedIn()) return;
        clearTimeout(timeoutTimer);
        clearTimeout(warningTimer);
        if (warningBanner && warningBanner.parentElement) { warningBanner.remove(); warningBanner = null; }

        warningTimer = setTimeout(() => {
            if (!isLoggedIn()) return;
            warningBanner = document.createElement('div');
            warningBanner.id = 'session-warning';
            warningBanner.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#f59e0b;color:#1c1917;padding:10px 16px;text-align:center;font-size:0.8rem;font-weight:700;z-index:99997;display:flex;align-items:center;justify-content:center;gap:10px;';
            warningBanner.innerHTML = '⏰ Sesi akan berakhir dalam 5 menit karena tidak ada aktivitas. <button onclick="document.getElementById(\'session-warning\').remove()" style="background:#1c1917;color:#f59e0b;border:none;padding:3px 10px;border-radius:6px;font-weight:700;cursor:pointer;font-size:0.75rem;">Tetap Aktif</button>';
            warningBanner.querySelector('button').addEventListener('click', resetTimers);
            document.body.appendChild(warningBanner);
        }, WARNING_MS);

        timeoutTimer = setTimeout(() => {
            if (!isLoggedIn()) return;
            sessionStorage.removeItem('user_role');
            sessionStorage.removeItem('admin_authenticated');
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:999998;display:flex;align-items:center;justify-content:center;';
            overlay.innerHTML = '<div style="background:white;border-radius:20px;padding:2rem;text-align:center;max-width:320px;"><div style="font-size:2.5rem;margin-bottom:1rem;">🔒</div><h3 style="font-weight:900;margin-bottom:.5rem;">Sesi Berakhir</h3><p style="color:#64748b;font-size:.85rem;margin-bottom:1.5rem;">Kamu otomatis logout karena tidak aktif selama 30 menit.</p><button onclick="window.location.replace(\'login.html\')" style="background:#065f46;color:white;border:none;padding:.75rem 2rem;border-radius:12px;font-weight:700;cursor:pointer;width:100%;">Login Kembali</button></div>';
            document.body.appendChild(overlay);
        }, TIMEOUT_MS);
    }

    ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'].forEach(ev => {
        document.addEventListener(ev, resetTimers, { passive: true });
    });

    document.addEventListener('DOMContentLoaded', () => setTimeout(resetTimers, 2000));
})();


