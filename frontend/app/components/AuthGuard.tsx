"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { CenteredMessage } from "./AuthShell";

/**
 * Sesja Supabase żyje w localStorage przeglądarki, więc middleware (server-side)
 * nie ma do niej dostępu — stąd ochrona logowania dzieje się tutaj, po stronie
 * klienta, a nie w middleware.ts (które pilnuje wyłącznie bramki hasłem).
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (!data.session) {
        router.replace("/login");
      } else {
        setReady(true);
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) router.replace("/login");
      },
    );

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) {
    return <CenteredMessage>Wczytywanie...</CenteredMessage>;
  }

  return <>{children}</>;
}
