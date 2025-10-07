import { useState, useEffect, useCallback, useRef } from 'react';
import { ZodSchema, ZodError } from 'zod';
import { logger } from '@/lib/logger';

// Validation configuration
export interface ValidationConfig {
  debounceMs?: number;
  validateOnMount?: boolean;
  enableServerValidation?: boolean;
  maxRetries?: number;
  cacheTimeout?: number;
  batchValidation?: boolean;
}

// Validation state for individual fields
export interface FieldValidationState {
  isValidating: boolean;
  error?: string;
  lastValidated?: number;
  isValid?: boolean;
  retryCount?: number;
}

// Overall validation state
export interface ValidationState {
  isValidating: boolean;
  errors: Record<string, string>;
  fieldStates: Record<string, FieldValidationState>;
  lastValidated: Record<string, number>;
  cache: Record<string, { result: boolean; error?: string; timestamp: number }>;
}

// Validation result
export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fieldName: string;
  timestamp: number;
}

// Default configuration
const DEFAULT_CONFIG: Required<ValidationConfig> = {
  debounceMs: 500,
  validateOnMount: false,
  enableServerValidation: false,
  maxRetries: 3,
  cacheTimeout: 30000, // 30 seconds
  batchValidation: true,
};

// Field validation schemas mapping
const FIELD_SCHEMAS: Record<string, ZodSchema> = {};

// Register field schema
export const registerFieldSchema = (fieldName: string, schema: ZodSchema) => {
  FIELD_SCHEMAS[fieldName] = schema;
};

// Clear field schema
export const clearFieldSchema = (fieldName: string) => {
  delete FIELD_SCHEMAS[fieldName];
};

// Get field schema
export const getFieldSchema = (fieldName: string): ZodSchema | undefined => {
  return FIELD_SCHEMAS[fieldName];
};

