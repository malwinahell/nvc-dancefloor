"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import FlowCanvas from "./FlowCanvas";
import { TileSidebar } from "./TileSidebar";
import { AddTileModal } from "./AddTileModal";
import { TopBar, type SaveState } from "./TopBar";
import { ProcessDrawer } from "./ProcessDrawer";
import { AuthGuard } from "./AuthGuard";
import { CenteredMessage } from "./AuthShell";
import { api, ApiError } from "../lib/apiClient";
import type { TileTemplate } from "../types/nvc";
import type {
  CanvasData,
  ProcessDetail,
  TileCreatePayload,
  TileOut,
} from "../types/api";

interface ProcessWorkspaceProps {
  processId: string;
}

export function ProcessWorkspace({ processId }: ProcessWorkspaceProps) {
  return (
    <AuthGuard>
      <ProcessWorkspaceInner processId={processId} />
    </AuthGuard>
  );
}

function ProcessWorkspaceInner({ processId }: ProcessWorkspaceProps) {
  const router = useRouter();

  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const [libraryTiles, setLibraryTiles] = useState<TileTemplate[]>([]);
  const [galleryTiles, setGalleryTiles] = useState<TileOut[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Wczytanie procesu przy zmianie processId ────────────────────────────
  // Nie resetujemy stanu synchronicznie na początku efektu (setState w body
  // efektu powoduje kaskadowe rendery). Stan aktualizujemy wyłącznie
  // w callbackach .then() / .catch() po zakończeniu fetcha.
  useEffect(() => {
    let active = true;

    api.processes
      .get(processId)
      .then((p) => {
        if (!active) return;
        setLoadError(null);
        setSaveState("idle");
        setProcess(p);
      })
      .catch((err) => {
        if (!active) return;
        setProcess(null);
        setLoadError(
          err instanceof ApiError
            ? err.message
            : "Nie udało się wczytać procesu.",
        );
      });

    return () => {
      active = false;
    };
  }, [processId]);

  // ── Biblioteka kafelków + galeria publiczna ─────────────────────────────
  const refreshLibrary = useCallback(() => {
    api.tiles
      .library()
      .then((tiles) => setLibraryTiles(tiles.map(tileOutToTemplate)));
  }, []);

  const refreshGallery = useCallback(() => {
    api.tiles.gallery().then(setGalleryTiles);
  }, []);

  useEffect(() => {
    refreshLibrary();
    refreshGallery();
  }, [refreshLibrary, refreshGallery]);

  // ── Ref do aktualnego processId dla debounced callbacku autosave ────────
  // Zapisujemy w efekcie (nie podczas renderu) żeby uniknąć błędu
  // "Cannot access refs during render" z React compiler.
  const processIdRef = useRef(processId);
  useEffect(() => {
    processIdRef.current = processId;
  }, [processId]);

  const handleCanvasChange = useCallback((data: CanvasData) => {
    const targetId = processIdRef.current;
    setSaveState("saving");
    api.processes
      .update(targetId, { canvas_data: data })
      .then(() => {
        if (processIdRef.current === targetId) setSaveState("saved");
      })
      .catch(() => {
        if (processIdRef.current === targetId) setSaveState("error");
      });
  }, []);

  // ── Dodawanie kafelków na kanwas (rejestracja funkcji z FlowCanvas) ─────
  const addTileRef = useRef<((tile: TileTemplate) => void) | null>(null);
  const handleRegisterAddTile = useCallback(
    (fn: (tile: TileTemplate) => void) => {
      addTileRef.current = fn;
    },
    [],
  );
  const handleTileTap = useCallback((tile: TileTemplate) => {
    addTileRef.current?.(tile);
  }, []);

  // ── Tworzenie / usuwanie / dodawanie kafelków ───────────────────────────
  const openModal = useCallback(() => {
    setModalKey((k) => k + 1);
    setModalOpen(true);
  }, []);

  const handleSaveCustomTile = useCallback(
    (payload: TileCreatePayload) => {
      api.tiles.create(payload).then(() => {
        refreshLibrary();
        if (payload.visibility === "public") refreshGallery();
        setModalOpen(false);
      });
    },
    [refreshLibrary, refreshGallery],
  );

  const handleDeleteCustomTile = useCallback(
    (id: string) => {
      api.tiles.remove(id).then(() => {
        refreshLibrary();
        refreshGallery();
      });
    },
    [refreshLibrary, refreshGallery],
  );

  const handleAddFromGallery = useCallback(
    (id: string) => {
      api.tiles.addToLibrary(id).then(() => {
        refreshLibrary();
        refreshGallery();
      });
    },
    [refreshLibrary, refreshGallery],
  );

  // ── Tytuł / widoczność / nawigacja procesu ──────────────────────────────
  const handleRenameProcess = useCallback(
    (title: string) => {
      setProcess((prev) => (prev ? { ...prev, title } : prev));
      api.processes.update(processId, { title }).catch(() => {});
    },
    [processId],
  );

  const handleToggleVisibility = useCallback(() => {
    setProcess((prev) => {
      if (!prev) return prev;
      const visibility = prev.visibility === "public" ? "private" : "public";
      api.processes.update(prev.id, { visibility }).catch(() => {});
      return { ...prev, visibility };
    });
  }, []);

  const handleNewProcess = useCallback(() => {
    api.processes.create({}).then((p) => router.push(`/proces/${p.id}`));
  }, [router]);

  const handleForkProcess = useCallback(() => {
    api.processes.fork(processId).then((p) => router.push(`/proces/${p.id}`));
  }, [processId, router]);

  const handleOpenProcess = useCallback(
    (id: string) => {
      setDrawerOpen(false);
      router.push(`/proces/${id}`);
    },
    [router],
  );

  // ── Stany ładowania / błędu ──────────────────────────────────────────────
  if (loadError) {
    return <CenteredMessage>{loadError}</CenteredMessage>;
  }
  if (!process) {
    return <CenteredMessage>Wczytywanie procesu...</CenteredMessage>;
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100dvh",
        width: "100%",
        overflow: "hidden",
        background: "#F9F9F7",
      }}
    >
      <TopBar
        title={process.title}
        visibility={process.visibility}
        isOwner={process.is_owner}
        saveState={saveState}
        onRename={handleRenameProcess}
        onToggleVisibility={handleToggleVisibility}
        onOpenDrawer={() => setDrawerOpen(true)}
        onNewProcess={handleNewProcess}
        onFork={handleForkProcess}
      />

      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <TileSidebar
          customTiles={libraryTiles}
          galleryTiles={galleryTiles}
          onTileTap={handleTileTap}
          onCreateCustomTile={openModal}
          onDeleteCustomTile={handleDeleteCustomTile}
          onAddFromGallery={handleAddFromGallery}
        />

        <main style={{ flex: 1, overflow: "hidden", position: "relative" }}>
          <FlowCanvas
            // key={process.id} wymusza pełny remount FlowCanvas przy zmianie
            // procesu — celowo, żeby wewnętrzny stan useNodesState nie
            // "przeciekał" między różnymi procesami przy nawigacji w drawerze.
            key={process.id}
            onRegisterAddTile={handleRegisterAddTile}
            // canvas_data.nodes jest typowane jako unknown[] po stronie API
            // (JSONB bez narzuconej struktury) — tu wiemy, że to, co backend
            // oddał, zostało zapisane wcześniej właśnie przez ten komponent,
            // więc kształt jest zgodny z tym, czego oczekuje FlowCanvas.
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialNodes={process.canvas_data.nodes as any}
            initialViewport={process.canvas_data.viewport}
            onChange={process.is_owner ? handleCanvasChange : undefined}
          />
        </main>
      </div>

      <AddTileModal
        key={modalKey}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveCustomTile}
      />

      <ProcessDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onOpenProcess={handleOpenProcess}
        onNewProcess={handleNewProcess}
        currentProcessId={process.id}
      />
    </div>
  );
}

function tileOutToTemplate(t: TileOut): TileTemplate {
  return {
    id: t.id,
    label: t.label,
    description: t.description ?? undefined,
    color: t.color,
    icon: t.icon,
    nvcType: t.nvc_type,
    isDefault: false,
  };
}
