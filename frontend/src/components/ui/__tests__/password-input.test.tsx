/** @vitest-environment jsdom */
import { describe, test, expect } from 'vitest';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PasswordInput } from '../password-input';

describe('PasswordInput', () => {
  test('renders as type=password by default with show-toggle icon', () => {
    const utils = render(<PasswordInput id="pwd" placeholder="Password" />);
    const input = utils.container.querySelector('input') as HTMLInputElement;
    expect(input.type).toBe('password');
    const btn = utils.container.querySelector('button[aria-label="Show"]') as HTMLButtonElement;
    expect(btn).toBeInTheDocument();
    expect(utils.getByTestId('icon-eye')).toBeInTheDocument();
  });

  test('toggle shows and hides the password and updates icon/aria', () => {
    const utils = render(<PasswordInput id="pwd" placeholder="Password" />);
    const input = utils.container.querySelector('input') as HTMLInputElement;
    const btn = utils.container.querySelector('button[aria-label="Show"]') as HTMLButtonElement;

    // Click to show
    fireEvent.click(btn);
    expect(input.type).toBe('text');
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveAttribute('aria-label', 'Hide');
    expect(utils.queryAllByTestId('icon-eye-off').length).toBeGreaterThan(0);

    // Click to hide
    fireEvent.click(btn);
    expect(input.type).toBe('password');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).toHaveAttribute('aria-label', 'Show');
    expect(utils.queryAllByTestId('icon-eye').length).toBeGreaterThan(0);
  });
});
