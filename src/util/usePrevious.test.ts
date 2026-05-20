/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { usePrevious } from './usePrevious';

describe('usePrevious', () => {
  it('should return undefined on initial render', () => {
    const { result } = renderHook(() => usePrevious('initial'));
    expect(result.current).toBeUndefined();
  });

  it('should return the previous value after re-render with new value', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: 'first' },
    });
    
    // Initially returns undefined
    expect(result.current).toBeUndefined();

    // Update to second value and check that it returns the first value
    act(() => {
      rerender({ value: 'second' });
    });
    expect(result.current).toBe('first');

    // Update to third value and check that it returns the second value
    act(() => {
      rerender({ value: 'third' });
    });
    expect(result.current).toBe('second');
  });

  it('should not update ref when value is falsy due to the condition in useEffect', () => {
    const { result, rerender } = renderHook(
      ({ value }) => usePrevious<string | null | undefined>(value),
      {
        initialProps: { value: 'truthy-initial' as string | null | undefined }
      }
    );

    // Initially returns undefined (ref.current starts as undefined)
    expect(result.current).toBeUndefined();

    // Update to falsy value (null) - ref.current was 'truthy-initial', doesn't update because null is falsy,
    // so hook returns 'truthy-initial' (the previous value stored in ref.current)
    act(() => {
      rerender({ value: null as string | null | undefined });
    });
    expect(result.current).toBe('truthy-initial');

    // Update to another falsy value (undefined) - ref.current was 'truthy-initial', doesn't update because undefined is falsy,
    // so hook still returns 'truthy-initial'
    act(() => {
      rerender({ value: undefined as string | null | undefined });
    });
    expect(result.current).toBe('truthy-initial');

    // Update to a truthy value - ref.current was 'truthy-initial', updates to 'new-value',
    // so hook returns 'truthy-initial' (the previous value)
    act(() => {
      rerender({ value: 'new-value' as string | null | undefined });
    });
    expect(result.current).toBe('truthy-initial');
  });

  it('should maintain reference equality for complex objects', () => {
    const obj1 = { id: 1, name: 'test1' };
    const obj2 = { id: 2, name: 'test2' };
    const obj3 = { id: 3, name: 'test3' };

    const { result, rerender } = renderHook(({ value }) => usePrevious(value), {
      initialProps: { value: obj1 },
    });

    // Initially returns undefined
    expect(result.current).toBeUndefined();

    // Update to second object and check that it returns the first object
    act(() => {
      rerender({ value: obj2 });
    });
    expect(result.current).toBe(obj1);

    // Update to third object and check that it returns the second object
    act(() => {
      rerender({ value: obj3 });
    });
    expect(result.current).toBe(obj2);
  });

  it('should work with number type', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious<number>(value), {
      initialProps: { value: 1 },
    });

    act(() => {
      rerender({ value: 2 });
    });
    expect(result.current).toBe(1);
  });

  it('should work with boolean type', () => {
    const { result, rerender } = renderHook(({ value }) => usePrevious<boolean>(value), {
      initialProps: { value: true },
    });

    act(() => {
      rerender({ value: false });
    });
    expect(result.current).toBe(true);  // Previous truthy value was true

    // Update to truthy value again (true) - should store the previous true value
    act(() => {
      rerender({ value: true });
    });
    expect(result.current).toBe(true);  // Previous truthy value was still true
  });
});