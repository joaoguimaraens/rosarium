(() => {
  const content = document.getElementById("content");
  const navigation = document.querySelector(".section-nav");
  const links = document.getElementById("section-links");
  const mobile = window.matchMedia("(max-width: 767px)");
  const expandedOnMobile = new WeakSet();

  function syncLayout() {
    content.querySelectorAll(".prayer").forEach(prayer => {
      prayer.open = !mobile.matches || expandedOnMobile.has(prayer);
      const summary = prayer.querySelector("summary");
      if (mobile.matches) {
        summary.removeAttribute("tabindex");
        summary.removeAttribute("aria-disabled");
      } else {
        summary.tabIndex = -1;
        summary.setAttribute("aria-disabled", "true");
      }
    });
  }

  function updateCurrentLink() {
    links.querySelectorAll("a").forEach(link => {
      if (link.hash === window.location.hash) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  function scrollToSection() {
    const id = window.location.hash.slice(1);
    const section = document.getElementById(id);
    if (section) section.scrollIntoView();
    updateCurrentLink();
  }

  async function loadPrayers() {
    content.setAttribute("aria-busy", "true");
    content.innerHTML = '<p class="load-status" role="status">Preparando as orações…</p>';
    try {
      const response = await fetch("rosarium.md", { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = RosariumContent.render(await response.text());
      content.replaceChildren(result.content);
      links.replaceChildren(result.links);
      navigation.hidden = false;
      syncLayout();
      scrollToSection();
    } catch (error) {
      navigation.hidden = true;
      content.innerHTML = `
        <div class="load-status" role="alert">
          <p>Não foi possível carregar as orações. Tente novamente.</p>
          <button type="button" class="btn btn-outline-secondary" id="retry">Tentar novamente</button>
          <p class="mt-3"><a href="rosarium.md">Abrir o texto das orações</a></p>
        </div>`;
      document.getElementById("retry").addEventListener("click", loadPrayers);
      console.error("Falha ao carregar o rosário:", error);
    } finally {
      content.setAttribute("aria-busy", "false");
    }
  }

  content.addEventListener("click", event => {
    const summary = event.target.closest(".prayer summary");
    if (!summary) return;
    if (!mobile.matches) {
      event.preventDefault();
      return;
    }
    const prayer = summary.parentElement;
    if (prayer.open) expandedOnMobile.delete(prayer);
    else expandedOnMobile.add(prayer);
  });

  mobile.addEventListener("change", syncLayout);
  window.addEventListener("hashchange", updateCurrentLink);
  loadPrayers();
})();
