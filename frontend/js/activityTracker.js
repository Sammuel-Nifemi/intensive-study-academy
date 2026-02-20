(() => {
  const token = localStorage.getItem("studentToken");
  if (!token) return;

  const page = window.location.pathname;

  fetch((window.ISA_API_ORIGIN || "") + "/api/activity/track", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ` + token
    },
    body: JSON.stringify({
      page,
      timestamp: new Date().toISOString()
    })
  });
})();
