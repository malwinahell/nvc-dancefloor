"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import {
  AuthShell,
  errorStyle,
  FieldLabel,
  infoStyle,
  inputStyle,
  linkStyle,
  submitStyle,
} from "../components/AuthShell";

const MIN_PASSWORD_LENGTH = 8;

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) {
      setError(translateSignUpError(error.message));
      return;
    }

    if (data.session) {
      // Konto utworzone i sesja od razu aktywna — zależy od ustawienia
      // "Confirm email" w Supabase Auth (Project Settings → Auth).
      router.replace("/");
      return;
    }

    // Potwierdzenie e-mail włączone w projekcie Supabase — sesji jeszcze nie ma.
    setInfo("Konto utworzone. Sprawdź skrzynkę e-mail, aby potwierdzić rejestrację.");
  };

  return (
    <AuthShell
      title="Załóż konto"
      footer={
        <>
          Masz już konto?{" "}
          <Link href="/login" style={linkStyle}>
            Zaloguj się
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
        <FieldLabel style={{ marginTop: 16 }}>
          Hasło{" "}
          <span style={{ fontWeight: 400, color: "#C9CDD4" }}>
            (min. {MIN_PASSWORD_LENGTH} znaków)
          </span>
        </FieldLabel>
        <input
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
        />
        {error && <div style={errorStyle}>{error}</div>}
        {info && <div style={infoStyle}>{info}</div>}
        <button type="submit" disabled={loading} style={submitStyle}>
          {loading ? "Tworzenie konta..." : "Zarejestruj się"}
        </button>
      </form>
    </AuthShell>
  );
}

function translateSignUpError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "Ten e-mail jest już zarejestrowany.";
  }
  if (lower.includes("password")) {
    return "Hasło nie spełnia wymagań Supabase (sprawdź ustawienia projektu).";
  }
  return "Nie udało się utworzyć konta. Spróbuj ponownie.";
}
