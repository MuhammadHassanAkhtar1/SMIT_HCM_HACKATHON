# HCM Lite

A responsive, browser-based HR management demo built with HTML, CSS, vanilla JavaScript, and `localStorage`.

## Run the app

The app has no build step or package dependencies. From the project folder, start a static web server:

```powershell
py -m http.server 8000
```

Open [http://localhost:8000](http://localhost:8000) in your browser. You can also open `index.html` directly, but a local web server is recommended for consistent browser behavior.

## First run and demo

1. On the first visit, enter the company name, admin name/email/password, office start time, grace period, and yearly leave quota.
2. Sign in with the admin email and password you created.
3. Use **Manage Employees** to create employee accounts. The employee email and password are their login.
4. Sign out and sign in as an employee to check in/out, apply for leave, view attendance and announcements, check leave balance, and ask the Smart Helper.
5. Sign in as admin to review leave requests, see company attendance, manage employee records and settings, post announcements, and print payslips.

Settings include a five- or six-day working week. Leave requests count weekdays (Monday-Friday); annual leave balances are calculated per calendar year. Attendance CSV export is available from the employee-management page.

## Pages and code

- `index.html` — first-run setup and login
- `pages/admin.html` — company dashboard, attendance overview, announcements, and admin helper
- `pages/employees.html` — add/edit/delete employees, search, department filter, attendance records, CSV export
- `pages/leaves.html` — approve/reject leave requests with comments
- `pages/settings.html` — company settings and admin password change
- `pages/employee.html` — employee attendance, leave, announcements, password change, and personal helper
- `pages/payslip.html` — monthly payslip with print/save as PDF
- `css/style.css` — shared responsive design system
- `js/` — shared storage, authentication, helper, and page-specific modules

## Data and security

Company settings, users, attendance, leave, announcements, and the active session are saved using the `hcm_*` localStorage keys. This is intended for a learning/demo project: data is limited to the current browser and device, and client-side passwords and role checks are **not secure for real employment data**. A production service needs a backend, database, server-side authorization, secure password hashing, HTTPS, and suitable privacy controls. Do not use real employee credentials or sensitive HR data in this demo.

## Publish a static demo

The project can be published as a static site (for example, with GitHub Pages):

1. Push the project to a repository you control.
2. In the repository's **Settings → Pages**, choose **Deploy from a branch**, then select the branch and `/ (root)` folder.
3. Wait for the hosting provider to complete the deployment and open the URL it displays.

No hosting account or deployment credentials are included in this project, so a public live URL must be created from the owner's hosting account.
