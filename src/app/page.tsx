"use client";
import { PreviewShapeUtil } from "@/app/preview-shape";
import { AutoDraw } from "@/components/tldraw/AutoDraw";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";

export default function Home() {
  return (
    <Tldraw
      persistenceKey="imgpilot"
      forceMobile={true}
      shapeUtils={[PreviewShapeUtil]}
    >
      <AutoDraw></AutoDraw>
    </Tldraw>
  );
}