// Custom hook for debounced validation
export const useDebouncedValidation = (config: ValidationConfig = {}) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State management
  const [validationState, setValidationState] = useState<ValidationState>({
    isValidating: false,
    errors: {},
    fieldStates: {},
    lastValidated: {},
    cache: {},
  });

  // Refs for cleanup
  const timeoutsRef = useRef<Record<string, NodeJS.Timeout>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    // Clear all timeouts
    Object.values(timeoutsRef.current).forEach(timeout => clearTimeout(timeout));
    timeoutsRef.current = {};

    // Cancel any pending requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Check if value is in cache and still valid
  const getCachedResult = useCallback((fieldName: string, value: any): ValidationResult | null => {
    const cacheKey = `${fieldName}:${JSON.stringify(value)}`;
    const cached = validationState.cache[cacheKey];
    
    if (cached) {
      const isExpired = Date.now() - cached.timestamp > finalConfig.cacheTimeout;
      if (!isExpired) {
        return {
          isValid: cached.result,
          error: cached.error,
          fieldName,
          timestamp: cached.timestamp,
        };
      }
    }
    
    return null;
  }, [validationState.cache, finalConfig.cacheTimeout]);

  // Set cache result
  const setCachedResult = useCallback((fieldName: string, value: any, result: ValidationResult) => {
    const cacheKey = `${fieldName}:${JSON.stringify(value)}`;
    setValidationState(prev => ({
      ...prev,
      cache: {
        ...prev.cache,
        [cacheKey]: {
          result: result.isValid,
          error: result.error,
          timestamp: result.timestamp,
        },
      },
    }));
  }, []);

  // Validate individual field
  const validateField = useCallback(async (
    fieldName: string, 
    value: any, 
    schema?: ZodSchema
  ): Promise<ValidationResult> => {
    const startTime = Date.now();
    
    // Check cache first
    const cached = getCachedResult(fieldName, value);
    if (cached) {
      return cached;
    }

    // Get schema
    const fieldSchema = schema || getFieldSchema(fieldName);
    if (!fieldSchema) {
      throw new Error(`No validation schema found for field: ${fieldName}`);
    }

    // Update field state to validating
    setValidationState(prev => ({
      ...prev,
      fieldStates: {
        ...prev.fieldStates,
        [fieldName]: {
          ...prev.fieldStates[fieldName],
          isValidating: true,
        },
      },
    }));

    try {
      // Validate using Zod
      fieldSchema.parse(value);
      
      const result: ValidationResult = {
        isValid: true,
        fieldName,
        timestamp: startTime,
      };

      // Cache successful result
      setCachedResult(fieldName, value, result);

      // Update validation state
      setValidationState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldName]: undefined,
        },
        fieldStates: {
          ...prev.fieldStates,
          [fieldName]: {
            isValidating: false,
            isValid: true,
            lastValidated: startTime,
            retryCount: 0,
          },
        },
        lastValidated: {
          ...prev.lastValidated,
          [fieldName]: startTime,
        },
      }));

      return result;
    } catch (error) {
      let errorMessage = 'Invalid value';
      
      if (error instanceof ZodError && error.issues && error.issues.length > 0) {
        errorMessage = error.issues[0]?.message || errorMessage;
      }

      const result: ValidationResult = {
        isValid: false,
        error: errorMessage,
        fieldName,
        timestamp: startTime,
      };

      // Update validation state with error
      setValidationState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldName]: errorMessage,
        },
        fieldStates: {
          ...prev.fieldStates,
          [fieldName]: {
            isValidating: false,
            isValid: false,
            error: errorMessage,
            lastValidated: startTime,
            retryCount: (prev.fieldStates[fieldName]?.retryCount || 0) + 1,
          },
        },
        lastValidated: {
          ...prev.lastValidated,
          [fieldName]: startTime,
        },
      }));

      return result;
    }
  }, [getCachedResult, setCachedResult]);

  // Debounced validation function
  const debouncedValidateField = useCallback((
    fieldName: string,
    value: any,
    schema?: ZodSchema
  ) => {
    // Clear existing timeout for this field
    if (timeoutsRef.current[fieldName]) {
      clearTimeout(timeoutsRef.current[fieldName]);
    }

    // Skip validation for empty values unless it's a required field
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      // Clear any existing error for empty fields
      setValidationState(prev => ({
        ...prev,
        errors: {
          ...prev.errors,
          [fieldName]: undefined,
        },
        fieldStates: {
          ...prev.fieldStates,
          [fieldName]: {
            ...prev.fieldStates[fieldName],
            isValidating: false,
            isValid: undefined,
            error: undefined,
          },
        },
      }));
      return;
    }

    // Set up debounced validation
    timeoutsRef.current[fieldName] = setTimeout(async () => {
      try {
        await validateField(fieldName, value, schema);
      } catch (error) {
        logger.error(`Validation error for field ${fieldName}`, { fieldName, value, error });
      }
    }, finalConfig.debounceMs);
  }, [validateField, finalConfig.debounceMs]);

  // Clear field validation
  const clearFieldValidation = useCallback((fieldName: string) => {
    // Clear timeout
    if (timeoutsRef.current[fieldName]) {
      clearTimeout(timeoutsRef.current[fieldName]);
      delete timeoutsRef.current[fieldName];
    }

    // Clear validation state
    setValidationState(prev => {
      const newErrors = { ...prev.errors };
      const newFieldStates = { ...prev.fieldStates };
      const newLastValidated = { ...prev.lastValidated };

      delete newErrors[fieldName];
      delete newFieldStates[fieldName];
      delete newLastValidated[fieldName];

      return {
        ...prev,
        errors: newErrors,
        fieldStates: newFieldStates,
        lastValidated: newLastValidated,
      };
    });
  }, []);

  // Clear all validations
  const clearAllValidations = useCallback(() => {
    cleanup();
    setValidationState({
      isValidating: false,
      errors: {},
      fieldStates: {},
      lastValidated: {},
      cache: {},
    });
  }, [cleanup]);

  // Check if field is currently validating
  const isFieldValidating = useCallback((fieldName: string): boolean => {
    return validationState.fieldStates[fieldName]?.isValidating || false;
  }, [validationState.fieldStates]);

  // Check if field has been validated
  const isFieldValidated = useCallback((fieldName: string): boolean => {
    return validationState.fieldStates[fieldName]?.lastValidated !== undefined;
  }, [validationState.fieldStates]);

  // Get field error
  const getFieldError = useCallback((fieldName: string): string | undefined => {
    return validationState.errors[fieldName];
  }, [validationState.errors]);

  // Check if field is valid
  const isFieldValid = useCallback((fieldName: string): boolean | undefined => {
    return validationState.fieldStates[fieldName]?.isValid;
  }, [validationState.fieldStates]);

  // Get overall validation status
  const isFormValid = useCallback((): boolean => {
    const hasErrors = Object.values(validationState.errors).some(error => error !== undefined);
    const hasValidatingFields = Object.values(validationState.fieldStates).some(
      state => state.isValidating
    );
    
    return !hasErrors && !hasValidatingFields;
  }, [validationState.errors, validationState.fieldStates]);

  // Get validation summary
  const getValidationSummary = useCallback(() => {
    const totalFields = Object.keys(validationState.fieldStates).length;
    const validatedFields = Object.values(validationState.fieldStates).filter(
      state => state.lastValidated !== undefined
    ).length;
    const validFields = Object.values(validationState.fieldStates).filter(
      state => state.isValid === true
    ).length;
    const errorFields = Object.values(validationState.errors).filter(
      error => error !== undefined
    ).length;

    return {
      totalFields,
      validatedFields,
      validFields,
      errorFields,
      isValidating: validationState.isValidating,
      isFormValid: isFormValid(),
    };
  }, [validationState, isFormValid]);

  return {
    // Core functions
    validateField,
    debouncedValidateField,
    clearFieldValidation,
    clearAllValidations,
    
    // State queries
    isFieldValidating,
    isFieldValidated,
    getFieldError,
    isFieldValid,
    isFormValid,
    getValidationSummary,
    
    // State
    validationState,
    
    // Configuration
    config: finalConfig,
  };
};

// Export types for external use
export type {
  ValidationConfig,
  FieldValidationState,
  ValidationState,
  ValidationResult,
};
