/* Only trusted, versioned project Markdown is parsed or rendered here. */
const RosariumContent = (() => {
  // Table order is fixed; titles can change without changing public fragments or icons.
  const sections = [
    { id: "oracoes-iniciais", icon: "initial", prayerCount: 7 },
    { id: "misterios-gozosos", icon: "smile", prayerCount: 5, hasWeekdays: true },
    { id: "misterios-dolorosos", icon: "cross", prayerCount: 5, hasWeekdays: true },
    { id: "misterios-gloriosos", icon: "halo", prayerCount: 5, hasWeekdays: true },
    { id: "misterios-luminosos", icon: "sun", prayerCount: 5, hasWeekdays: true },
    { id: "oracoes-finais", icon: "final", prayerCount: 1 }
  ];

  function isNameRow(cells) {
    return cells.every(cell => cell.tokens.length === 1 && cell.tokens[0].type === "em");
  }

  function namesFrom(cells) {
    return cells.map(cell => cell.tokens[0].text);
  }

  function validateTable(table) {
    // Marked pads missing cells and discards extra cells; check raw widths before using tokens.
    const lines = table.raw.trim().split("\n");
    const hasTwoColumns = lines.every(line => line.trim().replace(/^\||\|$/g, "")
      .split(/(?<!\\)\|/).length === 2);
    const cells = [...table.header, ...table.rows.flat()];
    if (table.header.length !== 2 || !hasTwoColumns || cells.some(cell => !cell.text.trim())) {
      throw new Error("Cada linha deve conter latim e português, sem células vazias.");
    }
    if (!table.rows.length) throw new Error("A seção não contém orações.");
  }

  function parsePrayers(rows) {
    const prayers = [];
    let names = null;
    rows.forEach(cells => {
      if (isNameRow(cells)) {
        if (names) throw new Error("Nome de oração sem texto correspondente.");
        names = namesFrom(cells);
      } else {
        prayers.push({
          names,
          latin: marked.Parser.parseInline(cells[0].tokens),
          portuguese: marked.Parser.parseInline(cells[1].tokens)
        });
        names = null;
      }
    });
    if (names) throw new Error("Nome de oração sem texto correspondente.");
    return prayers;
  }

  function parseSection(table, specification) {
    validateTable(table);
    const rows = [...table.rows];
    let weekdays = null;
    if (specification.hasWeekdays) {
      if (!isNameRow(rows[0])) throw new Error("Os mistérios devem indicar os dias nos dois idiomas.");
      weekdays = namesFrom(rows.shift());
    }
    const prayers = parsePrayers(rows);
    if (prayers.length !== specification.prayerCount) {
      throw new Error(`Quantidade de orações inválida em ${specification.id}.`);
    }
    return {
      id: specification.id,
      icon: specification.icon,
      latinTitle: table.header[0].text,
      title: table.header[1].text,
      weekdays,
      prayers
    };
  }

  function parse(markdown) {
    const tables = marked.lexer(markdown).filter(token => token.type === "table");
    if (tables.length !== sections.length) throw new Error("O rosário deve conter seis seções.");
    const parsed = tables.map((table, index) => parseSection(table, sections[index]));
    const ids = new Set(parsed.map(section => section.id));
    const titles = new Set(parsed.map(section => section.title.trim().toLowerCase()));
    if (ids.size !== parsed.length || titles.size !== parsed.length) {
      throw new Error("Identificadores e títulos de seção devem ser únicos.");
    }
    return parsed;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function prayerCopy(html) {
    const copy = element("span", "prayer-copy");
    copy.innerHTML = html;
    return copy;
  }

  function createPrayer(data) {
    const prayer = element("details", "prayer");
    const latin = element("summary");
    const translation = element("div", "translation");
    latin.lang = "la";
    translation.lang = "pt-BR";
    if (data.names) {
      latin.append(element("span", "prayer-name", data.names[0]));
      translation.append(element("span", "prayer-name", data.names[1]));
    }
    latin.append(prayerCopy(data.latin));
    translation.append(prayerCopy(data.portuguese));
    prayer.append(latin, translation);
    return prayer;
  }

  function createHeading(data) {
    const heading = element("header", "section-heading");
    const icon = element("span", `section-icon icon-${data.icon}`);
    icon.setAttribute("aria-hidden", "true");
    const titleGroup = element("div");
    const title = element("h2", "", data.latinTitle);
    title.id = `${data.id}-title`;
    title.lang = "la";
    titleGroup.append(title, element("p", "section-subtitle", data.title));
    if (data.weekdays) {
      const days = element("p", "section-days");
      const latinDays = element("span", "", data.weekdays[0]);
      latinDays.lang = "la";
      days.append(latinDays, element("span", "", data.weekdays[1]));
      titleGroup.append(days);
    }
    heading.append(icon, titleGroup);
    return heading;
  }

  function createSection(data) {
    const section = element("section", "prayer-section");
    section.id = data.id;
    section.setAttribute("aria-labelledby", `${data.id}-title`);
    const languages = element("div", "language-labels");
    languages.setAttribute("aria-hidden", "true");
    languages.append(element("span", "", "Latim"), element("span", "", "Português"));
    const prayers = element("div", "prayer-list");
    prayers.append(...data.prayers.map(createPrayer));
    section.append(createHeading(data), languages, prayers);
    return section;
  }

  function createSectionLink(data) {
    const item = element("li");
    const link = element("a", "nav-link");
    const icon = element("span", `nav-icon icon-${data.icon}`);
    icon.setAttribute("aria-hidden", "true");
    link.append(icon, element("span", "nav-label", data.title.replace(/^(?:Orações|Mistérios) /, "")));
    link.href = `#${data.id}`;
    item.append(link);
    return item;
  }

  function render(markdown) {
    const parsed = parse(markdown);
    const content = document.createDocumentFragment();
    const links = document.createDocumentFragment();
    const hint = element("p", "reading-hint");
    hint.append(
      element("span", "mobile-hint", "Toque na oração em latim para ver a tradução."),
      element("span", "desktop-hint", "Reze em latim. Acompanhe a tradução ao lado.")
    );
    content.append(hint, ...parsed.map(createSection));
    links.append(...parsed.map(createSectionLink));
    return { content, links };
  }

  return { parse, render };
})();
