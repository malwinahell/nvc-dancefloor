"use client";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Rzucamy wcześnie i czytelnie — inaczej supabase-js zgłasza mylący błąd
  // dopiero przy pierwszym wywołaniu (np. "Invalid URL").
  throw new Error(
    "Brak NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY w env. " +
      "Sprawdź .env.local (patrz .env.local.example).",
  );
}

// Sesja trzymana w localStorage przez sam supabase-js (domyślne zachowanie) —
// nie synchronizujemy jej z cookie/middleware. Strony chronione logowaniem
// pilnują dostępu po stronie klienta przez <AuthGuard>, patrz components/AuthGuard.tsx.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
