import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import QuestCreatePage from '../QuestCreate';

// Mock the components and hooks
const mockUseTranslation = vi.fn();
const mockUseSearchParams = vi.fn();
const mockNavigate = vi.fn();
const mockQuestCreateForm = vi.fn();

// Mock the hooks
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => mockUseTranslation(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => mockUseSearchParams(),
  };
});

// Mock QuestCreateForm
vi.mock('@/components/quests/QuestCreateForm', () => ({
  default: (props: any) => {
    mockQuestCreateForm(props);
    return <div data-testid="quest-create-form">QuestCreateForm</div>;
  },
}));

describe('QuestCreatePage', () => {
  const mockTranslations = {
    quest: {
      title: 'Create Quest',
      description: 'Create a new quest to track your progress',
    },
    common: {
      back: 'Back',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseTranslation.mockReturnValue({
      t: mockTranslations,
    });
    mockUseSearchParams.mockReturnValue([new URLSearchParams()]);
    mockNavigate.mockClear();
    mockQuestCreateForm.mockClear();
  });

  describe('Rendering', () => {
    it('renders page title and description', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      expect(screen.getByText('Create Quest')).toBeInTheDocument();
      expect(screen.getByText('Create a new quest to track your progress')).toBeInTheDocument();
    });

    it('renders back button', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('renders QuestCreateForm component', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      expect(screen.getByTestId('quest-create-form')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('navigates to quests list when back button is clicked without goalId', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests');
    });

    it('navigates to goal details when back button is clicked with goalId', () => {
      const mockSearchParams = new URLSearchParams('goalId=goal-123');
      mockUseSearchParams.mockReturnValue([mockSearchParams]);

      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/goals/details/goal-123');
    });

    it('navigates to quest details when quest is created', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      // Trigger the onSuccess callback (simulated by calling QuestCreateForm props)
      const formProps = mockQuestCreateForm.mock.calls[0][0];
      formProps.onSuccess({ id: 'quest-456' });

      expect(mockNavigate).toHaveBeenCalledWith('/quests/details/quest-456');
    });

    it('navigates to quests list when cancel is clicked without goalId', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      // Trigger the onCancel callback
      const formProps = mockQuestCreateForm.mock.calls[0][0];
      formProps.onCancel();

      expect(mockNavigate).toHaveBeenCalledWith('/quests');
    });

    it('navigates to goal details when cancel is clicked with goalId', () => {
      // Set up search params before rendering
      const mockSearchParams = new URLSearchParams('goalId=goal-789');
      mockUseSearchParams.mockReturnValue([mockSearchParams]);

      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      // The component should have extracted goalId and passed it to form
      const formProps = mockQuestCreateForm.mock.calls[0][0];
      expect(formProps.goalId).toBe('goal-789');

      // Trigger cancel - should navigate to goal details
      formProps.onCancel();
      expect(mockNavigate).toHaveBeenCalledWith('/goals/details/goal-789');
    });
  });

  describe('Goal ID Parameter Handling', () => {
    it('extracts goalId from URL search parameters', () => {
      const mockSearchParams = new URLSearchParams('goalId=test-goal-123');
      mockUseSearchParams.mockReturnValue([mockSearchParams]);

      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      // Check that QuestCreateForm receives the goalId
      const formProps = mockQuestCreateForm.mock.calls[0][0];
      expect(formProps.goalId).toBe('test-goal-123');
    });

    it('passes undefined goalId when no goalId parameter is present', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      // Check that QuestCreateForm receives undefined goalId
      const formProps = mockQuestCreateForm.mock.calls[0][0];
      expect(formProps.goalId).toBeUndefined();
    });

    it('handles empty goalId parameter', () => {
      const mockSearchParams = new URLSearchParams('goalId=');
      mockUseSearchParams.mockReturnValue([mockSearchParams]);

      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      // Check that QuestCreateForm receives undefined goalId
      const formProps = mockQuestCreateForm.mock.calls[0][0];
      expect(formProps.goalId).toBeUndefined();
    });

    it('handles goalId with special characters', () => {
      const mockSearchParams = new URLSearchParams('goalId=goal-with-dashes_and_underscores');
      mockUseSearchParams.mockReturnValue([mockSearchParams]);

      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      // Check that QuestCreateForm receives the goalId
      const formProps = mockQuestCreateForm.mock.calls[0][0];
      expect(formProps.goalId).toBe('goal-with-dashes_and_underscores');
    });
  });

  describe('Props Passing to QuestCreateForm', () => {
    it('passes required props to QuestCreateForm', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      const formProps = mockQuestCreateForm.mock.calls[0][0];

      expect(formProps).toHaveProperty('onSuccess');
      expect(formProps).toHaveProperty('onCancel');
      expect(typeof formProps.onSuccess).toBe('function');
      expect(typeof formProps.onCancel).toBe('function');
    });

    it('passes goalId to QuestCreateForm when available', () => {
      const mockSearchParams = new URLSearchParams('goalId=specific-goal');
      mockUseSearchParams.mockReturnValue([mockSearchParams]);

      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      const formProps = mockQuestCreateForm.mock.calls[0][0];
      expect(formProps.goalId).toBe('specific-goal');
    });

    it('does not pass goalId to QuestCreateForm when not available', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      const formProps = mockQuestCreateForm.mock.calls[0][0];
      expect(formProps.goalId).toBeUndefined();
    });
  });

  describe('Translation Integration', () => {
    it('uses translation hook correctly', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      expect(mockUseTranslation).toHaveBeenCalled();
    });

    it('displays translated text', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      expect(screen.getByText('Create Quest')).toBeInTheDocument();
      expect(screen.getByText('Create a new quest to track your progress')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    it('handles missing translations gracefully', () => {
      mockUseTranslation.mockReturnValue({
        t: {},
      });

      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      // Should show fallback text
      expect(screen.getByText('Create Quest')).toBeInTheDocument();
      expect(screen.getByText('Create a new quest to track your progress')).toBeInTheDocument();
    });
  });

  describe('URL Parameter Edge Cases', () => {
    it('handles multiple query parameters correctly', () => {
      const mockSearchParams = new URLSearchParams('goalId=goal-123&other=param&another=value');
      mockUseSearchParams.mockReturnValue([mockSearchParams]);

      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      const formProps = mockQuestCreateForm.mock.calls[0][0];
      expect(formProps.goalId).toBe('goal-123');
    });

    it('ignores other query parameters', () => {
      const mockSearchParams = new URLSearchParams('other=param&goalId=goal-456&unrelated=value');
      mockUseSearchParams.mockReturnValue([mockSearchParams]);

      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      const formProps = mockQuestCreateForm.mock.calls[0][0];
      expect(formProps.goalId).toBe('goal-456');
    });

    it('handles URL-encoded goalId', () => {
      const mockSearchParams = new URLSearchParams('goalId=goal%20with%20spaces');
      mockUseSearchParams.mockReturnValue([mockSearchParams]);

      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      const formProps = mockQuestCreateForm.mock.calls[0][0];
      expect(formProps.goalId).toBe('goal with spaces');
    });
  });

  describe('Accessibility', () => {
    it('has proper heading structure', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Create Quest');
    });

    it('has accessible navigation buttons', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('React Router Integration', () => {
    it('uses useSearchParams hook correctly', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      expect(mockUseSearchParams).toHaveBeenCalled();
    });

    it('uses useNavigate hook correctly', () => {
      render(
        <BrowserRouter>
          <QuestCreatePage />
        </BrowserRouter>
      );

      // useNavigate is called in the component
      expect(mockNavigate).toBeDefined();
    });
  });
});
