"use client";

import React, { useCallback } from "react";
import {
  ReactFlow,
  useNodesState,
  Controls,
  Background,
  BackgroundVariant,
  ReactFlowProvider,
  useReactFlow,
  Panel,
} from "@xyflow/react";
import type { Node, Edge, ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./NvcNode";
import type { NvcNodeData, TileTemplate } from "../types/nvc";
import { CELL_SIZE } from "../helpers/canvasConfig";

type NvcFlowNode = Node<NvcNodeData, "nvcNode">;

let _nodeCounter = 1;
const nextId = () => `nvc_${Date.now()}_${_nodeCounter++}`;

// ── Inner canvas ─────────────────────────────────────────────────────────────

interface InnerProps {
  onRegisterAddTile: (fn: (tile: TileTemplate) => void) => void;
}

function FlowCanvasInner({ onRegisterAddTile }: InnerProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<NvcFlowNode>([]);
  const { screenToFlowPosition, getViewport } = useReactFlow();

  // ── Centre viewport on mount ─────────────────────────────────────────────
  // nodeOrigin=[0.5,0.5] means node.position = tile CENTER.
  // We centre the viewport so flow (0,0) is at the middle of the canvas area.
  const handleInit = useCallback(
    (instance: ReactFlowInstance<NvcFlowNode, Edge>) => {
      const isMobile = window.innerWidth < 768;
      const sidebarWidth = isMobile ? 0 : 264;
      const canvasW = window.innerWidth - sidebarWidth;
      const canvasH = window.innerHeight;
      instance.setViewport({ x: canvasW / 2, y: canvasH / 2, zoom: 1 });
    },
    [],
  );

  // ── Add tile ──────────────────────────────────────────────────────────────
  // Because nodeOrigin=[0.5, 0.5] the x/y we pass IS the tile's visual centre.
  // snapToGrid will then snap that centre to the nearest CELL_SIZE grid point.

  const addTileAtPosition = useCallback(
    (tile: TileTemplate, x: number, y: number) => {
      setNodes((nds) => {
        const isFirst = nds.length === 0;
        return [
          ...nds,
          {
            id: nextId(),
            type: "nvcNode" as const,
            position: { x, y }, // interpreted as CENTRE by nodeOrigin=[0.5,0.5]
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

  // Mobile tap-to-add: pass viewport centre directly (= tile centre)
  const addTileAtCenter = useCallback(
    (tile: TileTemplate) => {
      const vp = getViewport();
      const cx = (window.innerWidth / 2 - vp.x) / vp.zoom;
      const cy = (window.innerHeight / 2 - vp.y) / vp.zoom;
      const jitter = () => (Math.random() - 0.5) * 80;
      // No half-dimension subtraction needed — position IS the centre
      addTileAtPosition(tile, cx + jitter(), cy + jitter());
    },
    [getViewport, addTileAtPosition],
  );

  React.useEffect(() => {
    onRegisterAddTile(addTileAtCenter);
  }, [onRegisterAddTile, addTileAtCenter]);

  // ── Drag-and-drop ─────────────────────────────────────────────────────────
  // screenToFlowPosition gives the cursor position in flow coords;
  // with nodeOrigin=[0.5,0.5] the tile will appear centred on the cursor.

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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={[]}
        onNodesChange={onNodesChange}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onConnect={() => {}}
        onInit={handleInit}
        nodeTypes={nodeTypes}
        /*
          nodeOrigin=[0.5, 0.5]: the node's `position` is its CENTRE, not its
          top-left corner. Combined with snapToGrid this centres tiles on grid
          intersections instead of snapping their top-left to them.
        */
        nodeOrigin={[0.5, 0.5]}
        snapToGrid
        snapGrid={[CELL_SIZE, CELL_SIZE]}
        deleteKeyCode={["Backspace", "Delete"]}
        style={{ background: "#F9F9F7" }}
        proOptions={{ hideAttribution: false }}
      >
        {/*
          Background: dots every CELL_SIZE px.
          Each dot = a valid tile-centre snap point.
          Minor dots at half-interval mark the pyramid offset positions.
        */}
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
                Przeciągnij kafelek z biblioteki
                <br />
                lub dotknij ✦ na dole ekranu
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
}

export default function FlowCanvas({ onRegisterAddTile }: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner onRegisterAddTile={onRegisterAddTile} />
    </ReactFlowProvider>
  );
}
