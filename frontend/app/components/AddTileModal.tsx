"use client";

import React, { useState, useEffect } from "react";
import type { TileTemplate } from "../types/nvc";

// NOTE: This component is intentionally remounted via a `key` prop in the parent
// every time the modal opens. That way state always starts fresh without needing
// to reset it inside an effect (which triggers cascading renders).

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

const PRESET_ICONS = [
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

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSave = () => {
    if (!label.trim()) return;
    onSave({
      label: label.trim(),
      description: description.trim() || undefined,
      color,
      icon,
      nvcType: "custom",
      isDefault: false,
    });
  };

  if (!isOpen) return null;

  const canSave = label.trim().length > 0;

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
          transform: "translate(-50%, -50%)",
          zIndex: 201,
          background: "#F9F9F7",
          borderRadius: "28px",
          padding: "28px 28px 24px",
          width: "min(460px, calc(100vw - 32px))",
          maxHeight: "calc(100dvh - 48px)",
          overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,0.18)",
          fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
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
            padding: "14px 18px",
            marginBottom: 24,
            border: "1px solid rgba(0,0,0,0.05)",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            minHeight: 56,
          }}
        >
          <span style={{ fontSize: 22 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>
              {label || (
                <span style={{ color: "rgba(0,0,0,0.3)" }}>
                  Podgląd kafelka...
                </span>
              )}
            </div>
            {description && (
              <div
                style={{ fontSize: 11, color: "rgba(0,0,0,0.4)", marginTop: 2 }}
              >
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Icon picker */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Ikona</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {PRESET_ICONS.map((i) => (
              <button
                key={i}
                onClick={() => setIcon(i)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  border:
                    icon === i
                      ? "2px solid #7C3AED"
                      : "1.5px solid rgba(0,0,0,0.08)",
                  background: icon === i ? "rgba(124,58,237,0.07)" : "white",
                  cursor: "pointer",
                  fontSize: 18,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "border 0.15s, background 0.15s",
                  boxSizing: "border-box",
                }}
              >
                {i}
              </button>
            ))}
          </div>
        </div>

        {/* Color picker */}
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
                  transition: "outline 0.15s",
                  boxSizing: "border-box",
                }}
              />
            ))}
            {/* Custom color input */}
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

        {/* Label input */}
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

        {/* Description input */}
        <div style={{ marginBottom: 28 }}>
          <label style={labelStyle}>
            Opis{" "}
            <span style={{ fontSize: 11, fontWeight: 400, color: "#9CA3AF" }}>
              (opcjonalnie)
            </span>
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Krótka wskazówka pomocnicza..."
            maxLength={80}
            style={inputStyle}
          />
        </div>

        {/* Actions */}
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

// ── Shared mini-styles ──────────────────────────────────────────────────────

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
  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
  color: "#1a1a1a",
  outline: "none",
  boxSizing: "border-box",
  transition: "border 0.15s",
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
  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
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
  fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
  letterSpacing: "-0.01em",
};
