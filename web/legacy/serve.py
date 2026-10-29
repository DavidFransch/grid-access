"""Local dev server for the map.

Serves web/ as the site root, data/processed/ under /data/, and /config.js built
from MAPBOX_TOKEN in .env so the token never lives in code.
Binds to localhost only: the Eskom data must not be redistributed.
"""

import http.server
import json
import os
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "web/legacy"
DATA = ROOT / "data/processed"
PORT = int(os.environ.get("PORT", 8000))


def read_token():
    env = ROOT / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            key, _, value = line.partition("=")
            if key.strip() == "MAPBOX_TOKEN":
                return value.strip().strip("\"'")
    return os.environ.get("MAPBOX_TOKEN", "")


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WEB), **kwargs)

    def do_GET(self):
        if self.path == "/config.js":
            body = f"window.MAPBOX_TOKEN = {json.dumps(read_token())};".encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def end_headers(self):
        # Dev server: always serve the latest page and data, never a cached copy.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def translate_path(self, path):
        if path.startswith("/data/"):
            name = Path(path.split("?")[0]).name  # no subfolders, no ../
            return str(DATA / name)
        return super().translate_path(path)


if __name__ == "__main__":
    if not read_token():
        print("Warning: MAPBOX_TOKEN is empty. Add it to .env (see .env.example).")
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Map at http://localhost:{PORT}")
    server.serve_forever()
