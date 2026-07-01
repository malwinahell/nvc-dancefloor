"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { supabase } from "../../lib/supabaseClient";
import { CenteredMessage } from "../../components/AuthShell";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={<CenteredMessage>Potwierdzanie konta...</CenteredMessage>}
    >
      <CallbackHandler />
    </Suspense>
  );
}

function CallbackHandler() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get("code");

    if (!code) {
      // Brak kodu — coś poszło nie tak, wróć do logowania
      router.replace("/login");
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        // Token wygasł lub już użyty — wyślij ponownie przez stronę logowania
        router.replace("/login?error=link_expired");
      } else {
        // Sesja aktywna — wejdź do aplikacji
        router.replace("/");
      }
    });
  }, [params, router]);

  return <CenteredMessage>Potwierdzanie konta...</CenteredMessage>;
}
