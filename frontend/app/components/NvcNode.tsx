"use client";

import React, { useState, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import type { Node } from "@xyflow/react";
import type { NvcNodeData } from "../types/nvc";
import { TILE_WIDTH } from "../helpers/canvasConfig";

// ── Colour helpers ────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${alpha})`;
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Returns a visibly darker shade of the given hex (for borders on pastel tiles). */
function darkenHex(hex: string, amount = 0.22): string {
  let h = hex.replace("#", "");
  if (h.length === 3)
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - Math.round(255 * amount));
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - Math.round(255 * amount));
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - Math.round(255 * amount));
  if ([r, g, b].some(isNaN)) return "#999";
  return `rgb(${r},${g},${b})`;
}

// ── Ring icon (SVG donut) ─────────────────────────────────────────────────────
// Inactive: circle outline in neutral grey.
// Active:   filled donut in the tile's own colour.

function RingIcon({ active, color }: { active: boolean; color: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
      {active ? (
        <>
          <circle cx="8.5" cy="8.5" r="8" fill={color} />
          <circle cx="8.5" cy="8.5" r="4.5" fill="white" />
        </>
      ) : (
        <circle cx="8.5" cy="8.5" r="7.5" stroke="#BDC3C7" strokeWidth="1.5" />
      )}
    </svg>
  );
}

// ── Node props ────────────────────────────────────────────────────────────────

interface NvcNodeProps {
  id: string;
  data: NvcNodeData;
  selected?: boolean;
}

// ── NvcNode ───────────────────────────────────────────────────────────────────

export function NvcNode({ id, data, selected }: NvcNodeProps) {
  const { setNodes } = useReactFlow();
  const [descOpen, setDescOpen] = useState(false);

  // Derive whether the overlay is actually visible.
  // When the node loses selection the overlay hides automatically — no effect needed.
  const isDescOpen = !!selected && descOpen;

  // ── Actions ─────────────────────────────────────────────────────────────

  const handleDelete = useCallback(() => {
    setNodes((nds: Node[]) => nds.filter((n) => n.id !== id));
  }, [id, setNodes]);

  const handleSetAsBase = useCallback(() => {
    if (data.isBase) return;
    setNodes((nds: Node[]) =>
      nds.map((n) => ({
        ...n,
        data: { ...(n.data as NvcNodeData), isBase: n.id === id },
      })),
    );
  }, [id, data.isBase, setNodes]);

  // ── Derived styles ───────────────────────────────────────────────────────

  const hasIcon = !!data.icon;

  // Base tile uses a darkened version of the tile's own colour for border/glow
  const baseBorder = `2px solid ${darkenHex(data.color)}`;
  const baseShadow = `0 0 0 4px ${hexToRgba(data.color, 0.28)}, 0 8px 24px rgba(0,0,0,0.07)`;

  return (
    <div
      style={{
        width: TILE_WIDTH,
        boxSizing: "border-box",
        position: "relative",
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      }}
    >
      {/* ── Floating action panel ────────────────────────────────────────────
          Anchored above the tile card (bottom: 100% + marginBottom: 8px).
          Only shown when the node is selected — opacity/pointerEvents toggle.
      ─────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          transform: "translateX(-50%)",
          marginBottom: 8,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: 20,
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: 2,
          padding: "4px 6px",
          zIndex: 1000,
          pointerEvents: selected ? "all" : "none",
          opacity: selected ? 1 : 0,
          transition: "opacity 0.15s ease",
          whiteSpace: "nowrap",
        }}
      >
        {/* Ring button — set this tile as base */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            handleSetAsBase();
          }}
          title={
            data.isBase
              ? "Ten kafelek jest bazowy"
              : "Ustaw jako kafelek bazowy"
          }
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: data.isBase
              ? hexToRgba(data.color, 0.18)
              : "transparent",
            cursor: data.isBase ? "default" : "pointer",
            padding: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!data.isBase)
              (e.currentTarget as HTMLButtonElement).style.background =
                hexToRgba(data.color, 0.12);
          }}
          onMouseLeave={(e) => {
            if (!data.isBase)
              (e.currentTarget as HTMLButtonElement).style.background =
                "transparent";
          }}
        >
          <RingIcon active={!!data.isBase} color={data.color} />
        </button>

        {/* Separator */}
        <div
          style={{
            width: 1,
            height: 18,
            background: "rgba(0,0,0,0.08)",
            flexShrink: 0,
          }}
        />

        {/* Delete button */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          title="Usuń kafelek"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 15,
            padding: 0,
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "transparent";
          }}
        >
          🗑️
        </button>
      </div>

      {/* ── Tile card ────────────────────────────────────────────────────────
          overflow:hidden is intentional — it clips the description overlay
          to the card's border-radius without resizing the tile.
      ─────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: data.color,
          borderRadius: 20,
          border: data.isBase
            ? baseBorder
            : selected
              ? "2px solid rgba(124,58,237,0.5)"
              : "1px solid rgba(0,0,0,0.06)",
          boxShadow: data.isBase
            ? baseShadow
            : selected
              ? "0 0 0 4px rgba(124,58,237,0.1), 0 10px 32px rgba(0,0,0,0.08)"
              : "0 8px 24px rgba(0,0,0,0.05)",
          padding: "12px 14px",
          position: "relative",
          overflow: "hidden",
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
          cursor: "grab",
          minHeight: 52,
        }}
      >
        {/* ── Layout: icon (vert-centre) + text (horiz-centre) ────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: hasIcon ? 8 : 0,
          }}
        >
          {/* Icon — vertically centred via parent align-items:center */}
          {hasIcon && (
            <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>
              {data.icon}
            </span>
          )}

          {/* Text block — centred horizontally in its flex column */}
          <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
            {/* Title */}
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#1a1a1a",
                lineHeight: 1.35,
                letterSpacing: "-0.01em",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {data.label}
            </div>

            {/* Description row: truncated text + ℹ toggle */}
            {data.description && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 3,
                  marginTop: 3,
                }}
              >
                <span
                  style={{
                    fontSize: 10,
                    color: "rgba(0,0,0,0.38)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: "0 1 auto",
                    minWidth: 0,
                  }}
                >
                  {data.description}
                </span>

                {/* ℹ / × toggle */}
                <button
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDescOpen((v) => !v);
                  }}
                  title={isDescOpen ? "Ukryj opis" : "Pokaż pełen opis"}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 10,
                    fontWeight: 700,
                    color: isDescOpen ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.22)",
                    padding: "0 1px",
                    flexShrink: 0,
                    lineHeight: 1,
                    fontFamily: "inherit",
                    transition: "color 0.12s",
                  }}
                >
                  {isDescOpen ? "×" : "ℹ"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Description overlay ─────────────────────────────────────────────
            position:absolute + bottom:0 → sticks to bottom of the tile card.
            overflow:hidden on the card clips it to the same border-radius.
            The tile does NOT resize — the overlay covers existing content.
        ─────────────────────────────────────────────────────────────────────── */}
        {isDescOpen && data.description && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              background: "rgba(15,15,15,0.82)",
              color: "rgba(255,255,255,0.92)",
              padding: "10px 14px",
              fontSize: 11,
              lineHeight: 1.6,
              borderRadius: "0 0 20px 20px",
            }}
          >
            {data.description}
          </div>
        )}
      </div>
    </div>
  );
}

export const nodeTypes = { nvcNode: NvcNode };
