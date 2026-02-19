const API_URL = "http://localhost:5000/api/admin";

async function loadUsers() {
  const token = document.getElementById("tokenInput").value;

  if (!token) {
    alert("Please paste an admin JWT token");
    return;
  }

  const response = await fetch(`${API_URL}/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const users = await response.json();
  const table = document.getElementById("usersTable");
  table.innerHTML = "";

  users.forEach((user) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${user.name}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>
        <button onclick="changeRole('${user._id}', '${user.role === "admin" ? "student" : "admin"}')">
          Make ${user.role === "admin" ? "Student" : "Admin"}
        </button>
        <button onclick="deleteUser('${user._id}')">Delete</button>
      </td>
    `;

    table.appendChild(row);
  });
}

async function changeRole(userId, role) {
  const token = document.getElementById("tokenInput").value;

  await fetch(`${API_URL}/users/${userId}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });

  loadUsers();
}

async function deleteUser(userId) {
  const token = document.getElementById("tokenInput").value;

  await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  loadUsers();
}
