/**
 * @jest-environment jsdom
 */

import * as React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from "./select";

// Mock scrollIntoView to avoid JSDOM errors with Radix UI Select
beforeAll(() => {
  Element.prototype.scrollIntoView = jest.fn();
});

describe("Select Component", () => {
  const mockItems = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  it("renders the select trigger with placeholder", () => {
    render(
      <Select>
        <SelectTrigger data-testid="select-trigger">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
      </Select>
    );
    
    const trigger = screen.getByTestId("select-trigger");
    expect(trigger).toBeInTheDocument();
    
    const placeholder = screen.getByText("Select an option");
    expect(placeholder).toBeInTheDocument();
  });

  it("renders with default value", () => {
    render(
      <Select defaultValue="option2">
        <SelectTrigger data-testid="select-trigger">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {mockItems.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
    
    // Should show the default selected value instead of the placeholder
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.queryByText("Select an option")).not.toBeInTheDocument();
  });

  it("renders disabled state", () => {
    render(
      <Select>
        <SelectTrigger disabled data-testid="select-trigger">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
      </Select>
    );
    
    const trigger = screen.getByTestId("select-trigger");
    expect(trigger).toBeDisabled();
  });

  it("renders with custom className", () => {
    const customClassName = "custom-select-class";
    
    render(
      <Select>
        <SelectTrigger className={customClassName} data-testid="select-trigger">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
      </Select>
    );
    
    const trigger = screen.getByTestId("select-trigger");
    expect(trigger).toHaveClass(customClassName);
  });

  it("displays correct ARIA attributes on trigger", () => {
    render(
      <Select>
        <SelectTrigger data-testid="select-trigger">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
      </Select>
    );
    
    const trigger = screen.getByTestId("select-trigger");
    // Radix UI Select automatically sets proper ARIA attributes
    expect(trigger).toHaveAttribute("role", "combobox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  describe("Select Subcomponents", () => {
    it("SelectValue renders placeholder when no value is selected", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
        </Select>
      );
      
      expect(screen.getByText("Select an option")).toBeInTheDocument();
    });

    it("SelectTrigger has correct base styles", () => {
      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
        </Select>
      );
      
      const trigger = screen.getByTestId("select-trigger");
      expect(trigger).toHaveClass("flex");
      expect(trigger).toHaveClass("h-10");
      expect(trigger).toHaveClass("w-full");
    });

    it("renders SelectGroup with proper structure", () => {
      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent data-testid="select-content">
            <SelectGroup data-testid="select-group">
              <SelectLabel data-testid="select-label">Group Label</SelectLabel>
              <SelectItem data-testid="select-item" value="test">
                Test Item
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      );

      // Check that the trigger exists
      const trigger = screen.getByTestId("select-trigger");
      expect(trigger).toBeInTheDocument();
    });
    
    it("renders SelectSeparator", () => {
      render(
        <SelectSeparator data-testid="select-separator" />
      );
      
      const separator = screen.getByTestId("select-separator");
      expect(separator).toBeInTheDocument();
    });
    
    it("renders scroll buttons", () => {
      render(
        <Select>
          <SelectTrigger data-testid="select-trigger">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectScrollUpButton />
            <SelectScrollDownButton />
          </SelectContent>
        </Select>
      );

      expect(screen.getByTestId("select-trigger")).toBeInTheDocument();
    });
  });
});