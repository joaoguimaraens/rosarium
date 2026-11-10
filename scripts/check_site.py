"""Check the static site's local references without third-party dependencies."""

from html.parser import HTMLParser
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlsplit


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in ("href", "src") and value:
                self.urls.append(value)
            if name == "id":
                self.ids.add(value)


def check_site(root):
    root = root.resolve()
    errors = []

    def check_reference(source, reference, ids=None):
        url = urlsplit(reference)
        if url.scheme or url.netloc:
            return
        if not url.path:
            if ids is not None and url.fragment and unquote(url.fragment) not in ids:
                errors.append(f"{source.relative_to(root)}: âncora ausente: {reference}")
            return
        if url.path.startswith("/"):
            errors.append(f"{source.relative_to(root)}: use caminho relativo: {reference}")
            return
        target = (source.parent / unquote(url.path)).resolve()
        if not target.is_relative_to(root) or not target.is_file():
            errors.append(f"{source.relative_to(root)}: arquivo ausente: {reference}")

    index = root / "index.html"
    if not index.is_file():
        return ["index.html ausente"]

    html = References()
    html.feed(index.read_text(encoding="utf-8"))
    for reference in html.urls:
        check_reference(index, reference, html.ids)

    for stylesheet in (root / "assets/css").glob("*.css"):
        css = stylesheet.read_text(encoding="utf-8")
        css = re.sub(r"/\*.*?\*/", "", css, flags=re.DOTALL)
        for match in re.finditer(r"url\(\s*(['\"]?)(.*?)\1\s*\)", css):
            check_reference(stylesheet, match.group(2).strip())

    # These files are also requested by JavaScript, beyond HTML/CSS references.
    for filename in (
        "rosarium.md",
        "sw.js",
        "assets/icons/rosary-light.svg",
        "assets/icons/rosary-dark.svg",
    ):
        if not (root / filename).is_file():
            errors.append(f"Arquivo necessário ausente: {filename}")

    return errors


if __name__ == "__main__":
    errors = check_site(Path(__file__).resolve().parents[1])
    if errors:
        print("\n".join(errors), file=sys.stderr)
        sys.exit(1)
    print("Caminhos HTML/CSS, fontes, ícones e conteúdo encontrados.")
