"use client";

import React, { useCallback } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from "@xyflow/react";
import type { Connection, Node, Edge, ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./NvcNode";
import type { NvcNodeData, TileTemplate } from "../types/nvc";
import type { CanvasData } from "../types/api";
import { useMobile } from "../hooks/useMobile";
import { CELL_SIZE } from "../helpers/canvasConfig";

type NvcFlowNode = Node<NvcNodeData, "nvcNode">;
type FlowViewport = { x: number; y: number; zoom: number };

let _nodeCounter = 1;
const nextId = () => `nvc_${Date.now()}_${_nodeCounter++}`;

const AUTOSAVE_DEBOUNCE_MS = 600;

// Domyślny styl krawędzi — linia bez strzałki, zgodna z design systemem
const DEFAULT_EDGE_OPTIONS = {
  type: "smoothstep",
  style: {
    stroke: "#BDC3C7",
    strokeWidth: 2,
  },
  // markerEnd: undefined — brak strzałki, tylko linia
};

// ── Inner canvas ─────────────────────────────────────────────────────────────

interface InnerProps {
  onRegisterAddTile: (fn: (tile: TileTemplate) => void) => void;
  initialNodes?: NvcFlowNode[];
  initialEdges?: Edge[];
  initialViewport?: FlowViewport;
  onChange?: (data: CanvasData) => void;
}

function FlowCanvasInner({
  onRegisterAddTile,
  initialNodes,
  initialEdges,
  initialViewport,
  onChange,
}: InnerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<NvcFlowNode>(
    initialNodes ?? [],
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    initialEdges ?? [],
  );
  const { screenToFlowPosition, getViewport } = useReactFlow();
  const isMobile = useMobile();

  // Tryb łączenia na mobile: tap kafelka A → zostaje jako źródło (connectSource),
  // tap kafelka B → tworzy krawędź A→B. Na desktop standard drag-from-handle.
  const [connectSource, setConnectSource] = React.useState<string | null>(null);

  // ── Autosave ──────────────────────────────────────────────────────────────
  const nodesRef = React.useRef(nodes);
  const edgesRef = React.useRef(edges);
  const onChangeRef = React.useRef(onChange);
  const debounceTimer = React.useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const skippedFirstRun = React.useRef(false);

  // Refy aktualizowane w efekcie (nie podczas renderu) — wymóg React compiler
  React.useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);
  React.useEffect(() => {
    edgesRef.current = edges;
  }, [edges]);
  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const scheduleSave = useCallback(() => {
    if (!onChangeRef.current) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      const vp = getViewport();
      onChangeRef.current?.({
        nodes: nodesRef.current,
        edges: edgesRef.current,
        viewport: vp,
      });
    }, AUTOSAVE_DEBOUNCE_MS);
  }, [getViewport]);

  React.useEffect(() => {
    if (!skippedFirstRun.current) {
      skippedFirstRun.current = true;
      return;
    }
    scheduleSave();
  }, [nodes, edges, scheduleSave]);

  React.useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  // ── Połączenia ────────────────────────────────────────────────────────────
  // Użytkownik sam łączy kafelki przeciągając z handlera do handlera.
  // addEdge deduplikuje — nie można połączyć tych samych węzłów dwa razy.
  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            style: { stroke: "#BDC3C7", strokeWidth: 2 },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  // ── Centre viewport on mount ─────────────────────────────────────────────
  const handleInit = useCallback(
    (instance: ReactFlowInstance<NvcFlowNode, Edge>) => {
      if (initialViewport) {
        instance.setViewport(initialViewport);
        return;
      }
      const isMobile = window.innerWidth < 768;
      const sidebarWidth = isMobile ? 0 : 264;
      const canvasW = window.innerWidth - sidebarWidth;
      const canvasH = window.innerHeight;
      instance.setViewport({ x: canvasW / 2, y: canvasH / 2, zoom: 1 });
    },
    [initialViewport],
  );

  // ── Add tile ──────────────────────────────────────────────────────────────
  const addTileAtPosition = useCallback(
    (tile: TileTemplate, x: number, y: number) => {
      setNodes((nds) => {
        const isFirst = nds.length === 0;
        return [
          ...nds,
          {
            id: nextId(),
            type: "nvcNode" as const,
            position: { x, y },
            data: {
              label: tile.label,
              nvcType: tile.nvcType,
              color: tile.color,
              icon: tile.icon,
              description: tile.description,
              isBase: isFirst,
            },
          },
        ];
      });
    },
    [setNodes],
  );

  const addTileAtCenter = useCallback(
    (tile: TileTemplate) => {
      const vp = getViewport();
      const cx = (window.innerWidth / 2 - vp.x) / vp.zoom;
      const cy = (window.innerHeight / 2 - vp.y) / vp.zoom;
      const jitter = () => (Math.random() - 0.5) * 80;
      addTileAtPosition(tile, cx + jitter(), cy + jitter());
    },
    [getViewport, addTileAtPosition],
  );

  React.useEffect(() => {
    onRegisterAddTile(addTileAtCenter);
  }, [onRegisterAddTile, addTileAtCenter]);

  // ── Drag-and-drop ─────────────────────────────────────────────────────────
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const json = e.dataTransfer.getData("application/nvc-tile");
      if (!json) return;
      const tile: TileTemplate = JSON.parse(json);
      const pos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
      addTileAtPosition(tile, pos.x, pos.y);
    },
    [screenToFlowPosition, addTileAtPosition],
  );

  // ── Mobile: łączenie kafelków przez dwa kolejne tap-y ───────────────────
  // Na desktop użytkownik przeciąga z handlera — zostawiamy standardowe onConnect.
  // Na mobile handlery są zbyt małe, więc: tap A = zaznacz źródło,
  // tap B = utwórz połączenie A→B, tap tego samego = anuluj wybór.
  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: NvcFlowNode) => {
      if (!isMobile) return;
      if (connectSource === null) {
        setConnectSource(node.id);
      } else if (connectSource === node.id) {
        setConnectSource(null);
      } else {
        setEdges((eds) =>
          addEdge(
            {
              id: `e_${connectSource}_${node.id}_${Date.now()}`,
              source: connectSource,
              target: node.id,
              type: "smoothstep",
              style: { stroke: "#BDC3C7", strokeWidth: 2 },
            },
            eds,
          ),
        );
        setConnectSource(null);
      }
    },
    [isMobile, connectSource, setEdges],
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      {/* Pasek trybu łączenia (mobile) */}
      {isMobile && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 10,
            pointerEvents: "none",
          }}
        >
          {connectSource ? (
            <div
              style={{
                background: "#D8B4FE",
                color: "#4C1D95",
                borderRadius: 20,
                padding: "6px 16px",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
                boxShadow: "0 4px 16px rgba(124,58,237,0.25)",
                pointerEvents: "all",
              }}
            >
              Dotknij drugi kafelek, aby połączyć ✦
              <button
                onClick={() => setConnectSource(null)}
                style={{
                  marginLeft: 8,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  color: "#4C1D95",
                  fontWeight: 700,
                }}
              >
                ×
              </button>
            </div>
          ) : null}
        </div>
      )}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onInit={handleInit}
        onMoveEnd={scheduleSave}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={DEFAULT_EDGE_OPTIONS}
        nodeOrigin={[0.5, 0.5]}
        snapToGrid
        snapGrid={[CELL_SIZE, CELL_SIZE]}
        deleteKeyCode={["Backspace", "Delete"]}
        // Na mobile jeden palec = przesuwanie canvasu (pan), nie zaznaczanie.
        // Zaznaczanie odbywa się przez tap (onNodeClick), a łączenie przez
        // tryb connectSource. Na desktop zachowujemy standardowe zachowanie.
        panOnDrag={true}
        selectionOnDrag={!isMobile}
        // Wskazówka wizualna dla trybu łączenia — podświetl kafelek źródłowy
        nodesFocusable={true}
        style={{
          background: "#F9F9F7",
          // Wyróżniamy kafelek-źródło kolorem ring
          ...(connectSource &&
            ({
              "--node-source-id": connectSource,
            } as React.CSSProperties)),
        }}
        proOptions={{ hideAttribution: false }}
      >
        <Background
          id="bg-minor"
          variant={BackgroundVariant.Dots}
          color="rgba(0,0,0,0.06)"
          gap={CELL_SIZE / 2}
          size={1.5}
        />
        <Background
          id="bg-major"
          variant={BackgroundVariant.Dots}
          color="rgba(0,0,0,0.14)"
          gap={CELL_SIZE}
          size={2.5}
        />

        <Controls
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(8px)",
            borderRadius: 16,
            border: "1px solid rgba(0,0,0,0.05)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
        />

        {nodes.length === 0 && (
          <Panel position="top-center">
            <div
              style={{
                marginTop: "20vh",
                textAlign: "center",
                pointerEvents: "none",
                fontFamily: '"Plus Jakarta Sans","Inter",sans-serif',
              }}
            >
              <div style={{ fontSize: 44, opacity: 0.22, marginBottom: 14 }}>
                ✦
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#B5BAC4",
                  marginBottom: 8,
                  letterSpacing: "-0.01em",
                }}
              >
                Płótno jest puste
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#C9CDD4",
                  lineHeight: 1.6,
                  maxWidth: 260,
                  margin: "0 auto",
                }}
              >
                Kliknij lub przeciągnij kafelek z biblioteki
              </div>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

// ── Public export ─────────────────────────────────────────────────────────────

interface FlowCanvasProps {
  onRegisterAddTile: (fn: (tile: TileTemplate) => void) => void;
  initialNodes?: NvcFlowNode[];
  initialEdges?: Edge[];
  initialViewport?: FlowViewport;
  onChange?: (data: CanvasData) => void;
}

export default function FlowCanvas({
  onRegisterAddTile,
  initialNodes,
  initialEdges,
  initialViewport,
  onChange,
}: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner
        onRegisterAddTile={onRegisterAddTile}
        initialNodes={initialNodes}
        initialEdges={initialEdges}
        initialViewport={initialViewport}
        onChange={onChange}
      />
    </ReactFlowProvider>
  );
}
