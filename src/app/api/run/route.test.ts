// Define global mocks that Jest can access
let mockLimit: jest.Mock;
let mockSlidingWindow: jest.Mock;

// Setup mocks at the top level before any imports
jest.mock("@vercel/kv", () => ({
  createClient: jest.fn(() => ({
    get: jest.fn(),
    set: jest.fn(),
  })),
}));

jest.mock("@upstash/ratelimit", () => {
  mockLimit = jest.fn();
  mockSlidingWindow = jest.fn(() => "slidingWindow");
  
  const MockRatelimitClass = jest.fn().mockImplementation(() => ({
    limit: mockLimit,
  }));

  return {
    Ratelimit: Object.assign(MockRatelimitClass, {
      slidingWindow: mockSlidingWindow,
    }),
  };
});

// Mock the global fetch
global.fetch = jest.fn();

// Mock the Headers class to track headers properly
class MockHeaders {
  private headers: { [key: string]: string } = {};

  constructor(init?: [string, string][] | { [key: string]: string } | MockHeaders) {
    if (init) {
      if (init instanceof MockHeaders) {
        // Copy from another MockHeaders instance
        for (const [key, value] of init.entries()) {
          this.set(key, value);
        }
      } else if (Array.isArray(init)) {
        // Handle array format [ [key, value], ... ]
        init.forEach(([key, value]) => {
          this.set(key, value);
        });
      } else {
        // Handle object format { key: value, ... }
        Object.keys(init).forEach(key => {
          this.set(key, (init as { [key: string]: string })[key]);
        });
      }
    }
  }

  set(name: string, value: string) {
    this.headers[name.toLowerCase()] = value;
  }

  get(name: string) {
    return this.headers[name.toLowerCase()];
  }

  // Make it iterable and return entries
  entries() {
    return Object.entries(this.headers);
  }

  // Make it iterable for for...of loops
  [Symbol.iterator]() {
    return Object.entries(this.headers)[Symbol.iterator]();
  }

  // Method to get all headers as a simple object for testing
  toJSON() {
    return { ...this.headers };
  }

  // Implement forEach for compatibility
  forEach(callback: (value: string, key: string, parent: MockHeaders) => void) {
    Object.entries(this.headers).forEach(([key, value]) => {
      callback(value, key, this);
    });
  }
}

// Define Headers globally for the module
Object.defineProperty(global, 'Headers', {
  value: MockHeaders,
  writable: true,
  configurable: true,
});

import { NextRequest } from "next/server";

