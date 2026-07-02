"use client";

import React, { useEffect, useState } from "react";
import { api } from "../lib/apiClient";
import { useToast } from "./Toast";
import { useMobile } from "../hooks/useMobile";
import type { ProcessListItem } from "../types/api";

interface ProcessDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProcess: (id: string) => void;
  onNewProcess: () => void;
  currentProcessId: string;
  onProcessDeleted: (id: string) => void;
}

export function ProcessDrawer(props: ProcessDrawerProps) {
  const isMobile = useMobile();
  return isMobile ? (
    <ProcessDrawerMobile {...props} />
  ) : (
    <ProcessDrawerDesktop {...props} />
  );
}

// ── Wspólny stan i logika ─────────────────────────────────────────────────────

function useDrawerState(
  isOpen: boolean,
  onProcessDeleted: (id: string) => void,
) {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"mine" | "public">("mine");
  // null = "jeszcze nie załadowano" — loading derivujemy z null, nie oddzielny state.
  // setMine/setPub(null) w cleanup efektu resetuje przy zamknięciu drawera
  // bez synchronicznego setState w body efektu.
  const [mine, setMine] = useState<ProcessListItem[] | null>(null);
  const [pub, setPub] = useState<ProcessListItem[] | null>(null);
  const loading = mine === null;
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;

    Promise.all([api.processes.mine(), api.processes.public()]).then(
      ([mineRes, pubRes]) => {
        if (!active) return;
        setMine(mineRes);
        setPub(pubRes);
      },
    );

    return () => {
      active = false;
      // Reset w cleanup (nie w body) — dopuszczalne przez React compiler,
      // nie powoduje cascading renders. Dzięki temu przy kolejnym otwarciu
      // loading === true (mine === null) od razu.
      setMine(null);
      setPub(null);
    };
  }, [isOpen]);

  const handleDeleteConfirm = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await api.processes.remove(confirmDeleteId);
      setMine((prev) =>
        prev ? prev.filter((p) => p.id !== confirmDeleteId) : prev,
      );
      showToast("Proces usunięty.", "success");
      onProcessDeleted(confirmDeleteId);
      setConfirmDeleteId(null);
    } catch {
      showToast("Nie udało się usunąć procesu.", "error");
    } finally {
      setDeleting(false);
    }
  };

  return {
    tab,
    setTab,
    list: tab === "mine" ? (mine ?? []) : (pub ?? []),
    loading,
    confirmDeleteId,
    setConfirmDeleteId,
    deleting,
    handleDeleteConfirm,
  };
}

// ── Desktop: right-side panel ─────────────────────────────────────────────────

function ProcessDrawerDesktop({
  isOpen,
  onClose,
  onOpenProcess,
  onNewProcess,
  currentProcessId,
  onProcessDeleted,
}: ProcessDrawerProps) {
  const state = useDrawerState(isOpen, onProcessDeleted);
  if (!isOpen) return null;

  return (
    <>
      <div onClick={onClose} style={backdropStyle("rgba(0,0,0,0.28)", 95)} />
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
        <DrawerHeader
          onClose={onClose}
          tab={state.tab}
          onTabChange={state.setTab}
        />
        <NewProcessBtn onClick={onNewProcess} />
        <DrawerList
          list={state.list}
          loading={state.loading}
          tab={state.tab}
          currentProcessId={currentProcessId}
          onOpen={onOpenProcess}
          onDeleteRequest={state.setConfirmDeleteId}
        />
      </div>
      {state.confirmDeleteId && (
        <ConfirmDialog
          deleting={state.deleting}
          onConfirm={state.handleDeleteConfirm}
          onCancel={() => state.setConfirmDeleteId(null)}
        />
      )}
    </>
  );
}

// ── Mobile: bottom sheet ──────────────────────────────────────────────────────

function ProcessDrawerMobile({
  isOpen,
  onClose,
  onOpenProcess,
  onNewProcess,
  currentProcessId,
  onProcessDeleted,
}: ProcessDrawerProps) {
  const state = useDrawerState(isOpen, onProcessDeleted);

  return (
    <>
      {isOpen && (
        <div onClick={onClose} style={backdropStyle("rgba(0,0,0,0.3)", 95)} />
      )}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 96,
          background: "#F9F9F7",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -16px 48px rgba(0,0,0,0.14)",
          maxHeight: "82dvh",
          display: "flex",
          flexDirection: "column",
          fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
          transform: isOpen ? "translateY(0)" : "translateY(110%)",
          transition: "transform 0.32s cubic-bezier(0.32,0.72,0,1)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        {/* Handle */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "12px 0 0",
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
        <DrawerHeader
          onClose={onClose}
          tab={state.tab}
          onTabChange={state.setTab}
        />
        <NewProcessBtn
          onClick={() => {
            onNewProcess();
            onClose();
          }}
        />
        <DrawerList
          list={state.list}
          loading={state.loading}
          tab={state.tab}
          currentProcessId={currentProcessId}
          onOpen={(id) => {
            onOpenProcess(id);
            onClose();
          }}
          onDeleteRequest={state.setConfirmDeleteId}
        />
      </div>
      {state.confirmDeleteId && (
        <ConfirmDialog
          deleting={state.deleting}
          onConfirm={state.handleDeleteConfirm}
          onCancel={() => state.setConfirmDeleteId(null)}
        />
      )}
    </>
  );
}

