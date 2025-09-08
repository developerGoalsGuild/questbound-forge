import { request } from '../persistUser.js';

function ctxWith(input) {
  return { args: { input }, identity: { sub: '00000000-0000-4000-8000-TESTSUB000001' } };
}

describe('persistUser function (AppSync)', () => {
  test('rejects invalid country code', () => {
    const ctx = ctxWith({
      email: 'user@example.com',
      nickname: 'neo',
      fullName: 'Neo',
      country: 'ZZ', // not in allow-list
      birthDate: '2000-01-01'
    });
    expect(() => request(ctx)).toThrow(/invalid country/i);
  });

  test('rejects too-recent birthDate', () => {
    // util.time.nowISO8601() is mocked to 2024-09-01 in test/mocks
    // cutoff = 2023-09-01 → 2023-09-02 should be rejected
    const ctx = ctxWith({
      email: 'user@example.com',
      nickname: 'neo',
      fullName: 'Neo',
      country: 'US',
      birthDate: '2023-09-02'
    });
    expect(() => request(ctx)).toThrow(/too recent|invalid birthDate/i);
  });
});

