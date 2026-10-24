/* =========================================================
   employees.js — Employees page (admin only)
   Adds, edits, deletes and filters the team directory.
   ========================================================= */

(function () {
  applyTheme();
  const admin = guard('admin');
  if (!admin) return;

  renderShell('employees', 'Employees', 'Add, edit and manage your team');

  const state = { q: '', dept: 'all' };
  const rowsEl = document.getElementById('rows');
  const countEl = document.getElementById('countLabel');
  const searchEl = document.getElementById('searchInput');
  const deptEl = document.getElementById('deptFilter');

  deptEl.innerHTML = `<option value="all">All departments</option>` +
    DEPARTMENTS.map(d => `<option value="${esc(d)}">${esc(d)}</option>`).join('');

  searchEl.addEventListener('input', () => { state.q = searchEl.value; render(); });
  deptEl.addEventListener('change', () => { state.dept = deptEl.value; render(); });
  document.getElementById('addBtn').onclick = () => openForm(null);

  render();

  /* ---------------- list ---------------- */
  function render() {
    const all = Store.getUsers().filter(u => u.role === 'employee');
    const q = state.q.trim().toLowerCase();

    const list = all.filter(u =>
      (state.dept === 'all' || u.department === state.dept) &&
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    );

    countEl.textContent = `${list.length} of ${all.length} employee(s)`;

    if (!list.length) {
      rowsEl.innerHTML = `<tr><td colspan="5">
        <div class="empty">${all.length ? 'No employee matches your filters.' : 'No employees yet. Click “Add employee” to get started.'}</div>
      </td></tr>`;
      return;
    }

    rowsEl.innerHTML = list.map(u => `
      <tr>
        <td>
          <div class="cell-user">
            <div class="avatar" style="width:34px;height:34px;border-radius:11px;font-size:.72rem">
              ${esc(u.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase())}
            </div>
            <div>
              <strong>${esc(u.name)}</strong>
              <span>${esc(u.email)}</span>
            </div>
          </div>
        </td>
        <td><span class="badge off">${esc(u.department)}</span></td>
        <td>${money(u.salary)}</td>
        <td>${u.joined ? fmtDate(u.joined) : '—'}</td>
        <td class="right">
          <button class="btn btn-ghost btn-sm" data-edit="${u.id}">Edit</button>
          <button class="btn btn-danger btn-sm" data-del="${u.id}">Delete</button>
        </td>
      </tr>`).join('');

    rowsEl.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => openForm(b.dataset.edit));
    rowsEl.querySelectorAll('[data-del]').forEach(b => b.onclick = () => remove(b.dataset.del));
  }

  /* ---------------- add / edit ---------------- */
  function openForm(id) {
    const editing = id ? userById(id) : null;

    openModal(editing ? 'Edit employee' : 'Add employee', `
      <form id="empForm" class="form-grid" novalidate>
        <div class="field">
          <label for="empName">Full name</label>
          <input id="empName" value="${editing ? esc(editing.name) : ''}" placeholder="e.g. Ayesha Khan">
          <small class="err" data-err="name"></small>
        </div>
        <div class="field">
          <label for="empEmail">Email (login)</label>
          <input id="empEmail" type="email" value="${editing ? esc(editing.email) : ''}" placeholder="name@company.com">
          <small class="err" data-err="email"></small>
        </div>
        <div class="field">
          <label for="empDept">Department</label>
          <select id="empDept">
            ${DEPARTMENTS.map(d => `<option ${editing && editing.department === d ? 'selected' : ''}>${d}</option>`).join('')}
          </select>
          <small class="err" data-err="department"></small>
        </div>
        <div class="field">
          <label for="empSalary">Monthly salary (Rs)</label>
          <input id="empSalary" type="number" min="1" step="1"
                 value="${editing ? editing.salary : ''}" placeholder="e.g. 75000">
          <small class="err" data-err="salary"></small>
        </div>
        <div class="field">
          <label for="empPwd">${editing ? 'New password (optional)' : 'Password'}</label>
          <input id="empPwd" type="password" placeholder="${editing ? 'Leave blank to keep' : 'Min 6 characters'}">
          <small class="err" data-err="password"></small>
        </div>
        <div class="field">
          <label for="empJoined">Joining date</label>
          <input id="empJoined" type="date" value="${editing && editing.joined ? editing.joined : todayStr()}">
          <small class="err" data-err="joined"></small>
        </div>
        <div class="modal-actions">
          <button type="button" class="btn btn-ghost" data-close>Cancel</button>
          <button type="submit" class="btn btn-primary">${editing ? 'Save changes' : 'Create employee'}</button>
        </div>
      </form>`);

    const form = document.getElementById('empForm');
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = form.querySelector('#empName').value.trim();
      const email = form.querySelector('#empEmail').value.trim().toLowerCase();
      const department = form.querySelector('#empDept').value;
      const salary = Number(form.querySelector('#empSalary').value);
      const password = form.querySelector('#empPwd').value;
      const joined = form.querySelector('#empJoined').value;

      const errors = {};
      if (!name) errors.name = 'Full name is required';
      if (!email) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = 'Enter a valid email address';
      else if (Store.getUsers().some(u => u.email.toLowerCase() === email && (!editing || u.id !== editing.id)))
        errors.email = 'This email is already registered';
      if (!department) errors.department = 'Choose a department';
      if (!(salary > 0)) errors.salary = 'Salary must be greater than 0';
      if (!editing && (!password || password.length < 6)) errors.password = 'Password must be at least 6 characters';
      if (editing && password && password.length < 6) errors.password = 'Password must be at least 6 characters';

      if (Object.keys(errors).length) return showErrors(form, errors);

      const users = Store.getUsers();
      if (editing) {
        const target = users.find(u => u.id === editing.id);
        Object.assign(target, { name, email, department, salary, joined });
        if (password) target.password = password;
        Store.setUsers(users);
        toast('Employee updated');
      } else {
        users.push({ id: uid(), name, email, password, role: 'employee', department, salary, joined: joined || todayStr() });
        Store.setUsers(users);
        toast('Employee added — login created');
      }
      closeModal();
      render();
    });
  }

  /* ---------------- delete ---------------- */
  function remove(id) {
    const u = userById(id);
    if (!u) return;
    if (!confirm(`Delete ${u.name}? Their attendance and leave records stay in the system.`)) return;
    Store.setUsers(Store.getUsers().filter(x => x.id !== id));
    toast('Employee deleted');
    render();
  }
})();