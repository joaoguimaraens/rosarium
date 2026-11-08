(() => {
  const preference = window.matchMedia("(prefers-color-scheme: dark)");
  const toggle = document.getElementById("theme-toggle");
  const favicon = document.getElementById("favicon");
  let followsBrowser = true;

  function applyTheme(dark) {
    const theme = dark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    toggle.setAttribute("aria-pressed", String(dark));
    toggle.title = dark ? "Ativar tema claro" : "Ativar tema escuro";
    favicon.setAttribute("href", `assets/icons/rosary-${theme}.svg`);
  }

  toggle.addEventListener("click", () => {
    followsBrowser = false;
    applyTheme(document.documentElement.dataset.theme !== "dark");
  });

  preference.addEventListener("change", event => {
    if (followsBrowser) applyTheme(event.matches);
  });

  applyTheme(preference.matches);
  toggle.hidden = false;
})();
