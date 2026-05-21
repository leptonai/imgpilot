import { getBase64, zoomToFit } from "./excalidraw";

// Mock the Excalidraw API and related modules
jest.mock("@excalidraw/excalidraw", () => ({
  exportToCanvas: jest.fn(),
}));

// Mock document and canvas elements for testing
const mockCanvasElement = {
  width: 100,
  height: 100,
  toDataURL: jest.fn(() => "data:image/jpeg;base64,test"),
};

const mockImageContext = {
  fillStyle: "",
  fillRect: jest.fn(),
  drawImage: jest.fn(),
};

// Create a proper canvas mock with toDataURL method
const mockCanvas = {
  height: 0,
  width: 0,
  getContext: jest.fn(() => mockImageContext),
  toDataURL: jest.fn(() => "data:image/jpeg;base64,test"),
};

// Mock document and canvas globally for node environment
Object.defineProperty(global, 'document', {
  value: {
    createElement: jest.fn((tag: string) => {
      if (tag === "canvas") {
        // Create a new instance each time to avoid shared state
        const canvas = { ...mockCanvas };
        canvas.getContext = jest.fn(() => mockImageContext);
        canvas.toDataURL = jest.fn(() => "data:image/jpeg;base64,test");
        return canvas as any;
      }
      return { tagName: tag.toUpperCase() } as any;
    }),
  },
  writable: true,
});

describe("excalidraw utility functions", () => {
  const mockElements = [
    { id: "1", type: "rectangle", x: 0, y: 0, width: 100, height: 100 },
  ];

  let mockApi: any;

  beforeEach(() => {
    mockApi = {
      getFiles: jest.fn(() => ({})),
      getSceneElements: jest.fn(),
      scrollToContent: jest.fn(),
    };

    // Reset mocks
    jest.clearAllMocks();
    (global.document.createElement as jest.MockedFunction<any>).mockImplementation((tag: string) => {
      if (tag === "canvas") {
        // Create a new instance each time to avoid shared state
        const canvas = { ...mockCanvas };
        canvas.getContext = jest.fn(() => mockImageContext);
        canvas.toDataURL = jest.fn(() => "data:image/jpeg;base64,test");
        return canvas as any;
      }
      // Create a minimal mock element for other tags
      return { tagName: tag.toUpperCase() } as any;
    });
  });

  describe("getBase64", () => {
    it("should generate base64 string from excalidraw elements", async () => {
      // Mock the canvas element returned by exportToCanvas
      const { exportToCanvas } = require("@excalidraw/excalidraw");
      (exportToCanvas as jest.MockedFunction<any>).mockResolvedValue(mockCanvasElement);

      const result = await getBase64(mockElements as any, mockApi, 200);

      expect(exportToCanvas).toHaveBeenCalledWith({
        elements: mockElements,
        files: {},
        getDimensions: expect.any(Function),
        exportPadding: 12,
      });

      expect(result).toBe("data:image/jpeg;base64,test");
    });

    it("should handle width > height correctly in getDimensions", async () => {
      const { exportToCanvas } = require("@excalidraw/excalidraw");
      (exportToCanvas as jest.MockedFunction<any>).mockResolvedValue({
        ...mockCanvasElement,
        width: 200,
        height: 100,
      });

      const result = await getBase64(mockElements as any, mockApi, 400);

      expect(exportToCanvas).toHaveBeenCalledWith({
        elements: mockElements,
        files: {},
        getDimensions: expect.any(Function),
        exportPadding: 12,
      });
      expect(result).toBe("data:image/jpeg;base64,test");
    });

    it("should handle height > width correctly in getDimensions", async () => {
      const { exportToCanvas } = require("@excalidraw/excalidraw");
      (exportToCanvas as jest.MockedFunction<any>).mockResolvedValue({
        ...mockCanvasElement,
        width: 100,
        height: 200,
      });

      const result = await getBase64(mockElements as any, mockApi, 400);

      expect(result).toBe("data:image/jpeg;base64,test");
    });

    it("should center the canvas image correctly", async () => {
      const { exportToCanvas } = require("@excalidraw/excalidraw");
      (exportToCanvas as jest.MockedFunction<any>).mockResolvedValue({
        ...mockCanvasElement,
        width: 150,
        height: 100,
      });

      await getBase64(mockElements as any, mockApi, 300);

      expect(mockImageContext.drawImage).toHaveBeenCalledWith(
        expect.any(Object),
        75, // (300 - 150) / 2
        100 // (300 - 100) / 2
      );
    });
  });

  describe("zoomToFit", () => {
    it("should call scrollToContent with elements when elements exist", () => {
      mockApi.getSceneElements.mockReturnValue(mockElements);

      zoomToFit(mockApi);

      expect(mockApi.getSceneElements).toHaveBeenCalled();
      expect(mockApi.scrollToContent).toHaveBeenCalledWith(mockElements, {
        fitToViewport: true,
        viewportZoomFactor: 0.8,
      });
    });

    it("should not call scrollToContent when no elements exist", () => {
      mockApi.getSceneElements.mockReturnValue([]);

      zoomToFit(mockApi);

      expect(mockApi.getSceneElements).toHaveBeenCalled();
      expect(mockApi.scrollToContent).not.toHaveBeenCalled();
    });

    it("should handle empty elements array", () => {
      mockApi.getSceneElements.mockReturnValue([]);

      zoomToFit(mockApi);

      expect(mockApi.getSceneElements).toHaveBeenCalled();
      expect(mockApi.scrollToContent).not.toHaveBeenCalled();
    });
  });
});