"use client";

import React, { useState, useEffect } from "react";
import type { TileTemplate } from "../types/nvc";

// NOTE: remounted via key prop in page.tsx on every open — state always fresh,
// no setState-in-effect needed.

interface AddTileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tile: Omit<TileTemplate, "id">) => void;
}

const PRESET_COLORS = [
  "#FFB5A7",
  "#FFDAB9",
  "#FFF3CD",
  "#D8F3DC",
  "#A3E4D7",
  "#D8B4FE",
  "#BFDBFE",
  "#FBD5F5",
  "#E6E6FA",
  "#D1D5DB",
  "#F9D5BB",
  "#C7F2A4",
];

// '' = no icon sentinel; must stay first in the array
const PRESET_ICONS = [
  "", // "no icon" — rendered as ∅ in the picker
  "💡",
  "🎯",
  "🌊",
  "🔥",
  "⚡",
  "🎭",
  "🌈",
  "🏔️",
  "🌺",
  "🦋",
  "🌙",
  "✨",
  "🧩",
  "💎",
  "🌀",
  "🎪",
];

export function AddTileModal({ isOpen, onClose, onSave }: AddTileModalProps) {
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#D8B4FE");
  const [icon, setIcon] = useState("💡");

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const canSave = label.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      label: label.trim(),
      description: description.trim() || undefined,
      color,
      icon, // '' = no icon, handled in NvcNode via !!data.icon check
      nvcType: "custom",
      isDefault: false,
    });
  };

  if (!isOpen) return null;

  const hasIcon = icon !== "";

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(4px)",
          zIndex: 200,
        }}
      />

      {/* Modal card */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 201,
          background: "#F9F9F7",
          borderRadius: 28,
          padding: "28px 28px 24px",
          width: "min(460px, calc(100vw - 32px))",
          maxHeight: "calc(100dvh - 48px)",
          overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
          fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: "#1a1a1a",
              margin: 0,
              letterSpacing: "-0.02em",
            }}
          >
            Nowy kafelek
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "#9CA3AF",
              margin: "4px 0 0",
              fontWeight: 400,
            }}
          >
            Stwórz własną strefę procesu
          </p>
        </div>

        {/* Live preview */}
        <div
          style={{
            background: color,
            borderRadius: 20,
            padding: "12px 16px",
            marginBottom: 24,
            border: "1px solid rgba(0,0,0,0.05)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            gap: hasIcon ? 10 : 0,
            minHeight: 52,
          }}
        >
          {/* Icon only if selected */}
          {hasIcon && (
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>
              {icon}
            </span>
          )}

          {/* Text centred horizontally */}
          <div style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#1a1a1a" }}>
              {label || (
                <span style={{ color: "rgba(0,0,0,0.28)" }}>
                  Podgląd kafelka...
                </span>
              )}
            </div>
            {description && (
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(0,0,0,0.38)",
                  marginTop: 3,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {description}
              </div>
            )}
          </div>
        </div>

        {/* ── Icon picker ───────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Ikona</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PRESET_ICONS.map((i, idx) => {
              const isSelected = icon === i;
              const isEmpty = i === "";
              return (
                <button
                  key={idx}
                  onClick={() => setIcon(i)}
                  title={isEmpty ? "Brak ikony" : i}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 12,
                    border: isSelected
                      ? "2px solid #7C3AED"
                      : "1.5px solid rgba(0,0,0,0.08)",
                    background: isSelected
                      ? "rgba(124,58,237,0.07)"
                      : isEmpty
                        ? "rgba(0,0,0,0.03)"
                        : "white",
                    cursor: "pointer",
                    fontSize: isEmpty ? 13 : 18,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isEmpty
                      ? isSelected
                        ? "#7C3AED"
                        : "#9CA3AF"
                      : "inherit",
                    fontWeight: isEmpty ? 700 : 400,
                    transition: "border 0.12s, background 0.12s",
                    boxSizing: "border-box",
                    // "no icon" gets a slightly different shape as a hint
                    borderStyle: isEmpty ? "dashed" : "solid",
                  }}
                >
                  {isEmpty ? "∅" : i}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Colour picker ─────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Kolor</label>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              alignItems: "center",
            }}
          >
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: c,
                  border: "none",
                  cursor: "pointer",
                  outline:
                    color === c ? "2px solid #7C3AED" : "2px solid transparent",
                  outlineOffset: 2,
                  transition: "outline 0.12s",
                  boxSizing: "border-box",
                }}
              />
            ))}

            {/* Custom colour input */}
            <label
              title="Własny kolor"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "2px dashed rgba(0,0,0,0.2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                color: "#9CA3AF",
                position: "relative",
                overflow: "hidden",
              }}
            >
              +
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  position: "absolute",
                  opacity: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                }}
              />
            </label>
          </div>
        </div>

        {/* ── Label ──────────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            Nazwa <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSave) handleSave();
            }}
            placeholder="np. Granica, Strach, Pytanie..."
            maxLength={40}
            autoFocus
            style={inputStyle}
          />
        </div>

        {/* ── Description ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>
            Opis{" "}
            <span style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF" }}>
              (opcjonalnie — pojawi się jako podpowiedź na kafelku)
            </span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Krótka wskazówka pomocnicza..."
            maxLength={120}
            style={inputStyle}
          />
        </div>

        {/* ── Actions ────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={onClose} style={cancelBtnStyle}>
            Anuluj
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              ...saveBtnStyle,
              opacity: canSave ? 1 : 0.45,
              cursor: canSave ? "pointer" : "not-allowed",
            }}
          >
            Dodaj kafelek ✦
          </button>
        </div>
      </div>
    </>
  );
}

// ── Shared mini-styles ────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#6B7280",
  marginBottom: 8,
  letterSpacing: "0.01em",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 14,
  border: "1.5px solid rgba(0,0,0,0.09)",
  background: "white",
  fontSize: 14,
  fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
  color: "#1a1a1a",
  outline: "none",
  boxSizing: "border-box",
};

const cancelBtnStyle: React.CSSProperties = {
  flex: "0 0 auto",
  padding: "11px 20px",
  borderRadius: 16,
  border: "1.5px solid rgba(0,0,0,0.09)",
  background: "white",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
  color: "#6B7280",
  fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
};

const saveBtnStyle: React.CSSProperties = {
  flex: 1,
  padding: "11px 20px",
  borderRadius: 16,
  border: "none",
  background: "#D8B4FE",
  fontSize: 14,
  fontWeight: 700,
  color: "#4C1D95",
  fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
  letterSpacing: "-0.01em",
};
