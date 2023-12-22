"use client";
if (typeof window !== "undefined") {
  (window as any).EXCALIDRAW_ASSET_PATH = "/excalidraw/dist/";
}

import { Dice } from "@/components/dice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Toaster } from "@/components/ui/toaster";
import { getRandomDifferent } from "@/lib/utils";
import { zoomToFit } from "@/util/excalidraw";
import { fetchImage } from "@/util/fetch-image";
import {
  getLocalState,
  LocalState,
  saveToLocalState,
} from "@/util/local-store";
import {
  artStyles,
  paintingTypes,
  predefineState,
  presets,
} from "@/util/presets";
import { useCallbackRefState } from "@/util/useCallbackRefState";
import { useExcalidrawResponse } from "@/util/useExcalidrawResponse";
import { usePrevious } from "@/util/usePrevious";
import { CircleDash, Download } from "@carbon/icons-react";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import { Wand2 } from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useEffect, useMemo, useRef, useState } from "react";
import { useThrottledCallback } from "use-debounce";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  {
    ssr: false,
  },
);

const GitHubCorners = dynamic(
  async () => (await import("@uiw/react-github-corners")).default,
  {
    ssr: false,
  },
);

const getVersion = (elements: readonly ExcalidrawElement[]): string => {
  return elements.map((e) => e.version).join("");
};
export default function Home() {
  const [excalidrawAPI, excalidrawRefCallback] =
    useCallbackRefState<ExcalidrawImperativeAPI>();
  const [drawState, setDrawState] = useState<LocalState>({
    style: "",
    prompt: "",
    image: "",
    elements: [],
  });
  const [beautifyImage, setBeautifyImage] = useState("");
  const paintType = useRef<string | null>(null);
  const artStyle = useRef<string | null>(null);
  const [beautifyLoading, setBeautifyLoading] = useState(false);
  const [init, setInit] = useState(false);
  const [activeTool, setActiveTool] = useState("freedraw");
  useEffect(() => {
    setDrawState(getLocalState());
    setInit(true);
  }, []);
  const setDrawStateThrottle = useThrottledCallback(setDrawState, 500);

  useEffect(() => {
    setBeautifyImage("");
  }, [drawState.prompt, drawState.elements]);

  const realPrompt = useMemo(
    () => `${drawState.prompt},beautify ${drawState.style} style`,
    [drawState.prompt, drawState.style],
  );

  const { base64, loading } = useExcalidrawResponse(
    excalidrawAPI,
    drawState.elements,
    realPrompt,
    getVersion(drawState.elements),
  );

  const previousBase64 = usePrevious(base64);

  const imageSrc = useMemo(() => {
    return beautifyImage || base64 || previousBase64 || drawState.image;
  }, [previousBase64, base64, beautifyImage, drawState.image]);

  useEffect(() => {
    if (
      drawState.elements.length ||
      imageSrc ||
      drawState.prompt ||
      drawState.style
    ) {
      saveToLocalState({ ...drawState, image: imageSrc });
    }
  }, [drawState, imageSrc]);

  useEffect(() => {
    if (excalidrawAPI) {
      setTimeout(() => zoomToFit(excalidrawAPI));
    }
  }, [excalidrawAPI]);

  return (
    <div className="inset-0 absolute">
      <Toaster></Toaster>
      <div className="h-full w-full flex flex-col gap-8 pt-8">
        <div className="flex-1 flex flex-col lg:flex-row gap-4 px-4">
          <div className="w-24 shrink-0 hidden lg:flex border border-zinc-300 rounded flex-col items-center gap-2 py-2 bg-white">
            {presets.map((preset) => (
              <div
                key={preset.name}
                onClick={() => {
                  setDrawState((state) => ({
                    ...state,
                    prompt: preset.prompt,
                  }));
                  if (excalidrawAPI) {
                    excalidrawAPI.updateScene({ elements: preset.elements });
                    setTimeout(() => zoomToFit(excalidrawAPI));
                  }
                }}
                className="h-20 w-20 border border-zinc-200 rounded p-2 bg-white cursor-pointer"
              >
                <img src={preset.base64} className="object-cover" />
              </div>
            ))}
          </div>
          <div className="w-full h-full min-h-[500px] lg:w-1/2 rounded border-zinc-300 overflow-hidden border relative flex">
            <div className="flex-0 w-11 border-r bg-zinc-100 border-zinc-200"></div>
            <div className={`flex-1 relative ${activeTool}`}>
              <Excalidraw
                detectScroll={true}
                autoFocus={true}
                initialData={{
                  elements: drawState.elements,
                  appState: predefineState,
                }}
                excalidrawAPI={excalidrawRefCallback}
                onChange={(elements, appState) => {
                  setActiveTool(appState.activeTool.type);
                  setDrawStateThrottle((state) => ({ ...state, elements }));
                }}
              ></Excalidraw>
            </div>
          </div>
          <div className="w-full h-2/3 min-h-[400px] lg:h-full lg:w-1/2 bg-white rounded border-zinc-300 overflow-hidden border relative">
            <GitHubCorners
              position="right"
              href="https://github.com/leptonai/imgpilot"
            />
            <div className="absolute inset-0 flex justify-center items-center">
              {imageSrc && init && (
                <img
                  alt="img"
                  className="w-full h-full object-contain"
                  src={imageSrc}
                />
              )}
              {(loading || beautifyLoading) && (
                <div className="absolute left-4 bottom-4">
                  <CircleDash className="h-4 w-4 text-zinc-400 animate-spin"></CircleDash>
                </div>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="absolute bottom-2 right-2"
                asChild
              >
                <a href={imageSrc} download>
                  <Download />
                </a>
              </Button>
            </div>
          </div>
        </div>
        <div className="flex w-full items-end gap-6 px-4 pb-8">
          <div className="flex gap-1 items-center">
            <div className="flex-0 hidden md:block">
              <Image alt="logo" src="/logo.svg" height={46} width={46} />
            </div>
            <div className="flex-0 flex flex-col">
              <div className="text-2xl font-medium text-primary">ImgPilot</div>
              <div className="text-xs hidden md:block text-zinc-600 hover:text-zinc-900">
                <a href="https://lepton.ai" target="_blank">
                  Powered by Lepton AI
                </a>
              </div>
            </div>
          </div>
          <div className="flex-1 flex gap-2 items-end">
            <div className="flex-0 w-full md:w-96">
              <div className="text-xs pl-1 text-zinc-600">
                What do you want to draw
              </div>
              <Input
                type="text"
                value={drawState.prompt}
                onChange={(e) =>
                  setDrawState((state) => ({
                    ...state,
                    prompt: e.target.value,
                  }))
                }
                className="h-9 !ring-0 border-zinc-300 !ring-offset-0"
                placeholder=""
              />
            </div>
            <div className="flex-1 hidden md:block">
              <div className="text-xs pl-1 text-zinc-600">
                What is the painting style
              </div>
              <Input
                type="text"
                value={drawState.style}
                onChange={(e) =>
                  setDrawState((state) => ({ ...state, style: e.target.value }))
                }
                className="h-9 !ring-0 border-zinc-300 !ring-offset-0"
                placeholder=""
              />
            </div>
            <Button
              disabled={beautifyLoading}
              size="sm"
              onClick={() => {
                artStyle.current = getRandomDifferent(
                  artStyles,
                  artStyle.current,
                );
                paintType.current = getRandomDifferent(
                  paintingTypes,
                  paintType.current,
                );
                setDrawState((state) => ({
                  ...state,
                  style: `${paintType.current}, ${artStyle.current}`,
                }));
              }}
            >
              <Dice />
            </Button>
            <Button
              disabled={beautifyLoading}
              size="sm"
              onClick={() => {
                if (loading) return;
                setBeautifyLoading(true);
                fetchImage(imageSrc, realPrompt, 512)
                  .then((data) => {
                    setBeautifyImage(data);
                    setBeautifyLoading(false);
                  })
                  .catch(() => {
                    setBeautifyLoading(false);
                  });
              }}
            >
              <Wand2 size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
