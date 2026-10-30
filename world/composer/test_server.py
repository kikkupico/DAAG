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
        server.BOOKS_DIR = tmp / "books"
        for slug in ("b", "other"):
            (server.BOOKS_DIR / slug).mkdir(parents=True)
            (server.BOOKS_DIR / slug / "index.html").write_text(f"<title>Book {slug} \u2014 A Paper</title>")
        (server.BOOKS_DIR / "eighteen-books-in-one-scroll").mkdir()
        (server.BOOKS_DIR / "eighteen-books-in-one-scroll" / "index.html").write_text("<title>x</title>")
        server.CAPTURES_DIR = tmp / "captures"
        server.CAPTURES_DIR.mkdir()
        server.DRAFTS_DIR = tmp / "drafts"
        server.DRAFTS_FILE = server.DRAFTS_DIR / "shots.json"
        server.RENDERS_DIR = tmp / "renders"
        server.FLUX_DIR = tmp / "flux"
        server.RENDERS_DIR.mkdir()
        server.FLUX_DIR.mkdir()
        server.TESTS_DIR = tmp / "tests"
        server.TESTS_FILE = server.TESTS_DIR / "shots.json"
        (server.TESTS_DIR / "renders").mkdir(parents=True)
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

    def test_placed_props_are_saved_and_removed(self):
        self.call("/api/books/b/shots", {"shot_id": "w", "shot": {"island": "paxos", "prompt": "p",
                                                                   "placed_props": [{"prop": "cart_0", "at": [1, 2, 3], "face": 90, "scale": 1}]}})
        w = self.shots()["w"]
        self.assertEqual(w["placed_props"][0]["prop"], "cart_0")
        self.assertNotIn("composed_with", w)      # a shot is a description; provenance lives in the pictures
        self.call("/api/books/b/shots", {"shot_id": "w", "shot": {"placed_props": None}})
        self.assertNotIn("placed_props", self.shots()["w"])

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

    def test_books_are_the_sites_books(self):
        books = {b["id"]: b for b in json.loads(self.call("/api/books")[1])["books"]}
        self.assertEqual(sorted(books), ["b", "other"])          # no overview page, no "examples" folder
        self.assertEqual((books["b"]["title"], books["other"]["shots_count"]), ("Book b", 0))
        self.assertEqual(self.call("/api/books/examples/shots", {"shot_id": "x", "shot": {"a": 1}})[0], 400)
        self.assertEqual(self.call("/api/books/other/shots", {"shot_id": "x", "shot": {"a": 1}})[0], 200)
        self.assertEqual(json.loads(self.call("/api/books/other/shots")[1])["shots"]["x"], {"a": 1})

    def test_test_shots_are_kept_apart_from_books(self):
        shot = {"island": "paxos", "cam": [1, 2, 3], "target": [0, 0, 0], "lens": 26, "aspect": "3:4", "evil": 1}
        self.assertEqual(self.call("/api/tests", {"id": "door", "shot": shot})[0], 200)
        self.assertEqual(self.call("/api/tests", {"id": "../x", "shot": shot})[0], 400)
        self.assertEqual(self.call("/api/tests", {"id": "bad", "shot": {"island": "paxos", "cam": [1]}})[0], 400)
        data = json.loads(self.call("/api/tests")[1])
        self.assertEqual(sorted(data["shots"]), ["door"])
        self.assertNotIn("evil", data["shots"]["door"])
        self.assertEqual(data["renders"]["door"], [])
        self.assertFalse((server.PANELS_DIR / "door").exists())              # nothing lands in world/panels
        self.assertEqual(self.call("/api/render", {"island": "paxos", "shot": shot, "test": "nope"})[0], 400)
        self.call("/api/tests/delete", {"id": "door"})
        self.assertEqual(json.loads(self.call("/api/tests")[1])["shots"], {})

    def test_light_presets_come_from_render_py_and_weather_is_validated(self):
        presets = json.loads(self.call("/api/lights")[1])["presets"]
        self.assertEqual(presets["golden"]["sky"], "sun")
        self.assertEqual(presets["overcast"]["sky"], "hdri")
        shot = {"cam": [1, 2, 3], "target": [0, 0, 0], "light": "cloudy_sun"}
        spec, err = server.clean_spec({"island": "paxos", "shot": dict(shot, sun_elev=30, sun_scale=0.5, fog_scale=0)})
        self.assertEqual((err, spec["light"], spec["sun_elev"], spec["fog_scale"]), (None, "cloudy_sun", 30, 0))
        for bad in ({"sun_elev": 200}, {"sun_scale": 0}, {"fog_scale": "x"}):
            self.assertIsNotNone(server.clean_spec({"island": "paxos", "shot": dict(shot, **bad)})[1], bad)

    def test_flux_request_is_checked(self):
        (server.RENDERS_DIR / "r.png").write_bytes(b"x")
        ok = {"previs": "render:r.png", "prompt": "p", "cast": [], "seed": 3}
        spec, err = server.clean_flux(ok)
        self.assertEqual((err, spec["seed"], spec["cast"]), (None, 3, []))
        for bad in ({"previs": "render:../server.py"}, {"previs": "other:r.png"}, {"previs": "r.png"}, {"prompt": " "},
                    {"cast": ["../x"]}, {"cast": ["no-such-person"]}, {"seed": -1}, {"seed": "7"}):
            self.assertIsNotNone(server.clean_flux(dict(ok, **bad))[1], bad)
        self.assertEqual(self.call("/api/flux", {"previs": "capture:nope.png", "prompt": "p"})[0], 400)

    def test_attempts_are_those_from_the_same_camera_and_target(self):
        def put(folder, name, note):
            (folder / f"{name}.png").write_bytes(b"x")
            (folder / f"{name}.json").write_text(json.dumps(note))
        here = {"cam": [1.0, 2.0, 3.0], "target": [4.0, 5.0, 6.0]}
        put(server.RENDERS_DIR, "r-here", {"view": here, "lens": 26, "aspect": "3:4", "light": "golden"})
        put(server.RENDERS_DIR, "r-other-light", {"view": here, "lens": 50, "aspect": "16:9", "light": "dusk"})
        put(server.RENDERS_DIR, "r-moved", {"view": {"cam": [1.0, 2.5, 3.0], "target": [4.0, 5.0, 6.0]}})
        put(server.RENDERS_DIR, "r-turned", {"view": {"cam": [1.0, 2.0, 3.0], "target": [4.0, 5.0, 7.0]}})
        (server.RENDERS_DIR / "r-unknown.png").write_bytes(b"x")                 # made before views were recorded
        put(server.CAPTURES_DIR, "c-here", dict(here, lens=26))
        put(server.FLUX_DIR, "f-from-render", {"previs": str(server.RENDERS_DIR / "r-here.png"), "seed": 7})
        put(server.FLUX_DIR, "f-from-capture", {"previs": str(server.CAPTURES_DIR / "c-here.png"), "seed": 8})
        put(server.FLUX_DIR, "f-elsewhere", {"previs": str(server.RENDERS_DIR / "r-moved.png"), "seed": 9})
        q = "cam=1.0,2.0,3.0&target=4.0,5.0,6.0"
        self.assertTrue(server.same_view(here, {"cam": [1.0, 2.0, 3.0], "target": [7.0, 8.0, 9.0]}))      # same line of sight, further on
        self.assertFalse(server.same_view(here, {"cam": [1.0, 2.0, 3.0], "target": [4.0, 5.0, 6.5]}))     # looking elsewhere
        got = json.loads(self.call(f"/api/history?{q}")[1])
        self.assertEqual(sorted(r["url"] for r in got["renders"]), ["/renders/r-here.png", "/renders/r-other-light.png"])
        self.assertEqual(sorted(f["url"] for f in got["flux"]), ["/flux/f-from-capture.png", "/flux/f-from-render.png"])
        self.assertEqual([r.get("lens") for r in got["renders"] if r["url"].endswith("r-other-light.png")], [50])
        everything = json.loads(self.call("/api/history")[1])
        self.assertEqual(len(everything["renders"]), 5)

    def test_shots_have_ids_and_their_pictures_carry_them(self):
        shot = {"island": "paxos", "cam": [1.0, 2.0, 3.0], "target": [4.0, 5.0, 6.0], "lens": 26, "aspect": "3:4", "evil": 1}
        a = json.loads(self.call("/api/shots", {"shot": shot})[1])["id"]
        b = json.loads(self.call("/api/shots", {"shot": dict(shot, lens=50)})[1])["id"]
        self.assertEqual((a, b), ("shot-1", "shot-2"))
        self.call("/api/shots", {"id": a, "name": "Door", "shot": shot})              # saving again keeps the id
        data = json.loads(self.call("/api/shots")[1])
        self.assertEqual(sorted(data["shots"]), ["shot-1", "shot-2"])
        self.assertEqual((data["shots"][a]["name"], "evil" in data["shots"][a]), ("Door", False))
        self.assertEqual(self.call("/api/shots", {"id": "../x", "shot": shot})[0], 400)

        def put(folder, name, note):
            (folder / f"{name}.png").write_bytes(b"x")
            (folder / f"{name}.json").write_text(json.dumps(note))
        view = {"cam": shot["cam"], "target": shot["target"]}
        put(server.RENDERS_DIR, "s1-a", {"shot": a, "view": view})
        put(server.RENDERS_DIR, "s1-b", {"shot": a, "view": {"cam": [9, 9, 9], "target": shot["target"]}})
        put(server.RENDERS_DIR, "s2-a", {"shot": b, "view": view})
        put(server.FLUX_DIR, "f1", {"shot": a, "previs": str(server.RENDERS_DIR / "s1-a.png"), "seed": 1})
        urls = lambda q: sorted(r["url"] for r in json.loads(self.call(f"/api/history?{q}")[1])["renders"]
                                if r["url"].startswith("/renders/s"))        # (the folder is shared with the other tests)
        # attempts are matched by camera position and look direction, not by shot id: shot-2's render is the same view
        self.assertEqual(urls("cam=1.0,2.0,3.0&target=4.0,5.0,6.0"), ["/renders/s1-a.png", "/renders/s2-a.png"])
        summary = json.loads(self.call("/api/shots")[1])["summary"]
        self.assertEqual((summary[a]["counts"], summary[b]["counts"]), ({"renders": 2, "flux": 1}, {"renders": 1, "flux": 0}))
        self.call("/api/shots/delete", {"id": b})
        self.assertEqual(sorted(json.loads(self.call("/api/shots")[1])["shots"]), [a])

    def test_render_spec_is_cleaned(self):
        spec, err = server.clean_spec({"island": "paxos", "size": "1K", "shot": {
            "cam": [1, 2, "+1.7"], "target": [0, 0, 0], "aspect": "3:4", "light": "nonsense", "evil": "x", "lights": []}})
        self.assertIsNone(err)
        self.assertEqual((spec["light"], spec["res"], "evil" in spec, "lights" in spec), ("golden", [896, 1200], False, False))
        for bad in ({"island": "x", "shot": {}}, {"island": "paxos", "shot": {"cam": [1, 2], "target": [0, 0, 0]}},
                    {"island": "paxos", "shot": {"cam": [1, 2, "__import__('os')"], "target": [0, 0, 0]}},
                    {"island": "paxos", "shot": {"cam": [1, 2, 3], "target": [0, 0, 0], "site": "../x"}}):
            self.assertIsNotNone(server.clean_spec(bad)[1], bad)
        bad_props = {"island": "paxos", "shot": {"cam": [1, 2, 3], "target": [0, 0, 0],
                                                 "placed_props": [{"prop": "../x", "at": [0, 0, 0]}]}}
        self.assertIsNotNone(server.clean_spec(bad_props)[1])
        good = {"island": "paxos", "shot": {"cam": [1, 2, 3], "target": [0, 0, 0],
                                            "placed_props": [{"prop": "cart_0", "at": [0, 0, 0], "face": 90, "scale": 1}]}}
        self.assertEqual(server.clean_spec(good)[0]["placed_props"][0]["prop"], "cart_0")
        self.assertEqual(self.call("/api/render", {"island": "paxos", "shot": {}})[0], 400)
        self.assertEqual(self.call("/api/render/nope")[0], 404)

    def test_shot_pictures_listed_and_served(self):
        d = server.PANELS_DIR / "b" / "s" / "a"
        d.mkdir(parents=True)
        from PIL import Image
        Image.new("RGB", (40, 60)).save(d / "previs-abc.png")
        Image.new("RGB", (40, 60)).save(server.PANELS_DIR / "b" / "s" / "scene-abc.png")
        imgs = json.loads(self.call("/api/books/b/shots")[1])["images"]
        self.assertEqual(imgs["s/a"], {"previs": "/panels/b/s/a/previs-abc.png"})
        self.assertEqual(imgs["s"], {"scene": "/panels/b/s/scene-abc.png"})
        self.assertEqual(self.call("/panels/b/s/a/previs-abc.png?w=20")[0], 200)
        self.assertEqual(self.call("/panels/..%2Fx.png")[0], 404)

    def test_prompt_comes_from_pipeline(self):
        st, raw = self.call("/api/prompt")
        data = json.loads(raw)
        self.assertEqual(st, 200)
        self.assertTrue("styles" in data or "error" in data)


if __name__ == "__main__":
    unittest.main()
