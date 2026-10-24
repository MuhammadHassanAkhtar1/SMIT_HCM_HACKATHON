/* =========================================================
   storage.js — data layer + shared date/working-day utilities
   ========================================================= */

const KEYS = {
  company: 'hcm_company',
  users: 'hcm_users',
  attendance: 'hcm_attendance',
  leaves: 'hcm_leaves',
  session: 'hcm_session',
  announcements: 'hcm_announcements'
};

const DEPARTMENTS = [
  'Engineering', 'Design', 'Marketing', 'Sales',
  'Human Resources', 'Finance', 'Operations', 'Support'
];

const LEAVE_TYPES = ['Annual', 'Sick', 'Casual', 'Unpaid', 'Maternity'];

const DEFAULT_SETTINGS = {
  startTime: '09:00',
  graceMinutes: 15,
  leaveQuota: 20,
  workingDays: [1, 2, 3, 4, 5],
  halfDayHours: 5
};

/* ---------- low-level IO ---------- */
function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (err) {
    console.error('Could not read', key, err);
    return fallback;
  }
}
function writeJSON(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

const Store = {
  getCompany() {
    const c = readJSON(KEYS.company, null);
    return c ? { ...DEFAULT_SETTINGS, ...c } : null;
  },
  setCompany(c) { writeJSON(KEYS.company, c); },

  getUsers() { return readJSON(KEYS.users, []); },
  setUsers(u) { writeJSON(KEYS.users, u); },

  getAttendance() { return readJSON(KEYS.attendance, []); },
  setAttendance(a) { writeJSON(KEYS.attendance, a); },

  getLeaves() { return readJSON(KEYS.leaves, []); },
  setLeaves(l) { writeJSON(KEYS.leaves, l); },

  getSession() { return readJSON(KEYS.session, null); },
  setSession(s) { writeJSON(KEYS.session, s); },
  clearSession() { localStorage.removeItem(KEYS.session); },

  getAnnouncements() { return readJSON(KEYS.announcements, []); },
  setAnnouncements(a) { writeJSON(KEYS.announcements, a); },

  resetAll() { Object.values(KEYS).forEach(k => localStorage.removeItem(k)); }
};

/* ---------- id ---------- */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

/* ---------- date / time ---------- */
function pad2(n) { return String(n).padStart(2, '0'); }
function dateStr(d = new Date()) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; }
function todayStr() { return dateStr(new Date()); }
function nowTime() { const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; }
function parseDate(str) { const [y, m, d] = String(str).split('-').map(Number); return new Date(y, m - 1, d); }

function fmtDate(str) {
  if (!str) return '—';
  return parseDate(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtDateShort(str) {
  if (!str) return '—';
  return parseDate(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}
function fmtTime(t) {
  if (!t) return '—';
  const [h, m] = String(t).split(':').map(Number);
  const ap = h >= 12 ? 'PM' : 'AM';
  return `${(h % 12) || 12}:${pad2(m)} ${ap}`;
}
function toMinutes(t) {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + m;
}
function monthKey(d = new Date()) { return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`; }
function monthLabel(ym) {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}
function money(n) {
  return 'Rs ' + Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
}
function startOfWeek(d = new Date()) {
  const x = new Date(d);
  const day = x.getDay();
  x.setDate(x.getDate() + (day === 0 ? -6 : 1 - day));
  x.setHours(0, 0, 0, 0);
  return x;
}

/* ---------- working days ---------- */
function isWorkingDay(dateString, company) {
  const days = (company?.workingDays || DEFAULT_SETTINGS.workingDays).map(Number);
  return days.includes(parseDate(dateString).getDay());
}
function countWorkingDays(from, to, company) {
  if (!from || !to || from > to) return 0;
  let count = 0;
  const end = parseDate(to);
  for (let d = parseDate(from); d <= end; d.setDate(d.getDate() + 1)) {
    if (isWorkingDay(dateStr(d), company)) count++;
  }
  return count;
}
function workingDaysInMonth(year, month /* 0-based */, company) {
  const out = [];
  const total = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= total; d++) {
    const ds = `${year}-${pad2(month + 1)}-${pad2(d)}`;
    if (isWorkingDay(ds, company)) out.push(ds);
  }
  return out;
}