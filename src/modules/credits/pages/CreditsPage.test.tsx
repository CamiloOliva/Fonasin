import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import CreditsPage from './CreditsPage';

describe('CreditsPage', () => {
  it('presenta las cinco líneas informativas y el contacto aprobado', () => {
    render(
      <MemoryRouter>
        <CreditsPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /créditos a tu medida/i })).toBeInTheDocument();
    expect(screen.getAllByText(/información detallada próximamente/i)).toHaveLength(5);
    expect(screen.getByRole('link', { name: /contáctanos/i })).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });
});
