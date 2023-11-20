"use client";
import { AutoDraw } from "@/components/tldraw/AutoDraw";
import { Input } from "@/components/ui/input";

import { presets } from "@/util/presets";
import { Tldraw } from "@tldraw/tldraw";
import "@tldraw/tldraw/tldraw.css";
import { useEffect, useMemo, useState } from "react";

export default function Home() {
  const [response, setResponse] = useState<{ data: string; loading: boolean }>({
    data: "",
    loading: false,
  });
  const [prompt, setPrompt] = useState(presets.prompt);
  const [previousData, setPreviousData] = useState<string | null>(null);

  useEffect(() => {
    if (response.data) {
      setPreviousData(response.data);
    }
  }, [response.data]);

  const imgSrc = useMemo(() => {
    return response.data || previousData || presets.base64;
  }, [response.data, previousData]);

  return (
    <div className="inset-0 absolute">
      <div className="h-full w-full flex flex-col lg:flex-row">
        <div className="w-full h-full lg:w-1/2 bg-zinc-100 flex flex-col items-center justify-center py-4 px-8 gap-4">
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
            value={prompt}
            placeholder="Prompt"
            onChange={(e) => setPrompt(e.target.value)}
          />
        </div>
        <div className="-order-9 lg:order-1 w-full h-2/3 lg:h-full lg:w-1/2 border-b-2 border-zinc-300 lg:border-l-2 lg:border-b-0">
          <Tldraw persistenceKey="imgpilot" forceMobile={true}>
            <AutoDraw
              snapshot={presets.snapshot}
              input={presets.input}
              prompt={prompt}
              onResponse={setResponse}
            ></AutoDraw>
          </Tldraw>
        </div>
      </div>
    </div>
  );
}
