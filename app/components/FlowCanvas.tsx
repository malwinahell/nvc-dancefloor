"use client"; // Płótno jest interaktywne, więc musi działać po stronie klienta

import React, { useCallback } from "react";
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Controls,
  Background,
  Connection,
  Edge,
} from "@xyflow/react";

// Import domyślnych styli React Flow - bez tego kafelki się rozsypią!
import "@xyflow/react/dist/style.css";

// Przykładowe kafelki na start
const initialNodes = [
  {
    id: "1",
    position: { x: 250, y: 50 },
    data: { label: "Zaczynamy! (Krok 1)" },
  },
  { id: "2", position: { x: 100, y: 200 }, data: { label: "Opcja A" } },
  { id: "3", position: { x: 400, y: 200 }, data: { label: "Opcja B" } },
];

// Przykładowe połączenie na start
const initialEdges = [{ id: "e1-2", source: "1", target: "2" }];

export default function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Funkcja odpalana, gdy użytkownik łączy kafelki strzałką
  const onConnect = useCallback(
    (params: Connection | Edge) => {
      // LOGIKA BIZNESOWA: Max 3 strzałki wychodzące z jednego kafelka
      const sourceEdgesCount = edges.filter(
        (e) => e.source === params.source,
      ).length;

      if (sourceEdgesCount >= 3) {
        alert("Blokada: Ten kafelek może mieć maksymalnie 3 połączenia!");
        return;
      }

      setEdges((eds: any) => addEdge(params, eds));
    },
    [edges, setEdges],
  );

  return (
    // Kontener płótna musi mieć zdefiniowaną wysokość i szerokość
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView // Automatycznie wyśrodkowuje widok na kafelkach
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
