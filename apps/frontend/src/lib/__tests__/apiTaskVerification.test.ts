import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  submitTaskVerification,
  reviewTaskVerification,
  flagTaskVerification
} from '../apiTask';

vi.mock('../utils', () => ({
  getAccessToken: () => 'token',
  getApiBase: () => 'https://api.test',
  graphQLClient: vi.fn()
}));

vi.mock('../logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }
}));

describe('apiTask verification endpoints', () => {
  beforeEach(() => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({ id: 'task-1', verificationStatus: 'pending_review' })
    });
  });

  it('submits task verification payload', async () => {
    const payload = {
      completionNote: 'Completed after finishing the deliverables.',
      evidenceType: 'text',
      evidencePayload: { note: 'Summary' }
    };

    await submitTaskVerification('task-1', payload);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/quests/tasks/task-1/verification',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload)
      })
    );
  });

  it('reviews task verification decision', async () => {
    const payload = { decision: 'approved' as const, reason: 'Looks good' };

    await reviewTaskVerification('task-1', payload);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/quests/tasks/task-1/verification/review',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload)
      })
    );
  });

  it('flags task verification', async () => {
    const payload = { reason: 'Suspicious completion' };

    await flagTaskVerification('task-1', payload);

    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://api.test/quests/tasks/task-1/verification/flag',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(payload)
      })
    );
  });
});
