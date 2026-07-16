"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthBackdrop } from "@/components/auth-backdrop";
import { useAuth } from "@/components/auth-provider";
import { PasswordInput } from "@/components/password-input";

export function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-page">
      <AuthBackdrop />
      <form className="auth-card" onSubmit={onSubmit}>
        <div className="auth-brand">
          <div className="brand-mark">QA</div>
          <div>
            <strong>TestForge</strong>
            <span>Sign in to continue</span>
          </div>
        </div>

        <label className="field">
          <span>Email</span>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />
        </label>

        <PasswordInput
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Signing in…" : "Sign in"}
        </button>

        <p className="auth-switch">
          No account yet? <Link href="/signup">Create one</Link>
        </p>
      </form>
    </div>
  );
}
