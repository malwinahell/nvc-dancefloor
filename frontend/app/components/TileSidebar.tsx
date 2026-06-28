"use client";

import React, { useState, useEffect, DragEvent } from "react";
import type { TileTemplate } from "../types/nvc";
import { DEFAULT_NVC_TILES } from "../lib/defaultTiles";

interface TileSidebarProps {
  customTiles: TileTemplate[];
  onTileTap: (tile: TileTemplate) => void; // mobile: tap-to-add
  onCreateCustomTile: () => void;
  onDeleteCustomTile: (id: string) => void;
}

// ── Single draggable tile card ───────────────────────────────────────────────

function TileCard({
  tile,
  onDragStart,
  onTap,
  onDelete,
}: {
  tile: TileTemplate;
  onDragStart: (e: DragEvent<HTMLDivElement>, tile: TileTemplate) => void;
  onTap: (tile: TileTemplate) => void;
  onDelete?: (id: string) => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, tile)}
      onClick={() => onTap(tile)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: tile.color,
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.05)",
        boxShadow: hovered
          ? "0 8px 24px rgba(0,0,0,0.07)"
          : "0 2px 8px rgba(0,0,0,0.03)",
        padding: "10px 12px",
        cursor: "grab",
        display: "flex",
        alignItems: "center",
        gap: 10,
        position: "relative",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        userSelect: "none",
      }}
    >
      <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1 }}>
        {tile.icon}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#1a1a1a",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            letterSpacing: "-0.01em",
          }}
        >
          {tile.label}
        </div>
        {tile.description && (
          <div
            style={{
              fontSize: 10,
              color: "rgba(0,0,0,0.38)",
              marginTop: 2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              lineHeight: 1.4,
            }}
          >
            {tile.description}
          </div>
        )}
      </div>

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(tile.id);
          }}
          title="Usuń szablon"
          style={{
            background: "rgba(0,0,0,0.08)",
            border: "none",
            borderRadius: "50%",
            width: 20,
            height: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            color: "#6B7280",
            flexShrink: 0,
            padding: 0,
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
          }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// ── Shared sidebar content (rendered in both desktop + mobile) ───────────────

function SidebarContent({
  customTiles,
  onDragStart,
  onTap,
  onCreateCustomTile,
  onDeleteCustomTile,
}: {
  customTiles: TileTemplate[];
  onDragStart: (e: DragEvent<HTMLDivElement>, tile: TileTemplate) => void;
  onTap: (tile: TileTemplate) => void;
  onCreateCustomTile: () => void;
  onDeleteCustomTile: (id: string) => void;
}) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "20px 16px 14px",
          borderBottom: "1px solid rgba(0,0,0,0.05)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#BDC3C7",
            marginBottom: 4,
          }}
        >
          NVC Dancefloor
        </div>
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
          }}
        >
          Biblioteka kafelków
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#9CA3AF",
            marginTop: 4,
            lineHeight: 1.5,
          }}
        >
          Przeciągnij na płótno albo dotknij, żeby dodać
        </div>
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 14px" }}>
        {/* Process zones */}
        <SectionLabel>Strefy procesu</SectionLabel>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 7,
            marginBottom: 24,
          }}
        >
          {DEFAULT_NVC_TILES.map((tile: TileTemplate) => (
            <TileCard
              key={tile.id}
              tile={tile}
              onDragStart={onDragStart}
              onTap={onTap}
            />
          ))}
        </div>

        {/* Custom tiles */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 10,
          }}
        >
          <SectionLabel style={{ marginBottom: 0 }}>
            Własne kafelki
          </SectionLabel>
          {customTiles.length > 0 && (
            <span
              style={{
                fontSize: 10,
                background: "rgba(0,0,0,0.06)",
                borderRadius: 20,
                padding: "2px 7px",
                color: "#9CA3AF",
                fontWeight: 600,
              }}
            >
              {customTiles.length}
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 7,
            marginBottom: 12,
          }}
        >
          {customTiles.map((tile) => (
            <TileCard
              key={tile.id}
              tile={tile}
              onDragStart={onDragStart}
              onTap={onTap}
              onDelete={onDeleteCustomTile}
            />
          ))}
        </div>

        {customTiles.length === 0 && (
          <div
            style={{
              padding: "14px 12px",
              borderRadius: 14,
              background: "transparent",
              border: "2px dashed rgba(0,0,0,0.07)",
              textAlign: "center",
              fontSize: 12,
              color: "#C9CDD4",
              marginBottom: 12,
            }}
          >
            Brak własnych kafelków
          </div>
        )}

        {/* Create button */}
        <CreateButton onClick={onCreateCustomTile} />
      </div>
    </div>
  );
}

