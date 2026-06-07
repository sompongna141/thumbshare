import Link from "next/link";

export default function HomePage() {
  return (
    <div className="landing-page">
      {/* Nav */}
      <nav className="landing-nav" aria-label="Primary">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <span className="landing-logo-accent">Thumb</span>Snare
          </div>
          <div className="landing-nav-links">
            <Link href="/studio" className="landing-nav-link">Open Studio</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="hero-inner">
          <h1 className="hero-title">
            Thumbnails that stop the scroll
          </h1>
          <p className="hero-subtitle">
            Turn a video title and angle into 3 to 8 scroll-stopping thumbnail
            concepts — complete with image prompts, color psychology, face
            expressions, and A/B test plans. Hand them to an editor or generate
            previews directly.
          </p>
          <div className="hero-cta-row">
            <Link href="/studio" className="hero-cta-primary">
              Start creating
            </Link>
            <span className="hero-cta-note">
              Free with your Pollinations key
            </span>
          </div>
        </div>

        {/* Abstract visual: CSS-only composition */}
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-card hero-card-1">
            <div className="hero-card-bar" />
            <div className="hero-card-line" />
            <div className="hero-card-dot" />
          </div>
          <div className="hero-card hero-card-2">
            <div className="hero-card-bar" />
            <div className="hero-card-line hero-card-line-long" />
            <div className="hero-card-dot hero-card-dot-alt" />
          </div>
          <div className="hero-card hero-card-3">
            <div className="hero-card-bar hero-card-bar-wide" />
            <div className="hero-card-line" />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="section">
        <div className="section-inner">
          <h2 className="section-title">From idea to concepts in four steps</h2>
          <div className="steps-grid">
            <div className="step-item">
              <div className="step-num" aria-hidden="true">1</div>
              <h3 className="step-heading">Hook</h3>
              <p className="step-body">
                Paste your video title and the angle that makes someone click.
              </p>
            </div>
            <div className="step-item">
              <div className="step-num" aria-hidden="true">2</div>
              <h3 className="step-heading">Audience</h3>
              <p className="step-body">
                Define who needs to click — audience, category, and channel context.
              </p>
            </div>
            <div className="step-item">
              <div className="step-num" aria-hidden="true">3</div>
              <h3 className="step-heading">Direction</h3>
              <p className="step-body">
                Choose tone, text mode, concept count, model, and visual guardrails.
              </p>
            </div>
            <div className="step-item">
              <div className="step-num" aria-hidden="true">4</div>
              <h3 className="step-heading">Concepts</h3>
              <p className="step-body">
                Get the exact number of structured concept packs you selected.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What you get */}
      <section className="section section-alt">
        <div className="section-inner">
          <h2 className="section-title">Every concept pack includes</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon" aria-hidden="true">🎯</div>
              <h3 className="feature-heading">Image prompt</h3>
              <p className="feature-body">
                A production-ready prompt you can paste into any image generator or hand to a designer.
              </p>
            </div>
            <div className="feature-item">
              <div className="feature-icon" aria-hidden="true">😮</div>
              <h3 className="feature-heading">Face expression</h3>
              <p className="feature-body">
                Specific reaction guidance — shock, curiosity, excitement — to maximise CTR.
              </p>
            </div>
            <div className="feature-item">
              <div className="feature-icon" aria-hidden="true">📝</div>
              <h3 className="feature-heading">Text overlay</h3>
              <p className="feature-body">
                Suggested thumbnail text and placement so the hook reads instantly at small sizes.
              </p>
            </div>
            <div className="feature-item">
              <div className="feature-icon" aria-hidden="true">🎨</div>
              <h3 className="feature-heading">Color psychology</h3>
              <p className="feature-body">
                Primary colour choice with emotion and contrast notes for platform visibility.
              </p>
            </div>
            <div className="feature-item">
              <div className="feature-icon" aria-hidden="true">🔬</div>
              <h3 className="feature-heading">A/B variant hint</h3>
              <p className="feature-body">
                What to test against the concept so you learn what actually drives clicks.
              </p>
            </div>
            <div className="feature-item">
              <div className="feature-icon" aria-hidden="true">📤</div>
              <h3 className="feature-heading">Export ready</h3>
              <p className="feature-body">
                Copy individual concepts, export the full pack as Markdown or JSON, or print a briefing sheet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="section-inner cta-inner">
          <h2 className="cta-title">Ready to stop guessing?</h2>
          <p className="cta-body">
            Connect your Pollinations key and turn your next video title into
            a structured thumbnail concept pack in under five minutes.
          </p>
          <Link href="/studio" className="hero-cta-primary cta-large">
            Open ThumbSnare Studio
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <span className="landing-logo-accent">Thumb</span>Snare
          </div>
          <p className="landing-footer-note">
            Built on Pollinations. Developer earnings enabled.
          </p>
        </div>
      </footer>
    </div>
  );
}
