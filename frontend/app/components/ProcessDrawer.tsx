"use client";

import React, { useEffect, useState } from "react";
import { api } from "../lib/apiClient";
import type { ProcessListItem } from "../types/api";

interface ProcessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProcess: (id: string) => void;
  onNewProcess: () => void;
  currentProcessId: string;
}

export function ProcessDrawer({
  isOpen,
  onClose,
  onOpenProcess,
  onNewProcess,
  currentProcessId,
}: ProcessDrawerProps) {
  const [tab, setTab] = useState<"mine" | "public">("mine");
  const [mine, setMine] = useState<ProcessListItem[]>([]);
  const [pub, setPub] = useState<ProcessListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    setLoading(true);
    Promise.all([api.processes.mine(), api.processes.public()])
      .then(([mineRes, pubRes]) => {
        if (!active) return;
        setMine(mineRes);
        setPub(pubRes);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const list = tab === "mine" ? mine : pub;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.28)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          zIndex: 95,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "min(360px, 100vw)",
          zIndex: 96,
          background: "#F9F9F7",
          boxShadow: "-20px 0 60px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "column",
          fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
        }}
      >
        <div style={{ padding: "20px 18px 14px", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <div style={{ fontSize: 17, fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.02em" }}>
              Procesy
            </div>
            <button onClick={onClose} aria-label="Zamknij" style={closeBtnStyle}>
              ×
            </button>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <TabButton active={tab === "mine"} onClick={() => setTab("mine")}>
              Moje
            </TabButton>
            <TabButton active={tab === "public"} onClick={() => setTab("public")}>
              Publiczne
            </TabButton>
          </div>
        </div>

        <div style={{ padding: "14px 18px 0", flexShrink: 0 }}>
          <button onClick={onNewProcess} style={newProcessBtnStyle}>
            + Nowy proces
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
          {loading && <EmptyHint>Wczytywanie...</EmptyHint>}
          {!loading && list.length === 0 && (
            <EmptyHint>
              {tab === "mine" ? "Brak własnych procesów." : "Brak publicznych procesów."}
            </EmptyHint>
          )}
          {!loading &&
            list.map((p) => (
              <button
                key={p.id}
                onClick={() => onOpenProcess(p.id)}
                style={{
                  ...processItemStyle,
                  border:
                    p.id === currentProcessId
                      ? "1.5px solid #D8B4FE"
                      : "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1a1a1a",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {p.title}
                </div>
                <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>
                  {p.visibility === "public" ? "🌐 Publiczny" : "🔒 Prywatny"} ·{" "}
                  {formatDate(p.updated_at)}
                </div>
              </button>
            ))}
        </div>
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: "8px 0",
        borderRadius: 12,
        border: "none",
        cursor: "pointer",
        fontSize: 12.5,
        fontWeight: 700,
        fontFamily: "inherit",
        background: active ? "#D8B4FE" : "rgba(0,0,0,0.05)",
        color: active ? "#4C1D95" : "#6B7280",
      }}
    >
      {children}
    </button>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: "24px 8px", textAlign: "center", fontSize: 12.5, color: "#C9CDD4" }}>
      {children}
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pl-PL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const closeBtnStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.06)",
  border: "none",
  borderRadius: "50%",
  width: 28,
  height: 28,
  cursor: "pointer",
  fontSize: 16,
  color: "#6B7280",
};

const newProcessBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 14,
  border: "2px dashed #D8B4FE",
  background: "rgba(216,180,254,0.04)",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  color: "#7C3AED",
  fontFamily: "inherit",
};

const processItemStyle: React.CSSProperties = {
  width: "100%",
  textAlign: "left",
  padding: "10px 12px",
  borderRadius: 14,
  background: "white",
  cursor: "pointer",
  marginBottom: 8,
  fontFamily: "inherit",
};
