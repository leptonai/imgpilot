"use client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { blobToBase64 } from "@/lib/utils";
import { predefineState, presets } from "@/util/presets";
import type { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  from,
  fromEvent,
  map,
  merge,
  mergeMap,
  ReplaySubject,
  skip,
  switchMap,
} from "rxjs";
import { fromFetch } from "rxjs/fetch";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);

const zoomToFit = (api: ExcalidrawImperativeAPI | null) => {
  if (!api) {
    return;
  }
  api.scrollToContent(api.getSceneElements(), {
    fitToViewport: true,
    viewportZoomFactor: 0.8,
  });
};

const getBase64 = async (
  elements: readonly NonDeletedExcalidrawElement[],
  api: ExcalidrawImperativeAPI,
) => {
  const blob = await (
    await import("@excalidraw/excalidraw")
  ).exportToBlob({
    elements,
    files: api.getFiles(),
    exportPadding: 24,
  });
  const base64 = await blobToBase64(blob);
  return base64.replace(/^data:image\/(png|jpg);base64,/, "");
};
export default function Home() {
  const excalidrawAPI = useRef<ExcalidrawImperativeAPI | null>(null);
  const elements$ = useRef(
    new ReplaySubject<readonly NonDeletedExcalidrawElement[]>(1),
  );
  const prompt$ = useRef(new ReplaySubject<string>(1));
  const excalidrawAPI$ = useRef(new ReplaySubject<ExcalidrawImperativeAPI>(1));
  const input = useRef<HTMLInputElement>(null);
  const [initialed, setInitialed] = useState(false);
  const [presetName, setPresetName] = useState(presets[0].name);
  const [imgSrc, setImgSrc] = useState<string>("");

  useEffect(() => {
    const { prompt, elements, base64 } = presets.find(
      (p) => p.name === presetName,
    )!;
    elements$.current.next(elements);
    prompt$.current.next(prompt);
    setImgSrc(base64);
    if (input.current) {
      input.current.value = prompt;
    }
    if (excalidrawAPI.current) {
      excalidrawAPI.current.updateScene({ elements: elements });
      zoomToFit(excalidrawAPI.current);
    }
  }, [presetName]);

  useEffect(() => {
    const subscription = fromEvent(window, "resize")
      .pipe(
        debounceTime(300),
        map(() => window.innerWidth),
        distinctUntilChanged(),
        filter(() => !!excalidrawAPI.current),
      )
      .subscribe(() => {
        zoomToFit(excalidrawAPI.current!);
      });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (excalidrawAPI.current) {
      setTimeout(() => zoomToFit(excalidrawAPI.current!));
      excalidrawAPI.current.onPointerUp(() => {
        elements$.current.next(excalidrawAPI.current!.getSceneElements());
      });
    }
  }, [initialed]);

  useEffect(() => {
    const subscription = merge(
      elements$.current.pipe(debounceTime(300)),
      prompt$.current.pipe(distinctUntilChanged(), debounceTime(300)),
      excalidrawAPI$.current.pipe(distinctUntilChanged()),
    )
      .pipe(
        mergeMap(() => excalidrawAPI$.current),
        filter((e) => !!e),
        mergeMap(() =>
          elements$.current.pipe(
            mergeMap((elements) =>
              excalidrawAPI$.current.pipe(
                map((api) => ({
                  api,
                  elements,
                })),
              ),
            ),
            mergeMap(({ api, elements }) => from(getBase64(elements, api))),
            distinctUntilChanged(),
            mergeMap((base64) =>
              prompt$.current.pipe(
                distinctUntilChanged(),
                map((prompt) => [prompt, base64]),
              ),
            ),
          ),
        ),
        debounceTime(300),
        skip(1),
        switchMap(([prompt, input_image]) => {
          const body = {
            guidance_scale: 8,
            input_image,
            lcm_steps: 50,
            prompt,
            seed: 2159232,
            steps: 4,
            strength: 0.7,
            width: 768,
            height: 768,
          };
          return fromFetch("/api/run", {
            headers: {
              accept: "image/jpeg",
              "content-type": "application/json",
            },
            body: JSON.stringify(body),
            method: "POST",
          });
        }),
      )
      .subscribe(async (data) => {
        const blob = await data.blob();
        const base64 = await blobToBase64(blob);
        setImgSrc(base64);
      });
    return () => subscription.unsubscribe();
  }, []);
  return (
    <div className="inset-0 absolute">
      <div className="h-full w-full flex flex-col lg:flex-row">
        <div className="w-full h-full lg:w-1/2 bg-zinc-100 flex flex-col items-center justify-center py-4 px-8 gap-4">
          <Select value={presetName} onValueChange={setPresetName}>
            <SelectTrigger className="w-full flex-0">
              <SelectValue placeholder="Select a preset" />
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.name} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="border-zinc-300 border bg-white flex-1 w-full rounded relative">
            <div className="absolute inset-0 flex justify-center items-center">
              {imgSrc && (
                <img
                  alt="img"
                  className="w-auto h-auto max-w-full max-h-full"
                  src={imgSrc}
                />
              )}
            </div>
          </div>
          <Input
            type="text"
            className="flex-0"
            ref={input}
            placeholder="Prompt"
            onChange={(e) => prompt$.current.next(e.target.value)}
          />
        </div>
        <div className="-order-9 lg:order-1 w-full h-2/3 lg:h-full lg:w-1/2 border-b border-zinc-300 lg:border-l lg:border-b-0">
          <Excalidraw
            initialData={{
              elements: presets[0].elements,
              appState: predefineState,
            }}
            excalidrawAPI={(api) => {
              excalidrawAPI.current = api;
              excalidrawAPI$.current.next(api);
              setInitialed(true);
            }}
          ></Excalidraw>
        </div>
      </div>
    </div>
  );
}
