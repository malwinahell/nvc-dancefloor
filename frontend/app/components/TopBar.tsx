"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";
import { useMobile } from "../hooks/useMobile";
import type { Visibility } from "../types/api";

export type SaveState = "idle" | "saving" | "saved" | "error";

interface TopBarProps {
  title: string;
  description: string | null;
  visibility: Visibility;
  isOwner: boolean;
  saveState: SaveState;
  onRename: (title: string) => void;
  onEditDescription: (description: string) => void;
  onToggleVisibility: () => void;
  onOpenDrawer: () => void;
  onNewProcess: () => void;
  onFork: () => void;
  onRetrySave: () => void;
}

export function TopBar(props: TopBarProps) {
  const isMobile = useMobile();
  return isMobile ? <TopBarMobile {...props} /> : <TopBarDesktop {...props} />;
}

// ── Desktop TopBar ────────────────────────────────────────────────────────────

function TopBarDesktop({
  title,
  description,
  visibility,
  isOwner,
  saveState,
  onRename,
  onEditDescription,
  onToggleVisibility,
  onOpenDrawer,
  onNewProcess,
  onFork,
  onRetrySave,
}: TopBarProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [descDraft, setDescDraft] = useState(description ?? "");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLInputElement>(null);

  // focus w efekcie jest OK — to manipulacja DOM, nie setState
  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);
  useEffect(() => {
    if (editingDesc) descRef.current?.focus();
  }, [editingDesc]);

  // Draft inicjalizujemy przy wejściu w tryb edycji (onClick), nie przez efekt
  const startEditing = () => {
    setDraft(title);
    setEditing(true);
  };
  const startEditingDesc = () => {
    setDescDraft(description ?? "");
    setEditingDesc(true);
  };

  const commitRename = () => {
    setEditing(false);
    const t = draft.trim();
    if (t && t !== title) onRename(t);
  };
  const commitDesc = () => {
    setEditingDesc(false);
    const t = descDraft.trim();
    if (t !== (description ?? "")) onEditDescription(t);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <header style={headerBase}>
      <button onClick={onOpenDrawer} title="Procesy" style={iconBtn(36)}>
        📂
      </button>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 2,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {editing ? (
            <input
              ref={inputRef}
              value={draft}
              maxLength={80}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setDraft(title);
                  setEditing(false);
                }
              }}
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
              onClick={() => isOwner && startEditing()}
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
                maxWidth: 260,
              }}
            >
              {title}
            </button>
          )}
          {!isOwner && <span style={badgeStyle}>Tylko do odczytu</span>}
          {isOwner && (
            <button
              onClick={onToggleVisibility}
              style={visibilityBadgeStyle(visibility)}
            >
              {visibility === "public" ? "🌐 Publiczny" : "🔒 Prywatny"}
            </button>
          )}
          {isOwner && <SaveIndicator state={saveState} onRetry={onRetrySave} />}
        </div>

        {isOwner &&
          (editingDesc ? (
            <input
              ref={descRef}
              value={descDraft}
              maxLength={300}
              placeholder="Dodaj opis procesu..."
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={commitDesc}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitDesc();
                if (e.key === "Escape") {
                  setDescDraft(description ?? "");
                  setEditingDesc(false);
                }
              }}
              style={{
                fontSize: 11,
                color: "#9CA3AF",
                border: "1px solid #D8B4FE",
                borderRadius: 6,
                padding: "2px 8px",
                outline: "none",
                fontFamily: "inherit",
                background: "white",
                maxWidth: 300,
              }}
            />
          ) : (
            <button
              onClick={() => startEditingDesc()}
              style={{
                fontSize: 11,
                color: description ? "#9CA3AF" : "#C9CDD4",
                background: "none",
                border: "none",
                cursor: "text",
                padding: "2px 6px",
                fontFamily: "inherit",
                textAlign: "left",
                fontStyle: description ? "normal" : "italic",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 300,
              }}
            >
              {description || "Dodaj opis..."}
            </button>
          ))}
      </div>

      {!isOwner && (
        <button onClick={onFork} style={primaryBtnStyle}>
          Zapisz jako mój proces
        </button>
      )}
      <button onClick={onNewProcess} title="Nowy proces" style={iconBtn(36)}>
        ＋
      </button>

      <div style={{ position: "relative" }}>
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          title="Konto"
          style={iconBtn(36)}
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

