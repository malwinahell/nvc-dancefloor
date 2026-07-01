"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "./components/AuthGuard";
import { CenteredMessage } from "./components/AuthShell";
import { api } from "./lib/apiClient";

export default function RootPage() {
  return (
    <AuthGuard>
      <RootRedirect />
    </AuthGuard>
  );
}

function RootRedirect() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    api.processes.mine().then((list) => {
      if (!active) return;
      if (list.length > 0) {
        // Lista jest posortowana po updated_at malejąco (patrz backend),
        // więc pierwszy element to ostatnio edytowany proces.
        router.replace(`/proces/${list[0].id}`);
      } else {
        api.processes.create({}).then((p) => {
          if (active) router.replace(`/proces/${p.id}`);
        });
      }
    });

    return () => {
      active = false;
    };
  }, [router]);

  return <CenteredMessage>Wczytywanie...</CenteredMessage>;
}
