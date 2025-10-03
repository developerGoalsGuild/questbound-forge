import { renderHook, act, waitFor } from '@testing-library/react';
import { useDebouncedValidation, registerFieldSchema } from '../useDebouncedValidation';
import { titleSchema, deadlineSchema } from '@/lib/validation/goalValidation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('@/hooks/useDebouncedValidation');

// Mock timers to control debounce
vi.useFakeTimers();

describe.skip('useDebouncedValidation', () => {
  beforeEach(() => {
    // Clear all registered schemas
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDebouncedValidation());

    expect(result.current.validationState.isValidating).toBe(false);
    expect(result.current.validationState.errors).toEqual({});
    expect(result.current.validationState.fieldStates).toEqual({});
    expect(result.current.isFormValid()).toBe(true);
  });

  it('should register field schemas correctly', () => {
    registerFieldSchema('title', titleSchema);
    registerFieldSchema('deadline', deadlineSchema);

    const { result } = renderHook(() => useDebouncedValidation());

    expect(result.current.config.debounceMs).toBe(500);
    expect(result.current.config.validateOnMount).toBe(false);
  });

  it('should validate field synchronously when called directly', async () => {
    registerFieldSchema('title', titleSchema);
    
    const { result } = renderHook(() => useDebouncedValidation());

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateField('title', 'Valid Title');
    });

    expect(validationResult?.isValid).toBe(true);
    expect(validationResult?.fieldName).toBe('title');
  });

  it('should return error for invalid field value', async () => {
    registerFieldSchema('title', titleSchema);
    
    const { result } = renderHook(() => useDebouncedValidation());

    let validationResult;
    await act(async () => {
      validationResult = await result.current.validateField('title', 'A'); // Too short
    });

    expect(validationResult?.isValid).toBe(false);
    expect(validationResult?.error).toContain('at least 3 characters');
  });

  it('should debounce validation calls', async () => {
    registerFieldSchema('title', titleSchema);
    
    const { result } = renderHook(() => useDebouncedValidation());

    // Call debounced validation multiple times quickly
    act(() => {
      result.current.debouncedValidateField('title', 'Test');
      result.current.debouncedValidateField('title', 'Test Title');
      result.current.debouncedValidateField('title', 'Final Test Title');
    });

    // Should not have validated yet
    expect(result.current.isFieldValidating('title')).toBe(false);

    // Fast forward time to trigger debounced validation
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Wait for validation to complete
    await act(async () => {
      await vi.runAllTimersAsync();
    });

    expect(result.current.isFieldValidating('title')).toBe(false);
    expect(result.current.isFieldValid('title')).toBe(true);
  });

  it('should clear field validation', async () => {
    registerFieldSchema('title', titleSchema);
    
    const { result } = renderHook(() => useDebouncedValidation());

    // Validate field first
    await act(async () => {
      await result.current.validateField('title', 'Valid Title');
    });

    expect(result.current.isFieldValidated('title')).toBe(true);

    // Clear validation
    act(() => {
      result.current.clearFieldValidation('title');
    });

    expect(result.current.isFieldValidated('title')).toBe(false);
    expect(result.current.getFieldError('title')).toBeUndefined();
  });

  it('should clear all validations', async () => {
    registerFieldSchema('title', titleSchema);
    registerFieldSchema('deadline', deadlineSchema);
    
    const { result } = renderHook(() => useDebouncedValidation());

    // Validate multiple fields
    await act(async () => {
      await result.current.validateField('title', 'Valid Title');
      await result.current.validateField('deadline', '2024-12-31');
    });

    expect(result.current.isFieldValidated('title')).toBe(true);
    expect(result.current.isFieldValidated('deadline')).toBe(true);

    // Clear all validations
    act(() => {
      result.current.clearAllValidations();
    });

    expect(result.current.isFieldValidated('title')).toBe(false);
    expect(result.current.isFieldValidated('deadline')).toBe(false);
    expect(result.current.validationState.errors).toEqual({});
  });

  it.skip('should handle empty values correctly', async () => {
    registerFieldSchema('title', titleSchema);
    
    const { result } = renderHook(() => useDebouncedValidation());

    // Test empty string
    act(() => {
      result.current.debouncedValidateField('title', '');
    });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
    });

    await waitFor(() => {
      expect(result.current.getFieldError('title')).toBeUndefined();
    });
  });

  it('should provide validation summary', async () => {
    registerFieldSchema('title', titleSchema);
    registerFieldSchema('deadline', deadlineSchema);
    
    const { result } = renderHook(() => useDebouncedValidation());

    // Validate one field successfully
    await act(async () => {
      await result.current.validateField('title', 'Valid Title');
    });

    // Validate another field with error
    await act(async () => {
      await result.current.validateField('deadline', 'invalid-date');
    });

    const summary = result.current.getValidationSummary();

    expect(summary.totalFields).toBe(2);
    expect(summary.validatedFields).toBe(2);
    expect(summary.validFields).toBe(1);
    expect(summary.errorFields).toBe(1);
    expect(summary.isFormValid).toBe(false);
  });

  it('should handle custom configuration', () => {
    const customConfig = {
      debounceMs: 1000,
      validateOnMount: true,
      enableServerValidation: true,
      maxRetries: 5,
    };

    const { result } = renderHook(() => useDebouncedValidation(customConfig));
    // Ensure config values are set as expected
    expect(result.current.config.debounceMs).toStrictEqual(1000);
    expect(result.current.config.validateOnMount).toStrictEqual(true);
    expect(result.current.config.enableServerValidation).toStrictEqual(true);
    expect(result.current.config.maxRetries).toStrictEqual(5);

  it.skip('should cancel previous validation when new one is triggered', async () => {
    registerFieldSchema('title', titleSchema);
    
    const { result } = renderHook(() => useDebouncedValidation({ debounceMs: 1000 }));

    // Start first validation
    act(() => {
      result.current.debouncedValidateField('title', 'First');
    });

    // Start second validation before first completes
    act(() => {
      vi.advanceTimersByTime(500);
      result.current.debouncedValidateField('title', 'Second');
    });

    await act(async () => {
      vi.advanceTimersByTime(1000);
      await vi.runAllTimersAsync();
    });

    await waitFor(() => {
      expect(result.current.isFieldValidating('title')).toBe(false);
    });

    // Should have validated with the second value
    expect(result.current.isFieldValid('title')).toBe(true);
  });
});
});
