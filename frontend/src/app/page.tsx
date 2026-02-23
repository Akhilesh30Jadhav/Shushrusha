"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="page-container" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", gap: "32px" }}>
      {/* Hero illustration */}
      <div className="animate-fade-in" style={{ position: "relative" }}>
        <div style={{
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "linear-gradient(135deg, rgba(6,182,212,0.2), rgba(139,92,246,0.2))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto",
          animation: "pulse-glow 3s infinite",
        }}>
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="url(#grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div className="animate-fade-in">
        <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>
          <span className="gradient-text">SUSHRUSHA</span>
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: 15, marginTop: 8, lineHeight: 1.6 }}>
          Practice patient conversations safely. Get instant feedback on protocol adherence.
        </p>
      </div>

      {/* Feature pills */}
      <div className="animate-fade-in-delay" style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
        {["Interactive Scenarios", "Protocol Checklists", "Instant Reports", "Multi-language"].map((f) => (
          <span key={f} style={{
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 500,
            background: "rgba(6,182,212,0.1)",
            color: "var(--accent-primary)",
            border: "1px solid rgba(6,182,212,0.15)",
          }}>
            {f}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div className="animate-fade-in-delay" style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%", maxWidth: 320 }}>
        <Link href="/language" className="btn-primary" style={{ fontSize: 18 }}>
          🏥 Start Training
        </Link>
        <Link href="/glowing-demo" className="btn-secondary">
          ✨ Component Showcase
        </Link>
        <Link href="/history" className="btn-secondary">
          📋 View Past Sessions
        </Link>
      </div>

      {/* Footer note */}
      <p style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 16 }}>
        Built for ASHA & community health workers
      </p>
    </div>
  );
}
