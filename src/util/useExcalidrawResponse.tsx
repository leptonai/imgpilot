import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { getBase64 } from "@/util/excalidraw";
import { fetchImage } from "@/util/fetch-image";
import { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { useRef } from "react";
import useSWR from "swr";
import { useDebounce } from "use-debounce";

export const useExcalidrawResponse = (
  excalidrawAPI: ExcalidrawImperativeAPI | null,
  elements: readonly NonDeletedExcalidrawElement[],
  prompt: string,
  version: string,
) => {
  const errorCountRef = useRef(0);
  const abortController = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const [debounced] = useDebounce({ prompt, elements, version }, 300, {
    equalityFn: (prev, next) => {
      return prev.prompt === next.prompt && prev.version === next.version;
    },
  });
  const { data, isLoading } = useSWR(
    [debounced],
    async ([params]) => {
      if (excalidrawAPI) {
        if (abortController.current) {
          abortController.current.abort();
        }
        abortController.current = new AbortController();
        try {
          const input_image = await getBase64(
            params.elements,
            excalidrawAPI,
            768,
          );
          return await fetchImage(
            input_image,
            params.prompt,
            abortController.current.signal,
          );
        } catch (e) {
          errorCountRef.current += 1;
          if (errorCountRef.current > 5) {
            toast({
              title: "We are overloaded with service",
              description:
                "Please try again later or visit our github repo for local deployment.",
              action: (
                <ToastAction asChild altText="Try again">
                  <a
                    href="https://github.com/leptonai/imgpilot"
                    target="_blank"
                  >
                    Github
                  </a>
                </ToastAction>
              ),
            });
          }

          return "";
        }
      } else {
        return "";
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
