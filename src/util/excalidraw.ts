import type { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";

export const getBase64 = async (
  elements: readonly NonDeletedExcalidrawElement[],
  api: ExcalidrawImperativeAPI,
  dimensions: number,
) => {
  const canvasElement = await (
    await import("@excalidraw/excalidraw")
  ).exportToCanvas({
    elements,
    files: api.getFiles(),
    maxWidthOrHeight: dimensions,
    exportPadding: 24,
  });
  const dynamicCanvas = document.createElement("canvas");
  const dynamicContext = dynamicCanvas.getContext("2d")!;
  dynamicCanvas.height = dimensions;
  dynamicCanvas.width = dimensions;
  dynamicContext.fillStyle = "#fff";
  dynamicContext.fillRect(0, 0, dynamicCanvas.width, dynamicCanvas.height);
  dynamicContext!.drawImage(
    canvasElement!,
    (dimensions - canvasElement.width) / 2,
    (dimensions - canvasElement.height) / 2,
  );
  return dynamicCanvas.toDataURL("image/png", 0.9);
};

export const zoomToFit = (api: ExcalidrawImperativeAPI) => {
  api.scrollToContent(api.getSceneElements(), {
    fitToViewport: true,
    viewportZoomFactor: 0.7,
  });
};
