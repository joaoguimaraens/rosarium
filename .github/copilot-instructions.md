# Copilot instructions

## Project overview

Rosarium is a dependency-light static web page for praying the rosary in Latin and Portuguese. There is no application server, bundler, package manifest, or framework:

- `index.html` is the entry point and page shell.
- `rosarium.md` is the source content, organized as bilingual Markdown tables.
- `marked.min.js` is a vendored copy of Marked, used in the browser to convert the Markdown to HTML.
- `style.css` contains the complete page presentation and responsive table layout.
- `rosary.svg` is used both as the favicon and as the page illustration.

At runtime, `index.html` fetches `rosarium.md`, parses it with `marked.parse`, and writes the resulting HTML into `#content`. The fetch is intentionally client-side, so preview the site through a local HTTP server rather than opening `index.html` directly from `file://`.

## Build, test, and lint

There are currently no repository-defined build, test, or lint commands: no `package.json`, lockfile, or other build configuration is present. A local preview can be started from the repository root with:

```text
python -m http.server 8000
```

Then open `http://localhost:8000/`. Since there is no automated test suite, individual tests cannot be run; validate content and layout in a browser after changes.

## Content conventions

- Keep `rosarium.md` as the canonical content source; do not duplicate the prayers in `index.html`.
- Preserve the two-column structure: Latin on the left and Portuguese on the right. When changing a prayer or mystery, update both language cells and keep their order aligned.
- Preserve the existing accented Latin and Portuguese spelling. These are user-facing liturgical texts, so avoid automatic reformatting or “corrections” without an explicit request.
- Use the existing Markdown conventions (`---` section separators, table headings, emphasis for prayer names, and `<br>` for line breaks inside table cells) so Marked renders the content consistently.

## Front-end conventions

- Keep the page dependency-free at runtime apart from the checked-in `marked.min.js`; do not introduce a framework or package manager for small content/style changes.
- Preserve the relative asset paths in `index.html` (`rosarium.md`, `style.css`, `marked.min.js`, and `rosary.svg`) so the site continues to work when hosted from the repository root or a subpath.
- Keep error handling for Markdown loading visible through the existing `.error` element styling rather than silently failing.
- Maintain the responsive behavior in `style.css`: desktop tables use two equal columns, while narrow screens stack table cells vertically.
- Treat `marked.min.js` as generated/vendor content. Update it only when intentionally upgrading the vendored Marked version, and keep the version/license header intact.
