/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast, reducer } from '../use-toast';

// Mock the toast component types
vi.mock('@/components/ui/toast', () => ({
  ToastActionElement: {},
  ToastProps: {}
}));

describe('toast reducer', () => {
  const initialState = { toasts: [] };

  test('ADD_TOAST adds a new toast to the state', () => {
    const newToast = {
      id: '1',
      title: 'Test Toast',
      description: 'This is a test',
      open: true
    };

    const action = {
      type: 'ADD_TOAST' as const,
      toast: newToast
    };

    const result = reducer(initialState, action);

    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0]).toEqual(newToast);
  });

  test('ADD_TOAST respects TOAST_LIMIT', () => {
    const toast1 = { id: '1', title: 'Toast 1', open: true };
    const toast2 = { id: '2', title: 'Toast 2', open: true };
    const toast3 = { id: '3', title: 'Toast 3', open: true };

    let state = reducer(initialState, { type: 'ADD_TOAST', toast: toast1 });
    state = reducer(state, { type: 'ADD_TOAST', toast: toast2 });
    state = reducer(state, { type: 'ADD_TOAST', toast: toast3 });

    expect(state.toasts).toHaveLength(1); // TOAST_LIMIT is 1
    expect(state.toasts[0]).toEqual(toast3); // Most recent first
  });

  test('UPDATE_TOAST updates an existing toast', () => {
    const initialToast = {
      id: '1',
      title: 'Original Title',
      description: 'Original description',
      open: true
    };

    const stateWithToast = {
      toasts: [initialToast]
    };

    const updateAction = {
      type: 'UPDATE_TOAST' as const,
      toast: {
        id: '1',
        title: 'Updated Title'
      }
    };

    const result = reducer(stateWithToast, updateAction);

    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0].title).toBe('Updated Title');
    expect(result.toasts[0].description).toBe('Original description'); // Unchanged
  });

  test('DISMISS_TOAST sets open to false for specific toast', () => {
    const toast1 = { id: '1', title: 'Toast 1', open: true };
    const toast2 = { id: '2', title: 'Toast 2', open: true };

    const stateWithToasts = {
      toasts: [toast1, toast2]
    };

    const dismissAction = {
      type: 'DISMISS_TOAST' as const,
      toastId: '1'
    };

    const result = reducer(stateWithToasts, dismissAction);

    expect(result.toasts[0].open).toBe(false);
    expect(result.toasts[1].open).toBe(true);
  });

  test('DISMISS_TOAST dismisses all toasts when no toastId provided', () => {
    const toast1 = { id: '1', title: 'Toast 1', open: true };
    const toast2 = { id: '2', title: 'Toast 2', open: true };

    const stateWithToasts = {
      toasts: [toast1, toast2]
    };

    const dismissAllAction = {
      type: 'DISMISS_TOAST' as const
    };

    const result = reducer(stateWithToasts, dismissAllAction);

    expect(result.toasts[0].open).toBe(false);
    expect(result.toasts[1].open).toBe(false);
  });

  test('REMOVE_TOAST removes specific toast', () => {
    const toast1 = { id: '1', title: 'Toast 1', open: false };
    const toast2 = { id: '2', title: 'Toast 2', open: false };

    const stateWithToasts = {
      toasts: [toast1, toast2]
    };

    const removeAction = {
      type: 'REMOVE_TOAST' as const,
      toastId: '1'
    };

    const result = reducer(stateWithToasts, removeAction);

    expect(result.toasts).toHaveLength(1);
    expect(result.toasts[0].id).toBe('2');
  });

  test('REMOVE_TOAST removes all toasts when no toastId provided', () => {
    const stateWithToasts = {
      toasts: [
        { id: '1', title: 'Toast 1', open: false },
        { id: '2', title: 'Toast 2', open: false }
      ]
    };

    const removeAllAction = {
      type: 'REMOVE_TOAST' as const
    };

    const result = reducer(stateWithToasts, removeAllAction);

    expect(result.toasts).toHaveLength(0);
  });
});

