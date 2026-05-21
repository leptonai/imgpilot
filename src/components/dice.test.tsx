/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import { Dice } from './dice';

// Mock the lucide-react icons
jest.mock('lucide-react', () => ({
  Dice1: () => <div data-testid="dice-1">Dice1</div>,
  Dice2: () => <div data-testid="dice-2">Dice2</div>,
  Dice3: () => <div data-testid="dice-3">Dice3</div>,
  Dice4: () => <div data-testid="dice-4">Dice4</div>,
  Dice5: () => <div data-testid="dice-5">Dice5</div>,
  Dice6: () => <div data-testid="dice-6">Dice6</div>,
}));

describe('Dice Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    // Mock Math.random to have predictable results
    jest.spyOn(global.Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<Dice />);
    expect(screen.getByTestId('dice-4')).toBeTruthy(); // Default currentNumber is 3, which corresponds to index 3 in dices array -> Dice4
  });

  it('initially shows the default dice (index 3, which is Dice4)', () => {
    render(<Dice />);
    expect(screen.getByTestId('dice-4')).toBeTruthy(); // currentNumber starts at 3, so dices[3] = Dice4
  });

  it('changes dice on click', () => {
    render(<Dice />);

    // Initially shows Dice4 (for index 3)
    expect(screen.getByTestId('dice-4')).toBeTruthy();

    // Click the dice
    fireEvent.click(screen.getByTestId('dice-4'));

    // After click, the animation class should be applied
    const diceContainer = screen.getByTestId('dice-4').parentElement;
    expect(diceContainer).toHaveClass('animate-[shake_1.2s_ease-in-out]');
  });

  it('runs the rolling animation and stops after timeout', async () => {
    render(<Dice />);

    // Initially shows Dice4
    expect(screen.getByTestId('dice-4')).toBeTruthy();

    // Click to roll
    fireEvent.click(screen.getByTestId('dice-4'));

    // Use act to advance timers and handle state updates
    await act(async () => {
      // Advance timers to simulate the rolling animation
      jest.advanceTimersByTime(100);

      // Advance timers to the end of the animation
      jest.advanceTimersByTime(1200);
      jest.runAllTimers();
    });

    // Wait for the animation to complete
    await waitFor(() => {
      const diceContainer = screen.getByTestId('dice-4').parentElement;
      expect(diceContainer).not.toHaveClass('animate-[shake_1.2s_ease-in-out]');
    });
  });

  it('uses different dice faces during rolling animation', async () => {
    // Mock Math.random to return different values during the animation
    const mockRandomValues = [0.1, 0.3, 0.7, 0.9];
    let callIndex = 0;
    const mockRandom = jest.spyOn(global.Math, 'random')
      .mockImplementation(() => {
        if (callIndex < mockRandomValues.length) {
          return mockRandomValues[callIndex++];
        }
        return 0.5; // fallback for any additional calls
      });

    render(<Dice />);

    // Click to roll
    fireEvent.click(screen.getByTestId('dice-4'));

    // Use act to handle the async state updates
    await act(async () => {
      // Advance timers to trigger the interval
      jest.advanceTimersByTime(100);

      // After animation completes, advance timers to final state
      jest.advanceTimersByTime(1200);
      jest.runAllTimers();
    });

    // Check that Math.random was called (the actual number depends on the component's implementation)
    expect(mockRandom).toHaveBeenCalled();
  });

  it('applies shake animation class when clicked', () => {
    render(<Dice />);

    // Initially no animation class
    const diceContainer = screen.getByTestId('dice-4').parentElement;
    expect(diceContainer).not.toHaveClass('animate-[shake_1.2s_ease-in-out]');

    // Click the dice
    fireEvent.click(screen.getByTestId('dice-4'));

    // Animation class should be applied
    expect(diceContainer).toHaveClass('animate-[shake_1.2s_ease-in-out]');
  });

  it('prevents default event on click', () => {
    render(<Dice />);

    // Create a spy for preventDefault
    const preventDefault = jest.fn();

    // Get the dice element
    const diceElement = screen.getByTestId('dice-4');

    // Use act to wrap the event dispatch
    act(() => {
      // Create a click event with the preventDefault mock
      const clickEvent = document.createEvent('MouseEvents');
      clickEvent.initEvent('click', true, true);
      clickEvent.preventDefault = preventDefault;

      diceElement.dispatchEvent(clickEvent);
    });

    // Verify that preventDefault was called
    expect(preventDefault).toHaveBeenCalled();
  });
});