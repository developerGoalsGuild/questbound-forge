import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GoalCategorySelector from '../GoalCategorySelector';
import { useTranslation } from '@/hooks/useTranslation';

// Mock dependencies
vi.mock('@/hooks/useTranslation');

// Mock translation data
const mockTranslations = {
  goalCreation: {
    fields: {
      category: 'Category'
    },
    placeholders: {
      category: 'Select a category'
    },
    hints: {
      category: 'Choose a category that best fits your goal',
      iconLabel: 'More information about {field}'
    },
    validation: {
      categoryRequired: 'Category is required'
    }
  },
  goals: {
    fields: {
      category: 'Category'
    },
    hints: {
      fields: {
        category: 'Choose a category that best fits your goal'
      },
      iconLabel: 'More information about {field}'
    }
  },
  common: {
    categories: {
      learning: 'Learning',
      health: 'Health',
      career: 'Career',
      personal: 'Personal',
      financial: 'Financial',
      creative: 'Creative',
      social: 'Social',
      other: 'Other'
    }
  }
};

// Mock translation hook
const mockUseTranslation = vi.fn(() => ({
  t: () => mockTranslations,
  language: 'en'
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('GoalCategorySelector', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockImplementation(mockUseTranslation);
  });

  describe('Rendering', () => {
    test('renders category selector with label and placeholder', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error=""
          />
        </TestWrapper>
      );

      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
      expect(screen.getByText('Select a category')).toBeInTheDocument();
    });

    test('renders with proper accessibility attributes', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error=""
          />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id', 'goal-category');
      expect(select).toHaveAttribute('aria-describedby', 'hint-goal-category');
    });

    test('displays current value when provided', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value="learning"
            onChange={mockOnChange}
            error=""
          />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('Learning')).toBeInTheDocument();
    });

    test('renders all predefined categories', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error=""
          />
        </TestWrapper>
      );

      // Open the dropdown
      const select = screen.getByRole('combobox');
      fireEvent.click(select);

      // Check all categories are present
      const categories = [
        'Learning',
        'Health', 
        'Career',
        'Personal',
        'Financial',
        'Creative',
        'Social',
        'Other'
      ];

      categories.forEach(category => {
        expect(screen.getByText(category)).toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    test('calls onChange when user selects a category', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error=""
          />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      await user.click(select);
      
      const learningOption = screen.getByText('Learning');
      await user.click(learningOption);

      expect(mockOnChange).toHaveBeenCalledWith('learning');
    });

    test('allows custom category input', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error=""
          />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      await user.click(select);
      
      // Look for custom input option or type in the select
      const customOption = screen.queryByText('Custom...');
      if (customOption) {
        await user.click(customOption);
      } else {
        // Type custom category directly
        await user.type(select, 'Custom Category');
        await user.keyboard('{Enter}');
      }

      expect(mockOnChange).toHaveBeenCalled();
    });

    test('supports keyboard navigation', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error=""
          />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      select.focus();

      // Arrow down to open dropdown
      await user.keyboard('{ArrowDown}');
      
      // Arrow down to navigate options
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      
      // Enter to select
      await user.keyboard('{Enter}');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('Validation', () => {
    test('displays validation error when provided', () => {
      const mockOnChange = vi.fn();
      const error = 'Category is required';
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error={error}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Category is required')).toBeInTheDocument();
    });

    test('applies error styling when error is present', () => {
      const mockOnChange = vi.fn();
      const error = 'Category is required';
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error={error}
          />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveClass('border-red-500');
    });

    test('announces validation error to screen readers', () => {
      const mockOnChange = vi.fn();
      const error = 'Category is required';
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error={error}
          />
        </TestWrapper>
      );

      const errorMessage = screen.getByText('Category is required');
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('id', 'error-goal-category');
    });

    test('clears error when user makes selection', async () => {
      const mockOnChange = vi.fn();
      const error = 'Category is required';
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error={error}
          />
        </TestWrapper>
      );

      // Verify error is displayed
      expect(screen.getByText('Category is required')).toBeInTheDocument();

      // User makes selection
      const select = screen.getByRole('combobox');
      await user.click(select);
      
      const learningOption = screen.getByText('Learning');
      await user.click(learningOption);

      // Error should be cleared (handled by parent component)
      expect(mockOnChange).toHaveBeenCalledWith('learning');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and descriptions', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error=""
          />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('id', 'goal-category');
      expect(select).toHaveAttribute('aria-describedby', 'hint-goal-category');
    });

    test('provides helpful hint text', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error=""
          />
        </TestWrapper>
      );

      const hint = screen.getByTestId('hint-goal-category');
      expect(hint).toBeInTheDocument();
      expect(hint).toHaveTextContent('Choose a category that best fits your goal');
    });

    test('supports screen reader announcements', () => {
      const mockOnChange = vi.fn();
      const error = 'Category is required';
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error={error}
          />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveAttribute('aria-invalid', 'true');
      expect(select).toHaveAttribute('aria-describedby', 'hint-goal-category error-goal-category');
    });
  });

  describe('Internationalization', () => {
    test('uses translated category labels', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error=""
          />
        </TestWrapper>
      );

      // Open dropdown to see translated options
      const select = screen.getByRole('combobox');
      fireEvent.click(select);

      // Check that translated labels are used
      expect(screen.getByText('Learning')).toBeInTheDocument();
      expect(screen.getByText('Health')).toBeInTheDocument();
      expect(screen.getByText('Career')).toBeInTheDocument();
    });

    test('uses translated error messages', () => {
      const mockOnChange = vi.fn();
      const error = 'Category is required';
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error={error}
          />
        </TestWrapper>
      );

      expect(screen.getByText('Category is required')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles empty value gracefully', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value=""
            onChange={mockOnChange}
            error=""
          />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('');
    });

    test('handles undefined value gracefully', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value={undefined as any}
            onChange={mockOnChange}
            error=""
          />
        </TestWrapper>
      );

      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('');
    });

    test('handles invalid category value', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <GoalCategorySelector 
            value="invalid-category"
            onChange={mockOnChange}
            error=""
          />
        </TestWrapper>
      );

      // Should still render without crashing
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });
  });
});
