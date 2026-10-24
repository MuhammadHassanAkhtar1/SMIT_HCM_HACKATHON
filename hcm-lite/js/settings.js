"use strict";

document.addEventListener("DOMContentLoaded", () => {
    const session = HCM.requireRole("admin");
    if (!session) return;

    HCM.bindPasswordChange(document.getElementById("admin-password-form"), session);
    document.getElementById("logout-btn").addEventListener("click", HCM.logout);

    const company = Storage.getCompany();
    if (company) {
        document.getElementById("setting-company-name").value = company.name || "";
        document.getElementById("setting-start-time").value = company.startTime || "09:00";
        document.getElementById("setting-grace-minutes").value = company.graceMinutes ?? 15;
        document.getElementById("setting-leave-quota").value = company.leaveQuota ?? 20;
        document.getElementById("setting-working-days").value = company.workingDaysPerWeek || 5;
    }

    document.getElementById("settings-form").addEventListener("submit", event => {
        event.preventDefault();
        const updatedCompany = {
            name: document.getElementById("setting-company-name").value.trim(),
            startTime: document.getElementById("setting-start-time").value,
            graceMinutes: Number.parseInt(document.getElementById("setting-grace-minutes").value, 10),
            leaveQuota: Number.parseInt(document.getElementById("setting-leave-quota").value, 10),
            workingDaysPerWeek: Number.parseInt(document.getElementById("setting-working-days").value, 10)
        };

        Storage.setCompany(updatedCompany);
        const success = document.getElementById("settings-success");
        success.textContent = "Settings updated successfully.";
        window.setTimeout(() => {
            success.textContent = "";
        }, 3000);
    });
});
