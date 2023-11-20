import { PreviewShape } from "@/app/preview-shape";
import { blobToBase64 } from "@/lib/utils";
import {
  createShapeId,
  debounce,
  getSvgAsImage,
  TLShapeId,
  useEditor,
} from "@tldraw/tldraw";
import { useEffect, useRef, useState } from "react";
import useSWR from "swr";

export function AutoDraw() {
  const editor = useEditor();
  const generating = useRef(false);
  const [inputImage, setInputImage] = useState("");
  const [prompt, setPrompt] = useState(
    "a beautiful chinese watercolor painting of the mountainous",
  );
  const currentPreviewId = useRef<TLShapeId | null>(null);
  const currentDataUrl = useRef<string | null>(null);
  const { data, error, isLoading, isValidating } = useSWR<string>(
    ["/api/run", inputImage, prompt],
    async ([url, input_image, prompt]) => {
      if (input_image && prompt) {
        const response = await fetch(url, {
          headers: {
            accept: "image/jpeg",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            input_image,
            prompt,
            guidance_scale: 8,
            lcm_steps: 50,
            seed: 2159232,
            steps: 4,
            strength: 0.7,
            width: 768,
            height: 768,
          }),
          method: "POST",
        });
        const blob = await response.blob();
        return await blobToBase64(blob);
      } else {
        return new Promise((resolve) => resolve(""));
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshWhenOffline: false,
      refreshWhenHidden: false,
      refreshInterval: 0,
    },
  );

  useEffect(() => {
    if (currentPreviewId.current && currentDataUrl.current) {
      editor.updateShape<PreviewShape>({
        id: currentPreviewId.current!,
        type: "preview",
        props: { src: data, source: currentDataUrl.current },
      });
    }
  }, [data, editor]);

  useEffect(() => {
    const generate = debounce(async () => {
      if (generating.current) {
        return;
      }
      generating.current = true;
      const allShapes = editor.getCurrentPageShapes();
      const drawShapes = allShapes.filter((s) => s.type !== "preview");
      const previewShape = allShapes.find((s) => s.type === "preview");
      if (previewShape) {
        currentPreviewId.current = previewShape.id;
      }
      const svg = await editor.getSvg(drawShapes, { background: true });
      if (!svg) {
        return;
      }
      const IS_SAFARI = /^((?!chrome|android).)*safari/i.test(
        navigator.userAgent,
      );
      const blob = await getSvgAsImage(svg, IS_SAFARI, {
        type: "png",
        quality: 1,
        scale: 1,
      });
      const dataUrl = await blobToBase64(blob!);
      currentDataUrl.current = dataUrl;
      const previewPosition = drawShapes.reduce(
        (acc, shape) => {
          const bounds = editor.getShapePageBounds(shape);
          const right = bounds?.maxX ?? 0;
          const top = bounds?.minY ?? 0;
          return {
            x: Math.max(acc.x, right),
            y: Math.min(acc.y, top),
          };
        },
        { x: 0, y: Infinity },
      );
      if (!currentPreviewId.current) {
        currentPreviewId.current = createShapeId();
        editor.createShape<PreviewShape>({
          id: currentPreviewId.current,
          type: "preview",
          x: previewPosition.x,
          y: previewPosition.y,
          props: { src: "", source: dataUrl },
        });
      }
      setInputImage(dataUrl.replace(/^data:image\/(png|jpeg);base64,/, ""));
      generating.current = false;
    }, 1000);
    editor.addListener("update", generate);
    return () => {
      editor.removeListener("update", generate);
    };
  }, [editor]);
  return <></>;
}
