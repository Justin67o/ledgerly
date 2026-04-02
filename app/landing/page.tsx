'use client';

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

/* ── Animated counter ─────────────────────────────────── */
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(ease * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

function StatCard({ value, suffix, label, start }: { value: number; suffix: string; label: string; start: boolean }) {
  const count = useCountUp(value, 1600, start);
  return (
    <div className="text-center">
      <p className="text-4xl md:text-5xl font-bold tracking-tight" style={{ fontFamily: "'DM Serif Display', serif", color: "var(--accent)" }}>
        {count.toLocaleString()}{suffix}
      </p>
      <p className="text-sm mt-2" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
    </div>
  );
}

/* ── Feature card ─────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay }: { icon: string; title: string; desc: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.2 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      className="p-6 rounded-2xl transition-all duration-700"
      style={{
        backgroundColor: "var(--bg-card)",
        border: "1px solid var(--border)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: "'DM Serif Display', serif" }}>{title}</h3>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)", fontFamily: "'DM Sans', sans-serif" }}>{desc}</p>
    </div>
  );
}

/* ── Mock dashboard card ──────────────────────────────── */
function MockDashboard() {
  const bars = [55, 70, 45, 85, 60, 90, 75];
  return (
    <div
      className="rounded-2xl p-5 w-full max-w-sm mx-auto"
      style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", boxShadow: "0 32px 80px rgba(0,200,150,0.08)" }}
    >
      <p className="text-xs mb-1" style={{ color: "var(--text-muted)", fontFamily: "'DM Sans', sans-serif" }}>Net Worth</p>
      <p className="text-3xl font-bold mb-0.5" style={{ fontFamily: "'DM Serif Display', serif" }}>$142,830</p>
      <p className="text-xs mb-5" style={{ color: "var(--positive)", fontFamily: "'DM Sans', sans-serif" }}>+$4,210 (3.04%) this month</p>

      {/* Mini bar chart */}
      <div className="flex items-end gap-1.5 h-16 mb-5">
        {bars.map((h, i) => (
          <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, backgroundColor: i === 6 ? "var(--accent)" : "var(--bg-hover)" }} />
        ))}
      </div>

      {/* Account pills */}
      <div className="space-y-2">
        {[
          { name: "TD Chequing", amount: "$8,240", type: "CHECKING" },
          { name: "Wealthsimple", amount: "$94,100", type: "INVEST" },
          { name: "Amex Gold", amount: "−$1,420", type: "CREDIT" },
        ].map((a) => (
          <div key={a.name} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ backgroundColor: "var(--bg-hover)" }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: a.type === "CREDIT" ? "var(--negative)" : a.type === "INVEST" ? "var(--accent)" : "var(--text-muted)" }} />
              <span className="text-xs font-medium" style={{ fontFamily: "'DM Sans', sans-serif" }}>{a.name}</span>
            </div>
            <span className="text-xs font-semibold" style={{ color: a.amount.startsWith("−") ? "var(--negative)" : "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}>{a.amount}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Main page ────────────────────────────────────────── */
export default function Landing() {
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    // Hero entrance
    const t = setTimeout(() => setHeroVisible(true), 80);
    // Stats observer
    const el = statsRef.current;
    if (!el) return () => clearTimeout(t);
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setStatsVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    obs.observe(el);
    return () => { clearTimeout(t); obs.disconnect(); };
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        .glow-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
        }
        .nav-link {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          color: var(--text-secondary);
          transition: color 0.15s;
          text-decoration: none;
        }
        .nav-link:hover { color: var(--text-primary); }

        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: var(--accent);
          color: #000;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 600;
          padding: 0.75rem 1.5rem;
          border-radius: 0.875rem;
          border: none;
          cursor: pointer;
          transition: background-color 0.15s, transform 0.15s;
          text-decoration: none;
        }
        .btn-primary:hover { background-color: var(--accent-hover); transform: translateY(-1px); }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background-color: transparent;
          color: var(--text-primary);
          font-family: 'DM Sans', sans-serif;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.75rem 1.5rem;
          border-radius: 0.875rem;
          border: 1px solid var(--border);
          cursor: pointer;
          transition: background-color 0.15s, border-color 0.15s;
          text-decoration: none;
        }
        .btn-secondary:hover { background-color: var(--bg-hover); border-color: var(--text-muted); }

        .hero-word {
          display: inline-block;
          transition: opacity 0.7s, transform 0.7s;
        }
        .divider {
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--border), transparent);
        }
      `}</style>

      <div style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", minHeight: "100vh", overflow: "hidden" }}>

        {/* ── Nav ─────────────────────────────────────────── */}
        <nav style={{
          position: "sticky", top: 0, zIndex: 50,
          borderBottom: "1px solid var(--border)",
          backgroundColor: "rgba(15,15,15,0.85)",
          backdropFilter: "blur(12px)",
        }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1.25rem", color: "var(--accent)", letterSpacing: "-0.01em" }}>
              Ledgerly
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <Link href="/login" className="nav-link">Sign in</Link>
              <Link href="/register" className="btn-primary" style={{ padding: "0.5rem 1.1rem", fontSize: "0.8rem" }}>Get started</Link>
            </div>
          </div>
        </nav>

        {/* ── Hero ────────────────────────────────────────── */}
        <section style={{ position: "relative", maxWidth: 1100, margin: "0 auto", padding: "7rem 1.5rem 5rem" }}>
          {/* Glow orbs */}
          <div className="glow-orb" style={{ width: 600, height: 600, top: -200, left: "30%", backgroundColor: "rgba(0,200,150,0.07)" }} />
          <div className="glow-orb" style={{ width: 300, height: 300, top: 100, right: "5%", backgroundColor: "rgba(0,200,150,0.04)" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "3rem", alignItems: "center" }}
               className="md:grid-cols-2">

            {/* Left: text */}
            <div>
              {/* Badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                border: "1px solid var(--border)", borderRadius: 100,
                padding: "0.35rem 0.875rem", marginBottom: "2rem",
                opacity: heroVisible ? 1 : 0, transform: heroVisible ? "none" : "translateY(12px)",
                transition: "opacity 0.6s, transform 0.6s",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "var(--accent)", display: "inline-block" }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  Personal finance, simplified
                </span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: "clamp(2.8rem, 6vw, 4.5rem)",
                lineHeight: 1.08,
                letterSpacing: "-0.02em",
                marginBottom: "1.5rem",
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "none" : "translateY(20px)",
                transition: "opacity 0.7s 0.1s, transform 0.7s 0.1s",
              }}>
                Your money,<br />
                <em style={{ color: "var(--accent)", fontStyle: "italic" }}>clearly</em> in view.
              </h1>

              {/* Sub */}
              <p style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "1rem",
                lineHeight: 1.7,
                color: "var(--text-secondary)",
                maxWidth: 440,
                marginBottom: "2.5rem",
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "none" : "translateY(16px)",
                transition: "opacity 0.7s 0.2s, transform 0.7s 0.2s",
              }}>
                Track accounts, investments, and budgets in one place. No noise — just the numbers that matter.
              </p>

              {/* CTAs */}
              <div style={{
                display: "flex", flexWrap: "wrap", gap: "0.875rem",
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "none" : "translateY(12px)",
                transition: "opacity 0.7s 0.3s, transform 0.7s 0.3s",
              }}>
                <Link href="/register" className="btn-primary">
                  Start for free
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/login" className="btn-secondary">Sign in</Link>
              </div>
            </div>

            {/* Right: mock dashboard */}
            <div style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? "translateY(0) rotate(-1deg)" : "translateY(32px) rotate(-1deg)",
              transition: "opacity 0.9s 0.35s, transform 0.9s 0.35s",
            }}>
              <MockDashboard />
            </div>
          </div>
        </section>

        <div className="divider" />

        {/* ── Stats ───────────────────────────────────────── */}
        <section ref={statsRef} style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "3rem" }}>
            <StatCard value={12400} suffix="+" label="Transactions tracked" start={statsVisible} />
            <StatCard value={98}    suffix="%" label="Data accuracy"         start={statsVisible} />
            <StatCard value={5}     suffix=" min" label="Average setup time" start={statsVisible} />
          </div>
        </section>

        <div className="divider" />

        {/* ── Features ────────────────────────────────────── */}
        <section style={{ maxWidth: 1100, margin: "0 auto", padding: "5rem 1.5rem" }}>
          <div style={{ marginBottom: "3.5rem" }}>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "0.75rem" }}>
              Features
            </p>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(1.8rem, 4vw, 2.8rem)", lineHeight: 1.15, letterSpacing: "-0.02em", maxWidth: 500 }}>
              Everything you need, nothing you don't.
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem" }}>
            <FeatureCard
              icon="🏦"
              title="All your accounts"
              desc="Connect chequing, savings, credit cards, and investment accounts in one clean view."
              delay={0}
            />
            <FeatureCard
              icon="📊"
              title="Budget goals"
              desc="Set monthly spending targets by category and see exactly where you stand — at a glance."
              delay={80}
            />
            <FeatureCard
              icon="📈"
              title="Investment tracking"
              desc="Monitor your portfolio holdings, cost basis, and performance without switching apps."
              delay={160}
            />
            <FeatureCard
              icon="⚡"
              title="AI-powered entry"
              desc="Describe a transaction in plain English and let Ledgerly parse the details automatically."
              delay={240}
            />
            <FeatureCard
              icon="🔒"
              title="Private by design"
              desc="Your data stays yours. No selling, no third-party access, no surprises."
              delay={320}
            />
            <FeatureCard
              icon="🌙"
              title="Dark & focused"
              desc="A distraction-free interface designed for people who take their finances seriously."
              delay={400}
            />
          </div>
        </section>

        <div className="divider" />

        {/* ── CTA strip ───────────────────────────────────── */}
        <section style={{ padding: "6rem 1.5rem", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div className="glow-orb" style={{ width: 500, height: 500, top: "50%", left: "50%", transform: "translate(-50%,-50%)", backgroundColor: "rgba(0,200,150,0.05)" }} />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--accent)", marginBottom: "1.25rem" }}>
            Get started today
          </p>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: "1.5rem" }}>
            Take control of your<br />financial picture.
          </h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", color: "var(--text-secondary)", marginBottom: "2.5rem", maxWidth: 400, margin: "0 auto 2.5rem" }}>
            Free to use. No credit card required.
          </p>
          <Link href="/register" className="btn-primary" style={{ fontSize: "1rem", padding: "0.875rem 2rem" }}>
            Create your account
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </section>

        {/* ── Footer ──────────────────────────────────────── */}
        <footer style={{ borderTop: "1px solid var(--border)", padding: "2rem 1.5rem" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: "1rem", color: "var(--accent)" }}>Ledgerly</span>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              Built with Ledgerly
            </p>
          </div>
        </footer>

      </div>
    </>
  );
}
