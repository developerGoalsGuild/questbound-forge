import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { TranslationProvider } from '@/hooks/useTranslation';
import ProfileEdit from '../ProfileEdit';
import { checkNicknameAvailability, getProfile } from '@/lib/apiProfile';
import { getCurrentSubscription, createCheckoutSession } from '@/lib/api/subscription';

// Mock the API module
vi.mock('@/lib/apiProfile', () => ({
  getProfile: vi.fn(),
  updateProfile: vi.fn(),
  checkNicknameAvailability: vi.fn(),
  getCountries: vi.fn(() => [
    { code: 'US', name: 'United States' },
    { code: 'CA', name: 'Canada' },
    { code: 'MX', name: 'Mexico' },
  ]),
}));

vi.mock('@/lib/api/subscription', () => ({
  getCurrentSubscription: vi.fn(),
  createCheckoutSession: vi.fn(),
  updateSubscriptionPlan: vi.fn(),
}));

// Mock the GraphQL API module
vi.mock('@/lib/api', () => ({
  isNicknameAvailableForUser: vi.fn(),
  graphqlRaw: vi.fn(),
}));

// Mock the countries module
const mockCountries = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'MX', name: 'Mexico' },
];

vi.mock('@/i18n/countries', () => ({
  getCountries: vi.fn(() => mockCountries),
}));

// Mock the translation hook
vi.mock('@/i18n/translations', () => ({
  translations: {
    en: {
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
  },
}));

// Mock the useTranslation hook
vi.mock('@/hooks/useTranslation', () => ({
  TranslationProvider: ({ children }: any) => <>{children}</>,
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
    language: 'en',
  }),
}));

// Mock the user context
vi.mock('@/hooks/useUser', () => ({
  useUser: () => ({
    user: mockUserProfile,
    isLoading: false,
    error: null,
  }),
}));

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

const mockCheckNicknameAvailability = vi.mocked(checkNicknameAvailability);

  const createQueryClient = () =>
    new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

  const renderProfileEdit = () => {
    const queryClient = createQueryClient();
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <TranslationProvider>
            <ProfileEdit />
          </TranslationProvider>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

describe('ProfileEdit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful profile fetch
    vi.mocked(getProfile).mockResolvedValue(mockUserProfile);
    // Mock successful nickname availability check
    mockCheckNicknameAvailability.mockResolvedValue(true);
    vi.mocked(getCurrentSubscription).mockResolvedValue({
      subscription_id: null,
      plan_tier: null,
      status: null,
      stripe_customer_id: null,
      current_period_start: null,
      current_period_end: null,
      cancel_at_period_end: false,
      has_active_subscription: false,
    });
    vi.mocked(createCheckoutSession).mockResolvedValue({
      session_id: 'cs_123',
      url: 'https://checkout.example.com/session',
    });
  });

  describe('Nickname Validation', () => {
    it('should not check availability when nickname equals current user nickname', async () => {
      renderProfileEdit();

      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByDisplayValue('johndoe')).toBeInTheDocument();
      }, { timeout: 3000 });

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
      }, { timeout: 3000 });

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
      }, { timeout: 3000 });

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
      }, { timeout: 3000 });

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
      }, { timeout: 3000 });

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
      }, { timeout: 3000 });

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
      }, { timeout: 3000 });

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
      }, { timeout: 3000 });

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
        // Tags are displayed as individual chips, not as a comma-separated string
        expect(screen.getByText('developer')).toBeInTheDocument();
        expect(screen.getByText('gamer')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should render subscription plans when tab is selected', async () => {
      renderProfileEdit();

      await waitFor(() => {
        expect(screen.getByText('Edit Profile')).toBeInTheDocument();
      }, { timeout: 3000 });

      fireEvent.click(screen.getByRole('tab', { name: 'Subscription' }));

      await waitFor(() => {
        expect(screen.getByText('Subscription Plans')).toBeInTheDocument();
        expect(screen.getByText('INITIATE')).toBeInTheDocument();
      }, { timeout: 3000 });

      expect(getCurrentSubscription).toHaveBeenCalledTimes(1);
    });
  });
});