/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { reducer, useToast, toast } from './use-toast';


describe('use-toast', () => {
  // Reset the global state between tests
  beforeEach(() => {
    // We cannot easily reset the global state of the toast system
    // The toast module maintains global state, so we'll focus on testing the pure functions
  });

  describe('reducer', () => {
    it('should handle ADD_TOAST action', () => {
      const initialState = { toasts: [] };
      const newToast = {
        id: '1',
        title: 'Test Toast',
        description: 'Test Description',
        open: true,
      };

      // Cast to any to avoid typing conflicts
      const action: any = {
        type: 'ADD_TOAST',
        toast: newToast,
      };

      const newState = reducer(initialState, action);

      expect(newState).toEqual({
        toasts: [newToast],
      });
    });

    it('should limit the number of toasts to TOAST_LIMIT', () => {
      const initialState = { toasts: [] };
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };
      const toast3 = { id: '3', title: 'Toast 3', open: true };

      // First ADD_TOAST action
      const state1 = reducer(initialState, {
        type: 'ADD_TOAST',
        toast: toast1,
      } as any);

      // Second ADD_TOAST action (should be limited to 1 toast)
      const state2 = reducer(state1, {
        type: 'ADD_TOAST',
        toast: toast2,
      } as any);

      // Third ADD_TOAST action (should still be limited to 1 toast)
      const state3 = reducer(state2, {
        type: 'ADD_TOAST',
        toast: toast3,
      } as any);

      expect(state3.toasts).toHaveLength(1);
      expect(state3.toasts[0].id).toBe('3'); // Most recent toast should be kept
    });

    it('should handle UPDATE_TOAST action', () => {
      const toast1 = { id: '1', title: 'Original Title', open: true };
      const toast2 = { id: '2', title: 'Another Toast', open: true };
      const initialState = { toasts: [toast1, toast2] };

      const action: any = {
        type: 'UPDATE_TOAST',
        toast: { id: '1', title: 'Updated Title' },
      };

      const newState = reducer(initialState, action);

      expect(newState.toasts).toHaveLength(2);
      expect(newState.toasts[0].title).toBe('Updated Title');
      expect(newState.toasts[1].title).toBe('Another Toast');
    });

    it('should handle DISMISS_TOAST action for a specific toast', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };
      const initialState = { toasts: [toast1, toast2] };

      const action: any = {
        type: 'DISMISS_TOAST',
        toastId: '1',
      };

      const newState = reducer(initialState, action);

      expect(newState.toasts).toHaveLength(2);
      expect(newState.toasts[0].open).toBe(false);
      expect(newState.toasts[1].open).toBe(true);
    });

    it('should handle DISMISS_TOAST action for all toasts when no ID provided', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };
      const initialState = { toasts: [toast1, toast2] };

      const action: any = {
        type: 'DISMISS_TOAST',
        toastId: undefined,
      };

      const newState = reducer(initialState, action);

      expect(newState.toasts).toHaveLength(2);
      expect(newState.toasts[0].open).toBe(false);
      expect(newState.toasts[1].open).toBe(false);
    });

    it('should handle REMOVE_TOAST action for a specific toast', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };
      const initialState = { toasts: [toast1, toast2] };

      const action: any = {
        type: 'REMOVE_TOAST',
        toastId: '1',
      };

      const newState = reducer(initialState, action);

      expect(newState.toasts).toHaveLength(1);
      expect(newState.toasts[0].id).toBe('2');
    });

    it('should handle REMOVE_TOAST action for all toasts when no ID provided', () => {
      const toast1 = { id: '1', title: 'Toast 1', open: true };
      const toast2 = { id: '2', title: 'Toast 2', open: true };
      const initialState = { toasts: [toast1, toast2] };

      const action: any = {
        type: 'REMOVE_TOAST',
        toastId: undefined,
      };

      const newState = reducer(initialState, action);

      expect(newState.toasts).toHaveLength(0);
    });
  });

  describe('toast function', () => {
    it('should create a toast with unique ID', () => {
      // Since we can't easily mock the internal dispatch, let's test the return value
      const toastResult = toast({ title: 'Test Toast' });

      expect(toastResult.id).toBeDefined();
      expect(typeof toastResult.id).toBe('string');
      expect(toastResult.dismiss).toBeDefined();
      expect(toastResult.update).toBeDefined();
    });

    it('should have dismiss and update functions', () => {
      const toastResult = toast({ title: 'Test Toast' });

      expect(typeof toastResult.dismiss).toBe('function');
      expect(typeof toastResult.update).toBe('function');
    });
  });

  describe('useToast hook', () => {
    it('should return toasts, toast function, and dismiss function', () => {
      const { result } = renderHook(() => useToast());

      expect(result.current.toasts).toBeDefined();
      expect(Array.isArray(result.current.toasts)).toBe(true);
      expect(typeof result.current.toast).toBe('function');
      expect(typeof result.current.dismiss).toBe('function');
    });
  });
});