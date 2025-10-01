import { ZodSchema, ZodError } from 'zod';
import { 
  titleSchema, 
  descriptionSchema, 
  deadlineSchema, 
  categorySchema, 
  nlpAnswerSchema,
  validateGoalTitle,
  validateGoalDeadline,
  validateNLPAnswer,
  validateGoalCategory
} from './goalValidation';

// Field validation schemas mapping
export const FIELD_SCHEMAS: Record<string, ZodSchema> = {
  title: titleSchema,
  description: descriptionSchema,
  deadline: deadlineSchema,
  category: categorySchema,
  nlpAnswer: nlpAnswerSchema,
};

// Validation result interface
export interface FieldValidationResult {
  isValid: boolean;
  error?: string;
  fieldName: string;
  timestamp: number;
}

// Validation cache entry
export interface ValidationCacheEntry {
  result: boolean;
  error?: string;
  timestamp: number;
  value: any;
}

// Validation cache
class ValidationCache {
  private cache: Map<string, ValidationCacheEntry> = new Map();
  private readonly maxSize: number;
  private readonly timeout: number;

  constructor(maxSize: number = 100, timeout: number = 30000) {
    this.maxSize = maxSize;
    this.timeout = timeout;
  }

  // Generate cache key
  private getCacheKey(fieldName: string, value: any): string {
    return `${fieldName}:${JSON.stringify(value)}`;
  }

  // Get cached result
  get(fieldName: string, value: any): FieldValidationResult | null {
    const key = this.getCacheKey(fieldName, value);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.timeout) {
      this.cache.delete(key);
      return null;
    }

    return {
      isValid: entry.result,
      error: entry.error,
      fieldName,
      timestamp: entry.timestamp,
    };
  }

  // Set cached result
  set(fieldName: string, value: any, result: FieldValidationResult): void {
    const key = this.getCacheKey(fieldName, value);

    // Clean up if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      result: result.isValid,
      error: result.error,
      timestamp: result.timestamp,
      value,
    });
  }

  // Clear specific field cache
  clearField(fieldName: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${fieldName}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      timeout: this.timeout,
    };
  }
}

// Global validation cache instance
const validationCache = new ValidationCache();

// Field validation priority levels
export enum ValidationPriority {
  HIGH = 1,    // Required fields: title, deadline
  MEDIUM = 2,  // Important fields: description, category
  LOW = 3,     // Optional fields: NLP answers
}

// Field priority mapping
export const FIELD_PRIORITIES: Record<string, ValidationPriority> = {
  title: ValidationPriority.HIGH,
  deadline: ValidationPriority.HIGH,
  description: ValidationPriority.MEDIUM,
  category: ValidationPriority.MEDIUM,
  positive: ValidationPriority.LOW,
  specific: ValidationPriority.LOW,
  evidence: ValidationPriority.LOW,
  resources: ValidationPriority.LOW,
  obstacles: ValidationPriority.LOW,
  ecology: ValidationPriority.LOW,
  timeline: ValidationPriority.LOW,
  firstStep: ValidationPriority.LOW,
};

// Validate individual field with caching
export const validateField = async (
  fieldName: string, 
  value: any, 
  schema?: ZodSchema
): Promise<FieldValidationResult> => {
  const startTime = Date.now();

  // Check cache first
  const cached = validationCache.get(fieldName, value);
  if (cached) {
    return cached;
  }

  // Get schema
  const fieldSchema = schema || FIELD_SCHEMAS[fieldName];
  if (!fieldSchema) {
    throw new Error(`No validation schema found for field: ${fieldName}`);
  }

  // Skip validation for empty values unless it's a required field
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    const isRequired = FIELD_PRIORITIES[fieldName] === ValidationPriority.HIGH;
    const result: FieldValidationResult = {
      isValid: !isRequired, // Empty values are valid only for optional fields
      error: isRequired ? `${fieldName} is required` : undefined,
      fieldName,
      timestamp: startTime,
    };
    
    validationCache.set(fieldName, value, result);
    return result;
  }

  try {
    // Validate using Zod
    fieldSchema.parse(value);
    
    const result: FieldValidationResult = {
      isValid: true,
      fieldName,
      timestamp: startTime,
    };

    // Cache successful result
    validationCache.set(fieldName, value, result);
    return result;
  } catch (error) {
    let errorMessage = 'Invalid value';
    
    if (error instanceof ZodError && error.issues && error.issues.length > 0) {
      errorMessage = error.issues[0]?.message || errorMessage;
    }

    const result: FieldValidationResult = {
      isValid: false,
      error: errorMessage,
      fieldName,
      timestamp: startTime,
    };

    // Cache error result
    validationCache.set(fieldName, value, result);
    return result;
  }
};

