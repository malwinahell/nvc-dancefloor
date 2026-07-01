"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "../../components/AuthGuard";
import { CenteredMessage } from "../../components/AuthShell";
import { api } from "../../lib/apiClient";

export default function NewProcessPage() {
  return (
    <AuthGuard>
      <CreateAndRedirect />
    </AuthGuard>
  );
}

function CreateAndRedirect() {
  const router = useRouter();

  useEffect(() => {
    let active = true;
    api.processes.create({}).then((p) => {
      if (active) router.replace(`/proces/${p.id}`);
    });
    return () => {
      active = false;
    };
  }, [router]);

  return <CenteredMessage>Tworzenie nowego procesu...</CenteredMessage>;
}
