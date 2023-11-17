"use client";
import dynamic from "next/dynamic";
const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);
export default function Home() {
  return (
    <div className="h-screen">
      <Excalidraw></Excalidraw>
    </div>
  );
}
