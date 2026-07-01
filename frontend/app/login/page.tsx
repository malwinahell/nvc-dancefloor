"use client";

import React, { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import {
  AuthShell,
  errorStyle,
  FieldLabel,
  inputStyle,
  linkStyle,
  submitStyle,
} from "../components/AuthShell";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "link_expired"
      ? "Link potwierdzający wygasł. Zaloguj się ponownie, aby otrzymać nowy."
      : null,
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (error) {
      setError("Nieprawidłowy e-mail lub hasło.");
      return;
    }

    router.replace("/");
  };

  return (
    <AuthShell
      title="Zaloguj się"
      footer={
        <>
          Nie masz konta?{" "}
          <Link href="/register" style={linkStyle}>
            Zarejestruj się
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit}>
        <FieldLabel>E-mail</FieldLabel>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ty@example.com"
          style={inputStyle}
        />
        <FieldLabel style={{ marginTop: 16 }}>Hasło</FieldLabel>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
        />
        {error && <div style={errorStyle}>{error}</div>}
        <button type="submit" disabled={loading} style={submitStyle}>
          {loading ? "Logowanie..." : "Zaloguj się"}
        </button>
      </form>
    </AuthShell>
  );
}
