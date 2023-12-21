import { artStyles, paintingTypes, presets } from "@/util/presets";
import type {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
} from "@excalidraw/excalidraw/types/element/types";
import type { AppState } from "@excalidraw/excalidraw/types/types";

export const getNonDeletedElements = (elements: readonly ExcalidrawElement[]) =>
  elements.filter(
    (element) => !element.isDeleted,
  ) as readonly NonDeletedExcalidrawElement[];

export type LocalState = {
  style: string;
  prompt: string;
  image: string;
  elements: readonly ExcalidrawElement[];
};

export const STORAGE_KEYS = {
  LOCAL_STORAGE_ELEMENTS: "imgpilot_elements",
  LOCAL_STORAGE_IMAGE: "imgpilot_image",
  LOCAL_STORAGE_PROMPT: "imgpilot_prompt",
  LOCAL_STORAGE_TARGET: "imgpilot_target",
  LOCAL_STATE: "imgpilot_local_state",
} as const;

const getLocalStorage = () => {
  if (typeof localStorage !== "undefined") {
    return localStorage;
  } else {
    return null;
  }
};

export const getLocalState = (): LocalState => {
  let savedState: LocalState = {
    style: `${paintingTypes[0]} ${artStyles[0]}`,
    prompt: presets[0].prompt,
    image: presets[0].base64,
    elements: presets[0].elements,
  };

  try {
    const parsed = JSON.parse(
      getLocalStorage()?.getItem(STORAGE_KEYS.LOCAL_STATE) || "",
    );
    savedState = {
      style: parsed.style,
      prompt: parsed.prompt,
      image: parsed.image,
      elements: clearElementsForLocalStorage(parsed.elements) || [],
    };
  } catch (error: any) {
    console.error(error);
  }

  return savedState;
};

export const saveToLocalState = (state: LocalState) => {
  getLocalStorage()?.setItem(STORAGE_KEYS.LOCAL_STATE, JSON.stringify(state));
};

export const isLinearElementType = (
  elementType: AppState["activeTool"]["type"],
): boolean => {
  return (
    elementType === "arrow" || elementType === "line" // || elementType === "freedraw"
  );
};

const _clearElements = (
  elements: readonly ExcalidrawElement[],
): ExcalidrawElement[] =>
  getNonDeletedElements(elements).map((element) =>
    isLinearElementType(element.type)
      ? { ...element, lastCommittedPoint: null }
      : element,
  );
export const clearElementsForLocalStorage = (
  elements: readonly ExcalidrawElement[],
) => _clearElements(elements);
