import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ProfileEdit from '../ProfileEdit';
import { checkNicknameAvailability } from '@/lib/apiProfile';

// Mock the API module
vi.mock('@/lib/apiProfile', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  checkNicknameAvailability: vi.fn(),
  getCountries: vi.fn(),
}));

// Mock the GraphQL API module
vi.mock('@/lib/api', () => ({
  isNicknameAvailableForUser: vi.fn(),
  graphqlRaw: vi.fn(),
}));

// Mock the translation hook
vi.mock('@/i18n/translations', () => ({
  useTranslation: () => ({
    t: {
      profile: {
        title: 'Edit Profile',
        subtitle: 'Update your profile information',
        basicInfo: {
          title: 'Basic Information',
          fullName: { label: 'Full Name', placeholder: 'Enter your full name' },
          nickname: { label: 'Nickname', placeholder: 'Enter your nickname', help: 'Choose a unique nickname' },
          birthDate: { label: 'Birth Date', placeholder: 'Select your birth date' },
        },
        location: {
          title: 'Location & Identity',
          country: { label: 'Country', placeholder: 'Select your country' },
          language: { label: 'Language' },
        },
        identity: {
          title: 'Identity',
          gender: { label: 'Gender', placeholder: 'Select your gender' },
          pronouns: { label: 'Pronouns', placeholder: 'Enter your pronouns' },
        },
        about: {
          title: 'About',
          bio: { label: 'Bio', placeholder: 'Tell us about yourself', help: 'Optional' },
          tags: { label: 'Tags', placeholder: 'Enter tags separated by commas', help: 'Optional' },
        },
        actions: {
          save: 'Save Changes',
          cancel: 'Cancel',
          reset: 'Reset',
        },
        validation: {
          required: 'This field is required',
          nicknameTaken: 'This nickname is already taken',
          invalidFormat: 'Invalid format',
          tooLong: 'Too long',
        },
        messages: {
          saveSuccess: 'Profile updated successfully',
          saveError: 'Failed to update profile',
          loading: 'Loading profile...',
        },
      },
    },
  }),
}));

// Mock the countries data
vi.mock('@/i18n/countries', () => ({
  getCountries: () => [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'MX', name: 'Mexico' },
  ],
}));

const mockCheckNicknameAvailability = vi.mocked(checkNicknameAvailability);

// Mock user profile data
const mockUserProfile = {
  id: 'user123',
  email: 'test@example.com',
  role: 'user' as const,
  fullName: 'John Doe',
  nickname: 'johndoe',
  birthDate: '1990-01-01',
  status: 'active',
  country: 'US',
  language: 'en',
  gender: 'male',
  pronouns: 'he/him',
  bio: 'Test bio',
  tags: ['developer', 'gamer'],
  tier: 'free',
  provider: 'local',
  email_confirmed: true,
  createdAt: 1640995200,
  updatedAt: 1640995200,
};

const renderProfileEdit = () => {
  return render(
    <BrowserRouter>
      <ProfileEdit />
    </BrowserRouter>
  );
};

