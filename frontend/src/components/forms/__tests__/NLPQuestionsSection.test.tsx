import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import NLPQuestionsSection from '../NLPQuestionsSection';
import { useTranslation } from '@/hooks/useTranslation';

// Mock dependencies
vi.mock('@/hooks/useTranslation');

// Mock translation data
const mockTranslations = {
  goalCreation: {
    sections: {
      nlpQuestions: 'Well-formed Outcome (NLP)'
    },
    hints: {
      questions: {
        positive: 'Be positive and specific about what you want to achieve',
        specific: 'Make it specific and measurable',
        evidence: 'How will you know when you have achieved it?',
        resources: 'What resources do you have or need?',
        obstacles: 'What obstacles might you face?',
        ecology: 'Is this goal ecological for you and others?',
        timeline: 'When, where, and with whom will this happen?',
        firstStep: 'What is your immediate first step?'
      },
      iconLabel: 'More information about {field}'
    },
    fields: {
      nlpPositive: 'State your goal positively',
      nlpSpecific: 'Make it specific and context-bound',
      nlpEvidence: 'How will you know you achieved it?',
      nlpResources: 'What resources do you have/need?',
      nlpObstacles: 'What obstacles might arise?',
      nlpEcology: 'Is this ecological for you and others?',
      nlpTimeline: 'When, where, with whom will this happen?',
      nlpFirstStep: 'What is your immediate first step?'
    },
    validation: {
      nlpAnswerRequired: 'This question is required',
      nlpAnswerMinLength: 'Answer must be at least 10 characters'
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

describe('NLPQuestionsSection', () => {
  const user = userEvent.setup();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useTranslation).mockImplementation(mockUseTranslation);
  });

  describe('Rendering', () => {
    test('renders all 8 NLP questions in correct order', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={{}}
            onChange={mockOnChange}
            errors={{}}
          />
        </TestWrapper>
      );

      // Check section title
      expect(screen.getByText('Well-formed Outcome (NLP)')).toBeInTheDocument();

      // Check all 8 questions are rendered
      const questions = [
        'State your goal positively',
        'Make it specific and context-bound',
        'How will you know you achieved it?',
        'What resources do you have/need?',
        'What obstacles might arise?',
        'Is this ecological for you and others?',
        'When, where, with whom will this happen?',
        'What is your immediate first step?'
      ];

      questions.forEach(question => {
        expect(screen.getByText(question)).toBeInTheDocument();
      });

      // Check all textarea inputs are present
      const textareas = screen.getAllByRole('textbox');
      expect(textareas).toHaveLength(8);
    });

    test('renders with proper accessibility attributes', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={{}}
            onChange={mockOnChange}
            errors={{}}
          />
        </TestWrapper>
      );

      const textareas = screen.getAllByRole('textbox');
      textareas.forEach((textarea, index) => {
        expect(textarea).toHaveAttribute('id', `nlp-${['positive', 'specific', 'evidence', 'resources', 'obstacles', 'ecology', 'timeline', 'firstStep'][index]}`);
        expect(textarea).toHaveAttribute('aria-describedby');
      });
    });

    test('displays existing answers when provided', () => {
      const mockOnChange = vi.fn();
      const nlpAnswers = {
        positive: 'I will learn TypeScript',
        specific: 'Complete 3 courses by December',
        evidence: 'I will have built 5 projects',
        resources: 'Online courses and books',
        obstacles: 'Time management challenges',
        ecology: 'Will help with career advancement',
        timeline: '3 months, evenings and weekends',
        firstStep: 'Enroll in first course'
      };

      render(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={nlpAnswers}
            onChange={mockOnChange}
            errors={{}}
          />
        </TestWrapper>
      );

      expect(screen.getByDisplayValue('I will learn TypeScript')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Complete 3 courses by December')).toBeInTheDocument();
      expect(screen.getByDisplayValue('I will have built 5 projects')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('calls onChange when user types in textarea', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={{}}
            onChange={mockOnChange}
            errors={{}}
          />
        </TestWrapper>
      );

      const positiveInput = screen.getByLabelText(/state your goal positively/i);
      await user.type(positiveInput, 'I will learn React');

      expect(mockOnChange).toHaveBeenCalledWith({
        positive: 'I will learn React'
      });
    });

    test('updates existing answers when user types', async () => {
      const mockOnChange = vi.fn();
      const nlpAnswers = {
        positive: 'I will learn TypeScript',
        specific: 'Complete 3 courses'
      };

      render(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={nlpAnswers}
            onChange={mockOnChange}
            errors={{}}
          />
        </TestWrapper>
      );

      const specificInput = screen.getByLabelText(/make it specific/i);
      await user.clear(specificInput);
      await user.type(specificInput, 'Complete 5 courses by December');

      expect(mockOnChange).toHaveBeenCalledWith({
        positive: 'I will learn TypeScript',
        specific: 'Complete 5 courses by December'
      });
    });

    test('supports keyboard navigation between questions', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={{}}
            onChange={mockOnChange}
            errors={{}}
          />
        </TestWrapper>
      );

      const firstInput = screen.getByLabelText(/state your goal positively/i);
      firstInput.focus();

      // Tab to next field
      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/make it specific/i)).toHaveFocus();

      await user.keyboard('{Tab}');
      expect(screen.getByLabelText(/how will you know/i)).toHaveFocus();
    });
  });

  describe('Validation', () => {
    test('displays validation errors for individual questions', () => {
      const mockOnChange = vi.fn();
      const errors = {
        positive: 'This question is required',
        specific: 'Answer must be at least 10 characters'
      };

      render(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={{}}
            onChange={mockOnChange}
            errors={errors}
          />
        </TestWrapper>
      );

      expect(screen.getByText('This question is required')).toBeInTheDocument();
      expect(screen.getByText('Answer must be at least 10 characters')).toBeInTheDocument();
    });

    test('applies error styling to invalid fields', () => {
      const mockOnChange = vi.fn();
      const errors = {
        positive: 'This question is required'
      };

      render(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={{}}
            onChange={mockOnChange}
            errors={errors}
          />
        </TestWrapper>
      );

      const positiveInput = screen.getByLabelText(/state your goal positively/i);
      expect(positiveInput).toHaveClass('border-red-500');
    });

    test('announces validation errors to screen readers', () => {
      const mockOnChange = vi.fn();
      const errors = {
        positive: 'This question is required'
      };

      render(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={{}}
            onChange={mockOnChange}
            errors={errors}
          />
        </TestWrapper>
      );

      const errorMessage = screen.getByText('This question is required');
      expect(errorMessage).toHaveAttribute('role', 'alert');
      expect(errorMessage).toHaveAttribute('id', 'error-nlp-positive');
    });
  });

  describe('Accessibility', () => {
    test('has proper ARIA labels and descriptions', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={{}}
            onChange={mockOnChange}
            errors={{}}
          />
        </TestWrapper>
      );

      const textareas = screen.getAllByRole('textbox');
      textareas.forEach((textarea, index) => {
        const questionKeys = ['positive', 'specific', 'evidence', 'resources', 'obstacles', 'ecology', 'timeline', 'firstStep'];
        const questionKey = questionKeys[index];
        
        expect(textarea).toHaveAttribute('id', `nlp-${questionKey}`);
        expect(textarea).toHaveAttribute('aria-describedby', `hint-nlp-${questionKey}`);
      });
    });

    test('provides helpful hints for each question', () => {
      const mockOnChange = vi.fn();
      
      render(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={{}}
            onChange={mockOnChange}
            errors={{}}
          />
        </TestWrapper>
      );

      // Check that hint elements exist
      const hints = screen.getAllByTestId(/hint-nlp-/);
      expect(hints).toHaveLength(8);
    });
  });

  describe('Form Reset', () => {
    test('clears all fields when reset is called', () => {
      const mockOnChange = vi.fn();
      const nlpAnswers = {
        positive: 'I will learn TypeScript',
        specific: 'Complete 3 courses'
      };

      const { rerender } = render(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={nlpAnswers}
            onChange={mockOnChange}
            errors={{}}
          />
        </TestWrapper>
      );

      // Verify answers are displayed
      expect(screen.getByDisplayValue('I will learn TypeScript')).toBeInTheDocument();

      // Reset with empty answers
      rerender(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={{}}
            onChange={mockOnChange}
            errors={{}}
          />
        </TestWrapper>
      );

      // Verify fields are cleared
      expect(screen.queryByDisplayValue('I will learn TypeScript')).not.toBeInTheDocument();
    });
  });

  describe('Error Recovery', () => {
    test('clears errors when user starts typing', async () => {
      const mockOnChange = vi.fn();
      const errors = {
        positive: 'This question is required'
      };

      render(
        <TestWrapper>
          <NLPQuestionsSection 
            nlpAnswers={{}}
            onChange={mockOnChange}
            errors={errors}
          />
        </TestWrapper>
      );

      // Verify error is displayed
      expect(screen.getByText('This question is required')).toBeInTheDocument();

      // User starts typing
      const positiveInput = screen.getByLabelText(/state your goal positively/i);
      await user.type(positiveInput, 'I will learn');

      // Error should be cleared (this would be handled by parent component)
      expect(mockOnChange).toHaveBeenCalledWith({
        positive: 'I will learn'
      });
    });
  });
});
