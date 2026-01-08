/**
 * QuestTemplateCreate Component Tests
 * 
 * Comprehensive unit tests for the QuestTemplateCreate page component,
 * covering form validation, step navigation, and template creation functionality.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import QuestTemplateCreate from '../QuestTemplateCreate';
import { useQuestTemplateCreate } from '@/hooks/useQuestTemplateCreate';
import { useTranslation } from '@/hooks/useTranslation';

// Mock the hooks
vi.mock('@/hooks/useQuestTemplateCreate');
vi.mock('@/hooks/useTranslation');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Mock the logger
vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

const mockUseQuestTemplateCreate = vi.mocked(useQuestTemplateCreate);
const mockUseTranslation = vi.mocked(useTranslation);

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('QuestTemplateCreate', () => {
  const mockCreateTemplate = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockUseQuestTemplateCreate.mockReturnValue({
      createTemplate: mockCreateTemplate,
      loading: false,
      error: null,
      reset: vi.fn(),
    });

    mockUseTranslation.mockReturnValue({
      language: 'en',
      setLanguage: vi.fn(),
      changeLanguage: vi.fn(),
      t: {
        quest: {
          templates: {
            form: {
              title: 'Create Quest Template',
              description: 'Create a reusable template for quests',
              steps: {
                basicInfo: 'Basic Information',
                basicInfoDesc: 'Enter the basic details for your template',
                advancedOptions: 'Advanced Options',
                advancedOptionsDesc: 'Configure privacy, tags, and rewards',
                review: 'Review',
                reviewDesc: 'Review your template before creating',
              },
              step: 'Step',
              of: 'of',
              creating: 'Creating...',
              create: 'Create Template',
              titlePlaceholder: 'Enter template title...',
              descriptionPlaceholder: 'Describe what this template is for...',
              categoryPlaceholder: 'Select category...',
              difficultyPlaceholder: 'Select difficulty...',
              privacyPlaceholder: 'Select privacy...',
              kindPlaceholder: 'Select kind...',
              tagsPlaceholder: 'Add a tag...',
              instructionsPlaceholder: 'Add any specific instructions for using this template...',
            },
            messages: {
              createSuccess: 'Template created successfully!',
              createError: 'Failed to create template',
            },
          },
        },
        common: {
          back: 'Back',
          previous: 'Previous',
          next: 'Next',
        },
      },
      isLanguageLoading: false,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the template creation form', () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      expect(screen.getByText('Create Quest Template')).toBeInTheDocument();
      expect(screen.getByText('Create a reusable template for quests')).toBeInTheDocument();
    });

    it('renders the step progress indicator', () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
      // Check step progress indicator - use getAllByText to handle duplicates
      const basicInfoElements = screen.getAllByText('Basic Information');
      expect(basicInfoElements.length).toBeGreaterThan(0);
      
      const advancedOptionsElements = screen.getAllByText('Advanced Options');
      expect(advancedOptionsElements.length).toBeGreaterThan(0);
      
      const reviewElements = screen.getAllByText('Review');
      expect(reviewElements.length).toBeGreaterThan(0);
    });

    it('renders the first step form fields', () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      expect(screen.getByLabelText(/Create Quest Template/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Create a reusable template for quests/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Category/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Difficulty/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
        it('shows validation errors for required fields', async () => {
          renderWithProviders(<QuestTemplateCreate />);
          
          const nextButton = screen.getByText('Next');
          fireEvent.click(nextButton);
          
          // Wait for validation to complete and error messages to be displayed
          await waitFor(() => {
            expect(screen.getByText('Please fix the errors before continuing')).toBeInTheDocument();
            expect(screen.getByText('Title is required')).toBeInTheDocument();
            expect(screen.getByText('Description is required')).toBeInTheDocument();
            expect(screen.getByText('Category is required')).toBeInTheDocument();
            expect(screen.getByText('Difficulty is required')).toBeInTheDocument();
          }, { timeout: 5000 });
        });

    it('validates title length', async () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      const titleInput = screen.getByLabelText(/Create Quest Template/i);
      fireEvent.change(titleInput, { target: { value: 'a'.repeat(101) } });
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Title must be less than 100 characters')).toBeInTheDocument();
      });
    });

    it('validates description length', async () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      const descriptionInput = screen.getByLabelText(/Create a reusable template for quests/i);
      fireEvent.change(descriptionInput, { target: { value: 'a'.repeat(501) } });
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Description must be less than 500 characters')).toBeInTheDocument();
      });
    });

    it('shows calculated XP reward based on difficulty', async () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      // Fill basic info first
      fireEvent.change(screen.getByLabelText(/Create Quest Template/i), { target: { value: 'Test Template' } });
      fireEvent.change(screen.getByLabelText(/Create a reusable template for quests/i), { target: { value: 'Test Description' } });
      fireEvent.click(screen.getByLabelText(/Category/i));
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByLabelText(/Difficulty/i));
      fireEvent.click(screen.getByText('Medium'));
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      // XP should be calculated automatically and displayed as text
      await waitFor(() => {
        expect(screen.getByText('100 XP')).toBeInTheDocument();
        expect(screen.getByTestId('xp-calculation-note')).toBeInTheDocument();
      });
    });

    it('updates XP reward when difficulty changes', async () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      // Fill basic info first
      fireEvent.change(screen.getByLabelText(/Create Quest Template/i), { target: { value: 'Test Template' } });
      fireEvent.change(screen.getByLabelText(/Create a reusable template for quests/i), { target: { value: 'Test Description' } });
      fireEvent.click(screen.getByLabelText(/Category/i));
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByLabelText(/Difficulty/i));
      fireEvent.click(screen.getByText('Easy'));
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      // Should show 50 XP for easy difficulty
      await waitFor(() => {
        expect(screen.getByText('50 XP')).toBeInTheDocument();
      });
      
      // Go back and change difficulty
      fireEvent.click(screen.getByText('Previous'));
      fireEvent.click(screen.getByLabelText(/Difficulty/i));
      fireEvent.click(screen.getByText('Hard'));
      
      fireEvent.click(screen.getByText('Next'));
      
      // Should now show 200 XP for hard difficulty
      await waitFor(() => {
        expect(screen.getByText('200 XP')).toBeInTheDocument();
      });
    });
  });

  describe('Step Navigation', () => {
    it('navigates to next step when validation passes', async () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      // Fill basic info
      fireEvent.change(screen.getByLabelText(/Create Quest Template/i), { target: { value: 'Test Template' } });
      fireEvent.change(screen.getByLabelText(/Create a reusable template for quests/i), { target: { value: 'Test Description' } });
      fireEvent.click(screen.getByLabelText(/Category/i));
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByLabelText(/Difficulty/i));
      fireEvent.click(screen.getByText('Medium'));
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
        // Use getAllByText to handle duplicate text
        const configElements = screen.getAllByText('Configure privacy, tags, and rewards');
        expect(configElements.length).toBeGreaterThan(0);
      });
    });

    it('navigates to previous step', async () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      // Go to step 2 first
      fireEvent.change(screen.getByLabelText(/Create Quest Template/i), { target: { value: 'Test Template' } });
      fireEvent.change(screen.getByLabelText(/Create a reusable template for quests/i), { target: { value: 'Test Description' } });
      fireEvent.click(screen.getByLabelText(/Category/i));
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByLabelText(/Difficulty/i));
      fireEvent.click(screen.getByText('Medium'));
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
      });
      
      // Go back to step 1
      const previousButton = screen.getByText('Previous');
      fireEvent.click(previousButton);
      
      await waitFor(() => {
        expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
      });
    });

    it('disables previous button on first step', () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      const previousButton = screen.getByText('Previous');
      expect(previousButton).toBeDisabled();
    });
  });

  describe('Tag Management', () => {
    it('adds tags when clicking add button', async () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      // Go to step 2
      fireEvent.change(screen.getByLabelText(/Create Quest Template/i), { target: { value: 'Test Template' } });
      fireEvent.change(screen.getByLabelText(/Create a reusable template for quests/i), { target: { value: 'Test Description' } });
      fireEvent.click(screen.getByLabelText(/Category/i));
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByLabelText(/Difficulty/i));
      fireEvent.click(screen.getByText('Medium'));
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
        // Use getAllByText to handle duplicate text
        const configElements = screen.getAllByText('Configure privacy, tags, and rewards');
        expect(configElements.length).toBeGreaterThan(0);
      });
      
      // Add a tag
      const tagInput = screen.getByPlaceholderText('Add a tag...');
      fireEvent.change(tagInput, { target: { value: 'test-tag' } });
      
      // Find the add button by its position relative to the tag input
      const addButton = tagInput.parentElement?.querySelector('button[type="button"]');
      if (!addButton) {
        throw new Error('Add button not found');
      }
      fireEvent.click(addButton);
      
      await waitFor(() => {
        expect(screen.getByText('test-tag')).toBeInTheDocument();
      });
    });

    it('adds tags when pressing Enter', async () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      // Go to step 2
      fireEvent.change(screen.getByLabelText(/Create Quest Template/i), { target: { value: 'Test Template' } });
      fireEvent.change(screen.getByLabelText(/Create a reusable template for quests/i), { target: { value: 'Test Description' } });
      fireEvent.click(screen.getByLabelText(/Category/i));
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByLabelText(/Difficulty/i));
      fireEvent.click(screen.getByText('Medium'));
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
        // Use getAllByText to handle duplicate text
        const configElements = screen.getAllByText('Configure privacy, tags, and rewards');
        expect(configElements.length).toBeGreaterThan(0);
      });
      
      // Add a tag
      const tagInput = screen.getByPlaceholderText('Add a tag...');
      fireEvent.change(tagInput, { target: { value: 'test-tag' } });
      fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByText('test-tag')).toBeInTheDocument();
      });
    });

    it('removes tags when clicking remove button', async () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      // Go to step 2 and add a tag
      fireEvent.change(screen.getByLabelText(/Create Quest Template/i), { target: { value: 'Test Template' } });
      fireEvent.change(screen.getByLabelText(/Create a reusable template for quests/i), { target: { value: 'Test Description' } });
      fireEvent.click(screen.getByLabelText(/Category/i));
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByLabelText(/Difficulty/i));
      fireEvent.click(screen.getByText('Medium'));
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const tagInput = screen.getByPlaceholderText('Add a tag...');
        fireEvent.change(tagInput, { target: { value: 'test-tag' } });
        
        const addButton = tagInput.parentElement?.querySelector('button[type="button"]');
        if (addButton) {
          fireEvent.click(addButton);
        }
        
        expect(screen.getByText('test-tag')).toBeInTheDocument();
        
        // Remove the tag
        const removeButton = screen.getByRole('button', { name: /remove test-tag tag/i });
        fireEvent.click(removeButton);
        
        expect(screen.queryByText('test-tag')).not.toBeInTheDocument();
      });
    });

    it('limits tags to maximum of 10', async () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      // Go to step 2
      fireEvent.change(screen.getByLabelText(/Create Quest Template/i), { target: { value: 'Test Template' } });
      fireEvent.change(screen.getByLabelText(/Create a reusable template for quests/i), { target: { value: 'Test Description' } });
      fireEvent.click(screen.getByLabelText(/Category/i));
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByLabelText(/Difficulty/i));
      fireEvent.click(screen.getByText('Medium'));
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const tagInput = screen.getByPlaceholderText('Add a tag...');
        // Find the add button by its position relative to the tag input
        const addButton = tagInput.parentElement?.querySelector('button[type="button"]');
        if (!addButton) {
          throw new Error('Add button not found');
        }
        
        // Add 10 tags
        for (let i = 0; i < 10; i++) {
          fireEvent.change(tagInput, { target: { value: `tag-${i}` } });
          fireEvent.click(addButton);
        }
        
        // Try to add one more
        fireEvent.change(tagInput, { target: { value: 'tag-10' } });
        expect(addButton).toBeDisabled();
      });
    });
  });

  describe('Template Creation', () => {
    it('creates template when form is valid', async () => {
      mockCreateTemplate.mockResolvedValue({ id: 'template-1', title: 'Test Template' });
      
      renderWithProviders(<QuestTemplateCreate />);
      
      // Fill all required fields
      fireEvent.change(screen.getByLabelText(/Create Quest Template/i), { target: { value: 'Test Template' } });
      fireEvent.change(screen.getByLabelText(/Create a reusable template for quests/i), { target: { value: 'Test Description' } });
      fireEvent.click(screen.getByLabelText(/Category/i));
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByLabelText(/Difficulty/i));
      fireEvent.click(screen.getByText('Medium'));
      
      // Go to step 2
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        // Fill step 2 fields
        fireEvent.click(screen.getByLabelText(/Privacy/i));
        fireEvent.click(screen.getByText('Public'));
        fireEvent.click(screen.getByLabelText(/Kind/i));
        fireEvent.click(screen.getByText('Linked Quest'));
        
        // Fill estimated duration
        const durationInput = screen.getByLabelText(/Estimated Duration/i);
        fireEvent.change(durationInput, { target: { value: '7' } });
        
        // Go to step 3
        const nextButton2 = screen.getByText('Next');
        fireEvent.click(nextButton2);
      });
      
      await waitFor(() => {
        // Submit the form
        const createButton = screen.getByText('Create Template');
        fireEvent.click(createButton);
      });
      
      await waitFor(() => {
        expect(mockCreateTemplate).toHaveBeenCalledWith({
          title: 'Test Template',
          description: 'Test Description',
          category: 'Fitness',
          difficulty: 'medium',
          privacy: 'public',
          kind: 'linked',
          tags: [],
          rewardXp: 100, // Auto-calculated based on medium difficulty
          estimatedDuration: 7,
          instructions: '',
        });
      });
    });

    it('shows loading state during template creation', async () => {
      mockUseQuestTemplateCreate.mockReturnValue({
        createTemplate: mockCreateTemplate,
        loading: true,
        error: null,
        reset: vi.fn(),
      });
      
      renderWithProviders(<QuestTemplateCreate />);
      
      // Navigate to the last step to see the loading state
      fireEvent.change(screen.getByLabelText(/Create Quest Template/i), { target: { value: 'Test Template' } });
      fireEvent.change(screen.getByLabelText(/Create a reusable template for quests/i), { target: { value: 'Test Description' } });
      fireEvent.click(screen.getByLabelText(/Category/i));
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByLabelText(/Difficulty/i));
      fireEvent.click(screen.getByText('Medium'));
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        fireEvent.click(screen.getByLabelText(/Privacy/i));
        fireEvent.click(screen.getByText('Public'));
        fireEvent.click(screen.getByLabelText(/Kind/i));
        fireEvent.click(screen.getByText('Linked Quest'));
        
        const nextButton2 = screen.getByText('Next');
        fireEvent.click(nextButton2);
      });
      
      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
      });
    });

    it('shows error message when template creation fails', async () => {
      const error = new Error('Creation failed');
      mockUseQuestTemplateCreate.mockReturnValue({
        createTemplate: mockCreateTemplate,
        loading: false,
        error,
        reset: vi.fn(),
      });
      
      renderWithProviders(<QuestTemplateCreate />);
      
      expect(screen.getByText('Creation failed')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels for form fields', () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      const titleInput = screen.getByLabelText(/Create Quest Template/i);
      expect(titleInput).toHaveAttribute('aria-invalid', 'false');
      
      const descriptionInput = screen.getByLabelText(/Create a reusable template for quests/i);
      expect(descriptionInput).toHaveAttribute('aria-invalid', 'false');
    });

    it('announces validation errors to screen readers', async () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        const titleInput = screen.getByLabelText(/Create Quest Template/i);
        expect(titleInput).toHaveAttribute('aria-invalid', 'true');
        expect(titleInput).toHaveAttribute('aria-describedby', 'error-title');
      });
    });

    it('has proper live region for announcements', () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      const liveRegion = document.querySelector('[aria-live]');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Progress Indicator', () => {
    it('shows correct progress percentage', () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('updates progress when navigating steps', async () => {
      renderWithProviders(<QuestTemplateCreate />);
      
      // Fill basic info and go to step 2
      fireEvent.change(screen.getByLabelText(/Create Quest Template/i), { target: { value: 'Test Template' } });
      fireEvent.change(screen.getByLabelText(/Create a reusable template for quests/i), { target: { value: 'Test Description' } });
      fireEvent.click(screen.getByLabelText(/Category/i));
      fireEvent.click(screen.getByText('Fitness'));
      fireEvent.click(screen.getByLabelText(/Difficulty/i));
      fireEvent.click(screen.getByText('Medium'));
      
      const nextButton = screen.getByText('Next');
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText('67%')).toBeInTheDocument();
      });
    });
  });
});
