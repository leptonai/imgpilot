import { blobToBase64 } from "@/lib/utils";
import { getBase64 } from "@/util/excalidraw";
import { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

export const useExcalidrawResponse = (
  excalidrawAPI: ExcalidrawImperativeAPI | null,
  elements: readonly NonDeletedExcalidrawElement[],
  prompt: string,
  version: string,
) => {
  const [debounced] = useDebounce({ prompt, elements, version }, 300, {
    equalityFn: (prev, next) => {
      return prev.prompt === next.prompt && prev.version === next.version;
    },
  });
  const { data, isLoading } = useSWR(
    ["/api/run", debounced],
    async ([url, params]) => {
      if (excalidrawAPI) {
        try {
          const input_image = (
            await getBase64(params.elements, excalidrawAPI, 768)
          ).replace(/^data:image\/(png|jpeg);base64,/, "");
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
    },
  );
  return { base64: data as string, loading: isLoading };
};