// ── Mobile TopBar ─────────────────────────────────────────────────────────────
// Układ: [📂] [Tytuł ... SaveState] [⋮]
// ⋮ otwiera bottom sheet z wszystkimi pozostałymi opcjami.

function TopBarMobile({
  title,
  description,
  visibility,
  isOwner,
  saveState,
  onRename,
  onEditDescription,
  onToggleVisibility,
  onOpenDrawer,
  onNewProcess,
  onFork,
  onRetrySave,
}: TopBarProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [draft, setDraft] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingTitle) inputRef.current?.focus();
  }, [editingTitle]);

  const startEditing = () => {
    setDraft(title);
    setEditingTitle(true);
  };

  const commitRename = () => {
    setEditingTitle(false);
    const t = draft.trim();
    if (t && t !== title) onRename(t);
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  return (
    <>
      <header style={{ ...headerBase, height: 52, padding: "0 12px", gap: 8 }}>
        {/* Drawer */}
        <button onClick={onOpenDrawer} style={iconBtn(44)}>
          📂
        </button>

        {/* Tytuł + save state */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {editingTitle ? (
            <input
              ref={inputRef}
              value={draft}
              maxLength={80}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setDraft(title);
                  setEditingTitle(false);
                }
              }}
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
                width: "100%",
              }}
            />
          ) : (
            <button
              onClick={() => isOwner && (setEditingTitle(true), startEditing())}
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "#1a1a1a",
                background: "none",
                border: "none",
                cursor: isOwner ? "text" : "default",
                padding: "4px 2px",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "100%",
                textAlign: "left",
              }}
            >
              {title}
            </button>
          )}
          {isOwner && saveState !== "idle" && (
            <span
              style={{
                fontSize: 10,
                color: saveState === "error" ? "#EF4444" : "#BDC3C7",
                flexShrink: 0,
              }}
            >
              {saveState === "saving"
                ? "⏳"
                : saveState === "saved"
                  ? "✓"
                  : "✕"}
            </span>
          )}
        </div>

        {/* Menu ⋮ */}
        <button
          onClick={() => setMenuOpen(true)}
          style={iconBtn(44)}
          aria-label="Menu"
        >
          ⋮
        </button>
      </header>

      {/* Mobile bottom-sheet menu */}
      {menuOpen && (
        <>
          <div
            onClick={() => setMenuOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              zIndex: 200,
            }}
          />
          <div
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 201,
              background: "#F9F9F7",
              borderRadius: "20px 20px 0 0",
              boxShadow: "0 -16px 48px rgba(0,0,0,0.14)",
              paddingBottom: "env(safe-area-inset-bottom)",
              fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
            }}
          >
            {/* Handle */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                padding: "12px 0 4px",
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

            <div
              style={{
                padding: "8px 16px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              {/* Opis procesu */}
              {isOwner && (
                <MobileMenuSection label="Opis procesu">
                  <MobileDescriptionEditor
                    description={description}
                    onSave={(d) => {
                      onEditDescription(d);
                      setMenuOpen(false);
                    }}
                    onCancel={() => setMenuOpen(false)}
                  />
                </MobileMenuSection>
              )}

              {/* Widoczność */}
              {isOwner && (
                <MobileMenuItem
                  icon={visibility === "public" ? "🌐" : "🔒"}
                  label={
                    visibility === "public"
                      ? "Publiczny — kliknij, aby zmienić na prywatny"
                      : "Prywatny — kliknij, aby upublicznić"
                  }
                  onClick={() => {
                    onToggleVisibility();
                    setMenuOpen(false);
                  }}
                />
              )}

              {/* Fork (dla nie-właściciela) */}
              {!isOwner && (
                <MobileMenuItem
                  icon="💾"
                  label="Zapisz jako mój proces"
                  onClick={() => {
                    onFork();
                    setMenuOpen(false);
                  }}
                  highlight
                />
              )}

              {/* Retry save */}
              {isOwner && saveState === "error" && (
                <MobileMenuItem
                  icon="🔄"
                  label="Ponów zapis"
                  onClick={() => {
                    onRetrySave();
                    setMenuOpen(false);
                  }}
                />
              )}

              {/* Nowy proces */}
              <MobileMenuItem
                icon="＋"
                label="Nowy proces"
                onClick={() => {
                  onNewProcess();
                  setMenuOpen(false);
                }}
              />

              <div
                style={{
                  height: 1,
                  background: "rgba(0,0,0,0.06)",
                  margin: "4px 0",
                }}
              />

              {/* Wyloguj */}
              <MobileMenuItem
                icon="🚪"
                label="Wyloguj się"
                onClick={handleLogout}
                danger
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}

// ── Mobile helpers ────────────────────────────────────────────────────────────

function MobileMenuSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "#BDC3C7",
          textTransform: "uppercase",
          padding: "4px 4px 6px",
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function MobileMenuItem({
  icon,
  label,
  onClick,
  highlight,
  danger,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "13px 12px",
        borderRadius: 14,
        border: "none",
        background: highlight
          ? "rgba(216,180,254,0.12)"
          : danger
            ? "rgba(239,68,68,0.06)"
            : "rgba(0,0,0,0.02)",
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      <span
        style={{ fontSize: 18, width: 24, textAlign: "center", flexShrink: 0 }}
      >
        {icon}
      </span>
      <span
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: danger ? "#EF4444" : highlight ? "#7C3AED" : "#1a1a1a",
        }}
      >
        {label}
      </span>
    </button>
  );
}

