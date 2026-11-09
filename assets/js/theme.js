(() => {
  const preference = window.matchMedia("(prefers-color-scheme: dark)");
  const toggle = document.getElementById("theme-toggle");
  const favicon = document.getElementById("favicon");
  const storageKey = "rosarium-theme";
  let transitionTimeout;
  let savedTheme = null;
  try {
    savedTheme = window.localStorage.getItem(storageKey);
  } catch {
    // Theme switching still works when browser storage is unavailable.
  }
  let followsBrowser = savedTheme !== "light" && savedTheme !== "dark";

  function applyTheme(dark, animate = false) {
    if (animate) {
      document.documentElement.classList.add("theme-transition");
      window.clearTimeout(transitionTimeout);
      transitionTimeout = window.setTimeout(() => {
        document.documentElement.classList.remove("theme-transition");
      }, 550);
    }
    const theme = dark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.title = dark ? "Ativar tema claro" : "Ativar tema escuro";
    favicon.setAttribute("href", `assets/icons/rosary-${theme}.svg`);
  }

  toggle.addEventListener("click", () => {
    followsBrowser = false;
    applyTheme(document.documentElement.dataset.theme !== "dark", true);
    try {
      window.localStorage.setItem(storageKey, document.documentElement.dataset.theme);
    } catch {
      // Keep the chosen theme for this visit if saving is blocked.
    }
  });

  preference.addEventListener("change", event => {
    if (followsBrowser) applyTheme(event.matches, true);
  });

  applyTheme(followsBrowser ? preference.matches : savedTheme === "dark");
  toggle.hidden = false;
})();
