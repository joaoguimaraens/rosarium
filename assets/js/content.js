/* The Markdown is trusted, versioned project content, never visitor input. */
const RosariumContent = (() => {
  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function copyCell(cell, className) {
    const node = element("span", className);
    node.append(...Array.from(cell.childNodes, child => child.cloneNode(true)));
    return node;
  }

  function isNameRow(cells) {
    return cells.every(cell => cell.children.length === 1
      && cell.firstElementChild.tagName === "EM"
      && cell.textContent.trim() === cell.firstElementChild.textContent.trim());
  }

  function createPrayer(cells, names) {
    const prayer = element("details", "prayer");
    const latin = element("summary");
    const translation = element("div", "translation");
    latin.lang = "la";
    translation.lang = "pt-BR";

    if (names) {
      latin.append(element("span", "prayer-name", names[0].textContent));
      translation.append(element("span", "prayer-name", names[1].textContent));
    }

    latin.append(copyCell(cells[0], "prayer-copy"));
    translation.append(copyCell(cells[1], "prayer-copy"));
    prayer.append(latin, translation);
    return prayer;
  }

  function render(markdown) {
    const template = document.createElement("template");
    template.innerHTML = marked.parse(markdown);
    const tables = [...template.content.querySelectorAll("table")];
    if (!tables.length) throw new Error("Nenhuma oração encontrada.");

    const content = document.createDocumentFragment();
    const links = document.createDocumentFragment();
    const hint = element("p", "reading-hint");
    hint.append(
      element("span", "mobile-hint", "Toque na oração em latim para ver a tradução."),
      element("span", "desktop-hint", "Reze em latim. Acompanhe a tradução ao lado.")
    );
    content.append(hint);

    tables.forEach((table, index) => {
      const titles = [...table.querySelectorAll("thead th")];
      const rows = [...table.querySelectorAll("tbody tr")];
      if (titles.length !== 2 || rows.some(row => row.cells.length !== 2)) {
        throw new Error("As orações devem ter os dois idiomas.");
      }

      const title = titles[1].textContent.trim();
      const id = title.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const section = element("section", "prayer-section");
      section.id = id;
      section.setAttribute("aria-labelledby", `${id}-title`);
      const heading = element("header", "section-heading");
      const number = element("span", "section-index", String(index + 1).padStart(2, "0"));
      number.setAttribute("aria-hidden", "true");
      const titleGroup = element("div");
      const h2 = element("h2", "", titles[0].textContent);
      h2.id = `${id}-title`;
      h2.lang = "la";
      titleGroup.append(h2, element("p", "section-subtitle", title));

      // In mystery tables the first emphasized row describes the weekdays.
      if (index > 0 && isNameRow([...rows[0].cells])) {
        const days = element("p", "section-days");
        const latinDays = element("span", "", rows[0].cells[0].textContent);
        latinDays.lang = "la";
        days.append(latinDays, element("span", "", rows[0].cells[1].textContent));
        titleGroup.append(days);
        rows.shift();
      }

      heading.append(number, titleGroup);
      const languages = element("div", "language-labels");
      languages.setAttribute("aria-hidden", "true");
      languages.append(element("span", "", "Latim"), element("span", "", "Português"));
      const prayers = element("div", "prayer-list");
      let names = null;
      rows.forEach(row => {
        const cells = [...row.cells];
        if (isNameRow(cells)) {
          names = cells;
        } else {
          prayers.append(createPrayer(cells, names));
          names = null;
        }
      });
      section.append(heading, languages, prayers);
      content.append(section);

      const item = element("li", "nav-item");
      const link = element("a", "nav-link", title.replace(/^(?:Orações|Mistérios) /, ""));
      link.href = `#${id}`;
      item.append(link);
      links.append(item);
    });

    return { content, links };
  }

  return { render };
})();
