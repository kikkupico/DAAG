/* Loads a book's real index.html into jsdom with its real scripts, so widgets run as in the browser.
   Reduced motion is on, so sleep() and tween() resolve at once. */
import { JSDOM, VirtualConsole } from "jsdom";
import { resolve } from "node:path";
import { readdirSync, existsSync } from "node:fs";

export const ROOT = resolve(import.meta.dirname, "..");
export const BOOKS = readdirSync(resolve(ROOT, "books")).filter(b => existsSync(resolve(ROOT, "books", b, "script.js")));

export function loadBook(slug, { reg = "i" } = {}) {
  const errors = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => errors.push(e.detail || e));
  vc.on("error", (...a) => errors.push(a.join(" ")));
  return new Promise((ok, fail) => {
    JSDOM.fromFile(resolve(ROOT, "books", slug, "index.html"), {
      runScripts: "dangerously", resources: "usable", pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) {
        w.matchMedia = q => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
        w.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
        w.ResizeObserver = w.IntersectionObserver;
        w.scrollTo = () => {};
        const P = w.SVGElement.prototype;
        P.getBBox = () => ({ x: 0, y: 0, width: 40, height: 12 });
        P.getTotalLength = () => 100;
        P.getPointAtLength = () => ({ x: 0, y: 0 });
        const noop = () => {};
        w.HTMLCanvasElement.prototype.getContext = () => new Proxy({}, { get: (t, k) => k === "canvas" ? null : (k in t ? t[k] : noop), set: (t, k, v) => (t[k] = v, true) });
        w.Element.prototype.scrollIntoView = noop;
        const store = new Map([["daag-apart-reg", reg]]);   // file:// has no localStorage
        Object.defineProperty(w, "localStorage", { value: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) } });
      },
    }).then(dom => {
      const w = dom.window;
      const done = () => ok({ dom, window: w, document: w.document, errors, close: () => w.close() });
      w.document.readyState === "complete" ? done() : w.addEventListener("load", done);
    }, fail);
  });
}

/* like a user: a disabled control does not respond */
export const click = el => el.disabled ? false : el.dispatchEvent(new el.ownerDocument.defaultView.MouseEvent("click", { bubbles: true }));
export const text = el => el.textContent.replace(/\s+/g, " ").trim();
