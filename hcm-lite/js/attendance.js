/* =========================================================
   attendance.js — attendance rules + payslip calculation
   ========================================================= */

function getRecord(empId, date) {
  return Store.getAttendance().find(r => r.empId === empId && r.date === date) || null;
}

function computeAttendance(inTime, outTime, company) {
  const c = company || Store.getCompany() || {};
  const startMin = toMinutes(c.startTime || '09:00');
  const grace = Number(c.graceMinutes ?? 15);
  const inMin = toMinutes(inTime);
  const late = inMin > startMin + grace;

  let hours = 0;
  if (outTime) hours = Math.max(0, (toMinutes(outTime) - inMin) / 60);
  hours = Math.round(hours * 100) / 100;

  let status = late ? 'late' : 'present';
  if (outTime && hours < Number(c.halfDayHours ?? 5)) status = 'half-day';

  return { late, hours, status };
}

function checkIn(empId) {
  const company = Store.getCompany() || {};
  const today = todayStr();

  if (getRecord(empId, today)) {
    return { ok: false, message: 'You have already checked in today.' };
  }

  const time = nowTime();
  const calc = computeAttendance(time, null, company);
  const list = Store.getAttendance();
  list.push({
    id: uid(), empId, date: today, in: time, out: null,
    hours: 0, late: calc.late, status: calc.status
  });
  Store.setAttendance(list);
  return { ok: true, record: list[list.length - 1] };
}

function checkOut(empId) {
  const company = Store.getCompany() || {};
  const today = todayStr();
  const list = Store.getAttendance();
  const rec = list.find(r => r.empId === empId && r.date === today);

  if (!rec) return { ok: false, message: 'You need to check in first.' };
  if (rec.out) return { ok: false, message: 'You have already checked out today.' };

  const time = nowTime();
  const calc = computeAttendance(rec.in, time, company);
  rec.out = time;
  rec.hours = calc.hours;
  rec.late = calc.late;
  rec.status = calc.status;

  Store.setAttendance(list);
  return { ok: true, record: rec };
}

function dayStatus(empId, date, company) {
  const c = company || Store.getCompany() || {};
  const rec = getRecord(empId, date);
  if (rec && rec.in) {
    return { key: rec.status, label: labelForStatus(rec.status), record: rec };
  }
  if (typeof onApprovedLeave === 'function' && onApprovedLeave(empId, date)) {
    return { key: 'leave', label: 'On leave', record: null };
  }
  if (!isWorkingDay(date, c)) return { key: 'off', label: 'Day off', record: null };
  if (date > todayStr()) return { key: 'off', label: '—', record: null };
  return { key: 'absent', label: 'Absent', record: null };
}

function labelForStatus(status) {
  return { present: 'Present', late: 'Late', 'half-day': 'Half day', absent: 'Absent' }[status] || status;
}

function recordsFor(empId) {
  return Store.getAttendance()
    .filter(r => r.empId === empId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

function recordsOn(date) {
  return Store.getAttendance().filter(r => r.date === date);
}

/* ---------------------------------------------------------
   Payslip calculation
   ---------------------------------------------------------
   per day       = salary / working days in month
   deduction     = per day × (absent + 0.5 × half days)
   net           = salary – deduction
   Paid leaves do NOT count as absent.
   --------------------------------------------------------- */
function computePayslip(emp, ym, comp) {
  const company = comp || Store.getCompany() || {};
  const [year, monthNum] = ym.split('-').map(Number);
  const month = monthNum - 1;

  const wdAll = workingDaysInMonth(year, month, company);
  const today = todayStr();
  const elapsed = wdAll.filter(d => d <= today);

  const att = Store.getAttendance()
    .filter(r => r.empId === emp.id && r.date.startsWith(ym + '-'));
  const approved = Store.getLeaves()
    .filter(l => l.empId === emp.id && l.status === 'approved');
  const onLeave = d => approved.some(l => d >= l.from && d <= l.to);

  let present = 0, late = 0, half = 0, absent = 0, paidLeave = 0;
  elapsed.forEach(d => {
    const rec = att.find(r => r.date === d);
    if (rec) {
      if (rec.status === 'half-day') half++;
      else { present++; if (rec.status === 'late') late++; }
    } else if (onLeave(d)) {
      paidLeave++;
    } else {
      absent++;
    }
  });

  const salary = Number(emp.salary || 0);
  const perDay = wdAll.length ? salary / wdAll.length : 0;
  const deduction = perDay * (absent + 0.5 * half);
  const net = Math.max(0, salary - deduction);

  return {
    wdTotal: wdAll.length, wdElapsed: elapsed.length,
    present, late, half, absent, paidLeave,
    salary, perDay, deduction, net
  };
}