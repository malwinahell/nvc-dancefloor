"use client";

import React, { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import type { Node } from "@xyflow/react";
import type { NvcNodeData } from "../types/nvc";
import { useMobile } from "../hooks/useMobile";
import { TILE_WIDTH, TILE_HEIGHT } from "../helpers/canvasConfig";

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

// ── Ring SVG ──────────────────────────────────────────────────────────────────

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

// ── NvcNode ───────────────────────────────────────────────────────────────────

interface NvcNodeProps {
  id: string;
  data: NvcNodeData;
  selected?: boolean;
}

export function NvcNode({ id, data, selected }: NvcNodeProps) {
  const { setNodes } = useReactFlow();
  const isMobile = useMobile();

  const handleDelete = useCallback(() => {
    setNodes((nds: Node[]) => nds.filter((n) => n.id !== id));
  }, [id, setNodes]);

  const handleSetAsBase = useCallback(() => {
    setNodes((nds: Node[]) =>
      nds.map((n) =>
        n.id === id
          ? {
              ...n,
              data: {
                ...(n.data as NvcNodeData),
                isBase: !(n.data as NvcNodeData).isBase,
              },
            }
          : n,
      ),
    );
  }, [id, setNodes]);

  const hasIcon = !!data.icon;
  const baseBorder = `3px solid ${darkenHex(data.color)}`;
  const shadow = selected
    ? "0 0 0 4px rgba(124,58,237,0.1), 0 10px 32px rgba(0,0,0,0.08)"
    : "0 8px 24px rgba(0,0,0,0.05)";
  const border = data.isBase
    ? baseBorder
    : selected
      ? "1px solid rgba(110,110,110,0.5)"
      : "1px solid rgba(0,0,0,0.06)";

  // Na mobile panel akcji ląduje POD kafelkiem (nie nad), żeby nie wychodził
  // poza viewport gdy kafelek jest blisko górnej krawędzi ekranu.
  // Przyciski mają 44px (Apple HIG minimum) zamiast desktopowych 32px.
  const btnSize = isMobile ? 44 : 32;
  const panelAbove: React.CSSProperties = {
    position: "absolute",
    bottom: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    marginBottom: 8,
  };
  const panelBelow: React.CSSProperties = {
    position: "absolute",
    top: "100%",
    left: "50%",
    transform: "translateX(-50%)",
    marginTop: 8,
  };

  return (
    <div
      style={{
        width: TILE_WIDTH,
        boxSizing: "border-box",
        position: "relative",
        fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
      }}
    >
      {/* ── Panel akcji ──────────────────────────────────────────────────── */}
      <div
        style={{
          ...(isMobile ? panelBelow : panelAbove),
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          borderRadius: 20,
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 4px 18px rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 4 : 2,
          padding: isMobile ? "6px 8px" : "4px 6px",
          zIndex: 1000,
          pointerEvents: selected ? "all" : "none",
          opacity: selected ? 1 : 0,
          transition: "opacity 0.15s ease",
          whiteSpace: "nowrap",
        }}
      >
        {/* Wyróżnij / odznacz */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            handleSetAsBase();
          }}
          title={data.isBase ? "Usuń wyróżnienie" : "Wyróżnij"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: btnSize,
            height: btnSize,
            borderRadius: "50%",
            border: "none",
            background: data.isBase
              ? hexToRgba(data.color, 0.18)
              : "transparent",
            cursor: "pointer",
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

        <div
          style={{
            width: 1,
            height: 18,
            background: "rgba(0,0,0,0.08)",
            flexShrink: 0,
          }}
        />

        {/* Usuń */}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            handleDelete();
          }}
          title="Usuń kafelek"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: btnSize,
            height: btnSize,
            borderRadius: "50%",
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: isMobile ? 18 : 15,
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

      {/* ── Kafelek ────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: data.color,
          borderRadius: 20,
          border,
          boxShadow: shadow,
          padding: "0 14px",
          height: TILE_HEIGHT,
          boxSizing: "border-box",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
          cursor: "grab",
          // Aktywny obszar dotykowy — zwiększamy wirtualny obszar tap-a
          // (padding kompensowany przez ujemny margin — technika "invisible tap area")
          ...(isMobile && {
            margin: "-4px",
            padding: "4px calc(14px + 4px)",
          }),
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: hasIcon ? 8 : 0,
          }}
        >
          {hasIcon && (
            <span style={{ fontSize: 20, lineHeight: 1, flexShrink: 0 }}>
              {data.icon}
            </span>
          )}
          <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
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
            {data.description && (
              <p
                style={{
                  fontSize: 11,
                  color: "rgba(0,0,0,0.48)",
                  margin: 0,
                  marginTop: 3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                {data.description}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const nodeTypes = { nvcNode: NvcNode };
