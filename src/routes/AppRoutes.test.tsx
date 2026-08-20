import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import AppRoutes from './AppRoutes';

vi.mock('../components/sections/StatutesBookViewer', () => ({
  default: () => (
    <div role="region" aria-label="visor de lectura">
      <button type="button">Siguiente</button>
    </div>
  ),
}));

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

  it('renders the estatutos route', () => {
    renderRoute('/estatutos');

    expect(screen.getByRole('heading', { level: 1, name: /estatutos/i })).toBeInTheDocument();
  });

  it('opens the estatutos viewer with a download action', async () => {
    const user = userEvent.setup();

    renderRoute('/estatutos');

    const estatutosHeading = screen.getByRole('heading', { level: 3, name: /^estatutos$/i });
    const estatutosCard = estatutosHeading.closest('article');

    expect(estatutosCard).not.toBeNull();

    await user.click(within(estatutosCard as HTMLElement).getByRole('button', { name: /ver en la pagina/i }));

    const dialog = screen.getByRole('dialog', { name: /estatutos/i });

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /descargar/i })).toHaveAttribute(
      'href',
      expect.stringContaining('ESTATUTOS%20DEFINITIVOS%202024.pdf'),
    );
    expect(within(dialog).getByRole('button', { name: /siguiente/i })).toBeInTheDocument();
  });

  it('renders the FONALIBRE detail route', () => {
    renderRoute('/creditos/fonalibre');

    expect(screen.getByRole('heading', { name: /fonalibre/i })).toBeInTheDocument();
  });

  it('renders the FONAPEN detail route', () => {
    renderRoute('/creditos/fonapen');

    expect(screen.getByRole('heading', { level: 1, name: /fonapen/i })).toBeInTheDocument();
  });

  it('renders the FONAPRIMA detail route', () => {
    renderRoute('/creditos/fonaprima');

    expect(screen.getByRole('heading', { level: 1, name: /fonaprima/i })).toBeInTheDocument();
  });

  it('renders the FONAPORTES detail route', () => {
    renderRoute('/creditos/fonaportes');

    expect(screen.getByRole('heading', { level: 1, name: /fonaportes/i })).toBeInTheDocument();
  });

  it('falls back to the home page for an unknown route', () => {
    renderRoute('/ruta-inexistente');

    expect(screen.getByRole('heading', { name: /un fondo que te acompa/i })).toBeInTheDocument();
  });
});
