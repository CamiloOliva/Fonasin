import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Footer from './Footer';

describe('Footer', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('lleva Mi Fondo a ahorros y mantiene el centro documental separado', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole('heading', { name: /navegacion/i }).closest('section');
    const legal = screen.getByRole('heading', { name: /legales/i }).closest('section');

    expect(navigation).not.toBeNull();
    expect(legal).not.toBeNull();
    expect(within(navigation as HTMLElement).getByRole('link', { name: 'Mi Fondo' })).toHaveAttribute('href', '/mi-fondo');
    expect(within(navigation as HTMLElement).getByRole('link', { name: 'Balance social' })).toHaveAttribute('href', '/balance-social');
    expect(within(navigation as HTMLElement).queryByRole('link', { name: 'Estatutos' })).not.toBeInTheDocument();
    expect(within(legal as HTMLElement).getByRole('link', { name: 'Estatutos' })).toHaveAttribute('href', '/estatutos?document=statutes');
    expect(within(legal as HTMLElement).getByRole('link', { name: /manual de líneas de crédito/i })).toHaveAttribute('href', '/estatutos?document=credit-manual');
    expect(within(legal as HTMLElement).getByRole('link', { name: /reglamento de crédito y cartera/i })).toHaveAttribute('href', '/estatutos?document=credit-regulation');
    expect(within(legal as HTMLElement).getByRole('link', { name: /política de tratamiento de datos/i })).toHaveAttribute('href', '/estatutos?document=data-policy');
    expect(screen.getByRole('button', { name: 'Copiar correo' })).toBeInTheDocument();
    expect(screen.getByText('fonasin.bucaramanga@fonasin.com')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Facebook' })).not.toBeInTheDocument();
  });

  it('copies the visible institutional email without opening mailto or another tab', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    render(<MemoryRouter><Footer /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar correo' }));
    expect(await screen.findByText('Correo copiado')).toBeInTheDocument();
    expect(writeText).toHaveBeenCalledWith('fonasin.bucaramanga@fonasin.com');
    expect(document.querySelector('a[href^="mailto:"]')).toBeNull();
  });

  it.each(['denied', 'unavailable'])('keeps the email visible for manual copying when clipboard is %s', async (mode) => {
    vi.stubGlobal('navigator', mode === 'denied' ? { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('Denied')) } } : {});
    render(<MemoryRouter><Footer /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Copiar correo' }));
    expect(await screen.findByText(/copiala manualmente/i)).toBeInTheDocument();
    expect(screen.getByText('fonasin.bucaramanga@fonasin.com')).toBeInTheDocument();
    expect(screen.queryByText('Correo copiado')).not.toBeInTheDocument();
  });
});
