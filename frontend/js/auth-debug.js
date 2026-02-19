

// ===============================
// AUTH DEBUG LOGGER (DEV ONLY)
// ===============================
(function () {
  const token = localStorage.getItem("studentToken");

  console.group("🛡️ AUTH DEBUG");
  console.log("📍 Page:", window.location.pathname);
  console.log("🔑 studentToken:", token ? "PRESENT ✅" : "MISSING ❌");
  console.trace("📌 Stack trace");
  console.groupEnd();
})();
