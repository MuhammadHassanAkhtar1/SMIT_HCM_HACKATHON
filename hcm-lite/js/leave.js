/* =========================================================
   leave.js — leave requests, balance & business rules
   ========================================================= */

function onApprovedLeave(empId, date) {
  return Store.getLeaves().some(l =>
    l.empId === empId && l.status === 'approved' &&
    date >= l.from && date <= l.to);
}

function leaveBalance(empId) {
  const c = Store.getCompany() || {};
  const quota = Number(c.leaveQuota ?? 20);
  const used = Store.getLeaves()
    .filter(l => l.empId === empId && l.status === 'approved')
    .reduce((sum, l) => sum + Number(l.days || 0), 0);
  return { quota, used, left: Math.max(0, quota - used) };
}

function leavesFor(empId) {
  return Store.getLeaves()
    .filter(l => l.empId === empId)
    .sort((a, b) => (b.appliedAt || '').localeCompare(a.appliedAt || ''));
}

function applyLeave(data) {
  const c = Store.getCompany() || {};
  const { empId, type, from, to, reason } = data;
  const errors = {};

  if (!type) errors.type = 'Choose a leave type';
  if (!from) errors.from = 'Start date is required';
  if (!to) errors.to = 'End date is required';
  if (from && to && from > to) errors.to = 'End date cannot be before the start date';
  if (!reason || reason.trim().length < 4) errors.reason = 'Please write a short reason';

  let days = 0;
  if (!errors.from && !errors.to) {
    days = countWorkingDays(from, to, c);
    if (days === 0) errors.to = 'That range contains no working days';
  }

  if (!Object.keys(errors).length) {
    const overlap = Store.getLeaves().some(l =>
      l.empId === empId && l.status !== 'rejected' && !(to < l.from || from > l.to));
    if (overlap) errors.from = 'This overlaps an existing leave request';

    const bal = leaveBalance(empId);
    if (days > bal.left) errors.to = `Only ${bal.left} leave day(s) remaining this year`;
  }

  if (Object.keys(errors).length) return { ok: false, errors };

  const leaves = Store.getLeaves();
  leaves.push({
    id: uid(), empId, type, from, to, days,
    reason: reason.trim(),
    status: 'pending',
    comment: '',
    appliedAt: new Date().toISOString()
  });
  Store.setLeaves(leaves);
  return { ok: true, days };
}

function decideLeave(id, status, comment) {
  const leaves = Store.getLeaves();
  const leave = leaves.find(l => l.id === id);
  if (!leave) return { ok: false, message: 'Leave request not found.' };

  if (status === 'approved') {
    const bal = leaveBalance(leave.empId);
    if (leave.days > bal.left) {
      return { ok: false, message: `Approving exceeds the yearly quota (${bal.left} day(s) left).` };
    }
  }

  leave.status = status;
  leave.comment = (comment || '').trim();
  leave.decidedAt = new Date().toISOString();
  Store.setLeaves(leaves);
  return { ok: true };
}

function leavesOn(date) {
  return Store.getLeaves().filter(l =>
    l.status === 'approved' && date >= l.from && date <= l.to);
}

function pendingLeaves() {
  return Store.getLeaves()
    .filter(l => l.status === 'pending')
    .sort((a, b) => (a.from || '').localeCompare(b.from || ''));
}