// Get field validation error (synchronous)
export const getFieldValidationError = (fieldName: string, value: any): string | undefined => {
  const cached = validationCache.get(fieldName, value);
  if (cached && !cached.isValid) {
    return cached.error;
  }
  return undefined;
};

// Clear field validation cache
export const clearFieldValidation = (fieldName: string): void => {
  validationCache.clearField(fieldName);
};

// Clear all validation cache
export const clearAllValidationCache = (): void => {
  validationCache.clear();
};

// Check if field is currently being validated (placeholder for async validation)
export const isFieldValidating = (fieldName: string): boolean => {
  // This would be managed by the component state
  // For now, return false as a placeholder
  return false;
};

// Validate multiple fields in batch
export const validateFieldsBatch = async (
  fields: Array<{ name: string; value: any; schema?: ZodSchema }>
): Promise<Record<string, FieldValidationResult>> => {
  const results: Record<string, FieldValidationResult> = {};

  // Sort fields by priority
  const sortedFields = fields.sort((a, b) => {
    const priorityA = FIELD_PRIORITIES[a.name] || ValidationPriority.MEDIUM;
    const priorityB = FIELD_PRIORITIES[b.name] || ValidationPriority.MEDIUM;
    return priorityA - priorityB;
  });

  // Validate fields in parallel (up to 3 at a time for performance)
  const batchSize = 3;
  for (let i = 0; i < sortedFields.length; i += batchSize) {
    const batch = sortedFields.slice(i, i + batchSize);
    const batchPromises = batch.map(async (field) => {
      const result = await validateField(field.name, field.value, field.schema);
      return { fieldName: field.name, result };
    });

    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ fieldName, result }) => {
      results[fieldName] = result;
    });
  }

  return results;
};

// Validate form data with priority-based validation
export const validateFormData = async (
  formData: Record<string, any>,
  schemas?: Record<string, ZodSchema>
): Promise<{
  isValid: boolean;
  errors: Record<string, string>;
  results: Record<string, FieldValidationResult>;
}> => {
  const fields = Object.entries(formData).map(([name, value]) => ({
    name,
    value,
    schema: schemas?.[name],
  }));

  const results = await validateFieldsBatch(fields);
  
  const errors: Record<string, string> = {};
  let isValid = true;

  Object.entries(results).forEach(([fieldName, result]) => {
    if (!result.isValid && result.error) {
      errors[fieldName] = result.error;
      isValid = false;
    }
  });

  return {
    isValid,
    errors,
    results,
  };
};

// Register field schema
export const registerFieldSchema = (fieldName: string, schema: ZodSchema): void => {
  FIELD_SCHEMAS[fieldName] = schema;
};

// Get field schema
export const getFieldSchema = (fieldName: string): ZodSchema | undefined => {
  return FIELD_SCHEMAS[fieldName];
};

// Get field priority
export const getFieldPriority = (fieldName: string): ValidationPriority => {
  return FIELD_PRIORITIES[fieldName] || ValidationPriority.MEDIUM;
};

// Check if field is required
export const isFieldRequired = (fieldName: string): boolean => {
  return FIELD_PRIORITIES[fieldName] === ValidationPriority.HIGH;
};

// Format validation error message
export const formatValidationError = (
  fieldName: string, 
  error: string, 
  value?: any
): string => {
  // Add context to error messages
  if (value !== undefined && typeof value === 'string') {
    const length = value.length;
    if (length > 0) {
      return `${error} (${length} characters)`;
    }
  }
  return error;
};

// Validate field with custom error formatting
export const validateFieldWithFormatting = async (
  fieldName: string,
  value: any,
  schema?: ZodSchema
): Promise<FieldValidationResult> => {
  const result = await validateField(fieldName, value, schema);
  
  if (!result.isValid && result.error) {
    result.error = formatValidationError(fieldName, result.error, value);
  }
  
  return result;
};

// Get validation statistics
export const getValidationStats = () => {
  return validationCache.getStats();
};

// Predefined validation functions for common fields
export const validateTitle = (title: string) => validateGoalTitle(title);
export const validateDeadline = (deadline: string) => validateGoalDeadline(deadline);
export const validateDescription = (description: string) => {
  try {
    descriptionSchema.parse(description);
    return { isValid: true };
  } catch (error) {
    if (error instanceof ZodError && error.issues && error.issues.length > 0) {
      return { isValid: false, error: error.issues[0]?.message };
    }
    return { isValid: false, error: 'Invalid description' };
  }
};
export const validateCategory = (category: string) => validateGoalCategory(category);
export const validateNLPAnswerField = (answer: string) => validateNLPAnswer(answer);

// Export cache instance for external access
export { validationCache };

// Export types
export type {
  FieldValidationResult,
  ValidationCacheEntry,
};
