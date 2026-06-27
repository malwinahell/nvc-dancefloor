"use client";

import { useState, useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import type { Node } from "@xyflow/react";
import type { NvcNodeData } from "../types/nvc";
import { TILE_WIDTH } from "../helpers/canvasConfig";

interface NvcNodeProps {
  id: string;
  data: NvcNodeData;
  selected?: boolean;
}

export function NvcNode({ id, data, selected }: NvcNodeProps) {
  const { setNodes } = useReactFlow();
  const [hovered, setHovered] = useState(false);

  // ── Actions ───────────────────────────────────────────────────────────────

  const handleDelete = useCallback(() => {
    setNodes((nds: Node[]) => nds.filter((n) => n.id !== id));
  }, [id, setNodes]);

  const handleSetAsBase = useCallback(() => {
    if (data.isBase) return; // already base, nothing to do
    setNodes((nds: Node[]) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...(n.data as NvcNodeData),
          isBase: n.id === id,
        },
      })),
    );
  }, [id, data.isBase, setNodes]);

  const showPanel = hovered || selected;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: TILE_WIDTH,
        boxSizing: "border-box",
        position: "relative",
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      }}
    >
      {/* ── Floating action panel ────────────────────────────────────────────
          Anchored to bottom:100% so it sits 8 px above the tile card.
          opacity+pointerEvents transition gives a subtle fade-in/out.
          zIndex:1000 keeps it above sibling nodes in the React Flow layer.
      ── */}
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
          pointerEvents: showPanel ? "all" : "none",
          opacity: showPanel ? 1 : 0,
          transition: "opacity 0.15s ease",
          whiteSpace: "nowrap",
        }}
      >
        {/* Set-as-base button */}
        <ActionBtn
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
          active={!!data.isBase}
          activeStyle={{
            border: "1.5px solid #F59E0B",
            background: "rgba(245,158,11,0.1)",
            color: "#92400E",
            cursor: "default",
          }}
          idleStyle={{
            border: "1.5px solid transparent",
            background: "transparent",
            color: "#6B7280",
            cursor: "pointer",
          }}
        >
          <span style={{ fontSize: 13 }}>{data.isBase ? "⭐" : "☆"}</span>
          <span>{data.isBase ? "Bazowy" : "Ustaw bazowy"}</span>
        </ActionBtn>

        {/* Divider */}
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
            width: 30,
            height: 30,
            borderRadius: 14,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 14,
            color: "#EF4444",
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

      {/* ── Base tile badge (⭐ pinned top-left, always visible when isBase) ── */}
      {data.isBase && (
        <div
          style={{
            position: "absolute",
            top: -9,
            left: -9,
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#F59E0B",
            border: "2.5px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            zIndex: 10,
            boxShadow: "0 2px 8px rgba(245,158,11,0.45)",
            userSelect: "none",
          }}
          title="Kafelek bazowy"
        >
          ⭐
        </div>
      )}

      {/* ── Tile card ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: data.color,
          borderRadius: 20,
          border: data.isBase
            ? "2px solid #F59E0B"
            : selected
              ? "2px solid rgba(124,58,237,0.5)"
              : "1px solid rgba(0,0,0,0.06)",
          boxShadow: data.isBase
            ? "0 0 0 3px rgba(245,158,11,0.15), 0 8px 24px rgba(0,0,0,0.06)"
            : selected
              ? "0 0 0 4px rgba(124,58,237,0.1), 0 10px 32px rgba(0,0,0,0.08)"
              : "0 8px 24px rgba(0,0,0,0.05)",
          padding: "12px 14px",
          transition: "box-shadow 0.2s ease, border-color 0.2s ease",
          cursor: "grab",
        }}
      >
        {/* Icon + label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: data.description ? 5 : 0,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
            {data.icon}
          </span>
          <span
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
          </span>
        </div>

        {/* Description — single line, truncated */}
        {data.description && (
          <p
            style={{
              fontSize: 10,
              color: "rgba(0,0,0,0.4)",
              margin: 0,
              lineHeight: 1.5,
              paddingLeft: 26,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {data.description}
          </p>
        )}
      </div>
    </div>
  );
}

export const nodeTypes = { nvcNode: NvcNode };

// ── Tiny helper: styled action button ────────────────────────────────────────

function ActionBtn({
  children,
  onClick,
  onMouseDown,
  title,
  active,
  activeStyle,
  idleStyle,
}: {
  children: React.ReactNode;
  onClick: React.MouseEventHandler;
  onMouseDown: React.MouseEventHandler;
  title: string;
  active: boolean;
  activeStyle: React.CSSProperties;
  idleStyle: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      onMouseDown={onMouseDown}
      title={title}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: "4px 10px",
        borderRadius: 14,
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
        fontSize: 11,
        fontWeight: 600,
        transition: "all 0.15s ease",
        ...(active ? activeStyle : idleStyle),
      }}
    >
      {children}
    </button>
  );
}
