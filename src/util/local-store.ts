import { presetBase64, presetPrompt } from "@/util/presets";
import type {
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
} from "@excalidraw/excalidraw/types/element/types";
import type { AppState } from "@excalidraw/excalidraw/types/types";

export const getNonDeletedElements = (elements: readonly ExcalidrawElement[]) =>
  elements.filter(
    (element) => !element.isDeleted,
  ) as readonly NonDeletedExcalidrawElement[];

export const STORAGE_KEYS = {
  LOCAL_STORAGE_ELEMENTS: "imgpilot_elements",
  LOCAL_STORAGE_IMAGE: "imgpilot_image",
  LOCAL_STORAGE_PROMPT: "imgpilot_prompt",
  LOCAL_STORAGE_TARGET: "imgpilot_target",
} as const;

const getLocalStorage = () => {
  if (typeof localStorage !== "undefined") {
    return localStorage;
  } else {
    return null;
  }
};

export const getLocalTarget = () => {
  let saveTarget = "";
  try {
    saveTarget =
      getLocalStorage()?.getItem(STORAGE_KEYS.LOCAL_STORAGE_TARGET) || "";
  } catch (e) {
    console.error(e);
  }
  return saveTarget;
};

export const saveToLocalTarget = (target: string) => {
  getLocalStorage()?.setItem(STORAGE_KEYS.LOCAL_STORAGE_TARGET, target);
};

export const getLocalPrompt = () => {
  let savePrompt = presetPrompt;
  try {
    savePrompt =
      getLocalStorage()?.getItem(STORAGE_KEYS.LOCAL_STORAGE_PROMPT) ||
      presetPrompt;
  } catch (e) {
    console.error(e);
  }
  return savePrompt;
};

export const saveToLocalPrompt = (prompt: string) => {
  getLocalStorage()?.setItem(STORAGE_KEYS.LOCAL_STORAGE_PROMPT, prompt);
};

export const getLocalImage = () => {
  let savedImage = presetBase64;
  try {
    savedImage =
      getLocalStorage()?.getItem(STORAGE_KEYS.LOCAL_STORAGE_IMAGE) ||
      presetBase64;
  } catch (e) {
    console.error(e);
  }
  return savedImage;
};

export const saveToLocalImage = (base64: string) => {
  getLocalStorage()?.setItem(STORAGE_KEYS.LOCAL_STORAGE_IMAGE, base64);
};

export const getLocalElements = () => {
  let savedElements = null;

  try {
    savedElements = getLocalStorage()?.getItem(
      STORAGE_KEYS.LOCAL_STORAGE_ELEMENTS,
    );
  } catch (error: any) {
    console.error(error);
  }

  let elements: ExcalidrawElement[] = [];
  if (savedElements) {
    try {
      elements = clearElementsForLocalStorage(JSON.parse(savedElements));
    } catch (error: any) {
      console.error(error);
    }
  }
  return elements;
};

export const saveToLocalElements = (elements: readonly ExcalidrawElement[]) => {
  getLocalStorage()?.setItem(
    STORAGE_KEYS.LOCAL_STORAGE_ELEMENTS,
    JSON.stringify(elements),
  );
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
