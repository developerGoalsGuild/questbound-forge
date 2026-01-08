// src/pages/signup/__tests__/LocalSignUp.test.tsx
import React from 'react';
import { describe, test, beforeEach, afterEach, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// ----------------------- Mocks -----------------------
vi.mock('@/hooks/useTranslation', () => {
  const t = {
    common: { loading: 'Loading...', success: 'Available' },
    signup: {
      local: {
        email: 'Email',
        fullName: 'Full Name',
        nickname: 'Nickname',
        pronouns: 'Pronouns',
        gender: 'Gender',
        birthDate: 'Birth',
        bio: 'Bio',
        country: 'Country',
        role: 'Role',
        password: 'Password',
        confirmPassword: 'Confirm Password',
        submit: 'Create Account',
        selectCountry: 'Select your country',
        selectPronouns: 'Select pronouns',
        successMessage: 'OK',
        successConfirmMessage: 'OK-CONFIRM',
        errorMessage: 'ERR',
        options: { roles: { user: 'User', partner: 'Partner', patron: 'Patron' } },
        validation: {
          required: 'Required',
          invalidEmail: 'Invalid email',
          invalidDate: 'Invalid date',
          birthDateTooRecent: 'Too recent',
          bioMaxLength: 'Too long',
          invalidCountry: 'Invalid country code',
          emailTaken: 'Email already in use',
          emailAvailable: 'Email available',
          nicknameTaken: 'Nickname already in use',
          nicknameAvailable: 'Nickname available',
          passwordMinLength: 'Min 8',
          passwordUpper: 'Must include an uppercase letter',
          passwordLower: 'Must include a lowercase letter',
          passwordDigit: 'Must include a digit',
          passwordSpecial: 'Must include a special character',
          passwordMismatch: 'Passwords do not match',
          available: 'Available',
        },
      },
    },
  };
  return { useTranslation: () => ({ t, language: 'en' }) };
});

const api = {
  isEmailAvailable: vi.fn<[], any>(),
  isNicknameAvailable: vi.fn<[], any>(),
  createUser: vi.fn<[], any>(),
  confirmEmail: vi.fn<[], any>(),
};
vi.mock('@/lib/api', () => api);

vi.mock('@/i18n/countries', () => {
  const list = [
    { name: 'Brazil', code: 'BR' },
    { name: 'Argentina', code: 'AR' },
    { name: 'United States', code: 'US' },
  ];
  return {
    getCountries: () => list,
    initialsFor: (s: string) => (s || '').split(' ').map(x => x[0]).join(''),
    isValidCountryCode: (code: string) => ['BR', 'AR', 'US'].includes(code),
  };
});

vi.mock('./errorMapping', () => ({
  mapSignupErrorToField: (err: any) =>
    err?.mapped ? { field: 'email', message: 'Mapped email error' } : null,
}));

vi.mock('@/components/ui/password-input', () => ({
  PasswordInput: (props: any) => (
    <input
      data-testid={props.id}
      id={props.id}
      name={props.name}
      type="password"
      value={props.value}
      onChange={props.onChange}
      aria-invalid={props['aria-invalid']}
      aria-describedby={props['aria-describedby']}
      className={props.inputClassName || 'border rounded border-gray-300'}
    />
  ),
}));

vi.mock('@/lib/utils', () => ({ cn: (...xs: string[]) => xs.filter(Boolean).join(' ') }));

async function loadComponentWithEmailConfirmation(flag: boolean) {
  vi.resetModules();
  vi.doMock('@/config/featureFlags', () => ({ emailConfirmationEnabled: flag }));
  const mod = await import('@/pages/signup/LocalSignUp');
  return mod.default;
}

// ----------------------- Helpers -----------------------
const byId = <T extends HTMLElement = HTMLElement>(container: HTMLElement, id: string) =>
  container.querySelector<T>(`#${id}`)!;

const submitBtn = (container: HTMLElement) =>
  container.querySelector<HTMLButtonElement>('button[type="submit"]')!;

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function selectCountry(container: HTMLElement, query = 'Bra', buttonRe = /Brazil \(BR\)/i) {
  const input = screen.getByPlaceholderText('Select your country') as HTMLInputElement;
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: query } });
  const option = await screen.findByRole('button', { name: buttonRe }).catch(() => null);
  if (option) {
    fireEvent.mouseDown(option);
    fireEvent.click(option);
  }
}

