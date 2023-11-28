"use client";
if (typeof window !== "undefined") {
  (window as any).EXCALIDRAW_ASSET_PATH = "/excalidraw/dist/";
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Toaster } from "@/components/ui/toaster";
import { getRandomDifferent } from "@/lib/utils";
import { zoomToFit } from "@/util/excalidraw";
import { fetchImage } from "@/util/fetch-image";
import {
  getLocalElements,
  getLocalImage,
  getLocalPrompt,
  getLocalTarget,
  saveToLocalElements,
  saveToLocalImage,
  saveToLocalPrompt,
  saveToLocalTarget,
} from "@/util/local-store";
import { artStyles, paintingTypes, predefineState } from "@/util/presets";
import { useCallbackRefState } from "@/util/useCallbackRefState";
import { useExcalidrawResponse } from "@/util/useExcalidrawResponse";
import { usePrevious } from "@/util/usePrevious";
import { Download, MagicWandFilled, Shuffle } from "@carbon/icons-react";
import type { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import dynamic from "next/dynamic";
import Image from "next/image";

import { useEffect, useMemo, useRef, useState } from "react";

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
export default function Home() {
  const [excalidrawAPI, excalidrawRefCallback] =
    useCallbackRefState<ExcalidrawImperativeAPI>();
  const [prompt, setPrompt] = useState("");
  const [target, setTarget] = useState("");
  const [localImage, setLocalImage] = useState("");
  const [beautifyImage, setBeautifyImage] = useState("");
  const paintType = useRef<string | null>(null);
  const artStyle = useRef<string | null>(null);
  const [beautifyLoading, setBeautifyLoading] = useState(false);
  const [init, setInit] = useState(false);
  const [activeTool, setActiveTool] = useState("freedraw");
  const [elements, setElements] =
    useState<readonly NonDeletedExcalidrawElement[]>(getLocalElements());
  const [elementVersion, setElementVersion] = useState(
    elements.map((e) => e.version).join(""),
  );

  useEffect(() => {
    setPrompt(getLocalPrompt());
    setTarget(getLocalTarget());
    setLocalImage(getLocalImage());
    setInit(true);
  }, []);

  useEffect(() => {
    setBeautifyImage("");
  }, [prompt, elementVersion]);

  const { base64, loading } = useExcalidrawResponse(
    excalidrawAPI,
    elements,
    `${target},beautify ${prompt} style`,
    elementVersion,
  );

  useEffect(() => {
    if (base64) {
      saveToLocalImage(base64);
    }
  }, [base64]);

  useEffect(() => {
    if (prompt) {
      saveToLocalPrompt(prompt);
    }
  }, [prompt]);

  useEffect(() => {
    if (target) {
      saveToLocalTarget(target);
    }
  }, [target]);

  const previousBase64 = usePrevious(base64);

  useEffect(() => {
    if (excalidrawAPI) {
      setTimeout(() => zoomToFit(excalidrawAPI));
    }
  }, [excalidrawAPI]);

  const imageSrc = useMemo(() => {
    return beautifyImage || base64 || previousBase64 || localImage;
  }, [previousBase64, base64, beautifyImage, localImage]);

  return (
    <div className="inset-0 absolute">
      <Toaster></Toaster>
      <div className="h-full w-full flex flex-col gap-8 pt-8">
        <div className="flex-1 flex flex-col lg:flex-row gap-8 px-4">
          <div className="w-full h-full min-h-[500px] lg:w-1/2 rounded border-zinc-300 overflow-hidden border relative flex">
            <div className="flex-0 w-11 border-r bg-zinc-100 border-zinc-200"></div>
            <div className={`flex-1 relative ${activeTool}`}>
              <Excalidraw
                detectScroll={true}
                autoFocus={true}
                initialData={{
                  elements: elements,
                  appState: predefineState,
                }}
                excalidrawAPI={excalidrawRefCallback}
                onChange={(elements, appState) => {
                  saveToLocalElements(elements);
                  setActiveTool(appState.activeTool.type);
                  setElements(elements);
                  setElementVersion(elements.map((e) => e.version).join(""));
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
                <div className="text-zinc-300 font-normal text-sm absolute right-14 bottom-4">
                  processing...
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
        <div className="flex-0 flex w-full items-end gap-6 px-4 pb-8">
          <div className="flex gap-1 items-center">
            <div className="flex-0 hidden md:block">
              <Image alt="logo" src="/logo.svg" height={36} width={36} />
            </div>
            <div className="flex-0 text-2xl font-medium text-primary">
              ImgPilot
            </div>
          </div>
          <div className="flex-1 flex gap-2 items-end">
            <div className="flex-0 w-full md:w-80">
              <div className="text-xs pl-1 text-zinc-600">
                What do you want to draw
              </div>
              <Input
                type="text"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
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
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
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
                setPrompt(`${paintType.current}, ${artStyle.current}`);
              }}
            >
              <Shuffle />
            </Button>
            <Button
              disabled={beautifyLoading}
              size="sm"
              onClick={() => {
                if (loading) return;
                setBeautifyLoading(true);
                fetchImage(imageSrc, prompt, 512)
                  .then((data) => {
                    setBeautifyImage(data);
                    setBeautifyLoading(false);
                  })
                  .catch(() => {
                    setBeautifyLoading(false);
                  });
              }}
            >
              <MagicWandFilled />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
