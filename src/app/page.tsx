"use client";
import { GithubForkRibbon } from "@/components/github";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/toaster";
import { zoomToFit } from "@/util/excalidraw";
import { predefineState, presets } from "@/util/presets";
import { useCallbackRefState } from "@/util/useCallbackRefState";
import { useExcalidrawResponse } from "@/util/useExcalidrawResponse";
import { usePrevious } from "@/util/usePrevious";
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
export default function Home() {
  const [excalidrawAPI, excalidrawRefCallback] =
    useCallbackRefState<ExcalidrawImperativeAPI>();
  const [prompt, setPrompt] = useState(presets[0].prompt);
  const [presetName, setPresetName] = useState(presets[0].name);
  const [presetImage, setPresetImage] = useState(presets[0].base64);
  const [elements, setElements] = useState<
    readonly NonDeletedExcalidrawElement[]
  >(presets[0].elements);

  const [elementVersion, setElementVersion] = useState(
    elements.map((e) => e.version).join(""),
  );

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
    return base64 || previousBase64 || presetImage;
  }, [previousBase64, presetImage, base64]);

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
      <GithubForkRibbon></GithubForkRibbon>
      <div className="h-full w-full flex flex-col lg:flex-row">
        <div className="w-full h-full lg:w-1/2 bg-zinc-100 flex flex-col items-center justify-center py-4 px-8 gap-4">
          <div className="flex w-full items-center space-x-4">
            <div className="flex-0 text-lg font-medium text-primary">
              ImgPilot
            </div>
            <Select value={presetName} onValueChange={setPresetName}>
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
          </div>
          <div className="border-zinc-300 border bg-white flex-1 w-full rounded relative">
            <div className="absolute inset-0 flex justify-center items-center">
              {imageSrc && (
                <img
                  alt="img"
                  className="w-auto h-auto max-w-full max-h-full"
                  src={imageSrc}
                />
              )}
            </div>
          </div>
          <div className="flex w-full items-center space-x-2">
            <Input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="flex-0 !ring-0 border-zinc-300 !ring-offset-0"
              placeholder="Prompt"
            />
          </div>
        </div>
        <div className="-order-9 lg:order-1 w-full h-2/3 lg:h-full lg:w-1/2 border-b border-zinc-300 lg:border-l lg:border-b-0">
          <Excalidraw
            detectScroll={false}
            autoFocus={true}
            initialData={{
              elements: elements,
              appState: predefineState,
            }}
            excalidrawAPI={excalidrawRefCallback}
            onChange={(elements) => {
              setElements(elements);
              setElementVersion(elements.map((e) => e.version).join(""));
            }}
          ></Excalidraw>
        </div>
      </div>
    </div>
  );
}
