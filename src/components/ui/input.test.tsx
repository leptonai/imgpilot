/**
 * @jest-environment jsdom
 */

import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { Input, InputProps } from "./input";

describe("Input", () => {
  const mockRef = React.createRef<HTMLInputElement>();

  it("renders without crashing", () => {
    render(<Input />);
    const inputElement = screen.getByRole("textbox");
    expect(inputElement).toBeInTheDocument();
  });

  it("has the correct default attributes", () => {
    render(<Input />);
    const inputElement = screen.getByRole("textbox");

    expect(inputElement).toHaveClass("flex");
    expect(inputElement).toHaveClass("h-10");
    expect(inputElement).toHaveClass("w-full");
    expect(inputElement).toHaveClass("rounded-md");
    // Default type is undefined when not specified, which means it defaults to "text" in browsers
    expect(inputElement).not.toHaveAttribute("type"); // React doesn't render type attribute if not specified
  });

  it("renders with custom className", () => {
    const customClassName = "custom-input-class";
    render(<Input className={customClassName} />);
    const inputElement = screen.getByRole("textbox");
    
    expect(inputElement).toHaveClass(customClassName);
  });

  it("accepts and applies the type prop", () => {
    render(<Input type="email" />);
    const inputElement = screen.getByRole("textbox");
    
    expect(inputElement).toHaveAttribute("type", "email");
  });

  it("forwards ref properly", () => {
    render(<Input ref={mockRef} />);
    const inputElement = screen.getByRole("textbox");
    
    expect(inputElement).toBe(mockRef.current);
  });

  it("handles value and onChange props", () => {
    const mockOnChange = jest.fn();
    const testValue = "Test input value";
    
    render(
      <Input 
        value={testValue} 
        onChange={mockOnChange} 
      />
    );
    
    const inputElement = screen.getByDisplayValue(testValue);
    expect(inputElement).toBeInTheDocument();
    
    // Simulate user typing
    fireEvent.change(inputElement, { target: { value: "New value" } });
    expect(mockOnChange).toHaveBeenCalledTimes(1);
  });

  it("handles placeholder prop", () => {
    const placeholderText = "Enter your email";
    render(<Input placeholder={placeholderText} />);
    const inputElement = screen.getByPlaceholderText(placeholderText);
    
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute("placeholder", placeholderText);
  });

  it("respects disabled state", () => {
    render(<Input disabled={true} />);
    const inputElement = screen.getByRole("textbox");
    
    expect(inputElement).toBeDisabled();
    expect(inputElement).toHaveClass("disabled:cursor-not-allowed");
    expect(inputElement).toHaveClass("disabled:opacity-50");
  });

  it("handles other HTML input attributes", () => {
    const testName = "user-name";
    const testId = "test-input";
    
    render(
      <Input 
        name={testName} 
        id={testId} 
        autoComplete="off" 
        data-testid="custom-testid"
      />
    );
    
    const inputElement = screen.getByRole("textbox");
    expect(inputElement).toHaveAttribute("name", testName);
    expect(inputElement).toHaveAttribute("id", testId);
    expect(inputElement).toHaveAttribute("autoComplete", "off");
    expect(inputElement).toHaveAttribute("data-testid", "custom-testid");
  });

  it("applies proper dark mode classes", () => {
    render(<Input />);
    const inputElement = screen.getByRole("textbox");
    
    // Dark mode classes should be present in the default styling
    expect(inputElement).toHaveClass("dark:border-zinc-800");
    expect(inputElement).toHaveClass("dark:bg-zinc-950");
    expect(inputElement).toHaveClass("dark:ring-offset-zinc-950");
    expect(inputElement).toHaveClass("dark:placeholder:text-zinc-400");
    expect(inputElement).toHaveClass("dark:focus-visible:ring-zinc-300");
  });

  it("maintains focus-visible classes when focused", () => {
    render(<Input />);
    const inputElement = screen.getByRole("textbox");
    
    inputElement.focus();
    expect(inputElement).toHaveFocus();
    expect(inputElement).toHaveClass("focus-visible:outline-none");
    expect(inputElement).toHaveClass("focus-visible:ring-2");
    expect(inputElement).toHaveClass("focus-visible:ring-zinc-950");
    expect(inputElement).toHaveClass("focus-visible:ring-offset-2");
  });

  it("handles file input type properly", () => {
    // Render the file input with a test id to ensure we can query it
    const { container } = render(<Input type="file" />);

    // Get the actual input element by type
    const inputElement = container.querySelector('input');
    expect(inputElement).toBeInTheDocument();
    expect(inputElement).toHaveAttribute("type", "file");

    // Should have file-specific classes
    expect(inputElement).toHaveClass("file:border-0");
    expect(inputElement).toHaveClass("file:bg-transparent");
    expect(inputElement).toHaveClass("file:text-sm");
    expect(inputElement).toHaveClass("file:font-medium");
  });

  it("properly spreads additional props", () => {
    const mockOnBlur = jest.fn();
    render(<Input onBlur={mockOnBlur} data-custom-attr="test-value" />);
    
    const inputElement = screen.getByRole("textbox");
    expect(inputElement).toHaveAttribute("data-custom-attr", "test-value");
    
    fireEvent.blur(inputElement);
    expect(mockOnBlur).toHaveBeenCalledTimes(1);
  });
});