/** @vitest-environment jsdom */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import ChangePassword from '../ChangePassword';

vi.mock('@/lib/api', () => ({
  changePassword: vi.fn(),
}));

import * as api from '@/lib/api';

describe('ChangePassword page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('validates required fields and mismatched passwords', async () => {
    render(<ChangePassword />);
    const saveButtons = screen.getAllByRole('button', { name: /save password/i });
    fireEvent.click(saveButtons[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent(/required/i);

    // Fill current and one new but mismatch
    const inputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(inputs[0], { target: { value: 'Current1!' } });
    fireEvent.change(inputs[1], { target: { value: 'NewPass1!' } });
    fireEvent.change(inputs[2], { target: { value: 'Mismatch1!' } });
    fireEvent.click(saveButtons[0]);
    expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/i);
  });

  test('submits and shows success', async () => {
    (api.changePassword as any).mockResolvedValue({ token_type: 'Bearer', access_token: 'x.y.z', expires_in: 1200 });
    render(<ChangePassword />);
    const saveButtons = screen.getAllByRole('button', { name: /save password/i });
    const inputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(inputs[0], { target: { value: 'Current1!' } });
    fireEvent.change(inputs[1], { target: { value: 'NewPass1!' } });
    fireEvent.change(inputs[2], { target: { value: 'NewPass1!' } });
    fireEvent.click(saveButtons[0]);
    await waitFor(() => {
      expect(api.changePassword).toHaveBeenCalledWith({ current_password: 'Current1!', new_password: 'NewPass1!' });
      expect(screen.getByRole('alert')).toHaveTextContent(/success/i);
    });
  });

  test('toggle visibility for each password field', () => {
    render(<ChangePassword />);
    const buttons = screen.getAllByRole('button', { name: /show/i });
    expect(buttons.length).toBeGreaterThanOrEqual(3);
    // Click first toggle and ensure aria-pressed updates
    fireEvent.click(buttons[0]);
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
  });
});
