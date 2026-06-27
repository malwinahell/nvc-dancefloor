export type NvcNodeType =
  | "intention"
  | "observation"
  | "feeling"
  | "need"
  | "request"
  | "judgment"
  | "custom";

export interface NvcNodeData extends Record<string, unknown> {
  label: string;
  nvcType: NvcNodeType;
  color: string;
  icon: string;
  description?: string;
  /** True for the single designated "base" tile on the canvas. */
  isBase?: boolean;
}

export interface TileTemplate {
  id: string;
  label: string;
  nvcType: NvcNodeType;
  color: string;
  icon: string;
  description?: string;
  isDefault?: boolean;
}
