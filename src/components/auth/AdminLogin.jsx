import { useState } from "react";
import Image from "next/image";
import { readJson } from "../../services/adminApi.js";

export default function AdminLogin({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await readJson("/api/admin/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      await onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-screen">
      <div className="login-art" aria-hidden="true">
        <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <div className="art-glow" /><div className="art-caption"><span className="live-dot" /> SPOKEN ODYSSEY <span>ADMINISTRATION</span></div>
      </div>
      <section className="login-panel">
        <Image className="login-brand-logo" src="/odysseyLogo.png" alt="Spoken Odyssey" width={2092} height={752} priority />
        <p className="eyebrow">ADMINISTRATION PORTAL</p>
        <h1>Welcome back</h1>
        <p className="login-subtitle">Sign in with your designated administrator email and password.</p>
        <form onSubmit={submit} className="login-form">
          <label>Email address<input type="email" name="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="admin@example.com" required /></label>
          <label>Password<div className="password-input-wrap"><input type={showPassword ? "text" : "password"} name="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /><button className="password-visibility-button" type="button" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8"/><path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c5.2 0 8.8 5.1 9.8 6.7a.6.6 0 0 1 0 .6 17 17 0 0 1-3.1 3.7M6.2 6.2a17.3 17.3 0 0 0-4 5.5.6.6 0 0 0 0 .6C3.2 13.9 6.8 19 12 19c1.2 0 2.3-.3 3.3-.8"/></svg> : <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.2 12s3.5-7 9.8-7 9.8 7 9.8 7-3.5 7-9.8 7-9.8-7-9.8-7Z"/><circle cx="12" cy="12" r="3"/></svg>}</button></div></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button login-submit" disabled={busy}>{busy ? "Please wait…" : "Sign in securely"}<span>↗</span></button>
        </form>
        <p className="login-footnote"><span className="lock-symbol">◆</span> Restricted to the designated administrator account</p>
      </section>
    </main>
  );
}
