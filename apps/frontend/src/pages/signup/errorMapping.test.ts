import { describe, it, expect } from 'vitest';
import { mapSignupErrorToField } from './errorMapping';

const tSignup = {
  validation: {
    emailTaken: 'This email is already in use',
    nicknameTaken: 'This nickname is already in use',
  },
};

function makeError(detail: any) {
  return new Error(JSON.stringify({ detail }));
}

describe('mapSignupErrorToField', () => {
  it('maps EMAIL_TAKEN to email field with i18n text', () => {
    const err = makeError({ code: 'EMAIL_TAKEN', field: 'email', message: 'Email already in use' });
    const mapped = mapSignupErrorToField(err, tSignup as any);
    expect(mapped).toEqual({ field: 'email', message: tSignup.validation.emailTaken });
  });

  it('maps NICKNAME_TAKEN to nickname field with i18n text', () => {
    const err = makeError({ code: 'NICKNAME_TAKEN', field: 'nickname', message: 'Nickname already in use' });
    const mapped = mapSignupErrorToField(err, tSignup as any);
    expect(mapped).toEqual({ field: 'nickname', message: tSignup.validation.nicknameTaken });
  });

  it('returns null for unknown error codes', () => {
    const err = makeError({ code: 'OTHER', message: 'Something' });
    const mapped = mapSignupErrorToField(err, tSignup as any);
    expect(mapped).toBeNull();
  });
});

