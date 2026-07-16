"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthBackdrop } from "@/components/auth-backdrop";
import { useAuth } from "@/components/auth-provider";
import { PasswordInput } from "@/components/password-input";

export function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await signup({ name, email, password });
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
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
            <span>Create your account</span>
          </div>
        </div>

        <label className="field">
          <span>Name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Rivera"
            autoComplete="name"
          />
        </label>

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
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />

        <p className="field-hint">
          After signup you can browse in read-only mode. An admin must invite your
          email on Team members before you can edit or see the Team page.
        </p>

        {error ? <p className="form-error">{error}</p> : null}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Creating…" : "Create account"}
        </button>

        <p className="auth-switch">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </form>
    </div>
  );
}
