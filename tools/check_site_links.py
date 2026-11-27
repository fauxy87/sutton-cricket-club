#!/usr/bin/env python3
"""Check Sutton CC static HTML/CSS references without network access.

Run from repository root: python3 tools/check_site_links.py
External URLs, API endpoints and JavaScript-generated admin panel anchors are
outside the static checker and require separate runtime tests.
"""
from __future__ import annotations

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SKIP_DIRS = {".git", "node_modules", ".venv", "__pycache__"}
SKIP_TARGET_PREFIXES = ("/api/",)
GENERATED_FRAGMENTS = {"admin.html": {"play-cricket-admin", "season-admin"}}
URL_RE = re.compile(r"""url\(\s*(['"]?)(.*?)\1\s*\)""", re.I | re.S)
CSS_COMMENT = re.compile(r"/\*.*?\*/", re.S)
ATTRS = {"href", "src", "action", "poster"}
errors: list[str] = []
checked = 0


def files(glob: str) -> list[Path]:
    return sorted(p for p in ROOT.rglob(glob) if not any(x in SKIP_DIRS for x in p.relative_to(ROOT).parts))


def path_from_reference(source: Path, url: str) -> tuple[Path | None, str]:
    value = url.strip()
    if not value or value.startswith(("data:", "mailto:", "tel:", "javascript:", "//")):
        return None, ""
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc:
        return None, ""
    if parsed.path.startswith(SKIP_TARGET_PREFIXES):
        return None, ""
    relative = unquote(parsed.path)
    if not relative and not parsed.fragment:
        return None, ""
    if relative.startswith("/"):
        target = ROOT / relative.lstrip("/")
    else:
        target = (source.parent / relative) if relative else source
    # resolve() also deals with paths containing ./ and ../.
    target = target.resolve()
    try:
        target.relative_to(ROOT.resolve())
    except ValueError:
        errors.append(f"{source.relative_to(ROOT)}: reference escapes site root: {value}")
        return None, ""
    if not relative:
        target = source
    return target, unquote(parsed.fragment)


class PageParser(HTMLParser):
    def __init__(self, page: Path):
        super().__init__(convert_charrefs=True)
        self.page = page
        self.ids: set[str] = set()
        self.links: list[str] = []
        self.alt_missing = 0
        self.h1_count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]):
        data = dict(attrs)
        identity = data.get("id")
        if identity:
            if identity in self.ids:
                errors.append(f"{self.page.relative_to(ROOT)}: duplicate id #{identity}")
            self.ids.add(identity)
        if tag == "h1":
            self.h1_count += 1
        if tag == "img" and "alt" not in data:
            self.alt_missing += 1
        for attr in ATTRS:
            value = data.get(attr)
            if value:
                self.links.append(value)
        if data.get("srcset"):
            for entry in data["srcset"].split(","):
                source = entry.strip().split(" ")[0]
                if source:
                    self.links.append(source)


def validate_link(source: Path, value: str, own_ids: set[str] | None = None):
    global checked
    dest, fragment = path_from_reference(source, value)
    if dest is None:
        return
    checked += 1
    if not dest.exists():
        errors.append(f"{source.relative_to(ROOT)}: missing local file: {value}")
        return
    if dest.is_dir():
        if not (dest / "index.html").exists():
            errors.append(f"{source.relative_to(ROOT)}: directory without index page: {value}")
        return
    if fragment and dest == source and own_ids is not None:
        allowed = GENERATED_FRAGMENTS.get(source.relative_to(ROOT).as_posix(), set())
        if fragment not in own_ids and fragment not in allowed:
            errors.append(f"{source.relative_to(ROOT)}: missing local anchor #{fragment}")


def main():
    pages = files("*.html")
    styles = files("*.css")
    for page in pages:
        parser = PageParser(page)
        parser.feed(page.read_text(encoding="utf-8"))
        if parser.alt_missing:
            errors.append(f"{page.relative_to(ROOT)}: {parser.alt_missing} img tag(s) without alt text")
        if parser.h1_count > 1:
            errors.append(f"{page.relative_to(ROOT)}: {parser.h1_count} H1 headings")
        for url in parser.links:
            validate_link(page, url, parser.ids)
    for css in styles:
        content = CSS_COMMENT.sub("", css.read_text(encoding="utf-8"))
        for match in URL_RE.finditer(content):
            validate_link(css, match.group(2))
    print(f"Checked {len(pages)} HTML pages, {len(styles)} stylesheets and {checked} local references.")
    if errors:
        for error in sorted(set(errors)):
            print("ERROR:", error)
        print(f"{len(set(errors))} issue(s) found.")
        return 1
    print("Static links, referenced assets and basic HTML checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
