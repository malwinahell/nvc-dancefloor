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
import type { Node } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { nodeTypes } from "./NvcNode";
import type { NvcNodeData, TileTemplate } from "../types/nvc";
import { CELL_SIZE } from "../helpers/canvasConfig";

// Typed alias — edges removed entirely
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

  // ── Add tile ──────────────────────────────────────────────────────────────

  const addTileAtPosition = useCallback(
    (tile: TileTemplate, x: number, y: number) => {
      setNodes((nds) => {
        // The very first tile placed on the canvas becomes the base tile
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

  // Mobile tap-to-add: scatter near visible viewport centre
  const addTileAtCenter = useCallback(
    (tile: TileTemplate) => {
      const vp = getViewport();
      const cx = (window.innerWidth / 2 - vp.x) / vp.zoom;
      const cy = (window.innerHeight / 2 - vp.y) / vp.zoom;
      const jitter = () => (Math.random() - 0.5) * 120;
      addTileAtPosition(tile, cx - 90 + jitter(), cy - 40 + jitter());
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

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        onNodesChange={onNodesChange}
        onDrop={onDrop}
        onDragOver={onDragOver}
        nodeTypes={nodeTypes}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        deleteKeyCode={["Backspace", "Delete"]}
        style={{ background: "#F9F9F7" }}
        proOptions={{ hideAttribution: false }}
        snapToGrid
        snapGrid={[CELL_SIZE, CELL_SIZE]}
        // No edges — connections are intentionally disabled
        edges={[]}
        onConnect={() => {}}
      >
        {/* Minor grid: dots at CELL_SIZE/2 mark the half-offset pyramid positions */}
        <Background
          id="bg-minor"
          variant={BackgroundVariant.Dots}
          color="rgba(0,0,0,0.08)"
          gap={CELL_SIZE / 2}
          size={1.5}
        />
        {/* Major grid: lines at CELL_SIZE mark tile snap positions */}
        <Background
          id="bg-major"
          variant={BackgroundVariant.Lines}
          color="rgba(0,0,0,0.065)"
          gap={CELL_SIZE}
          lineWidth={1}
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

        {/* Empty state */}
        {nodes.length === 0 && (
          <Panel position="top-center">
            <div
              style={{
                marginTop: "20vh",
                textAlign: "center",
                pointerEvents: "none",
                fontFamily: '"Plus Jakarta Sans", "Inter", sans-serif',
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