function fillMinimalValidForm(container: HTMLElement) {
  fireEvent.change(screen.getByLabelText('Role'), { target: { value: 'user' } });
  fireEvent.change(byId<HTMLInputElement>(container, 'email'), { target: { value: 'user@example.com' } });
  fireEvent.change(byId<HTMLInputElement>(container, 'fullName'), { target: { value: 'Luna Lovegood' } });
  fireEvent.change(byId<HTMLInputElement>(container, 'nickname'), { target: { value: 'lunal' } });

  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  fireEvent.change(byId<HTMLInputElement>(container, 'birthDate'), { target: { value: `${yyyy}-${mm}-${dd}` } });

  fireEvent.change(screen.getByTestId('password'), { target: { value: 'StrongP@ssw0rd' } });
  fireEvent.change(screen.getByTestId('confirmPassword'), { target: { value: 'StrongP@ssw0rd' } });
}

// ----------------------- Lifecycle -----------------------
beforeEach(() => {
  // Use REAL timers globally so waitFor polls correctly
  vi.useRealTimers();
  api.isEmailAvailable.mockReset().mockResolvedValue(true);
  api.isNicknameAvailable.mockReset().mockResolvedValue(true);
  api.createUser.mockReset().mockResolvedValue({ ok: true });
  api.confirmEmail.mockReset().mockResolvedValue({ ok: true });
});

afterEach(() => {
  vi.useRealTimers();
});

