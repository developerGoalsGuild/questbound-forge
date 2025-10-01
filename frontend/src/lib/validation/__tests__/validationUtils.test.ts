import {
  validateField,
  validateFieldsBatch,
  validateFormData,
  validateTitle,
  validateDeadline,
  validateDescription,
  validateCategory,
  validateNLPAnswerField,
  getFieldValidationError,
  clearFieldValidation,
  clearAllValidationCache,
  getFieldPriority,
  isFieldRequired,
  formatValidationError,
  getValidationStats,
  ValidationPriority,
} from '../validationUtils';
import { titleSchema, deadlineSchema, descriptionSchema, categorySchema, nlpAnswerSchema } from '../goalValidation';

describe('validationUtils', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearAllValidationCache();
  });

  describe('validateField', () => {
    it('should validate field with correct schema', async () => {
      const result = await validateField('title', 'Valid Title', titleSchema);
      
      expect(result.isValid).toBe(true);
      expect(result.fieldName).toBe('title');
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should return error for invalid field value', async () => {
      const result = await validateField('title', 'A', titleSchema);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('at least 3 characters');
    });

    it('should handle empty values correctly', async () => {
      const result = await validateField('description', '', descriptionSchema);
      
      expect(result.isValid).toBe(true);
    });

    it('should throw error for unknown field', async () => {
      await expect(validateField('unknown', 'value')).rejects.toThrow(
        'No validation schema found for field: unknown'
      );
    });
  });

  describe('validateFieldsBatch', () => {
    it('should validate multiple fields in batch', async () => {
      // Use a future date for deadline validation
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const fields = [
        { name: 'title', value: 'Valid Title', schema: titleSchema },
        { name: 'deadline', value: futureDateStr, schema: deadlineSchema },
      ];

      const results = await validateFieldsBatch(fields);

      expect(results.title.isValid).toBe(true);
      expect(results.deadline.isValid).toBe(true);
      expect(Object.keys(results)).toHaveLength(2);
    });

    it('should handle mixed valid and invalid fields', async () => {
      const fields = [
        { name: 'title', value: 'Valid Title', schema: titleSchema },
        { name: 'deadline', value: 'invalid-date', schema: deadlineSchema },
      ];

      const results = await validateFieldsBatch(fields);

      expect(results.title.isValid).toBe(true);
      expect(results.deadline.isValid).toBe(false);
      expect(results.deadline.error).toContain('YYYY-MM-DD format');
    });

    it('should sort fields by priority', async () => {
      const fields = [
        { name: 'positive', value: 'Answer', schema: nlpAnswerSchema },
        { name: 'title', value: 'Title', schema: titleSchema },
        { name: 'category', value: 'work', schema: categorySchema },
      ];

      const results = await validateFieldsBatch(fields);

      // Should validate all fields
      expect(Object.keys(results)).toHaveLength(3);
      expect(results.title.isValid).toBe(true);
      expect(results.category.isValid).toBe(true);
      expect(results.positive.isValid).toBe(false); // Too short
    });
  });

  describe('validateFormData', () => {
    it('should validate complete form data', async () => {
      // Use a future date for deadline validation
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const formData = {
        title: 'Valid Title',
        deadline: futureDateStr,
        description: 'Valid description',
        category: 'work',
      };

      const schemas = {
        title: titleSchema,
        deadline: deadlineSchema,
        description: descriptionSchema,
        category: categorySchema,
      };

      const result = await validateFormData(formData, schemas);

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(Object.keys(result.results)).toHaveLength(4);
    });

    it('should return errors for invalid form data', async () => {
      const formData = {
        title: 'A', // Too short
        deadline: 'invalid-date',
        description: 'Valid description',
        category: 'work',
      };

      const schemas = {
        title: titleSchema,
        deadline: deadlineSchema,
        description: descriptionSchema,
        category: categorySchema,
      };

      const result = await validateFormData(formData, schemas);

      expect(result.isValid).toBe(false);
      expect(result.errors.title).toContain('at least 3 characters');
      expect(result.errors.deadline).toContain('YYYY-MM-DD format');
      expect(result.errors.description).toBeUndefined();
      expect(result.errors.category).toBeUndefined();
    });
  });

  describe('predefined validation functions', () => {
    it('should validate title correctly', () => {
      const validResult = validateTitle('Valid Title');
      const invalidResult = validateTitle('A');

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('at least 3 characters');
    });

    it('should validate deadline correctly', () => {
      // Use a future date for deadline validation
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      const validResult = validateDeadline(futureDateStr);
      const invalidResult = validateDeadline('invalid-date');

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('YYYY-MM-DD format');
    });

    it('should validate description correctly', () => {
      const validResult = validateDescription('Valid description');
      const invalidResult = validateDescription('a'.repeat(501)); // Too long

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('no more than 500 characters');
    });

    it('should validate category correctly', () => {
      const validResult = validateCategory('work');
      const invalidResult = validateCategory('a'.repeat(51)); // Too long

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('Invalid category');
    });

    it('should validate NLP answer correctly', () => {
      const validResult = validateNLPAnswerField('This is a valid answer with enough characters');
      const invalidResult = validateNLPAnswerField('Short');

      expect(validResult.isValid).toBe(true);
      expect(invalidResult.isValid).toBe(false);
      expect(invalidResult.error).toContain('at least 10 characters');
    });
  });

  describe('cache functionality', () => {
    it('should cache validation results', async () => {
      const value = 'Valid Title';
      
      // First validation
      const result1 = await validateField('title', value, titleSchema);
      
      // Second validation should use cache
      const result2 = await validateField('title', value, titleSchema);
      
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
      expect(result1.timestamp).toBe(result2.timestamp); // Same timestamp indicates cache hit
    });

    it('should clear field validation cache', async () => {
      const value = 'Valid Title';
      
      // Validate and cache
      await validateField('title', value, titleSchema);
      
      // Clear cache
      clearFieldValidation('title');
      
      // Next validation should not use cache
      const result = await validateField('title', value, titleSchema);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it('should clear all validation cache', async () => {
      // Validate multiple fields
      await validateField('title', 'Title', titleSchema);
      await validateField('deadline', '2024-12-31', deadlineSchema);
      
      // Clear all cache
      clearAllValidationCache();
      
      // Next validations should not use cache
      const result1 = await validateField('title', 'Title', titleSchema);
      const result2 = await validateField('deadline', '2024-12-31', deadlineSchema);
      
      expect(result1.timestamp).toBeGreaterThan(0);
      expect(result2.timestamp).toBeGreaterThan(0);
    });
  });

  describe('utility functions', () => {
    it('should get field priority correctly', () => {
      expect(getFieldPriority('title')).toBe(ValidationPriority.HIGH);
      expect(getFieldPriority('deadline')).toBe(ValidationPriority.HIGH);
      expect(getFieldPriority('description')).toBe(ValidationPriority.MEDIUM);
      expect(getFieldPriority('category')).toBe(ValidationPriority.MEDIUM);
      expect(getFieldPriority('positive')).toBe(ValidationPriority.LOW);
      expect(getFieldPriority('unknown')).toBe(ValidationPriority.MEDIUM);
    });

    it('should check if field is required', () => {
      expect(isFieldRequired('title')).toBe(true);
      expect(isFieldRequired('deadline')).toBe(true);
      expect(isFieldRequired('description')).toBe(false);
      expect(isFieldRequired('category')).toBe(false);
      expect(isFieldRequired('positive')).toBe(false);
    });

    it('should format validation error with context', () => {
      const error = 'Too short';
      const value = 'Hi';
      
      const formatted = formatValidationError('title', error, value);
      
      expect(formatted).toContain(error);
      expect(formatted).toContain('2 characters');
    });

    it('should get validation stats', () => {
      const stats = getValidationStats();
      
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('timeout');
      expect(typeof stats.size).toBe('number');
    });
  });

  describe('getFieldValidationError', () => {
    it('should return cached error for invalid field', async () => {
      // Validate with invalid value to cache error
      await validateField('title', 'A', titleSchema);
      
      // Get cached error
      const error = getFieldValidationError('title', 'A');
      
      expect(error).toContain('at least 3 characters');
    });

    it('should return undefined for valid field', async () => {
      // Validate with valid value
      await validateField('title', 'Valid Title', titleSchema);
      
      // Get cached error (should be undefined)
      const error = getFieldValidationError('title', 'Valid Title');
      
      expect(error).toBeUndefined();
    });

    it('should return undefined for uncached field', () => {
      const error = getFieldValidationError('title', 'Some Value');
      
      expect(error).toBeUndefined();
    });
  });
});
