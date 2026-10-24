"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const session = HCM.requireRole("admin");
    if (!session) return;

    document.getElementById("welcome-admin").textContent = `Welcome back, ${session.name}`;
    document.getElementById("admin-profile-name").textContent = session.name;
    document.getElementById("admin-avatar").textContent = session.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part.charAt(0))
        .join("")
        .toUpperCase();

    const dashboardDate = new Date();
    document.getElementById("dashboard-date").textContent =
        new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
            .format(dashboardDate);

    const users = Storage.getUsers();
    const employees = users.filter(user => user.role === "employee");
    const today = HCM.today();
    const attendance = Storage.getAttendance();
    const leaves = Storage.getLeaves();
    const todayAttendance = attendance.filter(record => record.date === today);
    const todayLeaves = leaves.filter(leave =>
        leave.status === "Approved" && leave.from <= today && leave.to >= today
    );
    const employeesOnLeave = new Set(todayLeaves.map(leave => leave.employeeId)).size;

    document.getElementById("total-emp").textContent = employees.length;
    document.getElementById("present-today").textContent =
        todayAttendance.filter(record => record.checkIn).length;
    document.getElementById("on-leave").textContent = employeesOnLeave;
    document.getElementById("late-today").textContent =
        todayAttendance.filter(record => record.late === true || record.status === "Late").length;
    document.getElementById("pending-leaves").textContent =
        leaves.filter(leave => leave.status === "Pending").length;

    const teamCount = document.getElementById("team-count-label");
    teamCount.textContent = `${employees.length} team member${employees.length === 1 ? "" : "s"}`;
    const teamList = document.getElementById("admin-team-list");
    teamList.innerHTML = employees.length
        ? employees.slice(0, 5).map(employee => {
            const name = employee.name || "Unnamed employee";
            const initials = name.trim().split(/\s+/).slice(0, 2)
                .map(part => part.charAt(0)).join("").toUpperCase();
            const department = employee.department || employee.dept || "Team member";
            return `<div class="admin-team-member">
                <span class="admin-team-initials" aria-hidden="true">${HCM.escapeHTML(initials)}</span>
                <span><strong>${HCM.escapeHTML(name)}</strong><small>${HCM.escapeHTML(department)}</small></span>
            </div>`;
        }).join("")
        : '<p class="admin-team-empty">Add your first employee to see your team here.</p>';

    const toDateKey = date => [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, "0"),
        String(date.getDate()).padStart(2, "0")
    ].join("-");
    const chartDays = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
        const date = new Date(dashboardDate);
        date.setDate(date.getDate() - offset);
        const dateKey = toDateKey(date);
        const dayRecords = attendance.filter(record => record.date === dateKey && record.checkIn);
        chartDays.push({
            label: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
            dateKey,
            present: dayRecords.length,
            late: dayRecords.filter(record => record.late === true || record.status === "Late").length
        });
    }
    const maxAttendance = Math.max(1, ...chartDays.map(day => day.present));
    const attendanceChart = document.getElementById("attendance-chart");
    attendanceChart.innerHTML = chartDays.map(day => {
        const presentHeight = day.present ? Math.max(8, day.present / maxAttendance * 100) : 3;
        const lateHeight = day.late ? Math.max(8, day.late / maxAttendance * 100) : 3;
        return `<div class="admin-chart-day" title="${day.dateKey}: ${day.present} present, ${day.late} late">
            <div class="admin-chart-bars">
                <span class="admin-chart-bar present" style="--present-height: ${presentHeight}%"></span>
                <span class="admin-chart-bar late" style="--late-height: ${lateHeight}%"></span>
            </div>
            <span>${HCM.escapeHTML(day.label)}</span>
        </div>`;
    }).join("");
    const hasAttendance = chartDays.some(day => day.present);
    attendanceChart.setAttribute("aria-label", hasAttendance
        ? `Attendance over the last seven days: ${chartDays.map(day => `${day.label} ${day.present} present, ${day.late} late`).join("; ")}`
        : "No attendance check-ins in the last seven days");

    const attendanceBody = document.getElementById("admin-attendance-body");
    const records = todayAttendance.filter(record => record.checkIn);
    attendanceBody.innerHTML = records.length ? records.map(record => {
        const employee = employees.find(user => user.id === record.employeeId);
        return `<tr>
            <td>${HCM.escapeHTML(employee ? employee.name : "Unknown")}</td>
            <td>${HCM.escapeHTML(record.checkIn)}</td>
            <td>${HCM.escapeHTML(record.checkOut || "—")}</td>
            <td>${HCM.escapeHTML(record.status)}</td>
        </tr>`;
    }).join("") : '<tr><td colspan="4" class="empty-state">No attendance records today</td></tr>';

    const announcementForm = document.getElementById("announcement-form");
    const announcementsList = document.getElementById("announcements-list");
    const renderAnnouncements = () => {
        const announcements = Storage.getAnnouncements();
        announcementsList.innerHTML = announcements.length
            ? announcements.slice().reverse().map(item => `
                <article class="announcement-item">
                    <p>${HCM.escapeHTML(item.message)}</p>
                    <small>${HCM.escapeHTML(item.date)} · ${HCM.escapeHTML(item.author)}</small>
                </article>`).join("")
            : '<p class="empty-state">No announcements yet.</p>';
    };

    announcementForm.addEventListener("submit", event => {
        event.preventDefault();
        const message = document.getElementById("announcement-text").value.trim();
        if (!message) return;

        const announcements = Storage.getAnnouncements();
        announcements.push({
            id: Date.now(),
            message,
            author: session.name,
            date: HCM.today()
        });
        Storage.setAnnouncements(announcements);
        announcementForm.reset();
        document.getElementById("announcement-message").textContent = "Announcement posted.";
        renderAnnouncements();
    });
    renderAnnouncements();

    const chatMessages = document.getElementById("chat-messages");
    const answerQuestion = () => {
        const input = document.getElementById("chat-input");
        const question = input.value.trim();
        if (!question) return;

        const userMessage = document.createElement("p");
        userMessage.className = "chat-message";
        userMessage.textContent = `You: ${question}`;
        const helperMessage = document.createElement("p");
        helperMessage.className = "chat-message chat-reply";
        helperMessage.textContent = `Helper: ${HCM.answerAdminQuestion(question)}`;
        chatMessages.append(userMessage, helperMessage);
        input.value = "";
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    document.getElementById("chat-send").addEventListener("click", answerQuestion);
    document.getElementById("chat-input").addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            answerQuestion();
        }
    });
    document.getElementById("logout-btn").addEventListener("click", HCM.logout);
});
