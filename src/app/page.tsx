"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { Toaster } from "@/components/ui/toaster";
import { getRandomDifferent } from "@/lib/utils";
import { zoomToFit } from "@/util/excalidraw";
import { fetchImage } from "@/util/fetch-image";
import {
  artStyles,
  paintingTypes,
  predefineState,
  presetBase64,
  presetElements,
} from "@/util/presets";
import { useCallbackRefState } from "@/util/useCallbackRefState";
import { useExcalidrawResponse } from "@/util/useExcalidrawResponse";
import { usePrevious } from "@/util/usePrevious";
import { MagicWandFilled, Shuffle } from "@carbon/icons-react";
import type { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import dynamic from "next/dynamic";

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
  const [prompt, setPrompt] = useState(
    "beautiful watercolor painting, impressionism style",
  );
  const paintType = useRef<string | null>(null);
  const artStyle = useRef<string | null>(null);

  const [presetImage, setPresetImage] = useState(presetBase64);
  const [beautifyImage, setBeautifyImage] = useState("");
  const [beautifyLoading, setBeautifyLoading] = useState(false);
  const [activeTool, setActiveTool] = useState("freedraw");
  const [elements, setElements] =
    useState<readonly NonDeletedExcalidrawElement[]>(presetElements);
  const [elementVersion, setElementVersion] = useState(
    elements.map((e) => e.version).join(""),
  );

  useEffect(() => {
    setBeautifyImage("");
  }, [prompt, elementVersion]);

  const { base64, loading } = useExcalidrawResponse(
    excalidrawAPI,
    elements,
    prompt,
    elementVersion,
  );

  const previousBase64 = usePrevious(base64);

  useEffect(() => {
    if (excalidrawAPI) {
      setTimeout(() => zoomToFit(excalidrawAPI));
    }
  }, [excalidrawAPI]);

  const imageSrc = useMemo(() => {
    return beautifyImage || base64 || previousBase64 || presetImage;
  }, [previousBase64, presetImage, base64, beautifyImage]);

  return (
    <div className="inset-0 absolute">
      <Toaster></Toaster>
      <div className="h-full w-full flex flex-col gap-8 pt-8">
        <div className="flex-1 flex flex-col lg:flex-row gap-8 px-4">
          <div className="w-full h-full min-h-[500px] lg:w-1/2 rounded border-zinc-300 overflow-hidden border relative flex">
            <div className="flex-0 w-11 border-r bg-zinc-100 border-zinc-200"></div>
            <div className={`flex-1 relative ${activeTool}`}>
              <Excalidraw
                detectScroll={false}
                autoFocus={true}
                initialData={{
                  elements: elements,
                  appState: predefineState,
                }}
                excalidrawAPI={excalidrawRefCallback}
                onChange={(elements, appState) => {
                  setActiveTool(appState.activeTool.type);
                  const currentActiveTool = appState.activeTool.type;
                  if (
                    (currentActiveTool === "ellipse" &&
                      activeTool !== "ellipse") ||
                    (currentActiveTool === "rectangle" &&
                      activeTool !== "rectangle")
                  ) {
                    appState.currentItemStrokeColor = "transparent";
                  }
                  if (
                    (currentActiveTool === "freedraw" &&
                      activeTool !== "freedraw") ||
                    (currentActiveTool === "text" && activeTool !== "text")
                  ) {
                    appState.currentItemStrokeColor = "#000";
                  }
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
              {imageSrc && (
                <img
                  alt="img"
                  className="w-auto h-auto max-w-full max-h-full"
                  src={imageSrc}
                />
              )}
              {(loading || beautifyLoading) && (
                <div className="text-zinc-300 font-normal text-sm absolute right-4 bottom-4">
                  processing...
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex-0 flex w-full items-center gap-8 px-4 pb-8">
          <div className="flex-0 text-lg font-medium text-primary">
            ImgPilot
          </div>
          <div className="flex-1 flex gap-2">
            <Input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-0 !ring-0 border-zinc-300 !ring-offset-0"
              placeholder="Prompt"
            />
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
                setPrompt(
                  `beautify ${paintType.current}, ${artStyle.current} style`,
                );
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
                fetchImage(imageSrc, prompt, 768)
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
