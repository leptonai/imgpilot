"use client";
import { predefineElements, predefineState } from "@/util/element";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { debounceTime, Subject, distinctUntilChanged, fromEvent } from "rxjs";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, _) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

export default function Home() {
  const excalidrawAPI = useRef<ExcalidrawImperativeAPI | null>(null);
  const change$ = useRef(new Subject<void>());
  const base64$ = useRef(new Subject<string>());
  const [initialed, setInitialed] = useState(false);
  const [imgSrc, setImgSrc] = useState<string>("");
  const getBase64 = useCallback(async () => {
    const exportToBlob = (await import("@excalidraw/excalidraw")).exportToBlob;
    if (!excalidrawAPI.current) {
      return;
    }
    const elements = excalidrawAPI.current.getSceneElements();
    if (!elements || !elements.length) {
      return;
    }
    const blob = await exportToBlob({
      elements,
      files: excalidrawAPI.current.getFiles(),
      exportPadding: 24,
    });
    const base64 = await blobToBase64(blob);
    return base64.replace(/^data:image\/(png|jpg);base64,/, "");
  }, []);

  useEffect(() => {
    const subscription = fromEvent(window, "resize")
      .pipe(debounceTime(300))
      .subscribe(() => {
        excalidrawAPI.current?.scrollToContent(
          excalidrawAPI.current?.getSceneElements(),
          {
            fitToContent: true,
          },
        );
      });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (excalidrawAPI.current) {
      change$.current.next();
      setTimeout(() => {
        excalidrawAPI.current?.scrollToContent(
          excalidrawAPI.current?.getSceneElements(),
          {
            fitToContent: true,
          },
        );
      });
      excalidrawAPI.current.onChange(() => {
        change$.current.next();
      });
    }
  }, [initialed]);

  useEffect(() => {
    const subscription = change$.current
      .pipe(debounceTime(300))
      .subscribe(async () => {
        const base64 = await getBase64();
        if (base64) {
          base64$.current.next(base64);
        }
      });
    return () => subscription.unsubscribe();
  }, [getBase64]);

  useEffect(() => {
    const subscription = base64$.current
      .pipe(distinctUntilChanged())
      .subscribe((base64) => {
        const body = {
          guidance_scale: 8,
          height: 768,
          input_image: base64,
          lcm_steps: 50,
          prompt:
            "Chibi Pixar style, cartoon style of a smart girl with long blonde loose hair , a smile on the front, and a black hoodie with normal hazel eyes, 3d rendering and aesthetic background, fashion",
          seed: 2159232,
          steps: 4,
          strength: 0.7,
          width: 768,
        };
        fetch("/api/run", {
          headers: {
            accept: "image/jpeg",
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
          method: "POST",
        })
          .then((data) => data.blob())
          .then((data) => {
            setImgSrc(URL.createObjectURL(data));
          });
      });
    return () => subscription.unsubscribe();
  }, []);
  return (
    <div className="inset-0 absolute">
      <div className="h-full w-full relative lg:flex">
        <div className="w-full h-2/3 lg:h-full lg:w-1/2 border-b border-zinc-300 lg:border-r lg:border-b-0">
          <Excalidraw
            initialData={{
              elements: predefineElements,
              appState: predefineState,
            }}
            excalidrawAPI={(api) => {
              excalidrawAPI.current = api;
              setInitialed(true);
            }}
          ></Excalidraw>
        </div>
        <div className="w-full min-h-1/2 lg:h-full lg:w-1/2 bg-zinc-200 flex items-center justify-center p-8">
          <div className="border-zinc-300 border bg-white min-h-[300px] min-w-[300px]">
            {imgSrc && <img alt="img" src={imgSrc} />}
          </div>
        </div>
      </div>
    </div>
  );
}
