import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';
import Breadcrumb from '../breadcrumb';

// Mock the useTranslation hook
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: {
      common: {
        dashboard: 'Dashboard',
        quests: 'Quests',
        create: 'Create',
        edit: 'Edit',
        view: 'View'
      }
    }
  })
}));

const TestWrapper: React.FC<{ children: React.ReactNode; initialEntries?: string[] }> = ({ 
  children, 
  initialEntries = ['/dashboard'] 
}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('Breadcrumb', () => {
  it('should not show breadcrumb when on dashboard page', () => {
    render(
      <TestWrapper initialEntries={['/dashboard']}>
        <Breadcrumb />
      </TestWrapper>
    );

    // Breadcrumb should not be rendered when on dashboard (returns null)
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.queryByText('Quests')).not.toBeInTheDocument();
  });

  it('should show Dashboard > Quests when on quests list page', () => {
    render(
      <TestWrapper initialEntries={['/quests']}>
        <Breadcrumb />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Quests')).toBeInTheDocument();
  });

  it('should show Dashboard > Quests > Create when on quest create page', () => {
    render(
      <TestWrapper initialEntries={['/quests/create']}>
        <Breadcrumb />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Quests')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
  });

  it('should show Dashboard > Quests > Edit when on quest edit page', () => {
    render(
      <TestWrapper initialEntries={['/quests/edit/quest-123']}>
        <Breadcrumb />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Quests')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
  });

  it('should show Dashboard > Quests > View when on quest details page', () => {
    render(
      <TestWrapper initialEntries={['/quests/details/quest-123']}>
        <Breadcrumb />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Quests')).toBeInTheDocument();
    expect(screen.getByText('View')).toBeInTheDocument();
  });

  it('should show Dashboard > Profile when on profile page', () => {
    render(
      <TestWrapper initialEntries={['/profile']}>
        <Breadcrumb />
      </TestWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should make breadcrumb items clickable except current page', () => {
    render(
      <TestWrapper initialEntries={['/quests/create']}>
        <Breadcrumb />
      </TestWrapper>
    );

    // Dashboard and Quests should be clickable buttons
    const dashboardButton = screen.getByRole('button', { name: 'Dashboard' });
    const questsButton = screen.getByRole('button', { name: 'Quests' });
    
    expect(dashboardButton).toBeInTheDocument();
    expect(questsButton).toBeInTheDocument();
    
    // Create should be current page (not clickable)
    const createSpan = screen.getByText('Create');
    expect(createSpan).toBeInTheDocument();
    expect(createSpan.tagName).toBe('SPAN');
  });
});
