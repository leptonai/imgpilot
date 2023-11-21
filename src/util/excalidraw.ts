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
    getDimensions: (width, height) => {
      const isWidthGreater = width > height;
      const ratio = isWidthGreater ? width / height : height / width;
      const scaledWidth = isWidthGreater ? dimensions : dimensions / ratio;
      const scaledHeight = isWidthGreater ? dimensions / ratio : dimensions;
      const scale = dimensions / (isWidthGreater ? width : height);

      return {
        width: scaledWidth,
        height: scaledHeight,
        scale: scale,
      };
    },
    exportPadding: 12,
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
    viewportZoomFactor: 0.5,
  });
};
