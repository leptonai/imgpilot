import useDebounce from "@/components/tldraw/useDebounce";
import { blobToBase64 } from "@/lib/utils";
import { debounce, getSvgAsImage, useEditor } from "@tldraw/tldraw";
import { useEffect, useRef, useState } from "react";
import useSWR, { SWRResponse } from "swr";

export function useDrawResponse(prompt: string, input: string): SWRResponse {
  const editor = useEditor();
  const generating = useRef(false);
  const [inputImage, setInputImage] = useState(input);
  const debouncePrompt = useDebounce(prompt, 300);
  const swrResponse = useSWR<string>(
    () => ["/api/run", inputImage, debouncePrompt],
    async ([url, input_image, prompt]) => {
      if (generating.current) {
        return new Promise((resolve) => resolve(""));
      }
      if (input_image && prompt) {
        generating.current = true;
        try {
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
        } catch (e) {
          return new Promise((resolve) => resolve(""));
        }
      } else {
        return new Promise((resolve) => resolve(""));
      }
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshWhenOffline: false,
      refreshInterval: 0,
      onSuccess: () => {
        generating.current = false;
      },
      onError: () => {
        generating.current = false;
      },
    },
  );

  useEffect(() => {
    const generate = async () => {
      const shapes = editor.getCurrentPageShapes();
      if (!shapes || shapes.length === 0) {
        return;
      }
      const svg = await editor.getSvg(shapes, {
        background: true,
      });
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
      setInputImage(dataUrl.replace(/^data:image\/(png|jpeg);base64,/, ""));
    };
    const debounceGenerate = debounce(generate, 300);
    editor.addListener("update", debounceGenerate);
    return () => {
      editor.removeListener("update", debounceGenerate);
    };
  }, [editor]);
  return swrResponse;
}