describe('ProfileEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful profile fetch
    vi.mocked(require('@/lib/apiProfile').getProfile).mockResolvedValue(mockUserProfile);
    // Mock successful countries fetch
    vi.mocked(require('@/i18n/countries').getCountries).mockReturnValue([
      { code: 'US', name: 'United States' },
      { code: 'CA', name: 'Canada' },
    ]);
  });

  describe('Nickname Validation', () => {
    it('should not check availability when nickname equals current user nickname', async () => {
      renderProfileEdit();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
      });

      const nicknameInput = screen.getByDisplayValue('johndoe');
      
      // Clear and retype the same nickname
      fireEvent.change(nicknameInput, { target: { value: '' } });
      fireEvent.change(nicknameInput, { target: { value: 'johndoe' } });

      // Wait for any debounced validation
      await waitFor(() => {
        expect(mockCheckNicknameAvailability).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should check availability when nickname is different from current user nickname', async () => {
      mockCheckNicknameAvailability.mockResolvedValue(true);
      
      renderProfileEdit();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
      });

      const nicknameInput = screen.getByDisplayValue('johndoe');
      
      // Change to a different nickname
      fireEvent.change(nicknameInput, { target: { value: 'newuser' } });

      // Wait for debounced validation
      await waitFor(() => {
        expect(mockCheckNicknameAvailability).toHaveBeenCalledWith('newuser');
      }, { timeout: 1000 });
    });

    it('should show validation error when new nickname is taken', async () => {
      mockCheckNicknameAvailability.mockResolvedValue(false);
      
      renderProfileEdit();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
      });

      const nicknameInput = screen.getByDisplayValue('johndoe');
      
      // Change to a taken nickname
      fireEvent.change(nicknameInput, { target: { value: 'takenuser' } });

      // Wait for validation error
      await waitFor(() => {
        expect(screen.getByText('This nickname is already taken')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('should show success when new nickname is available', async () => {
      mockCheckNicknameAvailability.mockResolvedValue(true);
      
      renderProfileEdit();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
      });

      const nicknameInput = screen.getByDisplayValue('johndoe');
      
      // Change to an available nickname
      fireEvent.change(nicknameInput, { target: { value: 'availableuser' } });

      // Wait for validation
      await waitFor(() => {
        expect(mockCheckNicknameAvailability).toHaveBeenCalledWith('availableuser');
      }, { timeout: 1000 });

      // Should not show error message
      expect(screen.queryByText('This nickname is already taken')).not.toBeInTheDocument();
    });

    it('should handle validation errors gracefully', async () => {
      mockCheckNicknameAvailability.mockRejectedValue(new Error('API Error'));
      
      renderProfileEdit();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
      });

      const nicknameInput = screen.getByDisplayValue('johndoe');
      
      // Change to a different nickname
      fireEvent.change(nicknameInput, { target: { value: 'newuser' } });

      // Wait for validation attempt
      await waitFor(() => {
        expect(mockCheckNicknameAvailability).toHaveBeenCalledWith('newuser');
      }, { timeout: 1000 });

      // Should not show error message for API errors (graceful handling)
      expect(screen.queryByText('This nickname is already taken')).not.toBeInTheDocument();
    });

    it('should not validate empty nickname', async () => {
      renderProfileEdit();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
      });

      const nicknameInput = screen.getByDisplayValue('johndoe');
      
      // Clear the nickname
      fireEvent.change(nicknameInput, { target: { value: '' } });

      // Wait for any debounced validation
      await waitFor(() => {
        expect(mockCheckNicknameAvailability).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });

    it('should not validate whitespace-only nickname', async () => {
      renderProfileEdit();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
      });

      const nicknameInput = screen.getByDisplayValue('johndoe');
      
      // Enter whitespace
      fireEvent.change(nicknameInput, { target: { value: '   ' } });

      // Wait for any debounced validation
      await waitFor(() => {
        expect(mockCheckNicknameAvailability).not.toHaveBeenCalled();
      }, { timeout: 1000 });
    });
  });

  describe('Form Rendering', () => {
    it('should render all profile fields with correct labels', async () => {
      renderProfileEdit();

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
        expect(screen.getByText('Basic Information')).toBeInTheDocument();
        expect(screen.getByText('Location & Identity')).toBeInTheDocument();
        expect(screen.getByText('Identity')).toBeInTheDocument();
        expect(screen.getByText('About')).toBeInTheDocument();
      });

      // Check form fields
      expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
      expect(screen.getByLabelText('Nickname')).toBeInTheDocument();
      expect(screen.getByLabelText('Birth Date')).toBeInTheDocument();
      expect(screen.getByLabelText('Country')).toBeInTheDocument();
      expect(screen.getByLabelText('Language')).toBeInTheDocument();
      expect(screen.getByLabelText('Gender')).toBeInTheDocument();
      expect(screen.getByLabelText('Pronouns')).toBeInTheDocument();
      expect(screen.getByLabelText('Bio')).toBeInTheDocument();
      expect(screen.getByLabelText('Tags')).toBeInTheDocument();
    });

    it('should populate form with current user data', async () => {
      renderProfileEdit();

      await waitFor(() => {
        expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
        expect(screen.getByDisplayValue('1990-01-01')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Test bio')).toBeInTheDocument();
        expect(screen.getByDisplayValue('developer, gamer')).toBeInTheDocument();
      });
    });
  });
});