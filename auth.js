/**
 * auth.js — Role-based access control untuk RM. Pondok Marisa
 * 
 * Role:
 *   'admin'  → akses semua halaman ADMIN (index, produk, transaksi, laporan, pengaturan, menu-hub)
 *   'kasir'  → akses halaman KASIR saja (kasir.html, pesanan-masuk.html)
 * 
 * Disertakan di setiap halaman SEBELUM admin-app.js.
 */

(function () {
  'use strict';

  // Halaman publik (menu pelanggan, QR) — tidak perlu auth
  const PUBLIC_PAGES = ['menu.html', 'menu-hub.html', 'qrcode.html', 'menu-admin.html', 'login.html'];

  // Halaman khusus KASIR
  const KASIR_PAGES = ['kasir.html', 'pesanan-masuk.html'];

  // Halaman khusus ADMIN (semua selain kasir & public)
  const ADMIN_PAGES = ['index.html', 'produk.html', 'transaksi.html', 'laporan.html', 'pengaturan.html'];

  const path = window.location.pathname;
  const filename = path.split('/').pop() || 'index.html';

  // Skip public pages
  if (PUBLIC_PAGES.some(p => filename.includes(p))) return;

  const role = sessionStorage.getItem('user_role');

  // Belum login → ke login
  if (!role) {
    window.location.replace('login.html');
    return;
  }

  // Kasir mencoba akses halaman admin → redirect ke kasir
  if (role === 'kasir' && ADMIN_PAGES.some(p => filename.includes(p))) {
    window.location.replace('kasir.html');
    return;
  }

  // Admin mencoba akses halaman kasir → redirect ke admin dashboard
  // (admin boleh akses kasir.html, tapi sebaiknya tidak secara langsung dari sidebar admin)
  // → kita biarkan admin tetap bisa buka kasir kalau perlu

  // Inject logout button & role badge ke topbar saat DOM siap
  document.addEventListener('DOMContentLoaded', function () {
    // Inject role badge + logout ke topbar (tunggu topbar ada)
    setTimeout(injectRoleBadge, 100);
  });

  function injectRoleBadge() {
    const topbar = document.querySelector('header, .sticky.top-0.z-10, [class*="sticky"][class*="top-0"]');
    if (!topbar) return;

    const rightSection = topbar.querySelector('.flex.items-center.justify-between > :last-child, .flex.items-center.gap-3');
    const container = rightSection || topbar;

    // Buat badge + logout
    const badge = document.createElement('div');
    badge.id = 'auth-badge';
    badge.style.cssText = 'display:flex;align-items:center;gap:10px;margin-left:auto;flex-shrink:0;';

    const rolePill = document.createElement('span');
    rolePill.style.cssText = `
      display:inline-flex;align-items:center;gap:6px;
      padding:5px 12px;border-radius:9999px;
      font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:0.08em;
      background:${role === 'admin' ? '#d1fae5' : '#ccfbf1'};
      color:${role === 'admin' ? '#065f46' : '#0f766e'};
    `;
    rolePill.innerHTML = role === 'admin'
      ? `<svg style="width:12px;height:12px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> Admin`
      : `<svg style="width:12px;height:12px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 20h16a2 2 0 002-2V8a2 2 0 00-2-2h-5.586a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 0011.586 3H4a2 2 0 00-2 2v13a2 2 0 002 2z"/></svg> Kasir`;

    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.title = 'Logout';
    logoutBtn.style.cssText = 'padding:6px;border-radius:10px;border:none;background:transparent;cursor:pointer;color:#6b7280;display:flex;align-items:center;transition:background 0.15s;';
    logoutBtn.innerHTML = `<svg style="width:18px;height:18px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>`;
    logoutBtn.addEventListener('mouseenter', () => { logoutBtn.style.background = '#fee2e2'; logoutBtn.style.color = '#dc2626'; });
    logoutBtn.addEventListener('mouseleave', () => { logoutBtn.style.background = 'transparent'; logoutBtn.style.color = '#6b7280'; });
    logoutBtn.addEventListener('click', doLogout);

    badge.appendChild(rolePill);
    badge.appendChild(logoutBtn);

    // Cari posisi yang tepat di topbar
    const flexParent = topbar.querySelector('.flex.items-center.justify-between');
    if (flexParent) {
      flexParent.appendChild(badge);
    } else {
      topbar.appendChild(badge);
    }
  }

  function doLogout() {
    sessionStorage.removeItem('user_role');
    sessionStorage.removeItem('admin_authenticated');
    window.location.replace('login.html');
  }

  // Expose logout globally
  window.authLogout = doLogout;
  window.getCurrentRole = () => sessionStorage.getItem('user_role');

})();
