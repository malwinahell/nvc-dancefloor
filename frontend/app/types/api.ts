export type Visibility = "private" | "public";

// ── Kafelki ─────────────────────────────────────────────────────────────────

export interface TileOut {
  id: string;
  owner_id: string;
  label: string;
  description: string | null;
  color: string;
  icon: string;
  nvc_type: string;
  visibility: Visibility;
  created_at: string;
  is_owner: boolean;
}

export interface TileCreatePayload {
  label: string;
  description?: string;
  color: string;
  icon: string;
  nvc_type?: string;
  visibility: Visibility;
}

// ── Procesy ──────────────────────────────────────────────────────────────────

export interface CanvasData {
  // luźno typowane celowo — backend trzyma to jako JSONB bez narzuconej
  // struktury; faktyczny kształt nodes/edges narzuca React Flow po stronie
  // frontu (patrz FlowCanvas.tsx).
  nodes: unknown[];
  edges: unknown[];
  viewport: { x: number; y: number; zoom: number };
}

export interface ProcessListItem {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  visibility: Visibility;
  forked_from_id: string | null;
  created_at: string;
  updated_at: string;
  is_owner: boolean;
}

export interface ProcessDetail extends ProcessListItem {
  canvas_data: CanvasData;
}

export interface ProcessCreatePayload {
  title?: string;
  description?: string;
  visibility?: Visibility;
  canvas_data?: CanvasData;
}

export interface ProcessUpdatePayload {
  title?: string;
  description?: string;
  visibility?: Visibility;
  canvas_data?: CanvasData;
}
