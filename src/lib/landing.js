/* Magnera '26 — landing: pointer + scroll parallax, mobile bridge carousel, countdown

   Migrated verbatim from the original main.js. The logic is unchanged — it still
   queries the DOM directly and writes transforms straight onto elements every
   animation frame (that's deliberate: see the perf notes below, and the "Performance
   conventions" section of CLAUDE.md). The only things added for React are the
   initLanding() wrapper and the dispose() it returns, so the effect that calls this
   can undo everything on unmount/HMR instead of leaking listeners forever. */

import Lenis from "lenis";
import { Portal, warpOut, arrive, reduceMotion } from "./fx.js";

const CONFIG = {
  // Fest start (local time). Change when the date is final.
  festDate: new Date("2027-01-29T09:00:00+05:30"),
  parallaxEase: 0.06,   // lower = floatier
  slideEase: 0.1,
};

export function initLanding() {
  const cleanups = [];
  const on = (target, type, handler, opts) => {
    target.addEventListener(type, handler, opts);
    cleanups.push(() => target.removeEventListener(type, handler, opts));
  };

  const stage = document.getElementById("stage");
  const mobile = matchMedia("(max-width: 760px)");

  /* ───────── Parallax: pointer / tilt / scroll ───────── */

  // Each layer's transform is computed here and written straight onto that layer —
  // no CSS variables on the stage, so a move never restyles the stage's whole subtree.
  const layers = [...document.querySelectorAll(".layer")].map((el) => ({
    el,
    depth: +el.dataset.depth || 0,     // pointer/tilt parallax strength
    scroll: +el.dataset.scroll || 0,   // scroll parallax speed
    pan: +el.dataset.pan || 0,         // mobile: vw moved while the island panels slide
    last: "",
  }));
  const bgLayer = document.querySelector(".layer--bg");
  const bgImg = bgLayer.querySelector("img");
  const track = document.getElementById("track");
  const hudTop = document.querySelector(".hud--top");

  const pointer = { x: 0, y: 0 };  // target, -1..1
  const eased = { x: 0, y: 0 };

  on(window, "pointermove", (e) => {
    if (e.pointerType === "touch") return;
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  });
  on(document, "pointerleave", () => { pointer.x = 0; pointer.y = 0; });

  // Phones: tilt drives the parallax (iOS needs a permission prompt; skipped there)
  // Readings are quantised so sensor jitter doesn't keep the page busy.
  const q = (v) => Math.round(v * 40) / 40;
  on(window, "deviceorientation", (e) => {
    if (e.gamma == null) return;
    pointer.x = q(Math.max(-1, Math.min(1, e.gamma / 25)));
    pointer.y = q(Math.max(-1, Math.min(1, (e.beta - 45) / 25)));
  });

  /* ───────── Mobile: bridge ⇄ island panels ───────── */

  const panels = [...document.querySelectorAll(".panel")];
  let slideTarget = 0;   // -1 technical · 0 bridge · 1 cultural
  let slide = 0;         // eased

  let portalTimer;
  function go(to) {
    slideTarget = Math.max(-1, Math.min(1, Math.round(to)));
    panels.forEach((p) => {
      // off-screen panels shouldn't be tabbable on mobile
      p.inert = mobile.matches && Number(p.dataset.slide) !== slideTarget;
    });
    // mobile: the island that slides into view opens its portal once it settles
    if (!mobile.matches || !portals) return;
    clearTimeout(portalTimer);
    portals.forEach((p) => { if (p.slide !== slideTarget) p.fx.close(); });
    const next = portals.find((p) => p.slide === slideTarget);
    if (next) portalTimer = setTimeout(() => next.fx.open(), 420);
  }

  document.querySelectorAll("[data-go]").forEach((btn) =>
    on(btn, "click", () => go(Number(btn.dataset.go)))
  );

  on(mobile, "change", () => { portals?.forEach((p) => p.fx.close()); go(0); });

  on(window, "keydown", (e) => {
    if (!mobile.matches || scrollY > stage.offsetHeight / 2) return;
    if (e.key === "ArrowLeft") go(slideTarget - 1);
    if (e.key === "ArrowRight") go(slideTarget + 1);
  });

  // Horizontal swipe (vertical movement is left to page scroll via touch-action: pan-y)
  let drag = null;
  on(stage, "pointerdown", (e) => {
    if (!mobile.matches) return;
    drag = { x: e.clientX, from: slideTarget, moved: false };
  });
  on(stage, "pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 8) {
      drag.moved = true;
      stage.setPointerCapture(e.pointerId);
    }
    if (drag.moved) {
      slideTarget = Math.max(-1.15, Math.min(1.15, drag.from - dx / innerWidth));
      slide = slideTarget; // follow the finger directly
    }
  });
  function endDrag(e) {
    if (!drag) return;
    if (drag.moved) {
      const dx = e.clientX - drag.x;
      go(Math.abs(dx) > innerWidth * 0.15 ? drag.from - Math.sign(dx) : drag.from);
      stage.addEventListener("click", (ev) => { ev.preventDefault(); ev.stopPropagation(); }, { capture: true, once: true });
    }
    drag = null;
  }
  on(stage, "pointerup", endDrag);
  on(stage, "pointercancel", () => { if (drag?.moved) go(drag.from); drag = null; });

  /* ───────── Old-world bridge (SVG, 400×110 units; stretches with its box) ─────────
     Weathered planks, hemp rope, mossy stone pillars — matched to the ruined islands. */

  function buildBridge() {
    const svg = document.getElementById("bridge");
    const NS = "http://www.w3.org/2000/svg";
    const el = (tag, attrs) => {
      const n = document.createElementNS(NS, tag);
      for (const k in attrs) n.setAttribute(k, attrs[k]);
      svg.appendChild(n);
      return n;
    };
    const f = (n) => n.toFixed(2);

    // deterministic "random" so the bridge looks the same every load
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    svg.innerHTML = `
      <defs>
        <linearGradient id="br-stone" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#4a443b"/><stop offset=".4" stop-color="#9a8f7c"/><stop offset=".7" stop-color="#77705f"/><stop offset="1" stop-color="#3f3a32"/>
        </linearGradient>
        <radialGradient id="br-lamp"><stop offset="0" stop-color="#ffc47a" stop-opacity=".5"/><stop offset="1" stop-color="#ff9a4a" stop-opacity="0"/></radialGradient>
        <radialGradient id="br-blue"><stop offset="0" stop-color="#7fd6ff" stop-opacity=".45"/><stop offset="1" stop-color="#3fa9ff" stop-opacity="0"/></radialGradient>
        <radialGradient id="br-pink"><stop offset="0" stop-color="#ff9cc4" stop-opacity=".45"/><stop offset="1" stop-color="#ff3b8a" stop-opacity="0"/></radialGradient>
      </defs>`;

    const L = 44, R = 356;
    const sag = (y0, mid) => (t) => ({
      x: (1 - t) ** 2 * L + 2 * (1 - t) * t * 200 + t * t * R,
      y: (1 - t) ** 2 * y0 + 2 * (1 - t) * t * (2 * mid - y0) + t * t * y0,
    });
    const deck = sag(44, 70);
    const rail = sag(14, 40);
    const rail2 = sag(29, 56);
    const path = (fn, n = 48) =>
      Array.from({ length: n + 1 }, (_, i) => fn(i / n))
        .map((p, i) => `${i ? "L" : "M"}${f(p.x)} ${f(p.y)}`).join(" ");
    const rope = (w, c = "#8a6a48") => `fill:none;stroke:${c};stroke-width:${w};stroke-linecap:round`;

    // guy ropes from the pillars down onto the islands
    el("path", { d: `M${L} 16 L6 50 M${R} 16 L394 50`, style: rope(1.1, "#6e5238") });

    // rope suspenders (slightly irregular), with a lower hand-rope
    for (let i = 1; i < 26; i++) {
      const t = i / 26, a = rail(t), b = deck(t), j = (rnd() - 0.5) * 1.2;
      el("line", { x1: f(a.x), y1: f(a.y), x2: f(b.x + j), y2: f(b.y), style: "stroke:#7a5c3e;stroke-width:.6" });
    }
    el("path", { d: path(rail2), style: rope(0.9, "#7a5c3e") });

    // weathered planks — uneven, a couple missing
    const woods = ["#3d2b1f", "#4a3526", "#35261b", "#523b29"];
    const planks = (fn, n, gaps = []) => {
      for (let i = 0; i < n; i++) {
        if (gaps.includes(i)) continue;
        const p = fn((i + 0.08) / n), q = fn((i + 0.92) / n), dy = (rnd() - 0.5) * 0.8;
        el("line", { x1: f(p.x), y1: f(p.y + 2.4 + dy), x2: f(q.x), y2: f(q.y + 2.4 - dy), style: `stroke:${woods[Math.floor(rnd() * 4)]};stroke-width:4.8` });
        el("line", { x1: f(p.x), y1: f(p.y + dy), x2: f(q.x), y2: f(q.y - dy), style: "stroke:#9a7650;stroke-width:.6;opacity:.55" });
      }
    };
    planks(deck, 40, [13, 27]);
    planks((t) => ({ x: 6 + (L - 6) * t, y: 50 - 6 * t }), 5);
    planks((t) => ({ x: R + (394 - R) * t, y: 44 + 6 * t }), 5);

    // dark stringer beam under the planks + rope lashings
    const beam = (t) => { const p = deck(t); return { x: p.x, y: p.y + 5.2 }; };
    el("path", { d: path(beam), style: rope(1.6, "#2a1d14") });
    for (let i = 1; i < 20; i++) {
      const p = beam(i / 20);
      el("line", { x1: f(p.x - 0.6), y1: f(p.y - 3), x2: f(p.x + 0.6), y2: f(p.y + 1), style: "stroke:#6e5238;stroke-width:.7" });
    }

    // moss clumps + trailing ivy
    for (const t of [0.05, 0.13, 0.22, 0.31, 0.4, 0.57, 0.66, 0.75, 0.84, 0.93]) {
      const p = beam(t);
      el("ellipse", { cx: f(p.x), cy: f(p.y), rx: f(2 + rnd() * 2.5), ry: 1.3, style: "fill:#3e5a26" });
      const len = 6 + rnd() * 16, bend = (rnd() - 0.5) * 7;
      const end = { x: p.x + bend, y: p.y + len };
      el("path", { d: `M${f(p.x)} ${f(p.y)} Q${f(p.x - bend)} ${f(p.y + len * 0.6)} ${f(end.x)} ${f(end.y)}`, style: "fill:none;stroke:#2f4a1c;stroke-width:.7" });
      for (let k = 1; k <= 4; k++) {
        const u = k / 5, cx = p.x + (end.x - p.x) * u, cy = p.y + len * u;
        el("ellipse", {
          cx: f(cx + (k % 2 ? 1.2 : -1.2)), cy: f(cy), rx: 1.4, ry: 0.75,
          transform: `rotate(${k % 2 ? 35 : -35} ${f(cx)} ${f(cy)})`,
          style: `fill:${k % 2 ? "#476b2a" : "#34521f"}`,
        });
      }
      if (rnd() > 0.7) el("circle", { cx: f(end.x), cy: f(end.y + 1), r: 1, style: "fill:#b8567a" });
    }

    // main hand-rope, with a twisted strand
    el("path", { d: path(rail), style: rope(2.2) });
    el("path", { d: path(rail), style: "fill:none;stroke:#4a3524;stroke-width:.9;stroke-dasharray:1.2 2.4" });

    // two dim hanging lanterns
    for (const t of [0.3, 0.7]) {
      const p = rail(t), y = p.y + 9;
      el("line", { x1: f(p.x), y1: f(p.y), x2: f(p.x), y2: f(y - 3), style: "stroke:#5a4028;stroke-width:.5" });
      el("circle", { cx: f(p.x), cy: f(y), r: 6, style: "fill:url(#br-lamp)" });
      el("path", { d: `M${f(p.x - 1.7)} ${f(y - 3)} h3.4 l-.5 5 h-2.4z`, style: "fill:#e8a95c;stroke:#2e2118;stroke-width:.5" });
    }

    // stone pillars: carved rings, moss caps, a small crystal set in each
    for (const [x, halo, crystal] of [[L, "br-blue", "#9fdcf5"], [R, "br-pink", "#f2a9c6"]]) {
      el("path", { d: `M${x - 8} 66 L${x + 8} 66 L${x + 6.5} 58 L${x - 6.5} 58 Z`, style: "fill:url(#br-stone)" });
      el("rect", { x: x - 4.5, y: 12, width: 9, height: 47, style: "fill:url(#br-stone)" });
      for (const y of [22, 38, 52]) el("line", { x1: x - 4.5, y1: y, x2: x + 4.5, y2: y, style: "stroke:#3a352e;stroke-width:.8" });
      el("path", { d: `M${x - 6.5} 12 L${x + 6.5} 12 L${x + 5} 7 L${x - 5} 7 Z`, style: "fill:url(#br-stone)" });
      el("ellipse", { cx: x - 1, cy: 7.5, rx: 5.5, ry: 1.8, style: "fill:#3e5a26" });
      el("path", { d: `M${x - 4.5} 14 q1 6 -.5 12`, style: "fill:none;stroke:#3e5a26;stroke-width:1.2" });
      el("circle", { cx: x, cy: 1, r: 8, style: `fill:url(#${halo})` });
      el("path", { d: `M${x} -4 L${x + 2.6} 1.5 L${x} 7 L${x - 2.6} 1.5 Z`, style: `fill:${crystal};stroke:#2e2a26;stroke-width:.4` });
    }
  }

  /* Desktop: string the bridge between the two islands' platforms */
  const bridgeBox = document.querySelector(".bridge");
  const ANCHOR = { x: 0.8, y: 0.47 };   // platform edge, as a fraction of the island image
  function placeBridge() {
    if (mobile.matches) { bridgeBox.removeAttribute("style"); return; }
    const tech = document.querySelector(".panel--tech .island");
    const cult = document.querySelector(".panel--cult .island");
    const x1 = tech.parentElement.offsetLeft + tech.offsetWidth * ANCHOR.x;
    const x2 = cult.parentElement.offsetLeft + cult.offsetWidth * (1 - ANCHOR.x);
    const y = tech.parentElement.offsetTop + tech.offsetHeight * ANCHOR.y;
    // deck ends sit at x 6 / 394 (of 400) and y ≈ 48 (of 110) in the SVG
    const width = (x2 - x1) / (388 / 400);
    const height = width * (110 / 400);
    bridgeBox.style.left = `${x1 - width * (6 / 400)}px`;
    bridgeBox.style.width = `${width}px`;
    bridgeBox.style.top = `${y - height * (48 / 110)}px`;
  }
  on(window, "resize", placeBridge);
  on(mobile, "change", placeBridge);

  /* ───────── Smooth scroll (Lenis; wheel/trackpad only, touch stays native) ───────── */

  const lenis = !reduceMotion && !matchMedia("(pointer: coarse)").matches
    ? new Lenis({ lerp: 0.085, anchors: true })
    : null;

  /* ───────── Render loop ───────── */

  // Sizes cached on resize: the loop below never reads layout
  let vw = innerWidth, vh = innerHeight;
  let stageW = stage.offsetWidth, stageH = stage.offsetHeight;
  let bgOverflow = 0;   // how much wider the background art is than its layer (mobile pan range)

  // Size the background art explicitly (instead of object-fit/object-position) so the
  // mobile pan is a plain translate — composited, no repaint.
  function sizeBg() {
    const lw = bgLayer.offsetWidth, lh = bgLayer.offsetHeight, ar = 1672 / 941;
    let w = Math.max(lw, lh * ar), h = w / ar;
    // "Cover" sizing zooms based on width when the box is proportionally wider than the
    // art (any desktop screen shorter/wider than ~1.78:1), cropping the excess off the
    // top and bottom. On a short, wide window that zoom — and the crop — can get severe
    // enough to cut into the mountains/tower. Cap it: past ~25% vertical crop, stop
    // zooming to cover and shrink instead, even if that leaves the layer's own (night-
    // sky-coloured) edges showing at the sides — same shrink the mobile carousel already
    // gets from the opposite kind of narrow/tall box, just for the other extreme.
    const maxH = lh * 1.25;
    if (h > maxH) { h = maxH; w = h * ar; }
    const posX = mobile.matches ? 0.575 : 0.5;   // tower centred on phones
    bgOverflow = w - lw;
    Object.assign(bgImg.style, {
      width: `${w}px`, height: `${h}px`,
      left: `${(lw - w) * posX}px`, top: `${(lh - h) * 0.4}px`,
    });
  }
  // Each layer is oversized (inset: -5%) so parallax never shows its edges. Measure that
  // margin per layer; the loop clamps pointer/tilt movement (+ mobile pan) inside it.
  // The islands layer is see-through at its edges, so it's free to move.
  function measureLayers() {
    for (const l of layers) {
      l.clamp = !l.el.classList.contains("layer--islands");
      l.bx = Math.max(0, (l.el.offsetWidth - stageW) / 2 - 1);
      l.by = Math.max(0, (l.el.offsetHeight - stageH) / 2 - 1);
    }
  }
  const clamp = (v, m) => Math.max(-m, Math.min(m, v));

  function onResize() {
    vw = innerWidth; vh = innerHeight;
    stageW = stage.offsetWidth; stageH = stage.offsetHeight;
    measureLayers();
    sizeBg();
    layers.forEach((l) => (l.last = ""));
    // null, not "": the track's desktop value *is* "", so resetting to "" would skip
    // clearing the mobile slide transform when the viewport widens past the breakpoint
    frameLast.bg = frameLast.track = frameLast.hud = null;
  }
  on(window, "resize", onResize);
  on(mobile, "change", onResize);

  const frameLast = { bg: "", track: "", hud: "" };
  const write = (key, el, value) => { if (frameLast[key] !== value) { frameLast[key] = value; el.style.transform = value; } };

  /* ───────── About walls: on mobile, scrolling pans from wall 1 to wall 2 ─────────
     The section is tall with a sticky frame; the pan is tied 1:1 to scroll position —
     scroll and it moves, stop and it stops. Sizes are cached; the loop never reads layout. */

  const WALLS = { centres: [0.308, 0.7165], ar: 1672 / 941 };
  const walls = document.querySelector(".walls");
  const wallsScene = walls.querySelector(".walls__scene");
  let wallsTop = 0, wallsSpan = 1, wallsFrameH = 0, wallsLast = "";
  function measureWalls() {
    wallsTop = walls.getBoundingClientRect().top + scrollY;
    wallsSpan = Math.max(1, walls.offsetHeight - innerHeight);
    wallsFrameH = walls.querySelector(".walls__frame").offsetHeight;
    wallsLast = null;   // force the next updateWalls() to write (or clear) the transform
  }
  on(window, "resize", measureWalls);
  on(window, "load", measureWalls);
  on(mobile, "change", measureWalls);
  measureWalls();

  function updateWalls() {
    if (!mobile.matches) {
      if (wallsLast !== "") { wallsLast = ""; wallsScene.style.transform = ""; }
      return;
    }
    const p = Math.max(0, Math.min(1, (scrollY - wallsTop) / wallsSpan));
    const [c1, c2] = WALLS.centres;
    const x = vw / 2 - (c1 + (c2 - c1) * p) * wallsFrameH * WALLS.ar;
    const t = `translate3d(${x.toFixed(1)}px, 0, 0)`;
    if (t !== wallsLast) { wallsLast = t; wallsScene.style.transform = t; }
  }

  // torches only flicker while the walls are on screen
  const wallsObserver = new IntersectionObserver(([e]) => walls.classList.toggle("is-visible", e.isIntersecting));
  wallsObserver.observe(walls);

  let rafId = null;
  let disposed = false;
  function frame(time) {
    if (disposed) return;
    lenis?.raf(time);

    const k = reduceMotion ? 1 : CONFIG.parallaxEase;
    eased.x += (pointer.x - eased.x) * k;
    eased.y += (pointer.y - eased.y) * k;
    if (Math.abs(pointer.x - eased.x) < 0.0005) eased.x = pointer.x;
    if (Math.abs(pointer.y - eased.y) < 0.0005) eased.y = pointer.y;

    if (!drag?.moved) {
      slide += (slideTarget - slide) * (reduceMotion ? 1 : CONFIG.slideEase);
      if (Math.abs(slideTarget - slide) < 0.0005) slide = slideTarget;
    }

    updateWalls();

    const sy = reduceMotion ? 0 : Math.min(scrollY, stageH);
    const s = mobile.matches ? slide : 0;

    // off-screen landing: nothing to move
    if (sy < stageH) {
      for (const l of layers) {
        let tx = -eased.x * l.depth * vw - (s * l.pan * vw) / 100;
        let ty = -eased.y * l.depth * vh;
        if (l.clamp) { tx = clamp(tx, l.bx); ty = clamp(ty, l.by); }
        ty += sy * l.scroll;   // scroll drift: only layers that lag (move down) — their top edge is already off-screen
        const t = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
        if (t !== l.last) { l.last = t; l.el.style.transform = t; }
      }
      // background: mobile pan across the art + a slow zoom as you scroll away
      write("bg", bgImg, `translate3d(${(-bgOverflow * 0.24 * s).toFixed(1)}px, 0, 0) scale(${(1 + sy * 0.00018).toFixed(4)})`);
      // mobile island track
      write("track", track, mobile.matches ? `translate3d(${((-1 - s) * vw).toFixed(1)}px, 0, 0)` : "");
      // top bar drifts up and fades
      const hud = `translate3d(0, ${(-sy * 0.25).toFixed(1)}px, 0)`;
      if (frameLast.hud !== hud) { frameLast.hud = hud; hudTop.style.transform = hud; hudTop.style.opacity = Math.max(0, 1 - sy / 450).toFixed(3); }
    }

    rafId = requestAnimationFrame(frame);
  }

  /* ───────── Portals: open on hover (desktop) / when in view (mobile) ───────── */

  var portals = [...document.querySelectorAll(".island")].map((island) => ({
    island,
    slide: Number(island.closest(".panel").dataset.slide),
    fx: new Portal(island.querySelector(".portal")),
  }));

  portals.forEach(({ island, fx }) => {
    const enter = () => { if (!mobile.matches) fx.open(); };
    const leave = () => { if (!mobile.matches && !island.classList.contains("is-warping")) fx.close(); };
    on(island, "pointerenter", enter);
    on(island, "pointerleave", leave);
    on(island, "focus", enter);
    on(island, "blur", leave);

    // click → fly into the portal → realm page
    on(island, "click", (e) => {
      e.preventDefault();
      island.classList.add("is-warping");
      fx.open();
      warpOut({
        from: island.querySelector(".portal"),
        zoom: stage,
        url: island.getAttribute("href"),
        tint: getComputedStyle(island).getPropertyValue("--accent").trim(),
      });
    });
  });

  // Mobile: tapping the empty sky around an island returns to the bridge
  panels.forEach((p) => {
    on(p, "click", (e) => {
      if (mobile.matches && e.target === p && Number(p.dataset.slide) !== 0) go(0);
    });
  });

  /* ───────── Sections fade/slide in as they scroll into view ───────── */

  const revealer = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); revealer.unobserve(e.target); }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll(".section > *, .card").forEach((n, i) => {
    n.classList.add("reveal");
    if (n.classList.contains("card")) n.style.transitionDelay = `${(i % 3) * 90}ms`;
    revealer.observe(n);
  });

  /* ───────── Countdown ───────── */

  // .countdown, not #countdown: there are now two banners (the corner one on desktop,
  // the original hanging one on mobile), each with its own set of unit elements, so this
  // groups ALL of them by unit and tick() below writes every element in each group.
  const units = { d: [], h: [], m: [], s: [] };
  document.querySelectorAll(".countdown b").forEach((b) => units[b.dataset.unit]?.push(b));
  function tick() {
    let s = Math.max(0, Math.floor((CONFIG.festDate - Date.now()) / 1000));
    const d = Math.floor(s / 86400); s -= d * 86400;
    const h = Math.floor(s / 3600);  s -= h * 3600;
    const m = Math.floor(s / 60);    s -= m * 60;
    const write = (arr, v) => arr.forEach((el) => (el.textContent = v));
    write(units.d, String(d).padStart(3, "0"));
    write(units.h, String(h).padStart(2, "0"));
    write(units.m, String(m).padStart(2, "0"));
    write(units.s, String(s).padStart(2, "0"));
  }

  /* ───────── Boot ───────── */

  buildBridge();
  placeBridge();
  tick();
  const countdownInterval = setInterval(tick, 1000);
  let returnTo = 0;   // -1 technical · 1 cultural: the realm we're coming back from
  try {
    returnTo = Number(sessionStorage.getItem("magnera:slide")) || 0;
    sessionStorage.removeItem("magnera:slide");
  } catch {}
  // coming back through a warp: pull out of that island's portal
  const arrived = arrive({
    zoom: stage,
    focus: () => portals.find((p) => p.slide === returnTo)?.island.querySelector(".portal"),
  });
  if (arrived && mobile.matches && returnTo) {
    slide = slideTarget = returnTo;   // land on the island we left from, no slide
    go(returnTo);
  } else {
    go(0);
  }
  let introTimer;
  if (!reduceMotion && !arrived) {
    stage.classList.add("is-intro");
    introTimer = setTimeout(() => stage.classList.remove("is-intro"), 3200);
  }

  // back/forward cache: the page comes back as it was left, mid-warp — reset the island
  on(window, "pageshow", (e) => {
    if (!e.persisted) return;
    portals.forEach(({ island, fx }) => { island.classList.remove("is-warping"); if (!mobile.matches) fx.close(); });
  });
  measureLayers();
  sizeBg();
  // landing scrolled away: pause its looping CSS animations (see .stage.is-offscreen)
  const offscreenObserver = new IntersectionObserver(([e]) => stage.classList.toggle("is-offscreen", !e.isIntersecting));
  offscreenObserver.observe(stage);
  rafId = requestAnimationFrame(frame);

  return function dispose() {
    disposed = true;
    if (rafId != null) cancelAnimationFrame(rafId);
    clearInterval(countdownInterval);
    clearTimeout(portalTimer);
    clearTimeout(introTimer);
    wallsObserver.disconnect();
    revealer.disconnect();
    offscreenObserver.disconnect();
    lenis?.destroy();
    cleanups.forEach((fn) => fn());
  };
}
