"""Server tests: python3 -m unittest world/composer/test_server.py (from the repo root)."""
import base64
import json
import sys
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.argv = [sys.argv[0]]  # server.py reads its own port and host from argv
import server  # noqa: E402

PNG = base64.b64encode(b"\x89PNG\r\n\x1a\n" + b"0" * 16).decode()


class ServerTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        tmp = Path(cls.tmp.name)
        server.PANELS_DIR = tmp / "panels"
        server.CAPTURES_DIR = tmp / "captures"
        server.CAPTURES_DIR.mkdir()
        book = server.PANELS_DIR / "b"
        book.mkdir(parents=True)
        (book / "shots.json").write_text(json.dumps({"s": {"base": "x", "cam": [1, 2, 3], "variants": {"a": {"lens": 20}}}}))
        cls.httpd = server.ReusableThreadingServer(("127.0.0.1", 0), server.ComposerHandler)
        cls.base = f"http://127.0.0.1:{cls.httpd.server_address[1]}"
        threading.Thread(target=cls.httpd.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.httpd.shutdown()
        cls.httpd.server_close()
        cls.tmp.cleanup()

    def call(self, path, body=None):
        req = urllib.request.Request(self.base + path, data=None if body is None else json.dumps(body).encode(),
                                     headers={"Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req) as r:
                return r.status, r.read()
        except urllib.error.HTTPError as e:
            return e.code, e.read()

    def shots(self):
        return json.loads((server.PANELS_DIR / "b" / "shots.json").read_text())

    def test_save_keeps_existing_keys_and_ignores_if_new(self):
        st, _ = self.call("/api/books/b/shots", {"shot_id": "s", "shot": {"prompt": "p"}, "if_new": {"cam": [9, 9, 9]}})
        self.assertEqual(st, 200)
        s = self.shots()["s"]
        self.assertEqual((s["base"], s["cam"], s["prompt"]), ("x", [1, 2, 3], "p"))
        self.assertIn("a", s["variants"])

    def test_new_shot_gets_if_new_and_variant_lands_in_variants(self):
        self.call("/api/books/b/shots", {"shot_id": "n", "shot": {"prompt": "q"}, "if_new": {"cam": [9, 9, 9]}})
        self.call("/api/books/b/shots", {"shot_id": "n", "variant": "b", "shot": {"light": "dusk"}})
        n = self.shots()["n"]
        self.assertEqual(n["cam"], [9, 9, 9])
        self.assertEqual(n["variants"]["b"], {"light": "dusk"})

    def test_null_removes_key(self):
        self.call("/api/books/b/shots", {"shot_id": "s", "shot": {"others": "x"}})
        self.call("/api/books/b/shots", {"shot_id": "s", "shot": {"others": None}})
        self.assertNotIn("others", self.shots()["s"])

    def test_rejects_bad_names(self):
        for book, sid in (("..", "s"), ("b", "../x"), ("b", "")):
            st, _ = self.call(f"/api/books/{book}/shots", {"shot_id": sid, "shot": {"a": 1}})
            self.assertIn(st, (400, 404), (book, sid))
        self.assertFalse((server.PANELS_DIR.parent / "shots.json").exists())

    def test_capture_stays_in_captures(self):
        st, raw = self.call("/api/capture", {"image_data": "data:image/png;base64," + PNG, "shot_id": "../../evil"})
        self.assertEqual(st, 200)
        name = json.loads(raw)["filename"]
        self.assertTrue((server.CAPTURES_DIR / name).is_file())
        self.assertEqual(list(server.PANELS_DIR.rglob("previs-*")), [])
        self.assertEqual(self.call("/api/capture", {"image_data": base64.b64encode(b"nope").decode()})[0], 400)

    def test_no_path_traversal(self):
        for p in ("/captures/..%2Fserver.py", "/cast/images/..%2F..%2Fcast.json", "/props/kit/..%2F..%2Fx",
                  "/props/polyhaven/..%2F..%2F..%2FREADME.md", "/%2e%2e/README.md"):
            self.assertEqual(self.call(p)[0], 404, p)

    def test_sites_in_blender_coordinates(self):
        for island in server.ISLANDS:
            st, raw = self.call(f"/api/sites/{island}")
            sites = json.loads(raw)["sites"]
            self.assertEqual(st, 200)
            self.assertTrue(sites, island)
            self.assertTrue(all({"id", "name", "x", "y", "z"} <= s.keys() for s in sites))
        self.assertEqual(self.call("/api/sites/..")[0], 404)

    def test_prompt_comes_from_pipeline(self):
        st, raw = self.call("/api/prompt")
        data = json.loads(raw)
        self.assertEqual(st, 200)
        self.assertTrue("styles" in data or "error" in data)


if __name__ == "__main__":
    unittest.main()
