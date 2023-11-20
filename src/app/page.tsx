"use client";
import { GithubForkRibbon } from "@/components/github";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToastAction } from "@/components/ui/toast";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/components/ui/use-toast";
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
  Subject,
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
  return await blobToBase64(blob);
};
export default function Home() {
  const excalidrawAPIRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const elementsRef$ = useRef(
    new ReplaySubject<readonly NonDeletedExcalidrawElement[]>(1),
  );
  const promptRef$ = useRef(new ReplaySubject<string>(1));
  const beautifyRef$ = useRef(new Subject<string>());
  const excalidrawChange$ = useRef(new ReplaySubject<void>(1));
  const excalidrawAPIRef$ = useRef(
    new ReplaySubject<ExcalidrawImperativeAPI>(1),
  );
  const inputRef = useRef<HTMLInputElement>(null);
  const loadingRef = useRef(false);
  const [initialed, setInitialed] = useState(false);
  const [presetName, setPresetName] = useState(presets[0].name);
  const [imgSrc, setImgSrc] = useState<string>(presets[0].base64);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const { prompt, elements, base64 } = presets.find(
      (p) => p.name === presetName,
    )!;
    elementsRef$.current.next(elements);
    promptRef$.current.next(prompt);
    setImgSrc(base64);
    if (inputRef.current) {
      inputRef.current.value = prompt;
    }
    if (excalidrawAPIRef.current) {
      excalidrawAPIRef.current.updateScene({ elements: elements });
      zoomToFit(excalidrawAPIRef.current);
    }
  }, [presetName]);

  useEffect(() => {
    const subscription = fromEvent(window, "resize")
      .pipe(
        debounceTime(300),
        map(() => window.innerWidth),
        distinctUntilChanged(),
        filter(() => !!excalidrawAPIRef.current),
      )
      .subscribe(() => {
        zoomToFit(excalidrawAPIRef.current!);
      });
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (excalidrawAPIRef.current) {
      setTimeout(() => zoomToFit(excalidrawAPIRef.current!));
      excalidrawAPIRef.current.onPointerUp(() => {
        excalidrawChange$.current.next();
      });
    }
  }, [initialed]);

  useEffect(() => {
    const element$ = merge(
      elementsRef$.current,
      excalidrawChange$.current.pipe(
        debounceTime(300),
        mergeMap(() =>
          excalidrawAPIRef$.current.pipe(map((api) => api.getSceneElements())),
        ),
      ),
    );
    const base64FromExcalidraw$ = merge(
      element$.pipe(skip(1)),
      excalidrawAPIRef$.current,
    ).pipe(
      debounceTime(300),
      mergeMap(() => excalidrawAPIRef$.current),
      filter((e) => !!e),
      mergeMap(() =>
        element$.pipe(
          mergeMap((elements) =>
            excalidrawAPIRef$.current.pipe(
              map((api) => ({
                api,
                elements,
              })),
            ),
          ),
        ),
      ),
      mergeMap(({ api, elements }) => from(getBase64(elements, api))),
      distinctUntilChanged(),
    );
    const base64FromBeautify$ = beautifyRef$.current.pipe(
      distinctUntilChanged(),
    );
    const base64$ = merge(base64FromBeautify$, base64FromExcalidraw$).pipe(
      map((v) => v.replace(/^data:image\/(png|jpeg);base64,/, "")),
    );
    const prompt$ = promptRef$.current.pipe(
      distinctUntilChanged(),
      debounceTime(300),
    );
    const subscription = merge(base64$, prompt$)
      .pipe(
        mergeMap(() =>
          base64$.pipe(
            mergeMap((img) => prompt$.pipe(map((prompt) => [img, prompt]))),
          ),
        ),
        debounceTime(300),
        filter(() => !loadingRef.current),
        switchMap(([input_image, prompt]) => {
          loadingRef.current = true;
          setLoading(true);
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
      .subscribe({
        next: async (data) => {
          loadingRef.current = false;
          setLoading(false);
          const blob = await data.blob();
          const base64 = await blobToBase64(blob);
          const count = base64.split("AooooAKKKKACiiig").length;
          if (count < 500) {
            setImgSrc(base64);
          }
        },
        error: () => {
          loadingRef.current = false;
          setLoading(false);
          toast({
            title: "We are overloaded with service",
            description:
              "Please try again later or visit our github repo for local deployment.",
            action: (
              <ToastAction asChild altText="Try again">
                <a href="https://github.com/leptonai/imgpilot" target="_blank">
                  Github
                </a>
              </ToastAction>
            ),
          });
        },
      });
    return () => subscription.unsubscribe();
  }, [toast]);
  return (
    <div className="inset-0 absolute">
      <Toaster></Toaster>
      <GithubForkRibbon></GithubForkRibbon>
      <div className="h-full w-full flex flex-col lg:flex-row">
        <div className="w-full h-full lg:w-1/2 bg-zinc-100 flex flex-col items-center justify-center py-4 px-8 gap-4">
          <Select
            disabled={loading}
            value={presetName}
            onValueChange={setPresetName}
          >
            <SelectTrigger className="w-full flex-0 !ring-0 !ring-offset-0">
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
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              className="flex-0 !ring-0 border-zinc-300 !ring-offset-0"
              ref={inputRef}
              placeholder="Prompt"
              onChange={(e) => promptRef$.current.next(e.target.value)}
            />
            <Button
              disabled={loading || !imgSrc}
              size="sm"
              onClick={() => {
                setLoading(true);
                beautifyRef$.current.next(imgSrc);
              }}
            >
              {loading ? "Processing" : "Beautify"}
            </Button>
          </div>
        </div>
        <div className="-order-9 lg:order-1 w-full h-2/3 lg:h-full lg:w-1/2 border-b border-zinc-300 lg:border-l lg:border-b-0">
          <Excalidraw
            initialData={{
              elements: presets[0].elements,
              appState: predefineState,
            }}
            excalidrawAPI={(api) => {
              excalidrawAPIRef.current = api;
              excalidrawAPIRef$.current.next(api);
              setInitialed(true);
            }}
          ></Excalidraw>
        </div>
      </div>
    </div>
  );
}
