document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("staffCreateForm");
  const statusEl = document.getElementById("staffStatus");
  const tableBody = document.getElementById("staffTableBody");

  const token = localStorage.getItem("adminToken");

  const setStatus = (message, type) => {
    if (!statusEl) return;
    statusEl.textContent = message || "";
    statusEl.classList.remove("error", "success", "loading");
    if (type) statusEl.classList.add(type);
  };

  const fetchStaff = async () => {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    setStatus("Loading staff...", "loading");

    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/staff", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to load staff", "error");
        return;
      }

      if (!data.length) {
        setStatus("No staff created yet.", "");
        return;
      }

      setStatus("", "");
      data.forEach((staff) => {
        const row = document.createElement("tr");
        const createdAt = staff.createdAt
          ? new Date(staff.createdAt).toLocaleString()
          : "—";
        const createdBy = staff.createdBy || "—";
        const permissions = Array.isArray(staff.permissions)
          ? staff.permissions.join(", ")
          : "—";

        row.innerHTML = `
          <td>${staff.email || "—"}</td>
          <td>${permissions}</td>
          <td>${createdAt}</td>
          <td>${createdBy}</td>
          <td>
            <button class="action-btn danger" data-id="${staff._id}">Delete</button>
          </td>
        `;
        tableBody.appendChild(row);
      });
    } catch (err) {
      console.error(err);
      setStatus("Failed to load staff.", "error");
    }
  };

  tableBody?.addEventListener("click", async (event) => {
    const btn = event.target.closest("button[data-id]");
    if (!btn) return;

    const staffId = btn.getAttribute("data-id");
    if (!staffId) return;

    const confirmDelete = window.confirm("Delete this staff account?");
    if (!confirmDelete) return;

    btn.disabled = true;
    btn.textContent = "Deleting...";
    setStatus("Deleting staff...", "loading");

    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + `/api/admin/staff/${staffId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await res.json();
      if (!res.ok) {
        setStatus(data.message || "Failed to delete staff", "error");
        return;
      }

      setStatus("Staff deleted.", "success");
      fetchStaff();
    } catch (err) {
      console.error(err);
      setStatus("Failed to delete staff.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Delete";
    }
  });

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    setStatus("Creating staff...", "loading");

    const email = document.getElementById("staffEmail").value.trim();
    const permissions = Array.from(
      form.querySelectorAll("input[name=\"permissions\"]:checked")
    ).map((input) => input.value);

    try {
      const res = await fetch((window.ISA_API_ORIGIN || "") + "/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email, permissions })
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus(data.message || "Failed to create staff", "error");
        return;
      }

      const emailFailed = data.mailSent === false;
      const message = emailFailed
        ? "Staff created, but email failed to send."
        : "Staff created successfully.";
      setStatus(message, emailFailed ? "error" : "success");

      let alertMessage = message;
      if (emailFailed && (data.otp || data.tempPassword)) {
        alertMessage += `\n\nTemporary Password: ${data.tempPassword || "—"}`;
        alertMessage += `\nOTP: ${data.otp || "—"}`;
      }
      window.alert(alertMessage);
      form.reset();
      fetchStaff();
    } catch (err) {
      console.error(err);
      setStatus("Failed to create staff.", "error");
    }
  });

  fetchStaff();
});
