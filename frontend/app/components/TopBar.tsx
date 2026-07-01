"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import type { Visibility } from "../types/api";

export type SaveState = "idle" | "saving" | "saved" | "error";

interface TopBarProps {
  title: string;
  visibility: Visibility;
  isOwner: boolean;
  saveState: SaveState;
  onRename: (title: string) => void;
  onToggleVisibility: () => void;
  onOpenDrawer: () => void;
  onNewProcess: () => void;
  onFork: () => void;
}

export function TopBar({
  title,
  visibility,
  isOwner,
  saveState,
  onRename,
  onToggleVisibility,
  onOpenDrawer,
  onNewProcess,
  onFork,
}: TopBarProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) setDraft(title);
  }, [title, editing]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commitRename = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (trimmed && trimmed !== title) {
      onRename(trimmed);
    } else {
      setDraft(title);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header
      style={{
        height: 56,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 14px",
        background: "rgba(255,255,255,0.92)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
        position: "relative",
        zIndex: 80,
      }}
    >
      <button onClick={onOpenDrawer} title="Procesy" style={iconBtnStyle}>
        📂
      </button>

      <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") {
                setDraft(title);
                setEditing(false);
              }
            }}
            maxLength={80}
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#1a1a1a",
              border: "1.5px solid #D8B4FE",
              borderRadius: 10,
              padding: "4px 10px",
              outline: "none",
              fontFamily: "inherit",
              background: "white",
              minWidth: 160,
            }}
          />
        ) : (
          <button
            onClick={() => isOwner && setEditing(true)}
            title={isOwner ? "Kliknij, aby zmienić nazwę" : title}
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#1a1a1a",
              background: "none",
              border: "none",
              cursor: isOwner ? "text" : "default",
              padding: "4px 6px",
              borderRadius: 8,
              fontFamily: "inherit",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: 320,
            }}
          >
            {title}
          </button>
        )}

        {!isOwner && <span style={badgeStyle}>Tylko do odczytu</span>}

        {isOwner && (
          <button
            onClick={onToggleVisibility}
            title="Zmień widoczność procesu"
            style={visibilityBadgeStyle(visibility)}
          >
            {visibility === "public" ? "🌐 Publiczny" : "🔒 Prywatny"}
          </button>
        )}

        {isOwner && <SaveIndicator state={saveState} />}
      </div>

      {!isOwner && (
        <button onClick={onFork} style={primaryBtnStyle}>
          Zapisz jako mój proces
        </button>
      )}

      <button onClick={onNewProcess} title="Nowy proces" style={iconBtnStyle}>
        ＋
      </button>

      <div style={{ position: "relative" }}>
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          title="Konto"
          style={iconBtnStyle}
        >
          👤
        </button>
        {userMenuOpen && (
          <>
            <div
              onClick={() => setUserMenuOpen(false)}
              style={{ position: "fixed", inset: 0, zIndex: 90 }}
            />
            <div style={userMenuStyle}>
              <button onClick={handleLogout} style={userMenuItemStyle}>
                Wyloguj się
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const label: Record<SaveState, string> = {
    idle: "",
    saving: "Zapisywanie...",
    saved: "Zapisano",
    error: "Błąd zapisu",
  };
  if (!label[state]) return null;
  return (
    <span
      style={{
        fontSize: 11,
        color: state === "error" ? "#EF4444" : "#9CA3AF",
        flexShrink: 0,
      }}
    >
      {label[state]}
    </span>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.06)",
  background: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 16,
  flexShrink: 0,
  color: "#6B7280",
};

const primaryBtnStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 12,
  border: "none",
  background: "#D8B4FE",
  color: "#4C1D95",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
  flexShrink: 0,
  whiteSpace: "nowrap",
};

const badgeStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: "#6B7280",
  background: "rgba(0,0,0,0.05)",
  borderRadius: 20,
  padding: "3px 9px",
  flexShrink: 0,
};

function visibilityBadgeStyle(visibility: Visibility): React.CSSProperties {
  return {
    fontSize: 11,
    fontWeight: 700,
    border: "none",
    cursor: "pointer",
    borderRadius: 20,
    padding: "3px 9px",
    flexShrink: 0,
    fontFamily: "inherit",
    color: visibility === "public" ? "#0F766E" : "#6B7280",
    background:
      visibility === "public" ? "rgba(163,228,215,0.35)" : "rgba(0,0,0,0.05)",
  };
}

const userMenuStyle: React.CSSProperties = {
  position: "absolute",
  top: 44,
  right: 0,
  zIndex: 91,
  background: "white",
  borderRadius: 14,
  border: "1px solid rgba(0,0,0,0.06)",
  boxShadow: "0 12px 32px rgba(0,0,0,0.1)",
  padding: 6,
  minWidth: 140,
};

const userMenuItemStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "8px 10px",
  borderRadius: 8,
  border: "none",
  background: "none",
  cursor: "pointer",
  fontSize: 13,
  color: "#1a1a1a",
  fontFamily: "inherit",
};
