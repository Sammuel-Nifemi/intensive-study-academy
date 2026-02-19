(() => {
  const token = localStorage.getItem("studentToken");
  if (!token) return;

  const page = window.location.pathname;

  fetch("http://localhost:5000/api/activity/track", {
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
