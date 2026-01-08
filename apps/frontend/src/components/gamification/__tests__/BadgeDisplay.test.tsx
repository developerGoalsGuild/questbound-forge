import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { BadgeDisplay } from '../BadgeDisplay';
import { getMyBadges } from '@/lib/api/gamification';

vi.mock('@/lib/api/gamification', () => ({
  getMyBadges: vi.fn(),
  getUserBadges: vi.fn(),
}));

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      gamification: {
        badges: {
          title: 'Badges',
          noBadges: 'No badges earned yet',
        },
      },
    },
  }),
}));

const mockedGetMyBadges = getMyBadges as vi.MockedFunction<typeof getMyBadges>;

describe('BadgeDisplay', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders earned badges', async () => {
    mockedGetMyBadges.mockResolvedValue({
      total: 1,
      badges: [
        {
          badge: {
            userId: 'user-1',
            badgeId: 'badge-1',
            earnedAt: Date.now(),
            metadata: {},
            progress: 1,
          },
          definition: {
            id: 'badge-1',
            name: 'Quest Starter',
            description: 'First quest',
            category: 'quest',
            rarity: 'common',
          },
        },
      ],
    });

    render(<BadgeDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('badge-badge-1')).toBeInTheDocument();
    });
    expect(screen.getByText('Quest Starter')).toBeInTheDocument();
  });

  it('shows error message on failure', async () => {
    mockedGetMyBadges.mockRejectedValue(new Error('Network down'));

    render(<BadgeDisplay />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Network down');
    });
  });
});

