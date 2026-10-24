/* =========================================================
   payslip.js — Payslip page logic
   Uses computePayslip() from js/attendance.js
   ========================================================= */

(function () {
  applyTheme();
  const user = guard();               // both roles allowed
  if (!user) return;

  renderShell('payslip',
    user.role === 'admin' ? 'Payslips' : 'My Payslip',
    'Monthly salary slip — print or save as PDF');

  const company = Store.getCompany() || {};
  const empSelect = document.getElementById('empSelect');
  const monthInput = document.getElementById('monthInput');
  const slipCard = document.getElementById('slipCard');

  monthInput.value = monthKey();

  if (user.role === 'admin') {
    const employees = Store.getUsers().filter(u => u.role === 'employee');
    empSelect.innerHTML = employees.length
      ? employees.map(e => `<option value="${e.id}">${esc(e.name)} — ${esc(e.department)}</option>`).join('')
      : `<option value="">No employees yet</option>`;
  } else {
    document.getElementById('empWrap').style.display = 'none';
  }

  empSelect.addEventListener('change', render);
  monthInput.addEventListener('change', render);
  document.getElementById('printBtn').onclick = () => window.print();

  render();

  /* ---------------- render ---------------- */
  function render() {
    const ym = monthInput.value || monthKey();
    const empId = user.role === 'admin' ? empSelect.value : user.id;
    const emp = userById(empId);

    if (!emp) {
      slipCard.innerHTML = `<div class="empty">
        No employee to show. Add an employee first from the Employees page.
      </div>`;
      return;
    }

    const p = computePayslip(emp, ym, company);
    const initials = emp.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

    slipCard.innerHTML = `
      <div class="slip-head">
        <div>
          <div class="slip-company">${esc(company.name || 'Company')}</div>
          <div class="muted small">Monthly salary slip · ${monthLabel(ym)}</div>
        </div>
        <div class="slip-brand">HCM Lite</div>
      </div>

      <div class="slip-grid">
        <div>
          <span>Employee</span>
          <div class="cell-user">
            <div class="avatar" style="width:34px;height:34px;border-radius:11px;font-size:.72rem">${initials}</div>
            <strong>${esc(emp.name)}</strong>
          </div>
        </div>
        <div><span>Email</span><strong>${esc(emp.email)}</strong></div>
        <div><span>Department</span><strong>${esc(emp.department)}</strong></div>
        <div><span>Month</span><strong>${monthLabel(ym)}</strong></div>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Item</th><th>Details</th><th class="right">Amount</th></tr></thead>
          <tbody>
            <tr>
              <td><strong>Monthly salary</strong></td>
              <td class="muted small">${p.wdTotal} working day(s) this month</td>
              <td class="right">${money(p.salary)}</td>
            </tr>
            <tr>
              <td>Per day rate</td>
              <td class="muted small">Salary ÷ working days</td>
              <td class="right">${money(p.perDay)}</td>
            </tr>
            <tr>
              <td>Present</td>
              <td class="muted small">${p.present} day(s), of which ${p.late} late</td>
              <td class="right">—</td>
            </tr>
            <tr>
              <td>Half days</td>
              <td class="muted small">0.5 × per day deduction each</td>
              <td class="right">${p.half}</td>
            </tr>
            <tr>
              <td>Absent</td>
              <td class="muted small">Working days with no record</td>
              <td class="right">${p.absent}</td>
            </tr>
            <tr>
              <td>Paid leave</td>
              <td class="muted small">Approved leave (not deducted)</td>
              <td class="right">${p.paidLeave}</td>
            </tr>
            <tr>
              <td><strong>Deduction</strong></td>
              <td class="muted small">Per day × (absent + 0.5 × half days)</td>
              <td class="right"><strong>${money(p.deduction)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="slip-net">
        <span>Net pay</span>
        <strong>${money(p.net)}</strong>
      </div>

      <p class="muted small" style="margin:0">
        Generated on ${fmtDate(todayStr())} · This is a system-generated slip and does not require a signature.
      </p>`;
  }
})();