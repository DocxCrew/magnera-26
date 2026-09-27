import { useLandingFX } from "../hooks/useLandingFX.js";

// The landing page. Markup is a 1:1 JSX translation of the original index.html
// <body> — same elements, classes, ids and data-* attributes — because
// src/lib/landing.js (main.js, migrated) still queries this DOM directly and
// writes transforms onto it every frame. See CLAUDE.md's "Performance
// conventions" for why that stayed imperative instead of becoming React state.
export default function LandingPage() {
  useLandingFX();

  return (
    <>
      {/* ═══════════════ LANDING ═══════════════ */}
      <header className="stage" id="stage">

        {/* LAYER 1 — background: sky, clouds, alternate-reality campus */}
        <div className="layer layer--bg" data-depth="0.012" data-scroll="0.6" data-pan="0">
          <img decoding="async" src="assets/layer1-background.webp" alt="" draggable="false" />
        </div>

        {/* LAYER 2 — floating islands.
            Desktop: two islands placed in the scene.
            Mobile:  a 3-panel track  [Technical] [bridge + hero] [Cultural]  that slides horizontally. */}
        <div className="layer layer--islands" data-depth="0.03" data-scroll="0.3">
          <div className="track" id="track">

            <section className="panel panel--tech" data-slide="-1" aria-label="Technical Events">
              <a className="island" href="technical.html" style={{ "--accent": "#3fa9ff" }}>
                <img decoding="async" src="assets/layer2-island-baked.webp" alt="Floating island — Technical Events" draggable="false" />
                <span className="portal" aria-hidden="true"></span>
                <span className="island__label"><i className="gem"></i>Technical Events</span>
              </a>
            </section>

            <section className="panel panel--center" data-slide="0" aria-label="Choose a realm">
              <div className="bridge">
                <svg className="bridge__svg" id="bridge" viewBox="0 0 400 110" preserveAspectRatio="none" aria-hidden="true"></svg>
                <button className="bridge__end bridge__end--left" data-go="-1">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 5-7 7 7 7" /></svg>
                  <span><i className="gem" style={{ "--accent": "#3fa9ff" }}></i>Technical Events</span>
                </button>
                <button className="bridge__end bridge__end--right" data-go="1">
                  <span>Cultural Events<i className="gem" style={{ "--accent": "#ff3b8a" }}></i></span>
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
                </button>

                {/* royal banner hanging from the middle of the bridge */}
                <div className="banner" id="hero">
                  <svg className="banner__hanger" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">
                    <path d="M50 3 L4 30 M50 3 L96 30" />
                    <circle cx="50" cy="3" r="2.4" />
                  </svg>
                  <div className="banner__rod"></div>
                  <div className="banner__cloth">
                    <div className="banner__inner"></div>
                    <div className="banner__content">
                      <p className="banner__presents">Department of Computer Science<em><span>presents</span></em></p>
                      <h1 className="title">MAGNERA<sup>’26</sup></h1>
                      <div className="collab"><span className="x">×</span><span className="partner">Brototype</span></div>
                      <span className="rule" aria-hidden="true"><i></i></span>
                      <div className="countdown" id="countdown" aria-live="off">
                        <div><b data-unit="d">000</b><span>Days</span></div>
                        <div><b data-unit="h">00</b><span>Hours</span></div>
                        <div><b data-unit="m">00</b><span>Minutes</span></div>
                        <div><b data-unit="s">00</b><span>Seconds</span></div>
                      </div>
                    </div>
                    <div className="banner__folds" aria-hidden="true"></div>
                  </div>
                  <span className="banner__tassel" aria-hidden="true"></span>
                </div>
              </div>
            </section>

            <section className="panel panel--cult" data-slide="1" aria-label="Cultural Events">
              <a className="island island--mirrored" href="cultural.html" style={{ "--accent": "#ff3b8a" }}>
                <img decoding="async" src="assets/layer2-island-baked.webp" alt="Floating island — Cultural Events" draggable="false" />
                <span className="portal" aria-hidden="true"></span>
                <span className="island__label"><i className="gem"></i>Cultural Events</span>
              </a>
            </section>

          </div>
        </div>

        {/* LAYER 3 — cliff + traveller */}
        <div className="layer layer--cliff" data-depth="0.045" data-scroll="0" data-pan="4">
          <img decoding="async" src="assets/layer3-cliff.webp" alt="A traveller standing on a cliff edge, looking at the campus" draggable="false" />
        </div>

        {/* LAYER 4 — crimson leaves (asset pending; vignette stands in for now) */}
        <div className="layer layer--leaves" data-depth="0.09" data-scroll="0" data-pan="10" aria-hidden="true"></div>

        {/* UI overlay */}
        <div className="hud hud--top">
          <div className="brand">
            <div className="brand__college">
              <svg className="crest" viewBox="0 0 32 36" aria-hidden="true"><path d="M2 2h28v14c0 9-6.5 15-14 18C8.5 31 2 25 2 16Z" fill="#8c1c24" stroke="#e8d7b0" strokeWidth="1.5" /><path d="M16 7v20M9 14h14" stroke="#e8d7b0" strokeWidth="2" /></svg>
              <span>St. Berchmans College<br />Changanassery</span>
            </div>
          </div>
        </div>

        {/* CTA: gold waymarker plaque, bottom-right */}
        <a className="cta" href="#gifts">
          <span className="cta__halo" aria-hidden="true"></span>
          <span className="cta__plate">
            <span className="cta__face" aria-hidden="true"></span>
            <span className="cta__shine" aria-hidden="true"></span>
            <span className="cta__label"><small>Get</small> Free gifts</span>
            <svg className="cta__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </span>
          <span className="cta__medal" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M3 11h18v3H3zM5 14h14v7H5zM12 11v10M12 11c-2-4-6-5-6-2s4 2 6 2c2 0 6 1 6-2s-4-2-6 2" strokeLinejoin="round" /></svg></span>
          <span className="cta__sparks" aria-hidden="true"><i></i><i></i><i></i></span>
        </a>

      </header>

      {/* ═══════════════ SECTIONS ═══════════════ */}
      <main className="sections">

        {/* The rock underside of the cliff, hanging from the bottom of the landing over the
            top of the walls. Decorative. */}
        <div className="seam" aria-hidden="true">
          <img src="assets/rock-ceiling.webp" alt="" width="2000" height="377" decoding="async" draggable="false" />
        </div>

        {/* ABOUT: two lit stone walls. Desktop shows both; on mobile the section pins
            and scrolling pans from one wall to the next (main.js's updateWalls, migrated
            into src/lib/landing.js). */}
        <section className="walls" id="about" aria-labelledby="walls-title">
          <h2 id="walls-title" className="sr-only">About Magnera</h2>
          <div className="walls__frame">
            <div className="walls__scene">
              <img className="walls__img" src="assets/walls.webp" alt="" width="1672" height="941" loading="lazy" decoding="async" draggable="false" />
              <span className="walls__torch walls__torch--fire" aria-hidden="true"></span>
              <span className="walls__torch walls__torch--blue" aria-hidden="true"></span>
            </div>
          </div>
          {/* the wall text is part of the artwork; this is the same text for screen readers and search */}
          <div className="sr-only">
            <article>
              <h3>01 · About Magnera</h3>
              <p>A two-day celebration of technology, creativity, and culture. Magnera brings together curious minds, bold ideas, and unforgettable experiences.</p>
            </article>
            <article>
              <h3>02 · Concept</h3>
              <p>Magnera is more than a fest — it's a convergence of ideas, talent, and communities. A space where technology meets creativity, students become creators, and every experience turns into a story.</p>
            </article>
          </div>
        </section>

        {/* SPONSORS: next section, to be designed */}
        <section className="section" id="sponsors">
          <p className="eyebrow">Sponsors</p>
          <h2>Our partners</h2>
          <p className="lede">Coming soon.</p>
        </section>

        <section className="section" id="contact">
          <p className="eyebrow">Contact</p>
          <h2>Get in touch</h2>
          <p className="lede">Contact details coming soon.</p>
        </section>

        <footer className="footer">© Magnera ’26 · Department of Computer Science, St. Berchmans College</footer>
      </main>
    </>
  );
}
