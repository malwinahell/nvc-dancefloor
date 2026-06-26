import FlowCanvas from "./components/FlowCanvas";

export default function Home() {
  return (
    // Ustawiamy wymiary na pełen ekran (100vw, 100vh) za pomocą Tailwind CSS
    <main className="w-screen h-screen">
      <FlowCanvas />
    </main>
  );
}
