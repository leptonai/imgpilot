"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/toaster";
import { zoomToFit } from "@/util/excalidraw";
import { fetchImage } from "@/util/fetch-image";
import { predefineState, presets } from "@/util/presets";
import { useCallbackRefState } from "@/util/useCallbackRefState";
import { useExcalidrawResponse } from "@/util/useExcalidrawResponse";
import { usePrevious } from "@/util/usePrevious";
import { MagicWandFilled } from "@carbon/icons-react";
import type { NonDeletedExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types/types";
import dynamic from "next/dynamic";

import { useEffect, useMemo, useState } from "react";

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
  const [prompt, setPrompt] = useState(presets[0].prompt);
  const [presetName, setPresetName] = useState(presets[0].name);
  const [presetImage, setPresetImage] = useState(presets[0].base64);
  const [beautifyImage, setBeautifyImage] = useState("");
  const [beautifyLoading, setBeautifyLoading] = useState(false);
  const [activeTool, setActiveTool] = useState("freedraw");
  const [elements, setElements] = useState<
    readonly NonDeletedExcalidrawElement[]
  >(presets[0].elements);
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

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }
    const preset = presets.find((p) => p.name === presetName)!;
    excalidrawAPI.updateScene({ elements: preset.elements });
    zoomToFit(excalidrawAPI);
    setPrompt(preset.prompt);
    setPresetImage(preset.base64);
    setElements(preset.elements);
  }, [presetName, excalidrawAPI]);

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
                <div className="text-zinc-300 font-normal text-sm absolute right-14 bottom-4">
                  processing...
                </div>
              )}
            </div>
            <Button
              disabled={beautifyLoading}
              size="sm"
              variant="ghost"
              className="absolute right-2 bottom-2"
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
        <div className="flex-0 flex w-full items-center space-x-2 px-4 pb-8">
          <Select value={presetName} onValueChange={setPresetName}>
            <SelectTrigger className="flex-0 border-none bg-transparent !ring-0 !ring-offset-0 flex-shrink-0 w-32">
              <div className="flex-0 text-lg font-medium text-primary">
                ImgPilot
              </div>
            </SelectTrigger>
            <SelectContent>
              {presets.map((p) => (
                <SelectItem key={p.name} value={p.name}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="flex-0 !ring-0 border-zinc-300 !ring-offset-0"
            placeholder="Prompt"
          />
        </div>
      </div>
    </div>
  );
}
