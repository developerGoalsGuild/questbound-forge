import { describe, it, expect } from 'vitest';
import { taskUpdateSchema, validateTaskCompletionNote } from '../taskValidation';

describe('taskValidation', () => {
  it('requires completion note when status is completed', () => {
    const result = taskUpdateSchema.safeParse({ status: 'completed' });
    expect(result.success).toBe(false);
  });

  it('accepts completion note when status is completed', () => {
    const result = taskUpdateSchema.safeParse({
      status: 'completed',
      completionNote: 'Completed after finishing the deliverables.'
    });
    expect(result.success).toBe(true);
  });

  it('rejects too short completion notes', () => {
    const result = validateTaskCompletionNote('too short');
    expect(result.isValid).toBe(false);
  });
});
