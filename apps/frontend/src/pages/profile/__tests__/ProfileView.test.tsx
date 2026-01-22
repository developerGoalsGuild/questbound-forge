/** @vitest-environment jsdom */
import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockProfile = {
  email: 'test@goalsguild.com',
  fullName: 'Juan Pérez',
  nickname: 'juanp',
  birthDate: '1990-01-01',
  language: 'es',
  country: 'España',
  gender: 'Femenino',
  pronouns: 'Ella',
  provider: 'local',
  bio: 'Bio de prueba',
  tags: ['foco', 'salud'],
  role: 'user',
  status: 'ACTIVE',
  email_confirmed: true,
  createdAt: 1700000000000,
  updatedAt: 1705000000000,
  tier: 'initiate',
};

vi.mock('@/hooks/useUserProfile', () => ({
  useUserProfile: () => ({
    profile: mockProfile,
    loading: false,
    error: null,
    refetch: vi.fn(),
    updateProfile: vi.fn(),
  }),
}));

vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    language: 'es',
    t: {
      profile: {
        view: {
          editProfile: 'Editar perfil',
          basicInformation: 'Información básica',
          email: 'Correo electrónico',
          nickname: 'Apodo',
          birthDate: 'Fecha de nacimiento',
          language: 'Idioma',
          locationIdentity: 'Ubicación e identidad',
          country: 'País',
          gender: 'Género',
          pronouns: 'Pronombres',
          provider: 'Proveedor',
          about: 'Acerca de ti',
          bio: 'Biografía',
          tags: 'Etiquetas',
          accountInformation: 'Información de la cuenta',
          tier: 'Nivel',
          memberSince: 'Miembro desde',
          lastUpdated: 'Última actualización',
          backToDashboard: 'Volver al panel',
          profileNotFound: 'No se encontró el perfil.',
          tryAgain: 'Reintentar',
          statusVerified: 'Verificado',
          statusEmailNotVerified: 'Correo no verificado',
          adventurer: 'Aventurero',
          roles: { user: 'Usuario', partner: 'Socio', patron: 'Patrón' },
          languages: { en: 'Inglés', es: 'Español', fr: 'Francés' },
        },
      },
    },
    setLanguage: vi.fn(),
    changeLanguage: vi.fn(),
    isLanguageLoading: false,
  }),
}));

vi.mock('@/lib/api/subscription', () => ({
  getCurrentSubscription: vi.fn().mockResolvedValue({ plan_tier: 'sage' }),
}));

vi.mock('@/components/gamification/XPDisplay', () => ({
  XPDisplay: () => <div>XP Display</div>,
}));

vi.mock('@/components/gamification/BadgeDisplay', () => ({
  BadgeDisplay: () => <div>Badge Display</div>,
}));

const renderWithProviders = (ui: React.ReactElement) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe('ProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders localized labels on profile view', async () => {
    const { default: ProfileView } = await import('@/pages/profile/ProfileView');
    renderWithProviders(<ProfileView />);

    expect(screen.getByText('Editar perfil')).toBeInTheDocument();
    expect(screen.getByText('Información básica')).toBeInTheDocument();
    expect(screen.getByText('Ubicación e identidad')).toBeInTheDocument();
    expect(screen.getByText('Información de la cuenta')).toBeInTheDocument();
    expect(screen.getByText('Volver al panel')).toBeInTheDocument();
    expect(screen.getByText('Verificado')).toBeInTheDocument();
    expect(screen.getByText('Usuario')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('SAGE')).toBeInTheDocument();
    });
  });
});