function MobileDescriptionEditor({
  description,
  onSave,
}: {
  description: string | null;
  onSave: (d: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(description ?? "");
  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        maxLength={300}
        placeholder="Opis procesu..."
        autoFocus
        style={{
          flex: 1,
          padding: "10px 12px",
          borderRadius: 12,
          border: "1.5px solid rgba(0,0,0,0.08)",
          fontSize: 13,
          fontFamily: "inherit",
          outline: "none",
          background: "white",
        }}
      />
      <button
        onClick={() => onSave(value)}
        style={{
          padding: "10px 14px",
          borderRadius: 12,
          border: "none",
          background: "#D8B4FE",
          color: "#4C1D95",
          fontWeight: 700,
          fontSize: 13,
          cursor: "pointer",
          fontFamily: "inherit",
          flexShrink: 0,
        }}
      >
        OK
      </button>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────

function SaveIndicator({
  state,
  onRetry,
}: {
  state: SaveState;
  onRetry: () => void;
}) {
  if (state === "idle") return null;
  return (
    <span
      style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
    >
      <span
        style={{
          fontSize: 11,
          color: state === "error" ? "#EF4444" : "#9CA3AF",
        }}
      >
        {state === "saving" && "Zapisywanie..."}
        {state === "saved" && "Zapisano ✓"}
        {state === "error" && "Błąd zapisu"}
      </span>
      {state === "error" && (
        <button
          onClick={onRetry}
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "#EF4444",
            background: "rgba(239,68,68,0.08)",
            border: "none",
            borderRadius: 6,
            padding: "2px 7px",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Ponów
        </button>
      )}
    </span>
  );
}

const headerBase: React.CSSProperties = {
  flexShrink: 0,
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "0 14px",
  height: 56,
  background: "rgba(255,255,255,0.92)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
  fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
  position: "relative",
  zIndex: 80,
};

const iconBtn = (size: number): React.CSSProperties => ({
  width: size,
  height: size,
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
  padding: 0,
});

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
