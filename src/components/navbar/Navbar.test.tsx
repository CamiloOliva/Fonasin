import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import Navbar from './Navbar';

describe('Navbar', () => {
  it('opens and closes the mobile navigation', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    const menuButton = screen.getByRole('button', { name: /abrir menú/i });
    await user.click(menuButton);

    const mobileNavigation = screen.getByRole('navigation', { name: /navegación móvil/i });
    expect(mobileNavigation).toBeInTheDocument();
    expect(within(mobileNavigation).getByRole('link', { name: 'Mi Fondo' })).toHaveAttribute('href', '/estatutos');
    expect(within(mobileNavigation).queryByRole('link', { name: 'Estatutos' })).not.toBeInTheDocument();
    expect(within(mobileNavigation).getByRole('link', { name: 'FPQRS' })).toHaveAttribute('href', '/fpqrs');

    await user.click(screen.getByRole('button', { name: /cerrar menú/i }));

    expect(screen.queryByRole('navigation', { name: /navegación móvil/i })).not.toBeInTheDocument();
  });
});
