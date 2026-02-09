import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import AuthenticatedLayout from '../AuthenticatedLayout';

vi.mock('../UserHeader', () => ({
  default: () => <div data-testid="user-header" />,
}));

vi.mock('@/components/ui/breadcrumb', () => ({
  default: () => <nav aria-label="Breadcrumb">Breadcrumb</nav>,
}));

describe('AuthenticatedLayout', () => {
  const renderLayout = (initialPath: string) => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <AuthenticatedLayout>
          <div data-testid="content">Content</div>
        </AuthenticatedLayout>
      </MemoryRouter>
    );
  };

  it('renders breadcrumb on non-dashboard routes', () => {
    renderLayout('/profile');

    expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('hides breadcrumb on the dashboard route', () => {
    renderLayout('/dashboard');

    expect(screen.queryByLabelText('Breadcrumb')).not.toBeInTheDocument();
  });
});
