#!/usr/bin/env python3
"""Serveur de développement pour la page Altitude.

Identique à `python3 -m http.server`, à une chose près : il interdit la mise
en cache. Sans cela le navigateur ressert l'ancien CSS après une modification,
et on débogue un rendu périmé.

    python3 serve.py          # http://localhost:8788
    python3 serve.py 3000     # sur un autre port
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8788


class SansCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Expires", "0")
        super().end_headers()

    def log_message(self, fmt, *args):
        if not args or not str(args[0]).startswith("GET"):
            super().log_message(fmt, *args)


if __name__ == "__main__":
    handler = partial(SansCache, directory=".")
    with ThreadingHTTPServer(("127.0.0.1", PORT), handler) as httpd:
        print(f"Altitude → http://localhost:{PORT}  (Ctrl+C pour arrêter)")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\narrêté")
