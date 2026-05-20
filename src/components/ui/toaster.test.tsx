/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";

// Define mock components for the toast components used by Toaster
const MockToast: React.FC<any> = ({ children, ...props }) => {
  return <div data-testid="toast" {...props}>{children}</div>;
};

const MockToastClose: React.FC<any> = ({ children, ...props }) => {
  return <button data-testid="toast-close" {...props}>{children}</button>;
};

const MockToastDescription: React.FC<any> = ({ children, ...props }) => {
  return <div data-testid="toast-description" {...props}>{children}</div>;
};

const MockToastProvider: React.FC<any> = ({ children, ...props }) => {
  return <div data-testid="toast-provider" {...props}>{children}</div>;
};

const MockToastTitle: React.FC<any> = ({ children, ...props }) => {
  return <div data-testid="toast-title" {...props}>{children}</div>;
};

const MockToastViewport: React.FC<any> = ({ children, ...props }) => {
  return <div data-testid="toast-viewport" {...props}>{children}</div>;
};

// Mock the toast components before importing them
jest.mock("./toast", () => ({
  Toast: MockToast,
  ToastClose: MockToastClose,
  ToastDescription: MockToastDescription,
  ToastProvider: MockToastProvider,
  ToastTitle: MockToastTitle,
  ToastViewport: MockToastViewport,
}));

// Mock the useToast hook after the components are mocked
const mockUseToast = jest.fn();

jest.mock("./use-toast", () => ({
  useToast: () => mockUseToast(),
  // Include other exports as needed
  toast: jest.requireActual("./use-toast").toast,
}));

// Now import the Toaster component after the mocks are set up
import { Toaster } from "./toaster";

describe("Toaster", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    mockUseToast.mockReturnValue({
      toasts: [],
    });

    render(<Toaster />);
    // The Toaster should render a ToastProvider with ToastViewport
    expect(screen.getByTestId("toast-provider")).toBeInTheDocument();
    expect(screen.getByTestId("toast-viewport")).toBeInTheDocument();
  });

  it("renders toasts when they exist in the state", () => {
    const mockToasts = [
      {
        id: "1",
        title: "Test Toast",
        description: "This is a test toast",
      },
      {
        id: "2",
        title: "Another Toast",
        description: "This is another test toast",
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: mockToasts,
    });

    render(<Toaster />);

    // Check for multiple toast elements
    const toastElements = screen.getAllByTestId("toast");
    expect(toastElements).toHaveLength(2);

    // Check for the titles and descriptions
    const titleElements = screen.getAllByTestId("toast-title");
    expect(titleElements).toHaveLength(2);
    expect(titleElements[0]).toHaveTextContent("Test Toast");
    expect(titleElements[1]).toHaveTextContent("Another Toast");

    const descriptionElements = screen.getAllByTestId("toast-description");
    expect(descriptionElements).toHaveLength(2);
    expect(descriptionElements[0]).toHaveTextContent("This is a test toast");
    expect(descriptionElements[1]).toHaveTextContent("This is another test toast");
  });

  it("renders only title when description is not provided", () => {
    const mockToasts = [
      {
        id: "1",
        title: "Title Only Toast",
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: mockToasts,
    });

    render(<Toaster />);

    expect(screen.getByTestId("toast")).toBeInTheDocument();
    expect(screen.getByTestId("toast-title")).toHaveTextContent("Title Only Toast");
    // Check that there's no description element
    expect(screen.queryByTestId("toast-description")).not.toBeInTheDocument();
  });

  it("renders only description when title is not provided", () => {
    const mockToasts = [
      {
        id: "1",
        description: "Description Only Toast",
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: mockToasts,
    });

    render(<Toaster />);

    expect(screen.getByTestId("toast")).toBeInTheDocument();
    expect(screen.getByTestId("toast-description")).toHaveTextContent("Description Only Toast");
    // Check that there's no title element
    expect(screen.queryByTestId("toast-title")).not.toBeInTheDocument();
  });

  it("does not render title or description elements when neither is provided", () => {
    const mockToasts = [
      {
        id: "1",
        // No title or description
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: mockToasts,
    });

    render(<Toaster />);

    // Should still render the toast container, but without title and description elements
    expect(screen.getByTestId("toast")).toBeInTheDocument();
    expect(screen.queryByTestId("toast-title")).not.toBeInTheDocument();
    expect(screen.queryByTestId("toast-description")).not.toBeInTheDocument();
  });

  it("includes ToastClose component for each toast", () => {
    const mockToasts = [
      {
        id: "1",
        title: "Test Toast",
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: mockToasts,
    });

    render(<Toaster />);

    // Check if close button is rendered for each toast
    expect(screen.getByTestId("toast-close")).toBeInTheDocument();
  });

  it("renders action components when provided", () => {
    const mockAction = <button>Action Button</button>;
    const mockToasts = [
      {
        id: "1",
        title: "Test Toast",
        action: mockAction,
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: mockToasts,
    });

    render(<Toaster />);

    expect(screen.getByText("Action Button")).toBeInTheDocument();
  });

  it("renders multiple toasts with different properties", () => {
    const mockToasts = [
      {
        id: "1",
        title: "First Toast",
        description: "First description",
      },
      {
        id: "2",
        title: "Second Toast",
        description: "Second description",
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: mockToasts,
    });

    render(<Toaster />);

    const toastElements = screen.getAllByTestId("toast");
    expect(toastElements).toHaveLength(2);

    const titleElements = screen.getAllByTestId("toast-title");
    expect(titleElements).toHaveLength(2);
    expect(titleElements[0]).toHaveTextContent("First Toast");
    expect(titleElements[1]).toHaveTextContent("Second Toast");

    const descriptionElements = screen.getAllByTestId("toast-description");
    expect(descriptionElements).toHaveLength(2);
    expect(descriptionElements[0]).toHaveTextContent("First description");
    expect(descriptionElements[1]).toHaveTextContent("Second description");
  });

  it("renders ToastViewport component", () => {
    mockUseToast.mockReturnValue({
      toasts: [],
    });

    render(<Toaster />);

    // Check if the ToastViewport is rendered
    expect(screen.getByTestId("toast-viewport")).toBeInTheDocument();
  });

  it("renders toasts with spread props", () => {
    const mockToasts = [
      {
        id: "1",
        title: "Test Toast",
        variant: "destructive", // This is a prop that gets spread to Toast component
      },
    ];

    mockUseToast.mockReturnValue({
      toasts: mockToasts,
    });

    render(<Toaster />);

    expect(screen.getByTestId("toast")).toBeInTheDocument();
    expect(screen.getByTestId("toast-title")).toHaveTextContent("Test Toast");
  });
});