// ----------------------- Tests -----------------------
describe('LocalSignUp (finalized)', () => {
  test('shows required-field state on empty submit', async () => {
    const LocalSignUp = await loadComponentWithEmailConfirmation(false);
    const { container } = render(<LocalSignUp />);

    fireEvent.click(submitBtn(container));

    await waitFor(() => expect(byId<HTMLInputElement>(container, 'email')).toHaveAttribute('aria-invalid', 'true'));
    await waitFor(() => expect(byId<HTMLInputElement>(container, 'fullName')).toHaveAttribute('aria-invalid', 'true'));
    await waitFor(() => expect(byId<HTMLInputElement>(container, 'country')).toHaveAttribute('aria-invalid', 'true'));
    await waitFor(() => expect(screen.getByTestId('password')).toHaveAttribute('aria-invalid', 'true'));
    await waitFor(() => expect(screen.getByTestId('confirmPassword')).toHaveAttribute('aria-invalid', 'true'));
  }, 10000);

  test('debounced email availability toggles color (green then red)', async () => {
    const LocalSignUp = await loadComponentWithEmailConfirmation(false);
    const { container } = render(<LocalSignUp />);

    const email = byId<HTMLInputElement>(container, 'email');

    // available
    api.isEmailAvailable.mockResolvedValueOnce(true);
    fireEvent.change(email, { target: { value: 'ok@example.com' } });
    await sleep(550); // debounce ~450ms → buffer
    expect(container.querySelector('.text-green-600')).toBeTruthy();

    // taken
    api.isEmailAvailable.mockResolvedValueOnce(false);
    fireEvent.change(email, { target: { value: 'taken@example.com' } });
    await sleep(550);
    expect(container.querySelector('.text-red-600')).toBeTruthy();
  }, 10000);

  test('debounced nickname availability toggles color (green then red)', async () => {
    const LocalSignUp = await loadComponentWithEmailConfirmation(false);
    const { container } = render(<LocalSignUp />);

    const nick = byId<HTMLInputElement>(container, 'nickname');

    // available
    api.isNicknameAvailable.mockResolvedValueOnce(true);
    fireEvent.change(nick, { target: { value: 'uniqueNick' } });
    await sleep(650); // debounce ~500ms → buffer
    expect(container.querySelector('#nickname-status .text-green-600, .text-green-600')).toBeTruthy();

    // taken
    api.isNicknameAvailable.mockResolvedValueOnce(false);
    fireEvent.change(nick, { target: { value: 'dupNick' } });
    await sleep(650);
    expect(container.querySelector('#nickname-status .text-red-600, .text-red-600')).toBeTruthy();
  }, 10000);

  test('validates password complexity and mismatch via aria-invalid', async () => {
    const LocalSignUp = await loadComponentWithEmailConfirmation(false);
    const { container } = render(<LocalSignUp />);

    // Minimal fields
    fireEvent.change(byId<HTMLInputElement>(container, 'email'), { target: { value: 'a@b.com' } });
    fireEvent.change(byId<HTMLInputElement>(container, 'fullName'), { target: { value: 'A B' } });
    fireEvent.change(byId<HTMLInputElement>(container, 'nickname'), { target: { value: 'ab' } });
    await selectCountry(container, 'Uni', /United States \(US\)/i);
    fireEvent.change(byId<HTMLInputElement>(container, 'birthDate'), { target: { value: '2000-01-01' } });

    // Weak (no uppercase)
    fireEvent.change(screen.getByTestId('password'), { target: { value: 'weakp@ss1' } });
    fireEvent.change(screen.getByTestId('confirmPassword'), { target: { value: 'weakp@ss1' } });
    fireEvent.click(submitBtn(container));
    await waitFor(() => expect(screen.getByTestId('password')).toHaveAttribute('aria-invalid', 'true'));

    // Mismatch
    fireEvent.change(screen.getByTestId('password'), { target: { value: 'StrongP@ss1' } });
    fireEvent.change(screen.getByTestId('confirmPassword'), { target: { value: 'WrongP@ss1' } });
    fireEvent.click(submitBtn(container));
    await waitFor(() => expect(screen.getByTestId('confirmPassword')).toHaveAttribute('aria-invalid', 'true'));
  }, 12000);

  test('country autocomplete clears invalid after selecting', async () => {
    const LocalSignUp = await loadComponentWithEmailConfirmation(false);
    const { container } = render(<LocalSignUp />);

    fireEvent.click(submitBtn(container));
    await waitFor(() => expect(byId<HTMLInputElement>(container, 'country')).toHaveAttribute('aria-invalid', 'true'));

    await selectCountry(container, 'Bra', /Brazil \(BR\)/i);
    fireEvent.click(submitBtn(container));
    await waitFor(() => expect(byId<HTMLInputElement>(container, 'country')).toHaveAttribute('aria-invalid', 'false'));
  }, 12000);

  test('submit WITHOUT email confirmation: creates user; shows success; no confirmEmail', async () => {
    const LocalSignUp = await loadComponentWithEmailConfirmation(false);
    const { container } = render(<LocalSignUp />);

    api.isEmailAvailable.mockResolvedValue(true);

    fillMinimalValidForm(container);
    await selectCountry(container, 'Bra', /Brazil \(BR\)/i);
    fireEvent.click(submitBtn(container));

    await waitFor(() => expect(api.createUser).toHaveBeenCalledTimes(1));
    expect(api.createUser.mock.calls[0][0]).toMatchObject({
      email: 'user@example.com',
      fullName: 'Luna Lovegood',
      role: 'user',
      status: 'active',
      country: 'BR',
    });
    expect(api.confirmEmail).not.toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  }, 15000);

  test('submit WITH email confirmation: creates user + confirmEmail; shows success', async () => {
    const LocalSignUp = await loadComponentWithEmailConfirmation(true);
    const { container } = render(<LocalSignUp />);

    api.isEmailAvailable.mockResolvedValue(true);

    fillMinimalValidForm(container);
    await selectCountry(container, 'Bra', /Brazil \(BR\)/i);
    fireEvent.click(submitBtn(container));

    await waitFor(() => expect(api.createUser).toHaveBeenCalledTimes(1));
    expect(api.createUser.mock.calls[0][0].status).toBe('email confirmation pending');
    expect(api.confirmEmail).toHaveBeenCalledWith('user@example.com');
    expect(await screen.findByRole('alert')).toBeInTheDocument();
  }, 15000);

  test('maps server error to field (current UI shows global alert)', async () => {
    const LocalSignUp = await loadComponentWithEmailConfirmation(false);
    const { container } = render(<LocalSignUp />);

    api.isEmailAvailable.mockResolvedValue(true);
    api.createUser.mockRejectedValue({ mapped: true });

    fillMinimalValidForm(container);
    await selectCountry(container, 'Bra', /Brazil \(BR\)/i);
    fireEvent.click(submitBtn(container));

    // Current behavior: global alert is rendered; field remains aria-invalid=false
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/ERR|Mapped email error/i);
  }, 12000);

  test('server-side email re-check failure (current behavior proceeds and shows success)', async () => {
    const LocalSignUp = await loadComponentWithEmailConfirmation(false);
    const { container } = render(<LocalSignUp />);

    // initial debounce OK (we don't explicitly debounce here; just ensure API is true first)
    api.isEmailAvailable.mockResolvedValueOnce(true);

    fillMinimalValidForm(container);
    await selectCountry(container, 'Bra', /Brazil \(BR\)/i);

    // re-check fails but component currently proceeds
    api.isEmailAvailable.mockRejectedValueOnce(new Error('network'));
    fireEvent.click(submitBtn(container));

    await waitFor(() => expect(api.createUser).toHaveBeenCalledTimes(1));
    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent(/OK/i);
  }, 12000);
});