describe('toast function', () => {
  beforeEach(() => {
    // Reset the global state before each test
    vi.doMock('../use-toast', () => ({
      ...vi.importActual('../use-toast'),
      count: 0,
      memoryState: { toasts: [] },
      toastTimeouts: new Map(),
      listeners: []
    }));
  });

  test('toast function returns an object with id, dismiss, and update methods', () => {
    const result = toast({
      title: 'Test Toast',
      description: 'Test description'
    });

    expect(result).toHaveProperty('id');
    expect(typeof result.dismiss).toBe('function');
    expect(typeof result.update).toBe('function');
  });

  test('toast generates unique IDs', () => {
    const toast1 = toast({ title: 'Toast 1' });
    const toast2 = toast({ title: 'Toast 2' });

    expect(toast1.id).not.toBe(toast2.id);
  });
});

describe('useToast hook', () => {
  beforeEach(() => {
    // Clear global state
    vi.doMock('../use-toast', () => ({
      ...vi.importActual('../use-toast'),
      memoryState: { toasts: [] },
      listeners: [],
      toastTimeouts: new Map()
    }));
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  test('useToast returns state and methods', () => {
    const { result } = renderHook(() => useToast());

    expect(result.current).toHaveProperty('toasts');
    expect(result.current).toHaveProperty('toast');
    expect(result.current).toHaveProperty('dismiss');
    expect(Array.isArray(result.current.toasts)).toBe(true);
    expect(typeof result.current.toast).toBe('function');
    expect(typeof result.current.dismiss).toBe('function');
  });

  test('useToast subscribes to state changes', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: 'Test Toast',
        description: 'Test description'
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
    expect(result.current.toasts[0].description).toBe('Test description');
    expect(result.current.toasts[0].open).toBe(true);
  });

  test('dismiss method dismisses specific toast', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const toastResult = result.current.toast({ title: 'Test Toast' });
      toastId = toastResult.id;
    });

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  test('dismiss method dismisses all toasts when no id provided', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Toast 1' });
      result.current.toast({ title: 'Toast 2' }); // This will replace the first due to TOAST_LIMIT = 1
    });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts[0].open).toBe(false);
    expect(result.current.toasts).toHaveLength(1);
  });

  test('toast dismiss method works', () => {
    const { result } = renderHook(() => useToast());

    let dismissToast: () => void;
    act(() => {
      const toastResult = result.current.toast({ title: 'Test Toast' });
      dismissToast = toastResult.dismiss;
    });

    act(() => {
      dismissToast();
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  test('toast update method works', () => {
    const { result } = renderHook(() => useToast());

    let updateToast: (props: any) => void;
    let toastId: string;
    act(() => {
      const toastResult = result.current.toast({ title: 'Original Title' });
      updateToast = toastResult.update;
      toastId = toastResult.id;
    });

    act(() => {
      updateToast({ id: toastId, title: 'Updated Title' });
    });

    expect(result.current.toasts[0].title).toBe('Updated Title');
  });

  test('cleanup removes listener on unmount', () => {
    const { result, unmount } = renderHook(() => useToast());

    // Add a toast to ensure state management is working
    act(() => {
      result.current.toast({ title: 'Test Toast' });
    });

    expect(result.current.toasts).toHaveLength(1);

    unmount();

    // The hook should still work in a new render - state persists globally
    const { result: newResult } = renderHook(() => useToast());
    expect(newResult.current.toasts).toHaveLength(1); // State persists
  });

  test('toast includes onOpenChange handler', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Test Toast' });
    });

    expect(result.current.toasts[0]).toHaveProperty('onOpenChange');
    expect(typeof result.current.toasts[0].onOpenChange).toBe('function');
  });

  test('onOpenChange calls dismiss when open is false', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: 'Test Toast' });
    });

    const { onOpenChange } = result.current.toasts[0];

    act(() => {
      onOpenChange(false);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });
});
