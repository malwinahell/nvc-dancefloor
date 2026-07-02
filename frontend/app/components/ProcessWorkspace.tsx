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
import { ToastProvider, useToast } from "./Toast";
import { api, ApiError } from "../lib/apiClient";
import type { TileTemplate } from "../types/nvc";
import type {
  CanvasData,
  ProcessDetail,
  TileCreatePayload,
  TileOut,
} from "../types/api";

// ── Public entry point — owija całość w ToastProvider i AuthGuard ─────────────

interface ProcessWorkspaceProps {
  processId: string;
}

export function ProcessWorkspace({ processId }: ProcessWorkspaceProps) {
  return (
    <ToastProvider>
      <AuthGuard>
        <ProcessWorkspaceInner processId={processId} />
      </AuthGuard>
    </ToastProvider>
  );
}

// ── Wewnętrzny komponent — ma dostęp do useToast() ───────────────────────────

function ProcessWorkspaceInner({ processId }: ProcessWorkspaceProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [process, setProcess] = useState<ProcessDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const [libraryTiles, setLibraryTiles] = useState<TileTemplate[]>([]);
  const [galleryTiles, setGalleryTiles] = useState<TileOut[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // ── Wczytanie procesu ────────────────────────────────────────────────────
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

  // ── Biblioteka + galeria ────────────────────────────────────────────────
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

  // ── Autosave ─────────────────────────────────────────────────────────────
  // Ref aktualizowany w efekcie (nie podczas renderu) — patrz komentarz niżej
  const processIdRef = useRef(processId);
  useEffect(() => {
    processIdRef.current = processId;
  }, [processId]);

  // Trzymamy ostatnie canvas_data żeby retry mógł je ponownie wysłać
  // bez potrzeby przekazywania go z FlowCanvas jeszcze raz.
  const lastCanvasDataRef = useRef<CanvasData | null>(null);

  const saveCanvas = useCallback(
    (data: CanvasData, targetId: string) => {
      setSaveState("saving");
      api.processes
        .update(targetId, { canvas_data: data })
        .then(() => {
          if (processIdRef.current === targetId) setSaveState("saved");
        })
        .catch(() => {
          if (processIdRef.current === targetId) {
            setSaveState("error");
            showToast('Nie udało się zapisać. Kliknij "Ponów".', "error");
          }
        });
    },
    [showToast],
  );

  const handleCanvasChange = useCallback(
    (data: CanvasData) => {
      lastCanvasDataRef.current = data;
      saveCanvas(data, processIdRef.current);
    },
    [saveCanvas],
  );

  const handleRetrySave = useCallback(() => {
    if (lastCanvasDataRef.current) {
      saveCanvas(lastCanvasDataRef.current, processIdRef.current);
    }
  }, [saveCanvas]);

  // ── Dodawanie kafelków na kanwas ────────────────────────────────────────
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

  // ── Kafelki: tworzenie / usuwanie / galeria ────────────────────────────
  const openModal = useCallback(() => {
    setModalKey((k) => k + 1);
    setModalOpen(true);
  }, []);

  const handleSaveCustomTile = useCallback(
    (payload: TileCreatePayload) => {
      api.tiles
        .create(payload)
        .then(() => {
          refreshLibrary();
          if (payload.visibility === "public") refreshGallery();
          setModalOpen(false);
          showToast("Kafelek utworzony.", "success");
        })
        .catch(() => showToast("Nie udało się utworzyć kafelka.", "error"));
    },
    [refreshLibrary, refreshGallery, showToast],
  );

  const handleDeleteCustomTile = useCallback(
    (id: string) => {
      api.tiles
        .remove(id)
        .then(() => {
          refreshLibrary();
          refreshGallery();
          showToast("Kafelek usunięty.", "success");
        })
        .catch(() => showToast("Nie udało się usunąć kafelka.", "error"));
    },
    [refreshLibrary, refreshGallery, showToast],
  );

  const handleAddFromGallery = useCallback(
    (id: string) => {
      api.tiles
        .addToLibrary(id)
        .then(() => {
          refreshLibrary();
          refreshGallery();
          showToast("Kafelek dodany do biblioteki.", "success");
        })
        .catch(() => showToast("Nie udało się dodać kafelka.", "error"));
    },
    [refreshLibrary, refreshGallery, showToast],
  );

  // ── Proces: tytuł / opis / widoczność / nawigacja ─────────────────────
  const handleRenameProcess = useCallback(
    (title: string) => {
      setProcess((prev) => (prev ? { ...prev, title } : prev));
      api.processes
        .update(processId, { title })
        .catch(() => showToast("Nie udało się zmienić nazwy.", "error"));
    },
    [processId, showToast],
  );

  const handleEditDescription = useCallback(
    (description: string) => {
      setProcess((prev) =>
        prev ? { ...prev, description: description || null } : prev,
      );
      api.processes
        .update(processId, { description })
        .catch(() => showToast("Nie udało się zapisać opisu.", "error"));
    },
    [processId, showToast],
  );

  const handleToggleVisibility = useCallback(() => {
    setProcess((prev) => {
      if (!prev) return prev;
      const visibility = prev.visibility === "public" ? "private" : "public";
      api.processes
        .update(prev.id, { visibility })
        .then(() =>
          showToast(
            visibility === "public"
              ? "Proces jest teraz publiczny."
              : "Proces jest prywatny.",
            "info",
          ),
        )
        .catch(() => showToast("Nie udało się zmienić widoczności.", "error"));
      return { ...prev, visibility };
    });
  }, [showToast]);

  const handleNewProcess = useCallback(() => {
    api.processes
      .create({})
      .then((p) => router.push(`/proces/${p.id}`))
      .catch(() => showToast("Nie udało się utworzyć procesu.", "error"));
  }, [router, showToast]);

  const handleForkProcess = useCallback(() => {
    api.processes
      .fork(processId)
      .then((p) => {
        showToast("Zapisano jako Twój proces.", "success");
        router.push(`/proces/${p.id}`);
      })
      .catch(() => showToast("Nie udało się skopiować procesu.", "error"));
  }, [processId, router, showToast]);

  const handleOpenProcess = useCallback(
    (id: string) => {
      setDrawerOpen(false);
      router.push(`/proces/${id}`);
    },
    [router],
  );

  // Gdy aktualnie otwarty proces zostanie usunięty z drawera —
  // tworzymy nowy pusty i przechodzimy do niego.
  const handleProcessDeleted = useCallback(
    (deletedId: string) => {
      if (deletedId === processId) {
        api.processes
          .create({})
          .then((p) => router.replace(`/proces/${p.id}`))
          .catch(() => router.replace("/"));
      }
    },
    [processId, router],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  if (loadError) return <CenteredMessage>{loadError}</CenteredMessage>;
  if (!process)
    return <CenteredMessage>Wczytywanie procesu...</CenteredMessage>;

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
        description={process.description}
        visibility={process.visibility}
        isOwner={process.is_owner}
        saveState={saveState}
        onRename={handleRenameProcess}
        onEditDescription={handleEditDescription}
        onToggleVisibility={handleToggleVisibility}
        onOpenDrawer={() => setDrawerOpen(true)}
        onNewProcess={handleNewProcess}
        onFork={handleForkProcess}
        onRetrySave={handleRetrySave}
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
            key={process.id}
            onRegisterAddTile={handleRegisterAddTile}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialNodes={process.canvas_data.nodes as any}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            initialEdges={process.canvas_data.edges as any}
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
        onProcessDeleted={handleProcessDeleted}
      />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
