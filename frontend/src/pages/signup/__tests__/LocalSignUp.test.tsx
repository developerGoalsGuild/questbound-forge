import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LocalSignUp from '../LocalSignUp';
import * as api from '@/lib/api';
import { TranslationProvider } from '@/hooks/useTranslation';

jest.mock('@/lib/api');

describe('LocalSignUp', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <TranslationProvider>
        <LocalSignUp />
      </TranslationProvider>
    );

  test('renders form fields', () => {
    renderComponent();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
  });

  test('shows validation errors on empty submit', async () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findAllByText(/this field is required/i)).toHaveLength(4);
  });

  test('shows password mismatch error', async () => {
    renderComponent();
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password1' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password2' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument();
  });

  test('submits form successfully', async () => {
    (api.createUser as jest.Mock).mockResolvedValue({});
    (api.confirmEmail as jest.Mock).mockResolvedValue(undefined);

    renderComponent();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(api.createUser).toHaveBeenCalledWith({
        email: 'test@example.com',
        fullName: 'Test User',
        password: 'password123',
        status: 'email confirmation pending',
      });
      expect(api.confirmEmail).toHaveBeenCalledWith('test@example.com');
      expect(screen.getByText(/account created! please check your email/i)).toBeInTheDocument();
    });
  });

  test('shows error message on submission failure', async () => {
    (api.createUser as jest.Mock).mockRejectedValue(new Error('Failed'));
    renderComponent();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'fail@example.com' } });
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Fail User' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/failed to create account/i)).toBeInTheDocument();
    });
  });
});
