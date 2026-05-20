import { fetchImage } from "./fetch-image";
import { blobToBase64 } from "@/lib/utils";

// Mock the global fetch function
global.fetch = jest.fn();

// Mock the blobToBase64 utility function
jest.mock("@/lib/utils", () => ({
  blobToBase64: jest.fn(),
}));

describe("fetchImage", () => {
  const mockBlob = new Blob(["mock-image-data"], { type: "image/jpeg" });
  const mockBase64 = "data:image/jpeg;base64,mock-base64-data";

  beforeEach(() => {
    jest.clearAllMocks();
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      status: 200,
      blob: jest.fn().mockResolvedValue(mockBlob),
      ok: true,
      headers: new Headers(),
      redirected: false,
      statusText: "OK",
      type: "basic",
      url: "",
      clone: () => ({} as Response),
      body: null,
      bodyUsed: false,
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => new FormData(),
      json: async () => ({}),
      text: async () => "",
    } as Response);

    (blobToBase64 as jest.MockedFunction<typeof blobToBase64>).mockResolvedValue(
      mockBase64
    );
  });

  it("should fetch an image successfully", async () => {
    const inputImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA";
    const prompt = "A beautiful landscape";
    const size = 512;

    const result = await fetchImage(inputImage, prompt, size);

    expect(fetch).toHaveBeenCalledWith("/api/run", {
      headers: {
        accept: "image/jpeg",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        input_image: "iVBORw0KGgoAAAANSUhEUgAA", // Should strip data:image/png;base64, prefix
        prompt,
        guidance_scale: 8,
        lcm_steps: 50,
        seed: 2159232,
        steps: 4,
        strength: 0.7,
        width: size,
        height: size,
      }),
      method: "POST",
    });

    expect(blobToBase64).toHaveBeenCalledWith(mockBlob);
    expect(result).toBe(mockBase64);
  });

  it("should handle jpeg images correctly", async () => {
    const inputImage = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD";
    const prompt = "A portrait photo";
    const size = 256;

    await fetchImage(inputImage, prompt, size);

    expect(fetch).toHaveBeenCalledWith("/api/run", expect.objectContaining({
      body: JSON.stringify({
        input_image: "/9j/4AAQSkZJRgABAQEAYABgAAD", // Should strip data:image/jpeg;base64, prefix
        prompt,
        guidance_scale: 8,
        lcm_steps: 50,
        seed: 2159232,
        steps: 4,
        strength: 0.7,
        width: size,
        height: size,
      }),
    }));
  });

  it("should handle direct image data without data URL prefix", async () => {
    const inputImage = "raw-image-data";
    const prompt = "Abstract art";
    const size = 1024;

    await fetchImage(inputImage, prompt, size);

    expect(fetch).toHaveBeenCalledWith("/api/run", expect.objectContaining({
      body: JSON.stringify({
        input_image: "raw-image-data", // Should remain unchanged
        prompt,
        guidance_scale: 8,
        lcm_steps: 50,
        seed: 2159232,
        steps: 4,
        strength: 0.7,
        width: size,
        height: size,
      }),
    }));
  });

  it("should throw an error when response status is not 200", async () => {
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      status: 500,
      blob: jest.fn().mockResolvedValue(mockBlob),
      ok: false,
      headers: new Headers(),
      redirected: false,
      statusText: "Internal Server Error",
      type: "basic",
      url: "",
      clone: () => ({} as Response),
      body: null,
      bodyUsed: false,
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => new FormData(),
      json: async () => ({}),
      text: async () => "",
    } as Response);

    await expect(fetchImage("image-data", "prompt", 512)).rejects.toThrow(
      "Failed to fetch image"
    );
  });

  it("should handle AbortSignal correctly", async () => {
    const abortSignal = new AbortController().signal;
    const inputImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA";
    const prompt = "A test image";
    const size = 512;

    await fetchImage(inputImage, prompt, size, abortSignal);

    expect(fetch).toHaveBeenCalledWith("/api/run", expect.objectContaining({
      signal: abortSignal,
    }));
  });

  it("should maintain all fixed parameters in the request body", async () => {
    const inputImage = "data:image/png;base64,image-data";
    const prompt = "Test prompt";
    const size = 512;

    await fetchImage(inputImage, prompt, size);

    expect(fetch).toHaveBeenCalledWith("/api/run", expect.objectContaining({
      body: JSON.stringify({
        input_image: "image-data",
        prompt,
        guidance_scale: 8,
        lcm_steps: 50,
        seed: 2159232,
        steps: 4,
        strength: 0.7,
        width: size,
        height: size,
      }),
    }));
  });
});