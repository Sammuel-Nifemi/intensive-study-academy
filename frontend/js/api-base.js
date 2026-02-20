(function configureApiBase() {
  const host = window.location.hostname;
  const isLocalHost =
    host === "localhost" ||
    host === "127.0.0.1";

  const apiOrigin = isLocalHost
    ? "http://localhost:5000"
    : "https://intensive-study-backend.onrender.com";

  window.ISA_API_ORIGIN = apiOrigin;
  window.ISA_API_BASE = `${apiOrigin}/api`;

  if (!window.__ISA_FETCH_PATCHED) {
    const originalFetch = window.fetch.bind(window);
    const localOrigins = ["http://localhost:5000", "http://127.0.0.1:5000"];

    window.fetch = (input, init) => {
      const shouldRewrite = !isLocalHost;
      if (!shouldRewrite) {
        return originalFetch(input, init);
      }

      try {
        if (typeof input === "string") {
          let url = input;
          localOrigins.forEach((origin) => {
            if (url.startsWith(origin)) {
              url = apiOrigin + url.slice(origin.length);
            }
          });
          return originalFetch(url, init);
        }

        if (input instanceof Request) {
          let url = input.url;
          localOrigins.forEach((origin) => {
            if (url.startsWith(origin)) {
              url = apiOrigin + url.slice(origin.length);
            }
          });
          if (url !== input.url) {
            const rewrittenRequest = new Request(url, input);
            return originalFetch(rewrittenRequest, init);
          }
        }
      } catch (err) {
        console.warn("API URL rewrite skipped:", err);
      }

      return originalFetch(input, init);
    };

    window.__ISA_FETCH_PATCHED = true;
  }
})();
