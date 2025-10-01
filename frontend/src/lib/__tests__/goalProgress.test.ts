import {
  calculateTimeProgress,
  getProgressBarColor,
  getProgressBarBgColor,
  getCategoryBadgeColor,
  formatProgressPercentage,
  getProgressStatusText,
  sortGoals,
  type GoalProgressData
} from '../goalProgress';

describe('goalProgress', () => {
  const now = new Date('2024-01-15T12:00:00Z');
  const oneDayAgo = new Date('2024-01-14T12:00:00Z');
  const oneWeekAgo = new Date('2024-01-08T12:00:00Z');
  const oneMonthAgo = new Date('2023-12-15T12:00:00Z');
  const oneWeekFromNow = new Date('2024-01-22T12:00:00Z');
  const oneMonthFromNow = new Date('2024-02-15T12:00:00Z');

  // Mock Date.now to return a fixed date
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(now);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('calculateTimeProgress', () => {
    it('calculates progress correctly for goal with deadline', () => {
      const goal: GoalProgressData = {
        id: 'goal-1',
        title: 'Test Goal',
        deadline: oneMonthFromNow.toISOString().split('T')[0],
        status: 'active',
        createdAt: oneMonthAgo.getTime(),
        updatedAt: now.getTime(),
        tags: ['work']
      };

      const progress = calculateTimeProgress(goal);

      expect(progress.percentage).toBeCloseTo(50, 0); // Halfway through
      expect(progress.isOverdue).toBe(false);
      expect(progress.isUrgent).toBe(false);
      expect(progress.isOnTrack).toBe(true);
      expect(progress.daysRemaining).toBe(31);
      expect(progress.daysElapsed).toBe(31);
      expect(progress.totalDays).toBe(62);
    });

    it('identifies overdue goals', () => {
      const goal: GoalProgressData = {
        id: 'goal-2',
        title: 'Overdue Goal',
        deadline: oneWeekAgo.toISOString().split('T')[0],
        status: 'active',
        createdAt: oneMonthAgo.getTime(),
        updatedAt: now.getTime(),
        tags: ['urgent']
      };

      const progress = calculateTimeProgress(goal);

      expect(progress.percentage).toBe(100);
      expect(progress.isOverdue).toBe(true);
      expect(progress.isUrgent).toBe(false);
      expect(progress.isOnTrack).toBe(false);
    });

    it('identifies urgent goals', () => {
      const goal: GoalProgressData = {
        id: 'goal-3',
        title: 'Urgent Goal',
        deadline: oneWeekFromNow.toISOString().split('T')[0],
        status: 'active',
        createdAt: oneMonthAgo.getTime(),
        updatedAt: now.getTime(),
        tags: ['urgent']
      };

      const progress = calculateTimeProgress(goal);

      expect(progress.percentage).toBeCloseTo(75, 0);
      expect(progress.isOverdue).toBe(false);
      expect(progress.isUrgent).toBe(true);
      expect(progress.isOnTrack).toBe(false);
      expect(progress.daysRemaining).toBe(7);
    });

    it('handles goals without deadline', () => {
      const goal: GoalProgressData = {
        id: 'goal-4',
        title: 'No Deadline Goal',
        status: 'active',
        createdAt: oneMonthAgo.getTime(),
        updatedAt: now.getTime(),
        tags: ['personal']
      };

      const progress = calculateTimeProgress(goal);

      expect(progress.percentage).toBe(0);
      expect(progress.isOverdue).toBe(false);
      expect(progress.isUrgent).toBe(false);
      expect(progress.isOnTrack).toBe(true);
      expect(progress.daysRemaining).toBe(0);
      expect(progress.totalDays).toBe(0);
    });

    it('handles goals created in the future', () => {
      const futureDate = new Date('2024-01-20T12:00:00Z');
      const goal: GoalProgressData = {
        id: 'goal-5',
        title: 'Future Goal',
        deadline: oneMonthFromNow.toISOString().split('T')[0],
        status: 'active',
        createdAt: futureDate.getTime(),
        updatedAt: now.getTime(),
        tags: ['future']
      };

      const progress = calculateTimeProgress(goal);

      expect(progress.percentage).toBe(0);
      expect(progress.isOverdue).toBe(false);
      expect(progress.isUrgent).toBe(false);
      expect(progress.isOnTrack).toBe(true);
    });
  });

  describe('getProgressBarColor', () => {
    it('returns red for overdue goals', () => {
      const progress = {
        percentage: 100,
        isOverdue: true,
        isUrgent: false,
        isOnTrack: false,
        daysRemaining: -5,
        daysElapsed: 35,
        totalDays: 30
      };

      expect(getProgressBarColor(progress)).toBe('bg-red-500');
    });

    it('returns yellow for urgent goals', () => {
      const progress = {
        percentage: 85,
        isOverdue: false,
        isUrgent: true,
        isOnTrack: false,
        daysRemaining: 3,
        daysElapsed: 17,
        totalDays: 20
      };

      expect(getProgressBarColor(progress)).toBe('bg-yellow-500');
    });

    it('returns green for on-track goals', () => {
      const progress = {
        percentage: 50,
        isOverdue: false,
        isUrgent: false,
        isOnTrack: true,
        daysRemaining: 15,
        daysElapsed: 15,
        totalDays: 30
      };

      expect(getProgressBarColor(progress)).toBe('bg-green-500');
    });
  });

  describe('getProgressBarBgColor', () => {
    it('returns appropriate background colors', () => {
      const overdueProgress = {
        percentage: 100,
        isOverdue: true,
        isUrgent: false,
        isOnTrack: false,
        daysRemaining: -5,
        daysElapsed: 35,
        totalDays: 30
      };

      const urgentProgress = {
        percentage: 85,
        isOverdue: false,
        isUrgent: true,
        isOnTrack: false,
        daysRemaining: 3,
        daysElapsed: 17,
        totalDays: 20
      };

      expect(getProgressBarBgColor(overdueProgress)).toBe('bg-red-100');
      expect(getProgressBarBgColor(urgentProgress)).toBe('bg-yellow-100');
    });
  });

  describe('getCategoryBadgeColor', () => {
    it('returns consistent colors for same tag', () => {
      const color1 = getCategoryBadgeColor('work');
      const color2 = getCategoryBadgeColor('work');
      expect(color1).toBe(color2);
    });

    it('returns different colors for different tags', () => {
      const workColor = getCategoryBadgeColor('work');
      const personalColor = getCategoryBadgeColor('personal');
      expect(workColor).not.toBe(personalColor);
    });

    it('handles empty string', () => {
      const color = getCategoryBadgeColor('');
      expect(color).toMatch(/^bg-\w+-\d+ text-\w+-\d+$/);
    });
  });

  describe('formatProgressPercentage', () => {
    it('formats percentage correctly', () => {
      expect(formatProgressPercentage(50.7)).toBe('51%');
      expect(formatProgressPercentage(0)).toBe('0%');
      expect(formatProgressPercentage(100)).toBe('100%');
      expect(formatProgressPercentage(33.333)).toBe('33%');
    });
  });

  describe('getProgressStatusText', () => {
    it('returns correct status text', () => {
      const overdue = {
        percentage: 100,
        isOverdue: true,
        isUrgent: false,
        isOnTrack: false,
        daysRemaining: -5,
        daysElapsed: 35,
        totalDays: 30
      };

      const urgent = {
        percentage: 85,
        isOverdue: false,
        isUrgent: true,
        isOnTrack: false,
        daysRemaining: 3,
        daysElapsed: 17,
        totalDays: 20
      };

      const onTrack = {
        percentage: 50,
        isOverdue: false,
        isUrgent: false,
        isOnTrack: true,
        daysRemaining: 15,
        daysElapsed: 15,
        totalDays: 30
      };

      const noDeadline = {
        percentage: 0,
        isOverdue: false,
        isUrgent: false,
        isOnTrack: true,
        daysRemaining: 0,
        daysElapsed: 0,
        totalDays: 0
      };

      expect(getProgressStatusText(overdue)).toBe('Overdue');
      expect(getProgressStatusText(urgent)).toBe('Urgent');
      expect(getProgressStatusText(onTrack)).toBe('On Track');
      expect(getProgressStatusText(noDeadline)).toBe('No Deadline');
    });
  });

  describe('sortGoals', () => {
    const goals: GoalProgressData[] = [
      {
        id: 'goal-1',
        title: 'Alpha Goal',
        deadline: '2024-02-01',
        status: 'active',
        createdAt: oneMonthAgo.getTime(),
        updatedAt: now.getTime(),
        tags: ['work']
      },
      {
        id: 'goal-2',
        title: 'Beta Goal',
        deadline: '2024-01-20',
        status: 'active',
        createdAt: oneWeekAgo.getTime(),
        updatedAt: now.getTime(),
        tags: ['personal']
      },
      {
        id: 'goal-3',
        title: 'Charlie Goal',
        deadline: '2024-01-10',
        status: 'active',
        createdAt: oneMonthAgo.getTime(),
        updatedAt: now.getTime(),
        tags: ['urgent']
      }
    ];

    it('sorts by deadline ascending', () => {
      const sorted = sortGoals(goals, 'deadline-asc');
      expect(sorted[0].id).toBe('goal-3');
      expect(sorted[1].id).toBe('goal-2');
      expect(sorted[2].id).toBe('goal-1');
    });

    it('sorts by deadline descending', () => {
      const sorted = sortGoals(goals, 'deadline-desc');
      expect(sorted[0].id).toBe('goal-1');
      expect(sorted[1].id).toBe('goal-2');
      expect(sorted[2].id).toBe('goal-3');
    });

    it('sorts by title ascending', () => {
      const sorted = sortGoals(goals, 'title-asc');
      expect(sorted[0].title).toBe('Alpha Goal');
      expect(sorted[1].title).toBe('Beta Goal');
      expect(sorted[2].title).toBe('Charlie Goal');
    });

    it('sorts by title descending', () => {
      const sorted = sortGoals(goals, 'title-desc');
      expect(sorted[0].title).toBe('Charlie Goal');
      expect(sorted[1].title).toBe('Beta Goal');
      expect(sorted[2].title).toBe('Alpha Goal');
    });

    it('sorts by created date ascending', () => {
      const sorted = sortGoals(goals, 'created-asc');
      expect(sorted[0].id).toBe('goal-2');
      expect(sorted[1].id).toBe('goal-1');
      expect(sorted[2].id).toBe('goal-3');
    });

    it('sorts by created date descending', () => {
      const sorted = sortGoals(goals, 'created-desc');
      expect(sorted[0].id).toBe('goal-1');
      expect(sorted[1].id).toBe('goal-3');
      expect(sorted[2].id).toBe('goal-2');
    });

    it('handles unknown sort option', () => {
      const sorted = sortGoals(goals, 'unknown-sort');
      expect(sorted).toEqual(goals);
    });
  });
});
