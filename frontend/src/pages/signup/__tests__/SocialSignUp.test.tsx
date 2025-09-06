import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SocialSignUp from '../SocialSignUp';
import * as api from '@/lib/api';
import { TranslationProvider } from '@/hooks/useTranslation';

jest.mock('@/lib/api');

describe('SocialSignUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (email: string) =>
    render(
      <TranslationProvider>
        <SocialSignUp email={email} />
      </TranslationProvider>
    );

  test('renders email field as read-only', () => {
    renderComponent('social@example.com');
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveValue('social@example.com');
    expect(emailInput).toHaveAttribute('readonly');
  });

  test('submits form successfully', async () => {
    (api.createUser as jest.Mock).mockResolvedValue({});

    renderComponent('social@example.com');

    fireEvent.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith({
        email: 'social@example.com',
        status: 'email confirmation pending',
      });
      expect(screen.getByText(/account created via social login!/i)).toBeInTheDocument();
    });
  });

  test('shows error message on submission failure', async () => {
    (api.createUser as jest.Mock).mockRejectedValue(new Error('Failed'));

    renderComponent('social@example.com');

    fireEvent.click(screen.getByRole('button', { name: /complete registration/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create account/i)).toBeInTheDocument();
    });
  });
});
