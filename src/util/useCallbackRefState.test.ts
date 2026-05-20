/**
 * @jest-environment jsdom
 */
import { renderHook, act } from '@testing-library/react';
import { useCallbackRefState } from './useCallbackRefState';

describe('useCallbackRefState', () => {
  it('should initialize with null value', () => {
    const { result } = renderHook(() => useCallbackRefState<string>());
    
    expect(result.current[0]).toBeNull();
  });

  it('should update the ref value when callback is called', () => {
    const { result } = renderHook(() => useCallbackRefState<string>());
    
    act(() => {
      result.current[1]('test value');
    });
    
    expect(result.current[0]).toBe('test value');
  });

  it('should handle null values correctly', () => {
    const { result } = renderHook(() => useCallbackRefState<string>());
    
    // Set an initial value
    act(() => {
      result.current[1]('test value');
    });
    
    expect(result.current[0]).toBe('test value');
    
    // Set it back to null
    act(() => {
      result.current[1](null);
    });
    
    expect(result.current[0]).toBeNull();
  });

  it('should work with different types', () => {
    // Test with number
    const { result: numberResult } = renderHook(() => useCallbackRefState<number>());
    
    act(() => {
      numberResult.current[1](42);
    });
    
    expect(numberResult.current[0]).toBe(42);
    
    // Test with object
    const { result: objectResult } = renderHook(() => useCallbackRefState<{ id: string }>());
    
    const testObject = { id: 'test' };
    act(() => {
      objectResult.current[1](testObject);
    });
    
    expect(objectResult.current[0]).toEqual(testObject);
  });

  it('should return the same callback function reference across re-renders', () => {
    const { result, rerender } = renderHook(() => useCallbackRefState<string>());
    
    const firstCallback = result.current[1];
    
    // Rerender the hook
    rerender();
    
    const secondCallback = result.current[1];
    
    expect(firstCallback).toBe(secondCallback);
  });

  it('should handle undefined values correctly', () => {
    const { result } = renderHook(() => useCallbackRefState<undefined | string>());
    
    act(() => {
      result.current[1](undefined);
    });
    
    expect(result.current[0]).toBeUndefined();
  });

  it('should work with complex objects', () => {
    interface TestType {
      name: string;
      value: number;
      nested: {
        id: string;
      };
    }
    
    const { result } = renderHook(() => useCallbackRefState<TestType>());
    
    const complexObject: TestType = {
      name: 'test',
      value: 123,
      nested: {
        id: 'nested-id'
      }
    };
    
    act(() => {
      result.current[1](complexObject);
    });
    
    expect(result.current[0]).toEqual(complexObject);
  });

  it('should maintain type safety', () => {
    const { result } = renderHook(() => useCallbackRefState<string>());
    
    // This should compile correctly with proper typing
    const [value, callback] = result.current;
    
    expect(typeof value === 'string' || value === null).toBeTruthy();
    
    act(() => {
      callback('hello');
    });
    
    expect(result.current[0]).toBe('hello');
  });
});