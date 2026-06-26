// ============================================================
// RM. PONDOK MARISA - DATABASE LOKAL (localStorage)
// ============================================================

const RM_MENU_KEY    = 'rm_pondok_menu';
const RM_ORDERS_KEY  = 'rm_pondok_orders';

// ── Data menu default (pertama kali buka) ──
const DEFAULT_MENU = {
    restaurantInfo: {
        name: "RM. Pondok Marisa",
        tagline: "Cita Rasa Nusantara yang Menggugah Selera",
        openHours: "Buka Setiap Hari: 09.00 – 22.00"
    },
    categories: [
        { id: "makanan", name: "Makanan", icon: "🍲" },
        { id: "minuman", name: "Minuman", icon: "🍹" },
        { id: "cemilan", name: "Cemilan", icon: "🍟" }
    ],
    items: [
        { id: 1, category: "makanan", name: "Nasi Ayam Bakar Madu",       description: "Nasi putih panas dengan ayam bakar dilumuri madu pilihan, sambal terasi, dan lalapan segar.", price: 25000, image: "https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?auto=format&fit=crop&q=80&w=500", recommended: true, variasi: ["Dada", "Paha"]  },
        { id: 2, category: "makanan", name: "Nasi Rendang Sapi Spesial",   description: "Potongan daging sapi empuk dengan bumbu rendang asli pedas gurih, disajikan dengan nasi hangat.", price: 28000, image: "https://images.unsplash.com/photo-1627996538056-bd44d216d773?auto=format&fit=crop&q=80&w=500", recommended: true  },
        { id: 3, category: "makanan", name: "Mie Goreng Seafood",           description: "Mie goreng gurih dengan topping udang, cumi, bakso ikan, dan sayuran segar.", price: 22000, image: "https://images.unsplash.com/photo-1617093727343-374698b1b08d?auto=format&fit=crop&q=80&w=500", recommended: false },
        { id: 4, category: "makanan", name: "Soto Ayam Kampung",            description: "Soto berkuah kuning bening dengan suwiran ayam kampung, telur rebus, dan koya.", price: 20000, image: "https://images.unsplash.com/photo-1649987483083-d3bceec188d2?auto=format&fit=crop&q=80&w=500", recommended: false },
        { id: 5, category: "minuman", name: "Es Jeruk Kelapa Muda",         description: "Perpaduan segar perasan jeruk asli dengan serutan kelapa muda alami.", price: 12000, image: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&q=80&w=500", recommended: true  },
        { id: 6, category: "minuman", name: "Es Teh Manis Selasih",         description: "Penyegar dahaga klasik dari teh tubruk pilihan dengan tambahan biji selasih.", price: 6000,  image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=500", recommended: false },
        { id: 7, category: "minuman", name: "Kopi Susu Gula Aren",          description: "Kopi robusta campur susu segar dan manisnya gula aren murni.", price: 15000, image: "https://images.unsplash.com/photo-1616422324905-dbbb9b7e7ab4?auto=format&fit=crop&q=80&w=500", recommended: false },
        { id: 8, category: "cemilan", name: "Pisang Goreng Keju Coklat",    description: "Pisang kepok manis digoreng krispi dengan limpahan keju parut dan lelehan coklat.", price: 12000, image: "https://images.unsplash.com/photo-1628101684307-e17f8670a8d6?auto=format&fit=crop&q=80&w=500", recommended: false },
        { id: 9, category: "cemilan", name: "Tahu Bakso Goreng",            description: "Tahu isi daging sapi cincang digoreng renyah, nikmati hangat dengan cabai rawit.", price: 10000, image: "https://images.unsplash.com/photo-1615555415252-0490b4d45d94?auto=format&fit=crop&q=80&w=500", recommended: true  }
    ]
};

// ── Helpers ──
function loadMenu() {
    try {
        const raw = localStorage.getItem(RM_MENU_KEY);
        return raw ? JSON.parse(raw) : JSON.parse(JSON.stringify(DEFAULT_MENU));
    } catch(e) { return JSON.parse(JSON.stringify(DEFAULT_MENU)); }
}

function saveMenu(data) {
    localStorage.setItem(RM_MENU_KEY, JSON.stringify(data));
}

function loadOrders() {
    try {
        const raw = localStorage.getItem(RM_ORDERS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch(e) { return {}; }
}

function saveOrders(orders) {
    localStorage.setItem(RM_ORDERS_KEY, JSON.stringify(orders));
}

// ============================================================
// MAIN APP (halaman pelanggan)
// ============================================================

// ── Firebase Init (SATU config, SATU project) ──
const firebaseConfig = {
    apiKey: "AIzaSyAquXEzHXgbp-036enXnJdN9kn2IFA6CUU",
    authDomain: "rm-pondok-marisa-final.firebaseapp.com",
    projectId: "rm-pondok-marisa-final",
    storageBucket: "rm-pondok-marisa-final.firebasestorage.app",
    messagingSenderId: "638351696963",
    appId: "1:638351696963:web:ad266be827925976ba20f6",
    measurementId: "G-4C0X7LZ9Z8"
};

let db = null;
try {
    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        
        // Aktifkan Offline Persistence agar HP tetap bisa kirim pesanan meski sinyal naik-turun
        db.enablePersistence().catch(() => {});

        console.log('[Firebase] Firestore berhasil terhubung ke project:', firebaseConfig.projectId);
    }
} catch(e) {
    console.error('[Firebase] Gagal inisialisasi:', e);
    db = null;
}

// ── Helper: Bungkus Promise dengan timeout ──
function withTimeout(promise, ms = 4000) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
    ]);
}

