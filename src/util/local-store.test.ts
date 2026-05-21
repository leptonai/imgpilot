import {
  getNonDeletedElements,
  getLocalState,
  saveToLocalState,
  isLinearElementType,
  clearElementsForLocalStorage,
  STORAGE_KEYS,
  type LocalState
} from "./local-store";
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type { AppState } from "@excalidraw/excalidraw/types/types";

// Mock localStorage for Node environment
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock presets and other dependencies
jest.mock("@/util/presets", () => ({
  artStyles: ["oil", "watercolor", "pencil"],
  paintingTypes: ["abstract", "realistic", "impressionist"],
  presets: [
    {
      prompt: "A beautiful landscape",
      base64: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAY",
      elements: []
    }
  ]
}));

// Define a simple mock element interface for our tests
interface MockExcalidrawElement {
  id: string;
  type: string;
  isDeleted?: boolean;
  lastCommittedPoint?: [number, number] | null;
  [key: string]: any;
}

describe("local-store", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockReturnValue(undefined);
  });

  describe("getNonDeletedElements", () => {
    it("should return only non-deleted elements", () => {
      const elements: MockExcalidrawElement[] = [
        {
          type: "rectangle",
          id: "1",
          isDeleted: false,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
        {
          type: "rectangle",
          id: "2",
          isDeleted: true,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
        {
          type: "arrow",
          id: "3",
          isDeleted: false,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
        {
          type: "line",
          id: "4",
          isDeleted: undefined,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        }, // undefined is not deleted
      ];

      const result = getNonDeletedElements(elements as unknown as readonly ExcalidrawElement[]);

      expect(result).toHaveLength(3);
      expect(result[0].type).toBe("rectangle");
      expect(result[1].type).toBe("arrow");
      expect(result[2].type).toBe("line");
    });

    it("should handle empty array", () => {
      const result = getNonDeletedElements([] as unknown as readonly ExcalidrawElement[]);
      expect(result).toHaveLength(0);
    });
  });

  describe("STORAGE_KEYS", () => {
    it("should have the correct storage keys", () => {
      expect(STORAGE_KEYS.LOCAL_STORAGE_ELEMENTS).toBe("imgpilot_elements");
      expect(STORAGE_KEYS.LOCAL_STORAGE_IMAGE).toBe("imgpilot_image");
      expect(STORAGE_KEYS.LOCAL_STORAGE_PROMPT).toBe("imgpilot_prompt");
      expect(STORAGE_KEYS.LOCAL_STORAGE_TARGET).toBe("imgpilot_target");
      expect(STORAGE_KEYS.LOCAL_STATE).toBe("imgpilot_local_state");
    });
  });

  describe("getLocalState", () => {
    it("should return default state when localStorage is empty", () => {
      // Suppress console.error and mock JSON.parse for this test
      const originalConsoleError = console.error;
      console.error = jest.fn(); // Mock console.error to suppress output
      const originalJSONParse = JSON.parse;
      JSON.parse = jest.fn((str) => {
        if (!str || str === "") {
          // Throw an error to trigger the catch block and use defaults
          throw new SyntaxError("Unexpected end of JSON input");
        }
        return originalJSONParse.call(JSON, str);
      });

      localStorageMock.getItem.mockReturnValue(null);

      const state = getLocalState();

      expect(state.style).toBe("abstract oil");
      expect(state.prompt).toBe("A beautiful landscape");
      expect(state.image).toBe("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAY");
      expect(state.elements).toEqual([]);

      // Restore original functions
      console.error = originalConsoleError;
      JSON.parse = originalJSONParse;
    });

    it("should return saved state when localStorage has valid data", () => {
      const mockElements = [
        {
          type: "rectangle",
          id: "rect1",
          isDeleted: false,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
        {
          type: "arrow",
          id: "arrow1",
          isDeleted: false,
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          lastCommittedPoint: [10, 20],
        }
      ];

      const savedState = {
        style: "realistic watercolor",
        prompt: "Amazing sunset",
        image: "data:image/png;base64,someData",
        elements: mockElements as unknown as readonly ExcalidrawElement[]
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

      const state = getLocalState();

      expect(state.style).toBe("realistic watercolor");
      expect(state.prompt).toBe("Amazing sunset");
      expect(state.image).toBe("data:image/png;base64,someData");
      expect(state.elements).toHaveLength(2);
    });

    it("should handle invalid JSON and return default state", () => {
      // Suppress console.error and mock JSON.parse for this test
      const originalConsoleError = console.error;
      console.error = jest.fn(); // Mock console.error to suppress output
      const originalJSONParse = JSON.parse;
      JSON.parse = jest.fn(() => {
        throw new SyntaxError("Invalid JSON");
      });

      localStorageMock.getItem.mockReturnValue("{ invalid JSON");

      const state = getLocalState();

      expect(state.style).toBe("abstract oil");
      expect(state.prompt).toBe("A beautiful landscape");
      expect(state.image).toBe("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAY");
      expect(state.elements).toEqual([]);

      // Restore original functions
      console.error = originalConsoleError;
      JSON.parse = originalJSONParse;
    });

    it("should handle missing properties in saved state", () => {
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        style: "custom style",
        prompt: undefined,
        image: undefined,
        elements: []
      }));

      const state = getLocalState();

      expect(state.style).toBe("custom style");
    });
  });

  describe("saveToLocalState", () => {
    it("should save state to localStorage", () => {
      const state: LocalState = {
        style: "impressionist pencil",
        prompt: "Morning coffee",
        image: "data:image/png;base64,anotherData",
        elements: [
          {
            type: "rectangle",
            isDeleted: false,
            id: "rect1",
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          } as unknown as ExcalidrawElement
        ]
      };

      saveToLocalState(state);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEYS.LOCAL_STATE,
        JSON.stringify(state)
      );
    });

    it("should not crash if localStorage is not available", () => {
      // Temporarily make localStorage undefined
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true,
      });

      const state: LocalState = {
        style: "impressionist pencil",
        prompt: "Morning coffee",
        image: "data:image/png;base64,anotherData",
        elements: []
      };

      expect(() => saveToLocalState(state)).not.toThrow();

      // Restore localStorage for other tests
      Object.defineProperty(global, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });
    });
  });

  describe("isLinearElementType", () => {
    it("should return true for linear element types", () => {
      expect(isLinearElementType("arrow")).toBe(true);
      expect(isLinearElementType("line")).toBe(true);
    });

    it("should return false for non-linear element types", () => {
      expect(isLinearElementType("rectangle")).toBe(false);
      expect(isLinearElementType("ellipse")).toBe(false);
      expect(isLinearElementType("text")).toBe(false);
      expect(isLinearElementType("freedraw")).toBe(false); // commented out in source
      expect(isLinearElementType("selection")).toBe(false);
      expect(isLinearElementType("image")).toBe(false);
    });
  });

  describe("clearElementsForLocalStorage", () => {
    it("should clear lastCommittedPoint for linear elements", () => {
      const elements: MockExcalidrawElement[] = [
        {
          type: "arrow",
          isDeleted: false,
          id: "arrow1",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          lastCommittedPoint: [10, 20],
        },
        {
          type: "line",
          isDeleted: false,
          id: "line1",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          lastCommittedPoint: [30, 40],
        },
        {
          type: "rectangle",
          isDeleted: false,
          id: "rect1",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          lastCommittedPoint: [50, 60], // not linear, should remain unchanged
        },
      ];

      const result = clearElementsForLocalStorage(elements as unknown as readonly ExcalidrawElement[]);

      expect(result[0].type).toBe("arrow");
      expect((result[0] as any).lastCommittedPoint).toBeNull();
      expect(result[1].type).toBe("line");
      expect((result[1] as any).lastCommittedPoint).toBeNull();
      expect(result[2].type).toBe("rectangle");
      expect((result[2] as any).lastCommittedPoint).toEqual([50, 60]); // unchanged
    });

    it("should filter out deleted elements", () => {
      const elements: MockExcalidrawElement[] = [
        {
          type: "arrow",
          isDeleted: true,
          id: "arrow1",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
        {
          type: "rectangle",
          isDeleted: false,
          id: "rect1",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
        {
          type: "line",
          isDeleted: true,
          id: "line1",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        },
      ];

      const result = clearElementsForLocalStorage(elements as unknown as readonly ExcalidrawElement[]);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("rectangle");
      expect(result[0].isDeleted).toBe(false);
    });

    it("should return empty array for empty input", () => {
      const result = clearElementsForLocalStorage([]);
      expect(result).toEqual([]);
    });

    it("should handle elements with missing lastCommittedPoint", () => {
      const elements: MockExcalidrawElement[] = [
        {
          type: "arrow",
          isDeleted: false,
          id: "arrow1",
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          // lastCommittedPoint is not defined
        },
      ];

      const result = clearElementsForLocalStorage(elements as unknown as readonly ExcalidrawElement[]);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe("arrow");
      expect((result[0] as any).lastCommittedPoint).toBeNull(); // Should be set to null for linear elements
    });
  });
});