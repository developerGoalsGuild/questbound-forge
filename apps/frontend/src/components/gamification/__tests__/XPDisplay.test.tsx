import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { XPDisplay } from '../XPDisplay';
import { getLevelProgress } from '@/lib/api/gamification';

vi.mock('@/lib/api/gamification', () => ({
  getLevelProgress: vi.fn(),
}));

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      gamification: {
        xp: {
          title: 'Experience Points',
          progress: 'Progress',
          maxLevel: 'Max level reached!',
        },
      },
    },
  }),
}));

const mockedGetLevelProgress = getLevelProgress as vi.MockedFunction<typeof getLevelProgress>;

describe('XPDisplay', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders XP summary after fetch', async () => {
    mockedGetLevelProgress.mockResolvedValue({
      userId: 'user-1',
      totalXp: 250,
      currentLevel: 3,
      xpForCurrentLevel: 100,
      xpForNextLevel: 400,
      xpProgress: 0.5,
      updatedAt: Date.now(),
    });

    render(<XPDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('xp-amount')).toHaveTextContent('250 XP');
    });
    expect(screen.getByTestId('xp-level')).toHaveTextContent('Level 3');
  });

  it('shows error message when request fails', async () => {
    mockedGetLevelProgress.mockRejectedValue(new Error('Boom'));

    render(<XPDisplay />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Boom');
    });
  });
});

