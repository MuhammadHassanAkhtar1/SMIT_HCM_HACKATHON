/* =========================================================
   helper.js — smart helper chat (answers from real data)
   Employees only ever see their own data.
   ========================================================= */

function helperAnswer(question, user) {
  const q = String(question || '').toLowerCase().trim();
  const company = Store.getCompany() || {};
  const users = Store.getUsers();
  const employees = users.filter(u => u.role === 'employee');
  const attendance = Store.getAttendance();
  const leaves = Store.getLeaves();
  const today = todayStr();

  const has = (...words) => words.some(w => q.includes(w));
  const nameOf = id => (users.find(u => u.id === id) || {}).name || 'Unknown';

  if (!q) return 'Ask me something and I will look it up in the app data.';
  if (has('hello', 'hi ', 'hey', 'salam')) {
    return `Hello ${user.name.split(' ')[0]}! 👋 I can answer questions about employees, attendance, leaves and salary.`;
  }

  /* ================= ADMIN ================= */
  if (user.role === 'admin') {
    if (has('how many employee', 'employee count', 'headcount', 'total employee', 'number of employee', 'how many staff', 'how many people')) {
      return `There are currently ${employees.length} employee(s) on record.`;
    }
    if (has('late')) {
      const lateToday = attendance.filter(r => r.date === today && r.late);
      if (!lateToday.length) return 'Nobody has checked in late today. 🎉';
      return `${lateToday.length} person(s) were late today:\n` +
        lateToday.map(r => `• ${nameOf(r.empId)} — checked in at ${fmtTime(r.in)}`).join('\n');
    }
    if (has('leave') && has('today')) {
      const onLeave = leavesOn(today);
      if (!onLeave.length) return 'Nobody is on approved leave today.';
      return `${onLeave.length} person(s) on leave today:\n` +
        onLeave.map(l => `• ${nameOf(l.empId)} — ${l.type} until ${fmtDate(l.to)}`).join('\n');
    }
    if (has('pending')) {
      const p = pendingLeaves();
      if (!p.length) return 'There are no pending leave requests. ✅';
      return `${p.length} leave request(s) awaiting your decision:\n` +
        p.map(l => `• ${nameOf(l.empId)} — ${l.days} day(s) from ${fmtDate(l.from)}`).join('\n');
    }
    if (has('absent')) {
      const absent = employees.filter(e => dayStatus(e.id, today, company).key === 'absent');
      if (!absent.length) return 'Nobody is absent today. 👍';
      return `${absent.length} employee(s) absent today:\n` +
        absent.map(e => `• ${e.name}`).join('\n');
    }
    if (has('present', 'checked in')) {
      const recs = recordsOn(today);
      return `${recs.length} of ${employees.length} employee(s) have checked in today.`;
    }
    if (has('salary', 'payroll')) {
      const total = employees.reduce((s, e) => s + Number(e.salary || 0), 0);
      return `The monthly payroll for ${employees.length} employee(s) is ${money(total)}.`;
    }
    if (has('department')) {
      const map = {};
      employees.forEach(e => { map[e.department] = (map[e.department] || 0) + 1; });
      const rows = Object.entries(map).map(([d, n]) => `• ${d}: ${n}`);
      return rows.length ? `Employees by department:\n${rows.join('\n')}` : 'No employees yet.';
    }
    return 'I can answer: "How many employees do we have?", "Who is on leave today?", "Who was late today?" or "How many pending leaves?".';
  }

  /* ================= EMPLOYEE ================= */
  const me = user;

  if (has('late')) {
    const rec = getRecord(me.id, today);
    if (!rec) return "You haven't checked in today yet, so you're not marked late.";
    return rec.late
      ? `Yes — you checked in at ${fmtTime(rec.in)}, after ${fmtTime(company.startTime)} + ${company.graceMinutes} min grace.`
      : `No — you checked in at ${fmtTime(rec.in)}, right on time. ✅`;
  }
  if (has('leave') && has('left', 'balance', 'remain', 'how many')) {
    const b = leaveBalance(me.id);
    return `You have ${b.left} of ${b.quota} leave day(s) left this year (used: ${b.used}).`;
  }
  if (has('hours', 'work this week', 'worked this week')) {
    const start = dateStr(startOfWeek());
    const recs = attendance.filter(r => r.empId === me.id && r.date >= start && r.date <= today);
    const total = recs.reduce((s, r) => s + Number(r.hours || 0), 0);
    return `You have worked ${Math.round(total * 10) / 10} hour(s) this week across ${recs.length} day(s).`;
  }
  if (has('salary', 'payslip', 'net pay', 'paid')) {
    const ym = monthKey();
    const p = computePayslip(me, ym, company);
    return `Your net pay for ${monthLabel(ym)} is ${money(p.net)} (deductions: ${money(p.deduction)}).`;
  }
  if (has('attendance', 'present', 'check in', 'checkin')) {
    const recs = recordsFor(me.id).filter(r => r.date.startsWith(monthKey()));
    const present = recs.filter(r => r.status !== 'half-day').length;
    return `This month you have ${present} present day(s), ` +
      `${recs.filter(r => r.status === 'late').length} late and ` +
      `${recs.filter(r => r.status === 'half-day').length} half day(s).`;
  }
  if (has('leave') && has('status')) {
    const mine = leavesFor(me.id);
    if (!mine.length) return 'You have not applied for any leave yet.';
    return 'Your requests:\n' + mine.slice(0, 5).map(l =>
      `• ${l.type} ${fmtDateShort(l.from)} → ${fmtDateShort(l.to)} — ${l.status}`).join('\n');
  }
  return 'I can answer: "How many leaves do I have left?", "Was I late today?", "How many hours did I work this week?" or "What is my net salary this month?".';
}

/* ---------- chat widget ---------- */
function initHelper(user) {
  const box = document.getElementById('helperBox');
  if (!box) return;

  const suggestions = user.role === 'admin'
    ? ['How many employees do we have?', 'Who is on leave today?', 'Who was late today?', 'How many pending leaves?']
    : ['How many leaves do I have left?', 'Was I late today?', 'How many hours did I work this week?', 'What is my net salary this month?'];

  box.innerHTML = `
    <div class="chat-log" id="chatLog"></div>
    <form class="chat-form" id="chatForm" autocomplete="off">
      <input class="input" id="chatInput" placeholder="Ask about employees, leaves, attendance…">
      <button class="btn btn-primary" type="submit" aria-label="Send">${icon('send')}</button>
    </form>
    <div class="chat-suggest">
      ${suggestions.map(s => `<button class="chip" type="button" data-q="${esc(s)}">${esc(s)}</button>`).join('')}
    </div>`;

  const log = box.querySelector('#chatLog');
  const form = box.querySelector('#chatForm');
  const input = box.querySelector('#chatInput');

  function push(text, who) {
    const el = document.createElement('div');
    el.className = 'chat-msg ' + who;
    el.innerHTML = `<div class="bubble">${esc(text).replace(/\n/g, '<br>')}</div>`;
    log.appendChild(el);
    log.scrollTop = log.scrollHeight;
  }

  push(`Hi ${user.name.split(' ')[0]} 👋 Ask me anything about ` +
    `${user.role === 'admin' ? 'the company' : 'your'} data.`, 'bot');

  function ask(q) {
    if (!q.trim()) return;
    push(q, 'user');
    setTimeout(() => push(helperAnswer(q, user), 'bot'), 220);
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    const q = input.value;
    input.value = '';
    ask(q);
  });
  box.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => ask(chip.dataset.q));
  });
}