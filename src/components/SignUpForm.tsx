"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignUpForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name: name || undefined }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    // Auto sign-in after successful registration
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Account created, but sign-in failed. Please log in.");
      router.push("/login");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.glow} aria-hidden />

      {/* Logo */}
      <div style={styles.logo}>
        <div style={styles.logoMark}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 3L9 15M5 7Q9 3 13 7"
              stroke="#0f0f0f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span style={styles.logoText}>Ledgerly</span>
      </div>

      {/* Card */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <h1 style={styles.title}>Create account</h1>
          <p style={styles.subtitle}>Start managing your finances</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Name (optional) */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="name">
              Name <span style={styles.optional}>(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Alex Smith"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Email */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              onFocus={focusStyle}
              onBlur={blurStyle}
            />
          </div>

          {/* Password */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="password">
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                style={{ ...styles.input, paddingRight: "44px" }}
                onFocus={focusStyle}
                onBlur={blurStyle}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={styles.eyeBtn}
                aria-label="Toggle password visibility"
              >
                {showPassword ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && <p style={styles.errorMsg}>{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.ctaBtn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background = "var(--accent-hover)";
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,200,150,0.3)";
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <a href="/login" style={styles.footerLink}>
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}

function focusStyle(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "var(--accent)";
  e.currentTarget.style.boxShadow = "0 0 0 3px var(--accent-dim)";
  e.currentTarget.style.background = "rgba(0,200,150,0.04)";
}

function blurStyle(e: React.FocusEvent<HTMLInputElement>) {
  e.currentTarget.style.borderColor = "var(--border)";
  e.currentTarget.style.boxShadow = "none";
  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
    position: "relative",
    background: "var(--bg-primary)",
    fontFamily: "Inter, sans-serif",
  },
  glow: {
    position: "fixed",
    inset: 0,
    background:
      "radial-gradient(ellipse 70% 45% at 50% -5%, rgba(0,200,150,0.08) 0%, transparent 65%)",
    pointerEvents: "none",
    zIndex: 0,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    marginBottom: "44px",
    position: "relative",
    zIndex: 1,
  },
  logoMark: {
    width: "32px",
    height: "32px",
    background: "var(--accent)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: "17px",
    fontWeight: 600,
    letterSpacing: "-0.3px",
    color: "var(--text-primary)",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: "20px",
    padding: "40px 36px",
    position: "relative",
    zIndex: 1,
    animation: "fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
  },
  cardHeader: {
    marginBottom: "32px",
  },
  title: {
    fontSize: "26px",
    fontWeight: 600,
    letterSpacing: "-0.5px",
    color: "var(--text-primary)",
    lineHeight: 1.2,
    margin: 0,
  },
  subtitle: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    fontWeight: 400,
    margin: "6px 0 0",
  },
  formGroup: {
    marginBottom: "14px",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 500,
    color: "var(--text-secondary)",
    marginBottom: "7px",
  },
  optional: {
    fontWeight: 400,
    color: "var(--text-muted)",
  },
  input: {
    width: "100%",
    height: "50px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "0 16px",
    fontFamily: "Inter, sans-serif",
    fontSize: "15px",
    fontWeight: 400,
    color: "var(--text-primary)",
    outline: "none",
    transition: "border-color 0.18s, box-shadow 0.18s, background 0.18s",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: "14px",
    top: "50%",
    transform: "translateY(-50%)",
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    padding: "4px",
  },
  errorMsg: {
    fontSize: "13px",
    color: "var(--negative)",
    margin: "0 0 12px",
  },
  ctaBtn: {
    marginTop: "22px",
    width: "100%",
    height: "52px",
    background: "var(--accent)",
    border: "none",
    borderRadius: "100px",
    color: "#0f0f0f",
    fontFamily: "Inter, sans-serif",
    fontSize: "15px",
    fontWeight: 600,
    letterSpacing: "-0.1px",
    transition: "background 0.18s, box-shadow 0.18s",
  },
  footer: {
    marginTop: "28px",
    textAlign: "center",
    fontSize: "14px",
    color: "var(--text-secondary)",
  },
  footerLink: {
    color: "var(--text-primary)",
    textDecoration: "none",
    fontWeight: 500,
  },
};