describe("POST /api/run", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let POST: any;
  let mockRatelimit: jest.Mock;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };

    // Set default environment variables
    process.env.API_URL = "http://test-api:8080";
    process.env.API_TOKEN = "test-api-token";
    process.env.KV_REST_API_URL = "http://test-kv";
    process.env.KV_REST_API_TOKEN = "test-kv-token";

    // Clear the module cache to ensure fresh import with new environment
    jest.resetModules();

    // Import the POST function after environment setup
    const routeModule = require("./route");
    POST = routeModule.POST;

    // Get the actual mocks after resetting modules
    const { Ratelimit } = require("@upstash/ratelimit");
    mockRatelimit = Ratelimit as jest.Mock;

    // Clear any previous mock calls
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
  });

  it("should return 429 when rate limited", async () => {
    // Mock rate limit response - no remaining requests
    mockLimit.mockResolvedValue({ remaining: 0 });

    const mockReq = {
      ip: "192.168.1.1",
      headers: {
        get: jest.fn(),
      },
      body: JSON.stringify({ test: "data" }),
      method: "POST",
    } as unknown as NextRequest;

    const response = await POST(mockReq);
    
    expect(response.status).toBe(429);
    expect(await response.text()).toBe("Too many requests");
    expect(mockLimit).toHaveBeenCalledWith("192.168.1.1");
  });

  it("should make a fetch request with correct parameters when not rate limited", async () => {
    // Mock rate limit response - has remaining requests
    mockLimit.mockResolvedValue({ remaining: 50 });

    // Mock fetch response
    const mockFetchResponse = {
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue("success"),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

    const mockReq = {
      ip: "192.168.1.1",
      headers: {
        get: jest.fn(() => "application/json"),
      },
      body: JSON.stringify({ test: "data" }),
      method: "POST",
    } as unknown as NextRequest;

    await POST(mockReq);

    // Check that fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      "http://test-api:8080/run",
      expect.objectContaining({
        body: JSON.stringify({ test: "data" }),
        method: "POST",
        duplex: "half",
      })
    );

    // Get the actual call to verify headers separately
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const options = callArgs[1];

    // Verify headers exist and have correct values
    expect(options.headers).toBeDefined();
    expect(options.headers.get).toBeDefined(); // Check if it's a Headers instance
    if (typeof options.headers.get === 'function') {
      // It's a Headers instance
      expect(options.headers.get("accept")).toBe("image/jpeg");
      expect(options.headers.get("authorization")).toBe("Bearer test-api-token");
      expect(options.headers.get("content-type")).toBe("application/json");
    } else {
      // It's a plain object
      expect(options.headers["accept"]).toBe("image/jpeg");
      expect(options.headers["authorization"]).toBe("Bearer test-api-token");
      expect(options.headers["content-type"]).toBe("application/json");
    }
  });

  it("should use default API URL and token when environment variables are not set", async () => {
    // Remove environment variables to trigger defaults
    delete process.env.API_URL;
    delete process.env.API_TOKEN;
    process.env.KV_REST_API_URL = "http://test-kv";
    process.env.KV_REST_API_TOKEN = "test-kv-token";

    // Re-import the module to re-evaluate with new environment
    jest.resetModules();
    const routeModule2 = require("./route");
    const { Ratelimit: NewRatelimit } = require("@upstash/ratelimit");

    const newPost = routeModule2.POST;
    const newMockRatelimit = NewRatelimit as jest.Mock;

    // Mock rate limit response - has remaining requests
    mockLimit.mockResolvedValue({ remaining: 50 });

    // Mock fetch response
    const mockFetchResponse = {
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue("success"),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

    const mockReq = {
      ip: "192.168.1.1",
      headers: {
        get: jest.fn(() => "application/json"),
      },
      body: JSON.stringify({ test: "data" }),
      method: "POST",
    } as unknown as NextRequest;

    await newPost(mockReq);

    // Check that fetch was called with the correct URL
    expect(global.fetch).toHaveBeenCalledWith(
      "http://127.0.0.1:8080/run",
      expect.anything()
    );

    // Get the actual call to verify headers
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const options = callArgs[1];

    // Verify authorization header exists and has correct value
    if (typeof options.headers.get === 'function') {
      // It's a Headers instance
      expect(options.headers.get("authorization")).toBe("Bearer "); // Empty token because env var was deleted
    } else {
      // It's a plain object
      expect(options.headers["authorization"]).toBe("Bearer "); // Empty token because env var was deleted
    }
  });

  it("should handle requests without KV (no rate limiting)", async () => {
    // Don't set KV environment variables to simulate no rate limiting
    delete process.env.KV_REST_API_URL;
    delete process.env.KV_REST_API_TOKEN;
    process.env.API_URL = "http://test-api:8080";
    process.env.API_TOKEN = "test-api-token";

    // Re-import the module to re-evaluate with new environment
    jest.resetModules();
    const routeModule2 = require("./route");
    const { Ratelimit: NewRatelimit } = require("@upstash/ratelimit");
    
    const newPost = routeModule2.POST;
    const newMockRatelimit = NewRatelimit as jest.Mock;

    // Mock fetch response
    const mockFetchResponse = {
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue("success"),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

    const mockReq = {
      ip: "192.168.1.1",
      headers: {
        get: jest.fn(() => "application/json"),
      },
      body: JSON.stringify({ test: "data" }),
      method: "POST",
    } as unknown as NextRequest;

    await newPost(mockReq);

    // Should not call rate limiting functions since ratelimit will be null (no KV)
    // The Ratelimit constructor should not be called when KV is null
    expect(newMockRatelimit).not.toHaveBeenCalled();
  });

  it("should use fallback IP when req.ip is not available", async () => {
    // Re-import to make sure we're using the right environment
    jest.resetModules();
    const routeModule2 = require("./route");
    const { Ratelimit: NewRatelimit } = require("@upstash/ratelimit");

    const newPost = routeModule2.POST;
    const newMockRatelimit = NewRatelimit as jest.Mock;

    // Mock rate limit response - has remaining requests
    mockLimit.mockResolvedValue({ remaining: 50 });

    // Mock fetch response
    const mockFetchResponse = {
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue("success"),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

    // Mock request without IP
    const mockReq = {
      ip: undefined,
      headers: {
        get: jest.fn(() => "application/json"),
      },
      body: JSON.stringify({ test: "data" }),
      method: "POST",
    } as unknown as NextRequest;

    await newPost(mockReq);

    // Should use fallback IP ::1
    expect(mockLimit).toHaveBeenCalledWith("::1");
  });

  it("should forward the correct content-type header from the original request", async () => {
    // Mock rate limit response - has remaining requests
    mockLimit.mockResolvedValue({ remaining: 50 });

    // Mock fetch response
    const mockFetchResponse = {
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue("success"),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

    const mockReq = {
      ip: "192.168.1.1",
      headers: {
        get: jest.fn(() => "application/xml"),
      },
      body: "<xml>test</xml>",
      method: "POST",
    } as unknown as NextRequest;

    await POST(mockReq);

    // Get the actual call to verify content-type header
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const options = callArgs[1];

    // Verify content-type header exists and has correct value
    if (typeof options.headers.get === 'function') {
      // It's a Headers instance
      expect(options.headers.get("content-type")).toBe("application/xml");
    } else {
      // It's a plain object
      expect(options.headers["content-type"]).toBe("application/xml");
    }
  });

  it("should set default content-type to application/json when request header is null", async () => {
    // Mock rate limit response - has remaining requests
    mockLimit.mockResolvedValue({ remaining: 50 });

    // Mock fetch response
    const mockFetchResponse = {
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue("success"),
    };
    (global.fetch as jest.Mock).mockResolvedValue(mockFetchResponse);

    // Mock request header get to return null
    const mockReq = {
      ip: "192.168.1.1",
      headers: {
        get: jest.fn(() => null),
      },
      body: JSON.stringify({ test: "data" }),
      method: "POST",
    } as unknown as NextRequest;

    await POST(mockReq);

    // Get the actual call to verify content-type header
    const callArgs = (global.fetch as jest.Mock).mock.calls[0];
    const options = callArgs[1];

    // Verify content-type header exists and has correct value
    if (typeof options.headers.get === 'function') {
      // It's a Headers instance
      expect(options.headers.get("content-type")).toBe("application/json");
    } else {
      // It's a plain object
      expect(options.headers["content-type"]).toBe("application/json");
    }
  });

  it("should handle fetch errors gracefully", async () => {
    // Mock rate limit response
    mockLimit.mockResolvedValue({ remaining: 50 });

    // Mock fetch to throw an error
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const mockReq = {
      ip: "192.168.1.1",
      headers: {
        get: jest.fn(() => "application/json"),
      },
      body: JSON.stringify({ test: "data" }),
      method: "POST",
    } as unknown as NextRequest;

    // We expect the function to re-throw or handle the error
    // Since the original code doesn't handle fetch errors, the error should propagate
    await expect(POST(mockReq)).rejects.toThrow("Network error");
  });
});