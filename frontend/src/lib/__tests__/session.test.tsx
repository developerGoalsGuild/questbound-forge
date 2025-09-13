/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { SessionKeepAlive } from '@/lib/session';

vi.mock('@/lib/api', () => ({
  getTokenExpiry: vi.fn(),
  renewToken: vi.fn(),
}));

import * as api from '@/lib/api';

describe('SessionKeepAlive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    cleanup();
  });

  test('renews when token expiring within 10 minutes on user interaction', async () => {
    const now = Math.floor(Date.now() / 1000);
    (api.getTokenExpiry as any).mockReturnValue(now + 100); // within threshold
    (api.renewToken as any).mockResolvedValue({});
    render(<SessionKeepAlive />);
    window.dispatchEvent(new Event('click'));
    // renew should be called once
    expect(api.renewToken).toHaveBeenCalledTimes(1);
  });

  test('does not renew when no token expiry available', async () => {
    (api.getTokenExpiry as any).mockReturnValue(null);
    render(<SessionKeepAlive />);
    window.dispatchEvent(new Event('click'));
    expect(api.renewToken).not.toHaveBeenCalled();
  });

  test('throttles multiple events to a single renew call', async () => {
    const now = Math.floor(Date.now() / 1000);
    (api.getTokenExpiry as any).mockReturnValue(now + 100);
    (api.renewToken as any).mockResolvedValue({});
    render(<SessionKeepAlive />);
    window.dispatchEvent(new Event('mousemove'));
    window.dispatchEvent(new Event('keydown'));
    window.dispatchEvent(new Event('touchstart'));
    expect(api.renewToken).toHaveBeenCalledTimes(1);
  });
});

