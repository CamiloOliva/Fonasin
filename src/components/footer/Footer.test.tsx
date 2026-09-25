import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Footer from './Footer';

describe('Footer', () => {
  it('lleva Mi Fondo a la informacion institucional sin duplicar Estatutos', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const navigation = screen.getByRole('heading', { name: /navegacion/i }).closest('section');
    const legal = screen.getByRole('heading', { name: /legales/i }).closest('section');

    expect(navigation).not.toBeNull();
    expect(legal).not.toBeNull();
    expect(within(navigation as HTMLElement).getByRole('link', { name: 'Mi Fondo' })).toHaveAttribute('href', '/estatutos');
    expect(within(navigation as HTMLElement).queryByRole('link', { name: 'Estatutos' })).not.toBeInTheDocument();
    expect(within(legal as HTMLElement).getByRole('link', { name: 'Estatutos' })).toHaveAttribute('href', '/estatutos?document=statutes');
    expect(within(legal as HTMLElement).getByRole('link', { name: /manual de líneas de crédito/i })).toHaveAttribute('href', '/estatutos?document=credit-manual');
    expect(within(legal as HTMLElement).getByRole('link', { name: /reglamento de crédito y cartera/i })).toHaveAttribute('href', '/estatutos?document=credit-regulation');
    expect(within(legal as HTMLElement).getByRole('link', { name: /política de tratamiento de datos/i })).toHaveAttribute('href', '/estatutos?document=data-policy');
  });
});
