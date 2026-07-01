import { supabase } from "./supabaseClient";
import type {
  CanvasData,
  ProcessDetail,
  ProcessListItem,
  TileCreatePayload,
  TileOut,
} from "../types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error(
    "Brak NEXT_PUBLIC_API_URL w env. Sprawdź .env.local (patrz .env.local.example).",
  );
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) {
    throw new ApiError(401, "Brak aktywnej sesji — zaloguj się ponownie.");
  }
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await authHeaders()),
    ...(init.headers as Record<string, string> | undefined),
  };

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });

  if (res.status === 204) {
    return undefined as T;
  }

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // brak body (np. 500 bez JSON) — zostawiamy null, komunikat poniżej
    // i tak będzie sensowny dzięki res.status
  }

  if (!res.ok) {
    const detail =
      body && typeof body === "object" && "detail" in body
        ? String((body as { detail: unknown }).detail)
        : `Błąd ${res.status}`;
    throw new ApiError(res.status, detail);
  }

  return body as T;
}

export const api = {
  tiles: {
    library: () => request<TileOut[]>("/api/tiles/library"),
    gallery: () => request<TileOut[]>("/api/tiles/gallery"),
    create: (payload: TileCreatePayload) =>
      request<TileOut>("/api/tiles", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      request<void>(`/api/tiles/${id}`, { method: "DELETE" }),
    addToLibrary: (id: string) =>
      request<void>(`/api/tiles/${id}/library`, { method: "POST" }),
    removeFromLibrary: (id: string) =>
      request<void>(`/api/tiles/${id}/library`, { method: "DELETE" }),
  },
  processes: {
    mine: () => request<ProcessListItem[]>("/api/processes/mine"),
    public: () => request<ProcessListItem[]>("/api/processes/public"),
    get: (id: string) => request<ProcessDetail>(`/api/processes/${id}`),
    create: (payload: { title?: string; visibility?: "private" | "public" }) =>
      request<ProcessDetail>("/api/processes", {
        method: "POST",
        body: JSON.stringify(payload),
      }),
    update: (
      id: string,
      payload: Partial<{
        title: string;
        description: string;
        visibility: "private" | "public";
        canvas_data: CanvasData;
      }>,
    ) =>
      request<ProcessDetail>(`/api/processes/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
    remove: (id: string) =>
      request<void>(`/api/processes/${id}`, { method: "DELETE" }),
    fork: (id: string) =>
      request<ProcessDetail>(`/api/processes/${id}/fork`, { method: "POST" }),
  },
};
