"use client";

import React, { useRef, useState, useCallback } from "react";
import FlowCanvas from "./components/FlowCanvas";
import { TileSidebar } from "./components/TileSidebar";
import { AddTileModal } from "./components/AddTileModal";
import type { TileTemplate } from "./types/nvc";

export default function NvcDancefloorPage() {
  const [customTiles, setCustomTiles] = useState<TileTemplate[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const openModal = useCallback(() => {
    setModalKey((k) => k + 1);
    setModalOpen(true);
  }, []);

  const addTileRef = useRef<((tile: TileTemplate) => void) | null>(null);

  const handleRegisterAddTile = useCallback(
    (fn: (tile: TileTemplate) => void) => {
      addTileRef.current = fn;
    },
    [],
  );

  // Called when user taps a tile in the mobile sidebar
  const handleTileTap = useCallback((tile: TileTemplate) => {
    addTileRef.current?.(tile);
  }, []);

  // Called when user submits the AddTileModal form
  const handleSaveCustomTile = useCallback(
    (tileData: Omit<TileTemplate, "id">) => {
      const newTile: TileTemplate = {
        ...tileData,
        id: `custom-${Date.now()}`,
      };
      setCustomTiles((prev) => [...prev, newTile]);
      setModalOpen(false);
    },
    [],
  );

  const handleDeleteCustomTile = useCallback((id: string) => {
    setCustomTiles((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        width: "100%",
        overflow: "hidden",
        background: "#F9F9F7",
        fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
      }}
    >
      {/* ── Sidebar (desktop: left panel | mobile: FAB + bottom sheet) ── */}
      <TileSidebar
        customTiles={customTiles}
        onTileTap={handleTileTap}
        onCreateCustomTile={openModal}
        onDeleteCustomTile={handleDeleteCustomTile}
      />

      {/* ── Main canvas ──────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        <FlowCanvas onRegisterAddTile={handleRegisterAddTile} />
      </main>

      {/* ── Custom tile creation modal ───────────────────────────────── */}
      <AddTileModal
        key={modalKey}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCustomTile}
      />
    </div>
  );
}
