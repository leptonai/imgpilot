/**
 * @jest-environment jsdom
 */

import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";

// Define the mock components outside the mock to avoid scope issues
const MockToastRoot: React.FC<any> = (props) => {
  const { children, ...rest } = props;
  return <div data-testid="toast-root" {...rest}>{children}</div>;
};
MockToastRoot.displayName = 'Toast';

const MockToastTitle: React.FC<any> = (props) => {
  const { children, ...rest } = props;
  return <div data-testid="toast-title" {...rest}>{children}</div>;
};
MockToastTitle.displayName = 'ToastTitle';

const MockToastDescription: React.FC<any> = (props) => {
  const { children, ...rest } = props;
  return <div data-testid="toast-description" {...rest}>{children}</div>;
};
MockToastDescription.displayName = 'ToastDescription';

const MockToastClose: React.FC<any> = (props) => {
  const { children, ...rest } = props;
  return <button data-testid="toast-close" {...rest}>{children}</button>;
};
MockToastClose.displayName = 'ToastClose';

const MockToastAction: React.FC<any> = (props) => {
  const { children, altText, ...rest } = props;
  return <button data-testid="toast-action" {...rest}>{children}</button>;
};
MockToastAction.displayName = 'ToastAction';

const MockToastProvider: React.FC<any> = (props) => {
  const { children, ...rest } = props;
  return <div data-testid="toast-provider" {...rest}>{children}</div>;
};
MockToastProvider.displayName = 'ToastProvider';

const MockToastViewport: React.FC<any> = (props) => {
  const { children, ...rest } = props;
  return <div data-testid="toast-viewport" {...rest}>{children}</div>;
};
MockToastViewport.displayName = 'ToastViewport';

// Mock the radix-ui toast components
jest.mock("@radix-ui/react-toast", () => ({
  Root: MockToastRoot,
  Title: MockToastTitle,
  Description: MockToastDescription,
  Close: MockToastClose,
  Action: MockToastAction,
  Provider: MockToastProvider,
  Viewport: MockToastViewport,
}));

// Import after the mock is set up
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastDescription, ToastClose, ToastAction } from "./toast";

describe("Toast Components", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("ToastProvider", () => {
    it("renders without crashing", () => {
      render(
        <ToastProvider>
          <div>Test</div>
        </ToastProvider>
      );

      expect(screen.getByTestId("toast-provider")).toBeInTheDocument();
    });
  });

  describe("ToastViewport", () => {
    it("renders without crashing", () => {
      render(<ToastViewport />);
      expect(screen.getByTestId("toast-viewport")).toBeInTheDocument();
    });

    it("renders with custom className", () => {
      const customClassName = "my-custom-class";
      render(<ToastViewport className={customClassName} />);
      expect(screen.getByTestId("toast-viewport")).toHaveClass(customClassName);
    });
  });

  describe("Toast", () => {
    it("renders without crashing", () => {
      render(<Toast />);
      expect(screen.getByTestId("toast-root")).toBeInTheDocument();
    });

    it("renders with default variant when no variant is specified", () => {
      render(<Toast />);
      const toastElement = screen.getByTestId("toast-root");
      expect(toastElement).toHaveClass("border");
      expect(toastElement).toHaveClass("bg-white");
    });

    it("renders with destructive variant when specified", () => {
      render(<Toast variant="destructive" />);
      const toastElement = screen.getByTestId("toast-root");
      expect(toastElement).toHaveClass("destructive");
      expect(toastElement).toHaveClass("border-red-500");
    });

    it("renders with custom className", () => {
      const customClassName = "my-custom-toast";
      render(<Toast className={customClassName} />);
      expect(screen.getByTestId("toast-root")).toHaveClass(customClassName);
    });
  });

  describe("ToastTitle", () => {
    it("renders without crashing", () => {
      render(<ToastTitle />);
      expect(screen.getByTestId("toast-title")).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      const titleText = "Test Title";
      render(<ToastTitle>{titleText}</ToastTitle>);
      expect(screen.getByTestId("toast-title")).toHaveTextContent(titleText);
    });

    it("renders with custom className", () => {
      const customClassName = "my-custom-title";
      render(<ToastTitle className={customClassName} />);
      expect(screen.getByTestId("toast-title")).toHaveClass(customClassName);
    });
  });

  describe("ToastDescription", () => {
    it("renders without crashing", () => {
      render(<ToastDescription />);
      expect(screen.getByTestId("toast-description")).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      const descriptionText = "Test Description";
      render(<ToastDescription>{descriptionText}</ToastDescription>);
      expect(screen.getByTestId("toast-description")).toHaveTextContent(descriptionText);
    });

    it("renders with custom className", () => {
      const customClassName = "my-custom-description";
      render(<ToastDescription className={customClassName} />);
      expect(screen.getByTestId("toast-description")).toHaveClass(customClassName);
    });
  });

  describe("ToastClose", () => {
    it("renders without crashing", () => {
      render(<ToastClose />);
      expect(screen.getByTestId("toast-close")).toBeInTheDocument();
    });

    it("triggers onClick when clicked", () => {
      const mockOnClick = jest.fn();
      render(<ToastClose onClick={mockOnClick} />);
      fireEvent.click(screen.getByTestId("toast-close"));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("renders with custom className", () => {
      const customClassName = "my-custom-close";
      render(<ToastClose className={customClassName} />);
      expect(screen.getByTestId("toast-close")).toHaveClass(customClassName);
    });
  });

  describe("ToastAction", () => {
    it("renders without crashing", () => {
      render(<ToastAction altText="Action" />);
      expect(screen.getByTestId("toast-action")).toBeInTheDocument();
    });

    it("renders children correctly", () => {
      const actionText = "Test Action";
      render(<ToastAction altText="Action">{actionText}</ToastAction>);
      expect(screen.getByTestId("toast-action")).toHaveTextContent(actionText);
    });

    it("triggers onClick when clicked", () => {
      const mockOnClick = jest.fn();
      render(<ToastAction altText="Action" onClick={mockOnClick} />);
      fireEvent.click(screen.getByTestId("toast-action"));
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it("renders with custom className", () => {
      const customClassName = "my-custom-action";
      render(<ToastAction altText="Action" className={customClassName} />);
      expect(screen.getByTestId("toast-action")).toHaveClass(customClassName);
    });
  });

  describe("Integration", () => {
    it("renders a complete toast with title, description, and actions", () => {
      render(
        <ToastProvider>
          <ToastViewport>
            <Toast>
              <ToastTitle>Toast Title</ToastTitle>
              <ToastDescription>Toast Description</ToastDescription>
              <ToastAction altText="Action">Action</ToastAction>
              <ToastClose />
            </Toast>
          </ToastViewport>
        </ToastProvider>
      );

      expect(screen.getByTestId("toast-provider")).toBeInTheDocument();
      expect(screen.getByTestId("toast-viewport")).toBeInTheDocument();
      expect(screen.getByTestId("toast-root")).toBeInTheDocument();
      expect(screen.getByTestId("toast-title")).toBeInTheDocument();
      expect(screen.getByTestId("toast-description")).toBeInTheDocument();
      expect(screen.getByTestId("toast-action")).toBeInTheDocument();
      expect(screen.getByTestId("toast-close")).toBeInTheDocument();
    });
  });
});