// ── Main exported sidebar ────────────────────────────────────────────────────

export function TileSidebar({
  customTiles,
  onTileTap,
  onCreateCustomTile,
  onDeleteCustomTile,
}: TileSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  // Detect viewport width — replaces Tailwind md: classes.
  // Initial value is read in the useState lazy initializer (runs only on client)
  // so the effect body only registers the change listener — no synchronous setState.
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 767px)").matches;
  });
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const onDragStart = (e: DragEvent<HTMLDivElement>, tile: TileTemplate) => {
    e.dataTransfer.setData("application/nvc-tile", JSON.stringify(tile));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTap = (tile: TileTemplate) => {
    onTileTap(tile);
    setMobileOpen(false); // close sheet after adding on mobile
  };

  const sharedProps = {
    customTiles,
    onDragStart,
    onTap: handleTap,
    onCreateCustomTile,
    onDeleteCustomTile,
  };

  return (
    <>
      {/* ── Desktop: fixed left sidebar ─────────────────────────────────── */}
      <aside
        style={{
          display: isMobile ? "none" : "flex",
          width: 264,
          flexShrink: 0,
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderRight: "1px solid rgba(0,0,0,0.05)",
          boxShadow: "4px 0 24px rgba(0,0,0,0.02)",
          height: "100%",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <SidebarContent {...sharedProps} />
      </aside>

      {/* ── Mobile: FAB + bottom sheet ──────────────────────────────────── */}
      <div style={{ display: isMobile ? "block" : "none" }}>
        {/* Floating action button */}
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Otwórz bibliotekę kafelków"
          style={{
            position: "fixed",
            bottom: 28,
            right: 24,
            zIndex: 50,
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "#D8B4FE",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            boxShadow:
              "0 8px 32px rgba(124,58,237,0.3), 0 2px 8px rgba(0,0,0,0.1)",
            transition: "transform 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.06)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
        >
          ✦
        </button>

        {/* Backdrop */}
        {mobileOpen && (
          <div
            onClick={() => setMobileOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.28)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              zIndex: 60,
            }}
          />
        )}

        {/* Bottom sheet */}
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 70,
            background: "#F9F9F7",
            borderRadius: "24px 24px 0 0",
            boxShadow: "0 -20px 60px rgba(0,0,0,0.14)",
            maxHeight: "75dvh",
            display: "flex",
            flexDirection: "column",
            transform: mobileOpen ? "translateY(0)" : "translateY(110%)",
            transition: "transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)",
            overflow: "hidden",
          }}
        >
          {/* Drag handle visual */}
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "12px 0 0",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                background: "rgba(0,0,0,0.14)",
              }}
            />
          </div>

          {/* Close button */}
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Zamknij"
            style={{
              position: "absolute",
              top: 14,
              right: 16,
              background: "rgba(0,0,0,0.06)",
              border: "none",
              borderRadius: "50%",
              width: 30,
              height: 30,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 17,
              color: "#6B7280",
              padding: 0,
            }}
          >
            ×
          </button>

          <div style={{ flex: 1, overflowY: "auto", paddingTop: 4 }}>
            <SidebarContent {...sharedProps} />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Small helpers ────────────────────────────────────────────────────────────

function SectionLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#C9CDD4",
        marginBottom: 10,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CreateButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "10px 14px",
        borderRadius: 16,
        border: "2px dashed #D8B4FE",
        background: hovered
          ? "rgba(216,180,254,0.12)"
          : "rgba(216,180,254,0.04)",
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 700,
        color: "#7C3AED",
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
        transition: "background 0.2s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        letterSpacing: "-0.01em",
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>+</span>
      Nowy kafelek
    </button>
  );
}
