"use client";

import { useParams } from "next/navigation";
import { ProcessWorkspace } from "../../components/ProcessWorkspace";

export default function ProcessPage() {
  const params = useParams<{ id: string }>();
  return <ProcessWorkspace processId={params.id} />;
}
