/* =========================================================
   auth.js — shared UI helpers, session, guards, app shell
   (contains esc / toast / modal / form-error helpers too,
    since this project has no separate ui.js)
   ========================================================= */

/* ---------- HTML escape ---------- */
function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/* ---------- toast ---------- */
function toast(message, type = 'success') {
  let wrap = document.getElementById('toastWrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toastWrap';
    wrap.className = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = `<span class="toast-dot"></span><span>${esc(message)}</span>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 320); }, 3200);
}

/* ---------- modal ---------- */
function onEscClose(e) { if (e.key === 'Escape') closeModal(); }
function openModal(title, bodyHTML) {
  closeModal();
  const root = document.createElement('div');
  root.className = 'modal-root';
  root.id = 'modalRoot';
  root.innerHTML = `
    <div class="modal-backdrop" data-close></div>
    <div class="modal" role="dialog" aria-modal="true">
      <div class="modal-head">
        <h3>${esc(title)}</h3>
        <button class="icon-btn" type="button" data-close aria-label="Close">
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="modal-body">${bodyHTML}</div>
    </div>`;
  document.body.appendChild(root);
  root.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeModal(); });
  document.addEventListener('keydown', onEscClose);
  requestAnimationFrame(() => root.classList.add('show'));
  return root;
}
function closeModal() {
  const r = document.getElementById('modalRoot');
  if (r) { r.classList.remove('show'); setTimeout(() => r.remove(), 180); }
  document.removeEventListener('keydown', onEscClose);
}

/* ---------- inline form errors ---------- */
function setFieldError(scope, name, msg) {
  const el = scope.querySelector(`[data-err="${name}"]`);
  if (el) el.textContent = msg || '';
}
function clearErrors(scope) {
  scope.querySelectorAll('[data-err]').forEach(el => (el.textContent = ''));
}
function showErrors(scope, errors) {
  clearErrors(scope);
  Object.entries(errors).forEach(([k, v]) => setFieldError(scope, k, v));
}

/* ---------- theme ---------- */
function applyTheme() {
  const t = localStorage.getItem('hcm_theme') || 'light';
  document.documentElement.setAttribute('data-theme', t);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', cur);
  localStorage.setItem('hcm_theme', cur);
}

/* ---------- icons ---------- */
const ICONS = {
  bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7l1-8z" fill="currentColor" stroke="none"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2.5"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  wallet: '<path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h16v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7"/><circle cx="16.5" cy="12" r="1.3"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.64 8.6a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.55 1z"/>',
  logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  menu: '<path d="M3 6h18M3 12h18M3 18h18"/>',
  moon: '<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  send: '<path d="m22 2-7 20-4-9-9-4 20-7z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v5M14 11v5"/>',
  check: '<path d="m20 6-11 11-5-5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  print: '<path d="M6 9V3h12v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M6 17h12v4H6z"/>',
  speaker: '<path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1z"/><path d="M16 8a5 5 0 0 1 0 8"/>',
  chart: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'
};

function icon(name) {
  return `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ''}</svg>`;
}

/* ---------- session ---------- */
function basePath() { return location.pathname.includes('/pages/') ? '../' : ''; }

function currentUser() {
  const s = Store.getSession();
  if (!s) return null;
  return Store.getUsers().find(u => u.id === s.userId) || null;
}

function logout() {
  Store.clearSession();
  location.href = basePath() + 'index.html';
}

function guard(role) {
  const user = currentUser();
  if (!user) { location.replace(basePath() + 'index.html'); return null; }
  if (role && user.role !== role) {
    location.replace(basePath() + 'pages/' + (user.role === 'admin' ? 'admin.html' : 'employee.html'));
    return null;
  }
  return user;
}

/* ---------- change password ---------- */
function openChangePassword() {
  const user = currentUser();
  if (!user) return;

  openModal('Change password', `
    <form id="pwdForm" class="form-grid" novalidate>
      <div class="field span-2">
        <label for="pwdCur">Current password</label>
        <input id="pwdCur" type="password" autocomplete="current-password">
        <small class="err" data-err="cur"></small>
      </div>
      <div class="field span-2">
        <label for="pwdNew">New password</label>
        <input id="pwdNew" type="password" autocomplete="new-password">
        <small class="err" data-err="new"></small>
      </div>
      <div class="field span-2">
        <label for="pwdConf">Confirm new password</label>
        <input id="pwdConf" type="password" autocomplete="new-password">
        <small class="err" data-err="conf"></small>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-close>Cancel</button>
        <button type="submit" class="btn btn-primary">Update password</button>
      </div>
    </form>`);

  const form = document.getElementById('pwdForm');
  form.addEventListener('submit', e => {
    e.preventDefault();
    const cur = form.querySelector('#pwdCur').value;
    const nw = form.querySelector('#pwdNew').value;
    const cf = form.querySelector('#pwdConf').value;
    const errors = {};
    if (cur !== user.password) errors.cur = 'Current password is incorrect';
    if (!nw || nw.length < 6) errors.new = 'Use at least 6 characters';
    if (nw !== cf) errors.conf = 'Passwords do not match';
    if (Object.keys(errors).length) return showErrors(form, errors);

    const users = Store.getUsers();
    users.find(u => u.id === user.id).password = nw;
    Store.setUsers(users);
    closeModal();
    toast('Password updated');
  });
}

/* ---------- navigation shell ---------- */
const NAV = {
  admin: [
    { key: 'dashboard', label: 'Dashboard', icon: 'grid', href: 'admin.html' },
    { key: 'employees', label: 'Employees', icon: 'users', href: 'employees.html' },
    { key: 'leaves', label: 'Leave Requests', icon: 'calendar', href: 'leaves.html' },
    { key: 'payslip', label: 'Payslips', icon: 'wallet', href: 'payslip.html' },
    { key: 'settings', label: 'Settings', icon: 'gear', href: 'settings.html' }
  ],
  employee: [
    { key: 'dashboard', label: 'My Dashboard', icon: 'grid', href: 'employee.html' },
    { key: 'payslip', label: 'My Payslip', icon: 'wallet', href: 'payslip.html' }
  ]
};

function renderShell(activeKey, title, subtitle) {
  const user = currentUser();
  if (!user) return;

  const company = Store.getCompany() || {};
  const items = NAV[user.role] || [];
  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML = `
    <div class="brand">
      <div class="brand-logo">${icon('bolt')}</div>
      <div>
        <div class="brand-name">HCM Lite</div>
        <div class="brand-sub">${esc(company.name || 'HR Workspace')}</div>
      </div>
    </div>
    <nav class="nav">
      ${items.map(i => `
        <a class="nav-link ${i.key === activeKey ? 'active' : ''}" href="${i.href}">
          ${icon(i.icon)}<span>${i.label}</span>
        </a>`).join('')}
    </nav>
    <div class="sidebar-foot">
      <div class="user-mini">
        <div class="avatar">${initials}</div>
        <div>
          <div class="user-mini-name">${esc(user.name)}</div>
          <div class="user-mini-role">${user.role === 'admin' ? 'Administrator' : 'Employee'}</div>
        </div>
      </div>
      <button class="btn btn-ghost btn-block" id="pwdBtn" type="button">
        ${icon('gear')} Change password
      </button>
      <button class="btn btn-ghost btn-block" id="logoutBtn" type="button">
        ${icon('logout')} Logout
      </button>
    </div>`;

  const topbar = document.getElementById('topbar');
  topbar.innerHTML = `
    <button class="icon-btn only-mobile" id="menuBtn" type="button" aria-label="Menu">
      ${icon('menu')}
    </button>
    <div class="topbar-title">
      <h1>${esc(title || '')}</h1>
      <p>${esc(subtitle || '')}</p>
    </div>
    <div class="topbar-actions">
      <button class="icon-btn" id="themeBtn" type="button" aria-label="Toggle theme">
        ${icon('moon')}
      </button>
      <div class="avatar avatar-sm">${initials}</div>
    </div>`;

  document.getElementById('logoutBtn').onclick = logout;
  document.getElementById('pwdBtn').onclick = openChangePassword;
  document.getElementById('themeBtn').onclick = toggleTheme;

  const backdrop = document.getElementById('backdrop');
  document.getElementById('menuBtn').onclick = () => {
    sidebar.classList.add('open');
    backdrop.classList.add('show');
  };
  backdrop.onclick = () => {
    sidebar.classList.remove('open');
    backdrop.classList.remove('show');
  };
}

/* ---------- lookups ---------- */
function userById(id) { return Store.getUsers().find(x => x.id === id) || null; }
function userName(id) { const u = userById(id); return u ? u.name : 'Unknown'; }