"use client";

import SiteFooter from "../components/SiteFooter";
import ThemePicker from "../components/ThemePicker";

const themes = [
  { id: "light", name: "Light", note: "Bright surfaces and familiar contrast" },
  { id: "midnight", name: "Midnight", note: "Low-glare navy for evening browsing" },
  { id: "graphite", name: "Graphite", note: "Neutral charcoal with restrained accents" },
  { id: "forest", name: "Forest", note: "Deep green surfaces and mint highlights" },
  { id: "amoled", name: "AMOLED Black", note: "True-black canvas for OLED screens" },
] as const;

export default function AppearancePage() {
  return (
    <>
      
      <main className="appearance-page">
        <section className="appearance-intro">
          <p className="appearance-eyebrow">MAKE IT YOURS</p>
          <h1>Your Apna Ghar, your look.</h1>
          <p className="appearance-description">
            Choose the appearance that feels comfortable. Your choice is saved on this device and
            applied across the website.
          </p>
          <div className="appearance-control-row">
            <div>
              <strong>Current appearance</strong>
              <span>Pick a theme or follow your device setting.</span>
            </div>
            <ThemePicker />
          </div>
        </section>

        <section className="appearance-showcase" aria-labelledby="theme-showcase-title">
          <div className="appearance-section-heading">
            <div>
              <p className="appearance-eyebrow">THE THEME SHOWCASE</p>
              <h2 id="theme-showcase-title">Same experience. Five themes.</h2>
              <p>Compare the same property card, controls and text in every palette.</p>
            </div>
          </div>
          <div className="appearance-theme-grid">
            {themes.map((theme) => (
              <article className="appearance-theme-sample" data-theme={theme.id} key={theme.id}>
                <div className="appearance-sample-heading">
                  <span className="appearance-sample-swatch" />
                  <div>
                    <h3>{theme.name}</h3>
                    <p>{theme.note}</p>
                  </div>
                </div>
                <div className="appearance-sample-property">
                  <div className="appearance-sample-art" aria-hidden="true">
                    <span className="appearance-art-sun" />
                    <span className="appearance-art-roof" />
                    <span className="appearance-art-house" />
                    <span className="appearance-art-door" />
                  </div>
                  <div className="appearance-sample-property-body">
                    <span className="appearance-sample-tag">FOR SALE</span>
                    <h4>Thoughtful spaces, made for living</h4>
                    <p>2 BHK apartment · Bengaluru</p>
                    <div className="appearance-sample-property-bottom">
                      <strong>₹ 78 lakh</strong>
                      <span aria-label="Verified listing">✓ Verified</span>
                    </div>
                  </div>
                </div>
                <div className="appearance-sample-actions">
                  <button type="button" className="appearance-sample-primary">Explore home</button>
                  <button type="button" className="appearance-sample-secondary" aria-label="Save sample property">♡ Save</button>
                </div>
                <p className="appearance-sample-footnote">Preview only · Illustrative content</p>
              </article>
            ))}
          </div>
        </section>

        <section className="appearance-system-note">
          <span className="appearance-system-icon" aria-hidden="true">◐</span>
          <div>
            <h2>Prefer not to choose?</h2>
            <p>System default follows your device’s light or dark preference and updates when that preference changes.</p>
          </div>
          <span className="appearance-system-label">System default is available in Appearance</span>
        </section>
      </main>
      <SiteFooter />
      <style jsx>{`
        .appearance-page { max-width: 1240px; margin: 0 auto; padding: 56px 36px 88px; color: var(--color-text); }
        .appearance-intro { max-width: 760px; margin: 0 auto 58px; text-align: center; }
        .appearance-eyebrow { margin: 0 0 12px; color: var(--color-primary); font-size: 10px; font-weight: 850; letter-spacing: 1.8px; text-transform: uppercase; }
        .appearance-intro h1 { margin: 0; font-size: clamp(36px, 5vw, 56px); letter-spacing: -2.8px; line-height: 1.08; }
        .appearance-description { max-width: 600px; margin: 18px auto 0; color: var(--color-text-secondary); font-size: 15px; line-height: 1.8; }
        .appearance-control-row { display: flex; align-items: center; justify-content: space-between; gap: 20px; max-width: 600px; margin: 32px auto 0; padding: 18px 20px; border: 1px solid var(--color-border); border-radius: 16px; background: var(--color-surface); text-align: left; }
        .appearance-control-row strong,.appearance-control-row span { display: block; }
        .appearance-control-row strong { font-size: 13px; }
        .appearance-control-row span { margin-top: 5px; color: var(--color-muted); font-size: 11px; line-height: 1.5; }
        .appearance-section-heading { margin-bottom: 24px; }
        .appearance-section-heading h2 { margin: 0; font-size: clamp(24px, 3vw, 34px); letter-spacing: -1.2px; }
        .appearance-section-heading>div>p:last-child { margin: 10px 0 0; color: var(--color-muted); font-size: 13px; line-height: 1.6; }
        .appearance-theme-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
        .appearance-theme-sample { min-width: 0; padding: 20px; border: 1px solid var(--color-border); border-radius: 20px; background: var(--color-bg); color: var(--color-text); }
        .appearance-sample-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
        .appearance-sample-swatch { width: 32px; height: 32px; flex: 0 0 32px; border: 1px solid var(--color-border); border-radius: 11px; background: var(--color-primary); box-shadow: inset 0 0 0 7px var(--color-surface); }
        .appearance-sample-heading h3 { margin: 0; font-size: 15px; }
        .appearance-sample-heading p { margin: 5px 0 0; color: var(--color-muted); font-size: 11px; line-height: 1.5; }
        .appearance-sample-property { overflow: hidden; border: 1px solid var(--color-border); border-radius: 15px; background: var(--color-surface); }
        .appearance-sample-art { position: relative; height: 132px; overflow: hidden; background: color-mix(in srgb, var(--color-primary) 12%, var(--color-surface-subtle)); }
        .appearance-art-sun { position: absolute; top: 18px; right: 28px; width: 30px; height: 30px; border-radius: 50%; background: var(--color-green); opacity: .85; }
        .appearance-art-house { position: absolute; bottom: 0; left: 50%; width: 126px; height: 73px; transform: translateX(-50%); background: var(--color-surface); border: 1px solid var(--color-border); }
        .appearance-art-roof { position: absolute; z-index: 1; left: calc(50% - 77px); bottom: 64px; width: 154px; height: 65px; background: var(--color-primary); clip-path: polygon(50% 0,100% 100%,0 100%); }
        .appearance-art-door { position: absolute; z-index: 2; left: calc(50% - 10px); bottom: 0; width: 20px; height: 38px; border-radius: 4px 4px 0 0; background: var(--color-green); }
        .appearance-sample-property-body { padding: 15px; }
        .appearance-sample-tag { display: inline-block; padding: 5px 8px; border-radius: 20px; background: var(--color-surface-subtle); color: var(--color-primary); font-size: 9px; font-weight: 850; letter-spacing: .5px; }
        .appearance-sample-property h4 { margin: 12px 0 7px; font-size: 14px; line-height: 1.4; }
        .appearance-sample-property-body>p { margin: 0; color: var(--color-muted); font-size: 11px; }
        .appearance-sample-property-bottom { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 15px; padding-top: 12px; border-top: 1px solid var(--color-border); }
        .appearance-sample-property-bottom strong { font-size: 16px; }
        .appearance-sample-property-bottom span { color: var(--color-green); font-size: 10px; font-weight: 800; }
        .appearance-sample-actions { display: flex; gap: 10px; margin-top: 12px; }
        .appearance-sample-actions button { min-height: 40px; padding: 0 14px; border: 1px solid var(--color-border); border-radius: 10px; font-size: 11px; font-weight: 800; cursor: default; }
        .appearance-sample-primary { background: var(--color-primary); border-color: var(--color-primary)!important; color: var(--color-on-primary); }
        .appearance-sample-secondary { background: var(--color-surface); color: var(--color-text); }
        .appearance-sample-footnote { margin: 13px 0 0; color: var(--color-muted); font-size: 10px; }
        .appearance-system-note { display: flex; align-items: center; gap: 16px; margin-top: 36px; padding: 24px; border: 1px solid var(--color-border); border-radius: 18px; background: var(--color-surface); }
        .appearance-system-icon { display: grid; place-items: center; width: 44px; height: 44px; flex: 0 0 44px; border-radius: 14px; background: var(--color-surface-subtle); color: var(--color-primary); font-size: 23px; }
        .appearance-system-note h2 { margin: 0 0 6px; font-size: 15px; }
        .appearance-system-note p { margin: 0; color: var(--color-text-secondary); font-size: 12px; line-height: 1.7; }
        .appearance-system-label { margin-left: auto; color: var(--color-muted); font-size: 10px; white-space: nowrap; }
        @media (max-width: 760px) { .appearance-page { padding: 36px 18px 56px; } .appearance-theme-grid { grid-template-columns: 1fr; } .appearance-control-row { align-items: flex-start; flex-direction: column; } .appearance-system-note { align-items: flex-start; flex-wrap: wrap; padding: 18px; } .appearance-system-label { margin-left: 60px; white-space: normal; } }
        @media (prefers-reduced-motion: reduce) { .appearance-theme-sample * { transition: none!important; } }
      `}</style>
    </>
  );
}