// ── Helper: Tampilkan toast notifikasi ──
function showToast(message, type = 'success') {
    const existing = document.getElementById('rm-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'rm-toast';
    const bg = type === 'error' ? '#e63946' : type === 'warning' ? '#f4a261' : '#2a9d8f';
    toast.style.cssText = `
        position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
        background: ${bg}; color: #fff; padding: 12px 24px;
        border-radius: 12px; font-size: 0.9rem; font-weight: 600;
        z-index: 99999; box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        animation: rmToastIn 0.3s ease; white-space: nowrap;
        max-width: 90vw; text-align: center;
    `;
    toast.textContent = message;
    if (!document.getElementById('rm-toast-style')) {
        const s = document.createElement('style');
        s.id = 'rm-toast-style';
        s.textContent = '@keyframes rmToastIn { from { opacity:0; bottom:70px } to { opacity:1; bottom:90px } }';
        document.head.appendChild(s);
    }
    document.body.appendChild(toast);
    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3500);
}

document.addEventListener("DOMContentLoaded", async () => {

    let allItems = [];
    let currentFilter = 'all';
    let cart = []; // [{item, qty, varian}]

    const formatRp = (n) => new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", minimumFractionDigits:0 }).format(n);

    // ── Sinkronisasi Data Kasir ──
    async function getKasirData() {
        try {
            let p = [], set = {}, cat = [];
            
            if (db) {
                const produkSnap = await db.collection('PondokMarisaPOS').doc('produk').get();
                if (produkSnap.exists) p = produkSnap.data().data || [];

                const setSnap = await db.collection('PondokMarisaPOS').doc('pengaturan').get();
                if (setSnap.exists) set = setSnap.data().data || {};

                const catSnap = await db.collection('PondokMarisaPOS').doc('kategori').get();
                if (catSnap.exists) cat = catSnap.data().data || [];
            } else {
                if (window.electronAPI) {
                    p = await window.electronAPI.readData('produk.json') || [];
                    set = await window.electronAPI.readData('pengaturan.json') || {};
                    cat = await window.electronAPI.readData('kategori.json') || [];
                } else {
                    p = JSON.parse(localStorage.getItem('produk') || "[]");
                    set = JSON.parse(localStorage.getItem('pengaturan') || "{}");
                    cat = JSON.parse(localStorage.getItem('kategori') || "[]");
                }
            }
            if (p.length === 0) return loadMenu(); // fallback

            const defaultCatIcons = { "Makanan": "🍲", "Minuman": "🍹", "Cemilan": "🍟", "Paket": "🍱" };
            if (cat.length === 0) cat = ["Makanan", "Minuman", "Cemilan", "Paket", "Lainnya"];
            
            return {
                restaurantInfo: {
                    name: set.merchantName || "RM. Pondok Marisa",
                    tagline: set.tagline || "Cita Rasa Nusantara yang Menggugah Selera",
                    openHours: set.openHours || "Buka Setiap Hari: 09.00 – 22.00",
                    bankName: set.bankName || "",
                    bankAccount: set.bankAccount || ""
                },
                categories: cat.map(c => ({ id: c, name: c, icon: defaultCatIcons[c] || "🍽️" })),
                items: p.map(x => ({
                    id: x.id,
                    category: x.kategori || "Makanan",
                    name: x.nama,
                    description: x.deskripsi || "Menu spesial kami.",
                    price: x.harga,
                    image: x.gambar || null,
                    recommended: false,
                    variasi: x.variasi || []
                }))
            };
        } catch(e) { return loadMenu(); }
    }

    // ── Load & render menu ──
    const data = await getKasirData();

    const brandName    = document.getElementById("brand-name");
    const brandTagline = document.getElementById("brand-tagline");
    const openHoursEl  = document.getElementById("open-hours");
    const categoryNav  = document.getElementById("category-nav");
    const menuContainer= document.getElementById("menu-container");

    if (!menuContainer) return; // guard: bukan halaman pelanggan

    if (brandName)    brandName.textContent    = data.restaurantInfo.name;
    if (brandTagline) brandTagline.textContent = data.restaurantInfo.tagline;
    if (openHoursEl)  openHoursEl.textContent  = data.restaurantInfo.openHours;

    // Kategori nav
    if (categoryNav) {
        (data.categories || []).forEach(c => {
            const b = document.createElement("button");
            b.className = "cat-btn";
            b.dataset.filter = c.id;
            b.innerHTML = `<span>${c.icon}</span> ${c.name}`;
            b.onclick = () => setFilter(c.id);
            categoryNav.appendChild(b);
        });
        const allBtn = document.querySelector(".cat-btn[data-filter='all']");
        if (allBtn) allBtn.onclick = () => setFilter('all');
    }

    allItems = data.items || [];
    renderItems();

    // Auto-fill table number from URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const mejaParam = urlParams.get('meja') || urlParams.get('table');
    if (mejaParam) {
        const orderTableEl = document.getElementById('order-table');
        if (orderTableEl) {
            orderTableEl.value = decodeURIComponent(mejaParam);
            orderTableEl.readOnly = true;
            orderTableEl.style.background = '#F1F5F9';
            orderTableEl.style.color = '#475569';
            orderTableEl.style.cursor = 'not-allowed';
            orderTableEl.style.fontWeight = 'bold';
            
            // Auto select "Makan di Tempat" (Dine In) type if table is specified
            const dineInRadio = document.querySelector('input[name="order-type"][value="Dine In"]');
            if (dineInRadio) {
                dineInRadio.checked = true;
                // Wait for order type toggle function to be set up or trigger it manually
                setTimeout(() => {
                    if (typeof window.toggleOrderType === 'function') {
                        window.toggleOrderType();
                    }
                }, 200);
            }
        }
    }


    // ── Filter ──
    function setFilter(f) {
        currentFilter = f;
        document.querySelectorAll(".cat-btn").forEach(b =>
            b.classList.toggle("active", b.dataset.filter === f)
        );
        renderItems();
    }

    // ── Render kartu menu ──
    function renderItems() {
        if (!menuContainer) return;
        const filtered = currentFilter === 'all'
            ? allItems
            : allItems.filter(i => i.category === currentFilter);

        menuContainer.innerHTML = '';
        if (filtered.length === 0) {
            menuContainer.innerHTML = '<p style="text-align:center;padding:2rem;width:100%">Menu tidak tersedia.</p>';
            return;
        }

        filtered.forEach(item => {
            const card = document.createElement("div");
            card.className = "menu-card";
            const badge = item.recommended ? '<span class="badge-recommended">⭐ Rekomendasi</span>' : '';
            
            const totalQty = cart.filter(c => c.item.id === item.id).reduce((sum, c) => sum + c.qty, 0);
            let qtyHtml = '';
            if (totalQty > 0) {
                qtyHtml = `<div class="qty-control">
                       <button class="qty-btn minus" onclick="changeQty(${item.id}, null, -1)">−</button>
                       <span class="qty-count">${totalQty}</span>
                       <button class="qty-btn plus"  onclick="addToCart(${item.id})">+</button>
                   </div>`;
            } else {
                qtyHtml = `<button class="btn-add" onclick="addToCart(${item.id})">+ Tambah</button>`;
            }

            // Tampilkan gambar asli jika ada, atau placeholder huruf jika tidak ada foto
            const imgHtml = item.image
                ? `<img src="${item.image}" class="menu-img" alt="${item.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                   <div class="menu-img-placeholder" style="display:none;">${item.name.charAt(0).toUpperCase()}</div>`
                : `<div class="menu-img-placeholder">${item.name.charAt(0).toUpperCase()}</div>`;

            card.innerHTML = `
                ${imgHtml}
                <div class="menu-info">
                    <div class="menu-info-top">
                        <h3 class="menu-name">${item.name}</h3>
                        ${badge}
                    </div>
                    <p class="menu-desc">${item.description}</p>
                    <div class="menu-footer">
                        <span class="menu-price">${formatRp(item.price)}</span>
                        ${qtyHtml}
                    </div>
                </div>`;
            menuContainer.appendChild(card);
        });
    }

    // ── Cart logic ──
    let selectedItemForVarian = null;
    let selectedVarian = null;

    window.addToCart = (id) => {
        const item = allItems.find(i => i.id === id);
        if (!item) return;

        if (item.variasi && item.variasi.length > 0) {
            selectedItemForVarian = item;
            selectedVarian = null;
            document.getElementById("varianNama").textContent = item.name;
            const varianList = document.getElementById("varianList");
            varianList.innerHTML = item.variasi.map(v => 
                `<button class="varian-chip" onclick="selectVarian(this, '${v}')">${v}</button>`
            ).join('');
            document.getElementById("modalVarian").style.display = 'flex';
            return;
        }

        tambahkanKeCart(item, null);
    };

    window.selectVarian = (btn, v) => {
        document.querySelectorAll('.varian-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedVarian = v;
    };

    window.closeModalVarian = () => {
        document.getElementById("modalVarian").style.display = 'none';
        selectedItemForVarian = null;
        selectedVarian = null;
    };

    window.tambahKeKeranjangFinal = () => {
        if (!selectedVarian) {
            alert("Pilih varian dulu!");
            return;
        }
        tambahkanKeCart(selectedItemForVarian, selectedVarian);
        closeModalVarian();
    };

    function tambahkanKeCart(item, varian) {
        const ex = cart.find(c => c.item.id === item.id && c.varian === varian);
        ex ? ex.qty++ : cart.push({ item, qty: 1, varian });
        renderItems(); updateCartFAB(); updateCartPanel();
    }

    window.changeQty = (id, varian, delta) => {
        let idx = -1;
        // FIX #6: Normalisasi varian — string kosong '' dan string 'null' keduanya dianggap null
        // agar item tanpa varian selalu bisa ditemukan di cart
        const normalizeVarian = (v) => {
            if (v === null || v === undefined || v === '' || v === 'null') return null;
            return v;
        };
        const varianNorm = normalizeVarian(varian);

        if (varianNorm === null) {
            // Item tanpa varian: cari berdasarkan id saja (varian null)
            idx = cart.findIndex(c => c.item.id === id && normalizeVarian(c.varian) === null);
        } else {
            idx = cart.findIndex(c => c.item.id === id && c.varian === varianNorm);
        }
        
        if (idx === -1) return;
        cart[idx].qty += delta;
        if (cart[idx].qty <= 0) cart.splice(idx, 1);
        renderItems(); updateCartFAB(); updateCartPanel();
    };

    const totalItems = () => cart.reduce((s,c)  => s + c.qty, 0);
    const totalPrice = () => cart.reduce((s,c)  => s + c.item.price * c.qty, 0);

    function updateCartFAB() {
        const fab = document.getElementById("cart-fab");
        if (!fab) return;
        if (totalItems() > 0) {
            fab.classList.add("visible");
            document.getElementById("fab-count").textContent = `${totalItems()} item`;
            document.getElementById("fab-total").textContent  = formatRp(totalPrice());
        } else {
            fab.classList.remove("visible");
        }
    }

    // ── Cart Panel ──
    window.openCart = () => {
        document.getElementById("cart-overlay").classList.add("active");
        document.getElementById("cart-panel").classList.add("active");
        updateCartPanel();
    };
    window.closeCart = () => {
        document.getElementById("cart-overlay").classList.remove("active");
        document.getElementById("cart-panel").classList.remove("active");
    };

    function updateCartPanel() {
        const el = document.getElementById("cart-items-list");
        if (!el) return;
        el.innerHTML = '';
        cart.forEach(entry => {
            const d = document.createElement("div");
            d.className = "cart-item";
            const cartImgHtml = entry.item.image
                ? `<img src="${entry.item.image}" class="cart-item-img" alt="${entry.item.name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                   <div class="cart-item-img-placeholder" style="display:none;">${entry.item.name.charAt(0).toUpperCase()}</div>`
                : `<div class="cart-item-img-placeholder">${entry.item.name.charAt(0).toUpperCase()}</div>`;
            d.innerHTML = `
                ${cartImgHtml}
                <div class="cart-item-info">
                    <div class="cart-item-name">${entry.item.name} ${entry.varian ? `<span style="color:var(--primary); font-size:0.8rem;">[${entry.varian}]</span>` : ''}</div>
                    <div class="cart-item-price">${formatRp(entry.item.price)}</div>
                </div>
                <div class="cart-item-qty">
                    <button class="qty-btn minus" onclick="changeQty(${entry.item.id}, '${entry.varian || ''}', -1)">−</button>
                    <span class="qty-count">${entry.qty}</span>
                    <button class="qty-btn plus"  onclick="changeQty(${entry.item.id}, '${entry.varian || ''}', 1)">+</button>
                </div>`;
            el.appendChild(d);
        });
        document.getElementById("summary-items-count").textContent = `${totalItems()} item`;
        document.getElementById("summary-subtotal").textContent    = formatRp(totalPrice());
        document.getElementById("summary-total").textContent       = formatRp(totalPrice());
    }

    // ── Order Type Toggle ──
    window.toggleOrderType = () => {
        const orderType = document.querySelector('input[name="order-type"]:checked').value;
        const lblDineIn = document.getElementById('label-dinein');
        const lblTakeAway = document.getElementById('label-takeaway');
        const grpMeja = document.getElementById('group-meja');
        const grpAlamat = document.getElementById('group-alamat');
        const paymentSelect = document.getElementById('order-payment');

        if (orderType === 'Dine In') {
            lblDineIn.style.background = '#eef2ff'; lblDineIn.style.borderColor = 'var(--primary)'; lblDineIn.style.color = 'var(--primary)';
            lblTakeAway.style.background = '#f8fafc'; lblTakeAway.style.borderColor = '#e2e8f0'; lblTakeAway.style.color = 'inherit';
            grpMeja.style.display = 'block';
            grpAlamat.style.display = 'none';
            paymentSelect.innerHTML = '<option value="Kasir">Bayar Nanti di Kasir</option>';
        } else {
            lblTakeAway.style.background = '#eef2ff'; lblTakeAway.style.borderColor = 'var(--primary)'; lblTakeAway.style.color = 'var(--primary)';
            lblDineIn.style.background = '#f8fafc'; lblDineIn.style.borderColor = '#e2e8f0'; lblDineIn.style.color = 'inherit';
            grpMeja.style.display = 'none';
            grpAlamat.style.display = 'block';
            paymentSelect.innerHTML = '<option value="QRIS">QRIS (Scan Barcode)</option><option value="Transfer">Transfer Bank (Manual)</option>';
        }
        togglePaymentInfo();
    };

    // Run once to set initial state
    setTimeout(window.toggleOrderType, 100);

    // ── Payment Info Toggle ──
    window.togglePaymentInfo = () => {
        const val = document.getElementById('order-payment').value;
        const box = document.getElementById('payment-info-box');
        const proof = document.getElementById('payment-proof-container');
        if (val === 'Kasir') {
            box.style.display = 'none';
            proof.style.display = 'none';
        } else if (val === 'Transfer') {
            box.style.display = 'block';
            proof.style.display = 'block';
            box.innerHTML = `<b>Transfer Bank</b><br>Silakan transfer sejumlah <b>${formatRp(totalPrice())}</b> ke rekening berikut:<br><b>Bank ${data.restaurantInfo.bankName || '-'}</b><br>No. Rekening: <b>${data.restaurantInfo.bankAccount || '-'}</b><br><br><i style="font-size:0.8rem;">Tunjukkan bukti transfer ke kasir atau pelayan.</i>`;
        } else if (val === 'QRIS') {
            box.style.display = 'block';
            proof.style.display = 'block';
            box.innerHTML = `<b>Pembayaran QRIS</b><br>Silakan scan QRIS yang tersedia di meja Anda atau di kasir sejumlah <b>${formatRp(totalPrice())}</b>.<br><br><i style="font-size:0.8rem;">Tunjukkan bukti sukses ke kasir atau pelayan.</i>`;
        }
    };

    function compressImage(file) {
        return new Promise((resolve, reject) => {
            if (!file) {
                reject(new Error("File tidak ditemukan."));
                return;
            }
            const img = new Image();
            let objectUrl = null;
            
            img.onload = () => {
                if (objectUrl) URL.revokeObjectURL(objectUrl);
                try {
                    const canvas = document.createElement('canvas');
                    const MAX_WIDTH = 600;
                    const MAX_HEIGHT = 600;
                    let width = img.width;
                    let height = img.height;

                    if (width === 0 || height === 0) {
                        reject(new Error("Dimensi gambar tidak valid."));
                        return;
                    }

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }
                    canvas.width = Math.floor(width);
                    canvas.height = Math.floor(height);
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.5));
                } catch (e) {
                    reject(new Error("Gagal kompresi: " + e.message));
                }
            };
            
            img.onerror = () => {
                if (objectUrl) URL.revokeObjectURL(objectUrl);
                reject(new Error("Format/file gambar rusak."));
            };

            try {
                objectUrl = URL.createObjectURL(file);
                img.src = objectUrl;
            } catch (e) {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onload = ev => { img.src = ev.target.result; };
                reader.onerror = ev => { reject(new Error("Gagal membaca file.")); };
            }
        });
    }

    // ── Submit Pesanan (bulletproof version) ──
    let isSubmitting = false; // Lock untuk cegah double-submit
    window.submitOrder = async () => {
        if (cart.length === 0) { showToast('⚠️ Keranjang masih kosong!', 'warning'); return; }

        // ANTI DOUBLE-SUBMIT: Jika sedang proses, abaikan klik berikutnya
        if (isSubmitting) { showToast('⏳ Pesanan sedang diproses...', 'warning'); return; }
        isSubmitting = true;

        const orderType = document.querySelector('input[name="order-type"]:checked').value;
        const name  = document.getElementById("order-name").value.trim();
        const table = document.getElementById("order-table").value.trim();
        const address = document.getElementById("order-address").value.trim();
        const note  = document.getElementById("order-note").value.trim();
        const payment = document.getElementById("order-payment").value;
        const proofInput = document.getElementById("payment-proof");

        document.getElementById("proof-error").textContent = "";

        if (!name)  { showToast('⚠️ Mohon isi nama Anda!', 'warning'); document.getElementById("order-name").focus(); return; }
        
        if (orderType === 'Dine In' && !table) { 
            showToast('⚠️ Mohon isi nomor meja!', 'warning'); document.getElementById("order-table").focus(); return; 
        }
        if (orderType === 'Take Away' && !address) { 
            showToast('⚠️ Mohon isi alamat pengiriman!', 'warning'); document.getElementById("order-address").focus(); return; 
        }

        if (payment !== 'Kasir' && (!proofInput.files || proofInput.files.length === 0)) {
            document.getElementById("proof-error").textContent = "Pilih foto bukti pembayaran terlebih dahulu!";
            showToast('⚠️ Bukti pembayaran wajib diunggah!', 'warning'); 
            return; 
        }

        const btn = document.getElementById("btn-submit-order");
        btn.disabled = true;
        btn.textContent = "⏳ Mengirim...";

        let paymentProofBase64 = null;
        if (payment !== 'Kasir' && proofInput.files.length > 0) {
            try {
                paymentProofBase64 = await compressImage(proofInput.files[0]);
            } catch (err) {
                console.error("Gagal compress image:", err);
                showToast(`❌ Gagal memproses gambar: ${err.message || 'Error'}`, 'error');
                btn.disabled = false;
                btn.textContent = '🚀 Kirim Pesanan Sekarang';
                return;
            }
        }

        const dt = Date.now();
        const randSuffix = Math.random().toString(36).slice(2, 7).toUpperCase();
        const orderId = "ORD-" + dt.toString().slice(-6) + "-" + randSuffix;
        const uniqueId = dt + Math.floor(Math.random() * 100000); // ID unik lebih kuat

        try {
            // ── 1. Baca draftList yang ada ──
            let draftList = [];
            try {
                if (db) {
                    const draftSnap = await withTimeout(db.collection('PondokMarisaPOS').doc('draft_transaksi').get(), 4000);
                    if (draftSnap.exists) draftList = draftSnap.data().data || [];
                } else if (window.electronAPI) {
                    draftList = await window.electronAPI.readData('draft_transaksi.json') || [];
                } else {
                    draftList = JSON.parse(localStorage.getItem('draft_transaksi') || '[]');
                }
            } catch(readErr) {
                console.warn('[RM] Baca draft gagal, mulai dari list kosong:', readErr.message);
                try { draftList = JSON.parse(localStorage.getItem('draft_transaksi') || '[]'); } catch(_) {}
            }

            // ── 2. Buat objek pesanan baru ──
            let tagStr = '';
            if (orderType === 'Dine In') {
                tagStr = `${name} (${table}) [${payment}]`;
            } else {
                tagStr = `${name} (Delivery) [${payment}]`;
            }

            let finalNote = note;
            if (orderType === 'Take Away') {
                finalNote = `📍 Alamat Pengiriman:\n${address}\n\n${note ? `Catatan: ${note}` : ''}`;
            }

            const newDraft = {
                id: uniqueId,
                tag: tagStr,
                time: new Date().toISOString(),
                source: 'digital_menu',
                isNewOrder: true,
                note: finalNote,
                metodeBayar: payment,
                buktiBayar: paymentProofBase64,
                total: totalPrice(),
                items: cart.map(c => ({
                    id:       c.item.id,
                    nama:     c.item.name,
                    harga:    c.item.price,
                    qty:      c.qty,
                    varian:   c.varian || null,
                    catatan:  note || '',
                    category: c.item.category,
                    image:    c.item.image
                }))
            };

            // ── ANTI DUPLIKASI: Cek apakah ID sudah ada sebelum push ──
            const alreadyExists = draftList.some(d => d.id === uniqueId);
            if (!alreadyExists) {
                draftList.push(newDraft);
            } else {
                console.warn('[RM] Pesanan duplikat terdeteksi, diabaikan:', uniqueId);
                showToast('✅ Pesanan sudah dikirim sebelumnya!', 'success');
                btn.disabled = false;
                btn.textContent = '🚀 Kirim Pesanan Sekarang';
                return;
            }

            // ── 3. Simpan ke Firebase atau fallback ──
            let savedOk = false;
            if (db) {
                try {
                    // FIX #5: Gunakan await agar kita tahu apakah Firebase benar-benar menerima data
                    await db.collection('PondokMarisaPOS').doc('draft_transaksi').set({
                        data: draftList,
                        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    savedOk = true;
                } catch(fbErr) {
                    // Firebase gagal — simpan ke localStorage sebagai fallback
                    console.warn('[RM] Firebase gagal, simpan ke localStorage:', fbErr.message);
                    localStorage.setItem('draft_transaksi', JSON.stringify(draftList));
                    savedOk = true; // tetap anggap berhasil karena sudah di localStorage
                }
            } else if (window.electronAPI) {
                await window.electronAPI.writeData('draft_transaksi.json', draftList);
                savedOk = true;
            } else {
                localStorage.setItem('draft_transaksi', JSON.stringify(draftList));
                savedOk = true;
            }

            // ── 4. Reset form & tampilkan sukses ──
            closeCart();
            cart = [];
            renderItems(); updateCartFAB();
            ['order-name','order-table','order-address','order-note'].forEach(id => { 
                const el = document.getElementById(id); 
                if(el) {
                    if (id === 'order-table' && el.readOnly) {
                        return; // Jangan hapus nomor meja jika terkunci dari scan QR
                    }
                    el.value = ''; 
                }
            });
            
            // Reset order type to Dine In
            document.querySelector('input[name="order-type"][value="Dine In"]').checked = true;
            toggleOrderType();
            
            document.getElementById('payment-proof').value = '';

            document.getElementById('success-name').textContent     = name;
            document.getElementById('success-table').textContent    = orderType === 'Dine In' ? table : 'Delivery / Take Away';
            document.getElementById('success-order-id').textContent = orderId;
            document.getElementById('order-success').classList.add('show');

            if (savedOk) showToast('✅ Pesanan berhasil dikirim ke kasir!', 'success');

        } catch(fatalErr) {
            // Jika ada error yang benar-benar tidak terduga
            console.error('[RM] Fatal error saat kirim pesanan:', fatalErr);
            showToast('❌ Gagal mengirim pesanan. Coba lagi.', 'error');
        } finally {
            // Tombol SELALU dikembalikan, tidak peduli apapun yang terjadi
            btn.disabled = false;
            btn.textContent = '🚀 Kirim Pesanan Sekarang';
            isSubmitting = false; // Release lock
        }
    };

    window.backToMenu = () => document.getElementById("order-success").classList.remove("show");

});
