/**
 * GuildCreationForm Component Tests
 *
 * Comprehensive unit tests for the GuildCreationForm component,
 * including form validation, user interactions, and accessibility.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuildCreationForm } from '../GuildCreationForm';
import { guildAPI } from '@/lib/api/guild';

// Mock the API
vi.mock('@/lib/api/guild', () => ({
  guildAPI: {
    createGuild: vi.fn(),
  },
}));

// Mock the translation hook
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: vi.fn(),
  }),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('GuildCreationForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();
  const mockCreateGuild = vi.mocked(guildAPI.createGuild);

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateGuild.mockResolvedValue({
      guildId: 'test-guild-id',
      name: 'Test Guild',
      description: 'Test description',
      createdBy: 'current-user-id',
      createdAt: new Date().toISOString(),
      memberCount: 1,
      goalCount: 0,
      questCount: 0,
      isPublic: true,
      tags: ['test'],
    });
  });

  const renderComponent = (props = {}) => {
    return render(
      <GuildCreationForm
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render the form with all required fields', () => {
      renderComponent();

      expect(screen.getByText('Create Guild')).toBeInTheDocument();
      expect(screen.getByText('Build a community around shared goals and interests')).toBeInTheDocument();
      expect(screen.getByLabelText(/Guild Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Tags/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Make guild public/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Guild/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument();
    });

    it('should render in edit mode when specified', () => {
      renderComponent({ mode: 'edit' });

      expect(screen.getByText('Edit Guild')).toBeInTheDocument();
    });

    it('should populate form with initial data', () => {
      const initialData = {
        name: 'Initial Guild',
        description: 'Initial description',
        tags: ['initial', 'guild'],
        isPublic: false,
      };

      renderComponent({ initialData });

      expect(screen.getByDisplayValue('Initial Guild')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Initial description')).toBeInTheDocument();
      expect(screen.getByText('initial')).toBeInTheDocument();
      expect(screen.getByText('guild')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should show validation errors for invalid input', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameInput = screen.getByLabelText(/Guild Name/);
      const submitButton = screen.getByRole('button', { name: /Create Guild/ });

      // Test empty name
      await user.clear(nameInput);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Guild name must be at least 3 characters long/)).toBeInTheDocument();
      });

      // Test name too short
      await user.type(nameInput, 'ab');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Guild name must be at least 3 characters long/)).toBeInTheDocument();
      });

      // Test name too long
      await user.clear(nameInput);
      await user.type(nameInput, 'a'.repeat(51));
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Guild name must be less than 50 characters/)).toBeInTheDocument();
      });

      // Test invalid characters
      await user.clear(nameInput);
      await user.type(nameInput, 'Test@Guild');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Guild name can only contain letters, numbers, spaces, hyphens, and underscores/)).toBeInTheDocument();
      });
    });

    it('should clear validation errors when user starts typing', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameInput = screen.getByLabelText(/Guild Name/);
      const submitButton = screen.getByRole('button', { name: /Create Guild/ });

      // Trigger validation error
      await user.clear(nameInput);
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Guild name must be at least 3 characters long/)).toBeInTheDocument();
      });

      // Start typing valid input
      await user.type(nameInput, 'Valid Guild Name');

      await waitFor(() => {
        expect(screen.queryByText(/Guild name must be at least 3 characters long/)).not.toBeInTheDocument();
      });
    });

    it('should validate description length', async () => {
      const user = userEvent.setup();
      renderComponent();

      const descriptionInput = screen.getByLabelText(/Description/);
      const submitButton = screen.getByRole('button', { name: /Create Guild/ });

      // Test description too long
      await user.type(descriptionInput, 'a'.repeat(501));
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Description must be less than 500 characters/)).toBeInTheDocument();
      });
    });

    it('should validate tag limits', async () => {
      const user = userEvent.setup();
      renderComponent();

      const tagInput = screen.getByLabelText(/Tags/);
      const submitButton = screen.getByRole('button', { name: /Create Guild/ });

      // Add too many tags
      for (let i = 0; i < 11; i++) {
        await user.type(tagInput, `tag${i}`);
        await user.keyboard('{Enter}');
      }

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Maximum 10 tags allowed/)).toBeInTheDocument();
      });
    });
  });

  describe('Tag Input Functionality', () => {
    it('should add tags when user types and presses Enter', async () => {
      const user = userEvent.setup();
      renderComponent();

      const tagInput = screen.getByLabelText(/Tags/);

      await user.type(tagInput, 'test-tag');
      await user.keyboard('{Enter}');

      expect(screen.getByText('test-tag')).toBeInTheDocument();
      expect(tagInput).toHaveValue('');
    });

    it('should add tags when user types and presses comma', async () => {
      const user = userEvent.setup();
      renderComponent();

      const tagInput = screen.getByLabelText(/Tags/);

      await user.type(tagInput, 'test,tag');
      await user.keyboard(',');

      expect(screen.getByText('test')).toBeInTheDocument();
      expect(screen.getByText('tag')).toBeInTheDocument();
    });

    it('should remove tags when user clicks the X button', async () => {
      const user = userEvent.setup();
      renderComponent();

      const tagInput = screen.getByLabelText(/Tags/);

      // Add a tag
      await user.type(tagInput, 'test-tag');
      await user.keyboard('{Enter}');

      expect(screen.getByText('test-tag')).toBeInTheDocument();

      // Remove the tag
      const removeButton = screen.getByLabelText(/Remove test-tag tag/);
      await user.click(removeButton);

      expect(screen.queryByText('test-tag')).not.toBeInTheDocument();
    });

    it('should remove last tag when user presses Backspace on empty input', async () => {
      const user = userEvent.setup();
      renderComponent();

      const tagInput = screen.getByLabelText(/Tags/);

      // Add tags
      await user.type(tagInput, 'tag1');
      await user.keyboard('{Enter}');
      await user.type(tagInput, 'tag2');
      await user.keyboard('{Enter}');

      expect(screen.getByText('tag1')).toBeInTheDocument();
      expect(screen.getByText('tag2')).toBeInTheDocument();

      // Clear input and press Backspace
      await user.clear(tagInput);
      await user.keyboard('{Backspace}');

      expect(screen.queryByText('tag2')).not.toBeInTheDocument();
      expect(screen.getByText('tag1')).toBeInTheDocument();
    });

    it('should show tag suggestions', async () => {
      const user = userEvent.setup();
      renderComponent();

      const tagInput = screen.getByLabelText(/Tags/);

      await user.type(tagInput, 'fit');

      // Should show suggestions containing 'fit'
      await waitFor(() => {
        expect(screen.getByText('fitness')).toBeInTheDocument();
      });
    });

    it('should disable tag input when maximum tags reached', async () => {
      const user = userEvent.setup();
      renderComponent();

      const tagInput = screen.getByLabelText(/Tags/);

      // Add maximum tags
      for (let i = 0; i < 10; i++) {
        await user.type(tagInput, `tag${i}`);
        await user.keyboard('{Enter}');
      }

      expect(tagInput).toBeDisabled();
      expect(tagInput).toHaveAttribute('placeholder', 'Maximum 10 tags reached');
    });
  });

  describe('Public/Private Toggle', () => {
    it('should toggle between public and private', async () => {
      const user = userEvent.setup();
      renderComponent();

      const toggle = screen.getByLabelText(/Make guild public/);
      const publicIcon = screen.getByText(/Public - Anyone can discover and join/);
      const privateIcon = screen.getByText(/Private - Invite-only access/);

      // Initially public
      expect(toggle).toBeChecked();
      expect(publicIcon).toBeInTheDocument();
      expect(privateIcon).not.toBeInTheDocument();

      // Toggle to private
      await user.click(toggle);

      expect(toggle).not.toBeChecked();
      expect(publicIcon).not.toBeInTheDocument();
      expect(privateIcon).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameInput = screen.getByLabelText(/Guild Name/);
      const descriptionInput = screen.getByLabelText(/Description/);
      const tagInput = screen.getByLabelText(/Tags/);
      const submitButton = screen.getByRole('button', { name: /Create Guild/ });

      // Fill form
      await user.type(nameInput, 'Test Guild');
      await user.type(descriptionInput, 'Test description');
      await user.type(tagInput, 'test');
      await user.keyboard('{Enter}');

      // Submit form
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockCreateGuild).toHaveBeenCalledWith({
          name: 'Test Guild',
          description: 'Test description',
          tags: ['test'],
          isPublic: true,
        });
      });

      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameInput = screen.getByLabelText(/Guild Name/);
      const submitButton = screen.getByRole('button', { name: /Create Guild/ });

      // Fill minimal form
      await user.type(nameInput, 'Test Guild');

      // Submit form
      await user.click(submitButton);

      // Should show loading state
      expect(screen.getByText(/Creating.../)).toBeInTheDocument();
      expect(submitButton).toBeDisabled();
    });

    it('should handle submission errors', async () => {
      const user = userEvent.setup();
      const errorMessage = 'Guild name is already taken';
      mockCreateGuild.mockRejectedValueOnce(new Error(errorMessage));

      renderComponent();

      const nameInput = screen.getByLabelText(/Guild Name/);
      const submitButton = screen.getByRole('button', { name: /Create Guild/ });

      // Fill form
      await user.type(nameInput, 'Test Guild');

      // Submit form
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Guild name is already taken/)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it('should not submit form with invalid data', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameInput = screen.getByLabelText(/Guild Name/);
      const submitButton = screen.getByRole('button', { name: /Create Guild/ });

      // Fill with invalid data
      await user.type(nameInput, 'ab'); // too short

      // Submit button should be disabled
      expect(submitButton).toBeDisabled();

      // Try to submit
      await user.click(submitButton);

      expect(mockCreateGuild).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderComponent();

      const cancelButton = screen.getByRole('button', { name: /Cancel/ });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('should show confirmation when canceling with dirty form', async () => {
      const user = userEvent.setup();
      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      renderComponent();

      const nameInput = screen.getByLabelText(/Guild Name/);
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });

      // Make form dirty
      await user.type(nameInput, 'Test Guild');

      // Try to cancel
      await user.click(cancelButton);

      expect(confirmSpy).toHaveBeenCalledWith('Are you sure you want to cancel? Your changes will be lost.');
      expect(mockOnCancel).toHaveBeenCalled();

      confirmSpy.mockRestore();
    });

    it('should not cancel when user declines confirmation', async () => {
      const user = userEvent.setup();
      // Mock window.confirm to return false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      renderComponent();

      const nameInput = screen.getByLabelText(/Guild Name/);
      const cancelButton = screen.getByRole('button', { name: /Cancel/ });

      // Make form dirty
      await user.type(nameInput, 'Test Guild');

      // Try to cancel
      await user.click(cancelButton);

      expect(confirmSpy).toHaveBeenCalled();
      expect(mockOnCancel).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and descriptions', () => {
      renderComponent();

      const nameInput = screen.getByLabelText(/Guild Name/);
      const descriptionInput = screen.getByLabelText(/Description/);
      const tagInput = screen.getByLabelText(/Tags/);
      const toggle = screen.getByLabelText(/Make guild public/);

      expect(nameInput).toHaveAttribute('aria-describedby');
      expect(descriptionInput).toHaveAttribute('aria-describedby');
      expect(tagInput).toHaveAttribute('id', 'tags-input');
      expect(toggle).toHaveAttribute('aria-describedby');
    });

    it('should show error messages with proper ARIA attributes', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameInput = screen.getByLabelText(/Guild Name/);
      const submitButton = screen.getByRole('button', { name: /Create Guild/ });

      // Trigger validation error
      await user.clear(nameInput);
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/Guild name must be at least 3 characters long/);
        expect(errorMessage).toHaveAttribute('role', 'alert');
        expect(errorMessage).toHaveAttribute('id', 'guild-name-error');
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
        expect(nameInput).toHaveAttribute('aria-describedby', 'guild-name-error');
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderComponent();

      const nameInput = screen.getByLabelText(/Guild Name/);
      const descriptionInput = screen.getByLabelText(/Description/);
      const tagInput = screen.getByLabelText(/Tags/);

      // Tab through form elements
      await user.tab();
      expect(nameInput).toHaveFocus();

      await user.tab();
      expect(descriptionInput).toHaveFocus();

      await user.tab();
      expect(tagInput).toHaveFocus();
    });
  });
});

