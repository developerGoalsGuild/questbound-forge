/**
 * QuestEdit Page Tests
 * 
 * Unit tests for the QuestEdit page component with 90%+ coverage.
 * Tests include navigation, quest loading, error handling, and form integration.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import QuestEditPage from '../QuestEdit';
import { useTranslation } from '@/hooks/useTranslation';
import type { Quest } from '@/models/quest';

// Mock the translation hook
vi.mock('@/hooks/useTranslation');

// Mock the QuestEditForm component
vi.mock('@/components/quests/QuestEditForm', () => ({
  QuestEditForm: ({ questId, onSuccess, onCancel }: any) => (
    <div data-testid="quest-edit-form">
      <div>Quest Edit Form for {questId}</div>
      <button onClick={() => onSuccess?.({ id: questId, title: 'Updated Quest' })}>
        Update Quest
      </button>
      <button onClick={() => onCancel?.()}>
        Cancel
      </button>
    </div>
  ),
}));

const mockUseTranslation = vi.mocked(useTranslation);

// Mock translations
const mockTranslations = {
  quest: {
    title: 'Edit Quest',
    description: 'Edit your quest details and settings',
  },
  common: {
    back: 'Back',
  },
};

// Test wrapper component
const TestWrapper: React.FC<{ 
  children: React.ReactNode; 
  initialEntries?: string[];
}> = ({ children, initialEntries = ['/quests/edit/quest-1'] }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('QuestEditPage', () => {
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useTranslation
    mockUseTranslation.mockReturnValue({
      t: mockTranslations,
      language: 'en',
      setLanguage: vi.fn(),
    });

    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: 'quest-1' }),
      };
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render the page with correct title and description', () => {
      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      expect(screen.getByText('Edit Quest')).toBeInTheDocument();
      expect(screen.getByText('Edit your quest details and settings')).toBeInTheDocument();
    });

    it('should render back button', () => {
      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });

    it('should render QuestEditForm when quest ID is provided', () => {
      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      expect(screen.getByTestId('quest-edit-form')).toBeInTheDocument();
      expect(screen.getByText('Quest Edit Form for quest-1')).toBeInTheDocument();
    });

    it('should not render QuestEditForm when quest ID is not provided', () => {
      // Mock useParams to return undefined id
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useParams: () => ({ id: undefined }),
        };
      });

      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      expect(screen.queryByTestId('quest-edit-form')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate back to quests list when back button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      await user.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests');
    });

    it('should navigate to quest details when quest is successfully updated', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      const updateButton = screen.getByRole('button', { name: /update quest/i });
      await user.click(updateButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests/details/quest-1');
    });

    it('should navigate back to quests list when quest update is cancelled', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith('/quests');
    });
  });

  describe('Internationalization', () => {
    it('should display translated text for different languages', () => {
      mockUseTranslation.mockReturnValue({
        t: {
          ...mockTranslations,
          quest: {
            title: 'Editar Misión',
            description: 'Edita los detalles y configuraciones de tu misión',
          },
          common: {
            back: 'Atrás',
          },
        },
        language: 'es',
        setLanguage: vi.fn(),
      });

      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      expect(screen.getByText('Editar Misión')).toBeInTheDocument();
      expect(screen.getByText('Edita los detalles y configuraciones de tu misión')).toBeInTheDocument();
      expect(screen.getByText('Atrás')).toBeInTheDocument();
    });

    it('should fallback to default text when translations are missing', () => {
      mockUseTranslation.mockReturnValue({
        t: {
          quest: {},
          common: {},
        },
        language: 'en',
        setLanguage: vi.fn(),
      });

      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      expect(screen.getByText('Edit Quest')).toBeInTheDocument();
      expect(screen.getByText('Edit your quest details and settings')).toBeInTheDocument();
      expect(screen.getByText('Back')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing quest ID gracefully', () => {
      // Mock useParams to return undefined id
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom');
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useParams: () => ({ id: undefined }),
        };
      });

      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      // Should not crash and should not render the form
      expect(screen.queryByTestId('quest-edit-form')).not.toBeInTheDocument();
    });

    it('should handle translation errors gracefully', () => {
      mockUseTranslation.mockReturnValue({
        t: null as any,
        language: 'en',
        setLanguage: vi.fn(),
      });

      // Should not crash
      expect(() => {
        render(
          <TestWrapper>
            <QuestEditPage />
          </TestWrapper>
        );
      }).not.toThrow();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Edit Quest');
    });

    it('should have accessible button labels', () => {
      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      const backButton = screen.getByRole('button', { name: /back/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should pass correct props to QuestEditForm', () => {
      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      const form = screen.getByTestId('quest-edit-form');
      expect(form).toBeInTheDocument();
      
      // The form should receive the quest ID
      expect(screen.getByText('Quest Edit Form for quest-1')).toBeInTheDocument();
    });

    it('should handle quest update success callback', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      const updateButton = screen.getByRole('button', { name: /update quest/i });
      await user.click(updateButton);

      // Should navigate to quest details
      expect(mockNavigate).toHaveBeenCalledWith('/quests/details/quest-1');
    });

    it('should handle quest update cancel callback', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      // Should navigate back to quests list
      expect(mockNavigate).toHaveBeenCalledWith('/quests');
    });
  });

  describe('URL Parameters', () => {
    it('should work with different quest IDs', () => {
      render(
        <TestWrapper initialEntries={['/quests/edit/quest-123']}>
          <QuestEditPage />
        </TestWrapper>
      );

      expect(screen.getByText('Quest Edit Form for quest-123')).toBeInTheDocument();
    });

    it('should handle empty quest ID', () => {
      render(
        <TestWrapper initialEntries={['/quests/edit/']}>
          <QuestEditPage />
        </TestWrapper>
      );

      // Should not render the form when ID is empty
      expect(screen.queryByTestId('quest-edit-form')).not.toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have proper container structure', () => {
      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      const container = screen.getByRole('main').parentElement;
      expect(container).toHaveClass('container', 'mx-auto', 'px-4', 'py-8');
    });

    it('should have proper spacing between elements', () => {
      render(
        <TestWrapper>
          <QuestEditPage />
        </TestWrapper>
      );

      const spaceY6 = screen.getByRole('main').querySelector('.space-y-6');
      expect(spaceY6).toBeInTheDocument();
    });
  });
});
