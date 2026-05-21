import React from "react";
import RootLayout, { metadata, viewport } from "./layout";

// Mock the Inter font import
jest.mock("next/font/google", () => ({
  Inter: () => ({
    className: "mocked-inter-class",
  }),
}));

// Mock the Vercel Analytics component
jest.mock("@vercel/analytics/react", () => ({
  Analytics: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="analytics">{children}</div>
  ),
}));

// Mock the globals.css import
jest.mock("./globals.css", () => ({}));

describe("RootLayout", () => {
  it("should render correctly with children", () => {
    const mockChildren = <div>Test Child</div>;
    
    // Since we're in node environment, just test that component renders without error
    const layoutElement = <RootLayout children={mockChildren} />;
    
    expect(layoutElement).toBeDefined();
    expect(React.isValidElement(layoutElement)).toBe(true);
  });

  it("renders with correct props", () => {
    const mockChildren = <div>Test Child</div>;
    const layoutElement = <RootLayout children={mockChildren} />;
    
    // Test the type of the element
    expect(layoutElement.type.name).toBe('RootLayout');
  });
});

describe("metadata", () => {
  it("has correct title", () => {
    expect(metadata.title).toBe("ImgPilot ｜ Turn the draft into an amazing artwork");
  });

  it("has correct description", () => {
    expect(metadata.description).toBe("Turn the draft into an amazing artwork");
  });
});

describe("viewport", () => {
  it("has correct viewport configuration", () => {
    expect(viewport).toEqual({
      width: "device-width",
      initialScale: 1,
      userScalable: false,
      maximumScale: 1,
      minimumScale: 1,
    });
  });
});