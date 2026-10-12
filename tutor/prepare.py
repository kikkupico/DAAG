"""Fetch the papers behind the books, so the tutor can answer from them.

    python3 tutor/prepare.py [--check]

The list is papers/index.html: every paper there is a link to a copy that can be read freely,
and the link's data-file is the paper's name under sources/, which is not in git:

    sources/<name>.pdf    the paper, as downloaded
    sources/<name>.txt    its text (pdftotext), for searching

A paper already there is left alone; so is every other file in sources/. A download that is not
a PDF is thrown away and reported, since a dead link often answers with a page of its own.
--check downloads nothing and reports the links that no longer serve a PDF.
"""
import re
import shutil
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
LIST = ROOT / "papers" / "index.html"
SOURCES = ROOT / "sources"
LINK = re.compile(r'<a href="(https?://[^"]+)" data-file="([a-z0-9_-]+)">(.*?)</a>', re.S)
AGENT = "Mozilla/5.0"  # some hosts refuse a script that does not name a browser, and the archive one that names too much


def papers():
    """(name, url, title) for every paper on the list, in its order."""
    return [(name, url, re.sub(r"<[^>]*>", "", title)) for url, name, title in LINK.findall(LIST.read_text(encoding="utf-8"))]


def fetch(url, whole=True):
    """The PDF at the address, or only its first bytes; None if what comes back is not a PDF."""
    request = urllib.request.Request(url, headers={"User-Agent": AGENT})
    for wait in (5, 20, 60, None):  # an archive that is busy says so, and serves the paper a little later
        try:
            with urllib.request.urlopen(request, timeout=90) as answer:
                data = answer.read() if whole else answer.read(5)
            return data if data.startswith(b"%PDF") else None
        except urllib.error.HTTPError as error:
            if error.code not in (429, 503) or wait is None:
                raise
            time.sleep(wait)


def text(pdf):
    """Write the paper's text beside it; False if there is none to speak of (a scan without text)."""
    out = pdf.with_suffix(".txt")
    if not out.exists():
        subprocess.run(["pdftotext", str(pdf), str(out)], check=False, capture_output=True)
    return out.exists() and len(out.read_text(encoding="utf-8", errors="replace").split()) > 500


if __name__ == "__main__":
    check = "--check" in sys.argv[1:]
    reader = shutil.which("pdftotext")
    SOURCES.mkdir(exist_ok=True)
    fetched, present, failed, scans = [], [], [], []
    for name, url, title in papers():
        pdf = SOURCES / f"{name}.pdf"
        if pdf.exists() and not check:
            present.append(name)
        else:
            try:
                data = fetch(url, whole=not check)
            except (OSError, ValueError) as error:
                data = None
                print(f"  failed   {name}: {error}")
            if data is None:
                failed.append(name)
                print(f"  no PDF   {name}  “{title}”\n           {url}")
                continue
            if check:
                present.append(name)
                continue
            part = pdf.with_suffix(".part")
            part.write_bytes(data)
            part.replace(pdf)
            fetched.append(name)
            print(f"  fetched  {name}")
        if reader and pdf.exists() and not text(pdf):
            scans.append(name)
    if check:
        print(f"papers: {len(present)} links serve a PDF, {len(failed)} do not")
    else:
        print(f"papers: {len(fetched)} fetched, {len(present)} already in sources/, {len(failed)} failed")
        if not reader:
            print("papers: pdftotext is not installed (brew install poppler), so no text was made; read the PDFs")
        if scans:
            print("papers: no text could be taken from " + ", ".join(scans) + "; read those PDFs by page")
    sys.exit(1 if failed else 0)
