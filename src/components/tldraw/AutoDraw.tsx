import { useDrawResponse } from "@/components/tldraw/useDraw";
import { debounce, useEditor } from "@tldraw/tldraw";
import { useEffect } from "react";

export function AutoDraw({
  prompt,
  input,
  onResponse,
}: {
  prompt: string;
  input: string;
  onResponse: (response: { data: string; loading: boolean }) => void;
}) {
  const drawResponse = useDrawResponse(prompt, input);
  const editor = useEditor();
  const innerWidth = window.innerWidth;
  useEffect(() => {
    editor.updateInstanceState({
      isDebugMode: false,
    });
  }, [editor]);

  useEffect(() => {
    setTimeout(() => {
      editor.zoomToFit();
    });
  }, [editor]);

  useEffect(() => {
    const autoResize = debounce(() => {
      if (window.innerWidth !== innerWidth) {
        editor.zoomToFit();
      }
    }, 300);
    window.addEventListener("resize", autoResize);
    return () => {
      window.removeEventListener("resize", autoResize);
    };
  }, [editor, innerWidth]);

  useEffect(() => {
    onResponse({ data: drawResponse.data, loading: drawResponse.isLoading });
  }, [drawResponse.data, drawResponse.isLoading, onResponse]);
  return <></>;
}
