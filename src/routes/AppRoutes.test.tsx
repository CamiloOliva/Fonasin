import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import AppRoutes from './AppRoutes';

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('AppRoutes', () => {
  it('renders the public credits route', () => {
    renderRoute('/creditos');

    expect(screen.getByRole('heading', { name: /un impulso para cada uno de tus proyectos/i })).toBeInTheDocument();
  });

  it('falls back to the home page for an unknown route', () => {
    renderRoute('/ruta-inexistente');

    expect(screen.getByRole('heading', { name: /un fondo pensado para acompañar a sus asociados/i })).toBeInTheDocument();
  });
});
