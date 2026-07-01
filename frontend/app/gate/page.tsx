"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AuthShell,
  errorStyle,
  FieldLabel,
  inputStyle,
  submitStyle,
} from "../components/AuthShell";

export default function GatePage() {
  return (
    <Suspense fallback={null}>
      <GateForm />
    </Suspense>
  );
}

function GateForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/gate/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    setLoading(false);

    if (!res.ok) {
      setError("Nieprawidłowe hasło.");
      return;
    }

    const next = params.get("next") ?? "/";
    router.replace(next);
  };

  return (
    <AuthShell title="Wejdź do aplikacji">
      <form onSubmit={handleSubmit}>
        <FieldLabel>Hasło dostępu</FieldLabel>
        <input
          type="password"
          autoFocus
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          style={inputStyle}
        />
        {error && <div style={errorStyle}>{error}</div>}
        <button type="submit" disabled={loading} style={submitStyle}>
          {loading ? "Sprawdzanie..." : "Wejdź"}
        </button>
      </form>
    </AuthShell>
  );
}