// ── Współdzielone bloki UI ────────────────────────────────────────────────────

function DrawerHeader({
  onClose,
  tab,
  onTabChange,
}: {
  onClose: () => void;
  tab: "mine" | "public";
  onTabChange: (t: "mine" | "public") => void;
}) {
  return (
    <div
      style={{
        padding: "16px 18px 14px",
        borderBottom: "1px solid rgba(0,0,0,0.05)",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.02em",
          }}
        >
          Procesy
        </div>
        <button onClick={onClose} aria-label="Zamknij" style={closeBtnStyle}>
          ×
        </button>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <TabBtn active={tab === "mine"} onClick={() => onTabChange("mine")}>
          Moje
        </TabBtn>
        <TabBtn active={tab === "public"} onClick={() => onTabChange("public")}>
          Publiczne
        </TabBtn>
      </div>
    </div>
  );
}

function NewProcessBtn({ onClick }: { onClick: () => void }) {
  return (
    <div style={{ padding: "12px 18px 0", flexShrink: 0 }}>
      <button onClick={onClick} style={newProcessBtnStyle}>
        + Nowy proces
      </button>
    </div>
  );
}

function DrawerList({
  list,
  loading,
  tab,
  currentProcessId,
  onOpen,
  onDeleteRequest,
}: {
  list: ProcessListItem[];
  loading: boolean;
  tab: "mine" | "public";
  currentProcessId: string;
  onOpen: (id: string) => void;
  onDeleteRequest: (id: string) => void;
}) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "14px" }}>
      {loading && <EmptyHint>Wczytywanie...</EmptyHint>}
      {!loading && list.length === 0 && (
        <EmptyHint>
          {tab === "mine"
            ? "Brak własnych procesów."
            : "Brak publicznych procesów."}
        </EmptyHint>
      )}
      {!loading &&
        list.map((p) => (
          <ProcessItem
            key={p.id}
            process={p}
            isCurrent={p.id === currentProcessId}
            showDelete={tab === "mine"}
            onOpen={() => onOpen(p.id)}
            onDeleteRequest={() => onDeleteRequest(p.id)}
          />
        ))}
    </div>
  );
}

function ProcessItem({
  process,
  isCurrent,
  showDelete,
  onOpen,
  onDeleteRequest,
}: {
  process: ProcessListItem;
  isCurrent: boolean;
  showDelete: boolean;
  onOpen: () => void;
  onDeleteRequest: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}
    >
      <button
        onClick={onOpen}
        style={{
          flex: 1,
          textAlign: "left",
          padding: "11px 12px",
          borderRadius: 14,
          background: "white",
          cursor: "pointer",
          fontFamily: "inherit",
          border: isCurrent
            ? "1.5px solid #D8B4FE"
            : "1px solid rgba(0,0,0,0.05)",
          minWidth: 0,
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
          {process.title}
        </div>
        <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 3 }}>
          {process.visibility === "public" ? "🌐 Publiczny" : "🔒 Prywatny"} ·{" "}
          {formatDate(process.updated_at)}
        </div>
      </button>
      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDeleteRequest();
          }}
          title="Usuń proces"
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            border: "none",
            background: hovered ? "rgba(239,68,68,0.08)" : "transparent",
            cursor: "pointer",
            fontSize: 16,
            color: hovered ? "#EF4444" : "#C9CDD4",
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          🗑️
        </button>
      )}
    </div>
  );
}

function ConfirmDialog({
  deleting,
  onConfirm,
  onCancel,
}: {
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          zIndex: 300,
        }}
      />
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%,-50%)",
          zIndex: 301,
          background: "#F9F9F7",
          borderRadius: 20,
          padding: "24px 24px 20px",
          width: "min(340px, calc(100vw - 32px))",
          boxShadow: "0 20px 60px rgba(0,0,0,0.18)",
          fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#1a1a1a",
            marginBottom: 8,
          }}
        >
          Usunąć proces?
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#6B7280",
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          Tej operacji nie można cofnąć.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: 14,
              border: "1.5px solid rgba(0,0,0,0.09)",
              background: "white",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "#6B7280",
              fontFamily: "inherit",
            }}
          >
            Anuluj
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: 14,
              border: "none",
              background: "#FEE2E2",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              color: "#B91C1C",
              fontFamily: "inherit",
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? "Usuwanie..." : "Usuń"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Małe pomocniki ────────────────────────────────────────────────────────────

function TabBtn({
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
        padding: "9px 0",
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
    <div
      style={{
        padding: "24px 8px",
        textAlign: "center",
        fontSize: 12.5,
        color: "#C9CDD4",
      }}
    >
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

function backdropStyle(bg: string, z: number): React.CSSProperties {
  return {
    position: "fixed",
    inset: 0,
    background: bg,
    backdropFilter: "blur(2px)",
    WebkitBackdropFilter: "blur(2px)",
    zIndex: z,
  };
}

const closeBtnStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.06)",
  border: "none",
  borderRadius: "50%",
  width: 32,
  height: 32,
  cursor: "pointer",
  fontSize: 18,
  color: "#6B7280",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 0,
};
const newProcessBtnStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 14,
  border: "2px dashed #D8B4FE",
  background: "rgba(216,180,254,0.04)",
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 700,
  color: "#7C3AED",
  fontFamily: "inherit",
};
