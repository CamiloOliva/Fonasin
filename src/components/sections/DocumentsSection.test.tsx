import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import DocumentsSection from './DocumentsSection';

vi.mock('./StatutesBookViewer', () => ({
  default: () => <div>Visor PDF</div>,
}));

describe('DocumentsSection', () => {
  it('publica los documentos institucionales y conecta la atencion con FPQRS', () => {
    render(
      <MemoryRouter>
        <DocumentsSection variant="estatutos" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /ver estatutos definitivos 2024/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver manual de líneas de crédito/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver reglamento de crédito y administración de cartera/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver estados financieros 2025/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ver política de tratamiento de datos personales/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ir a fpqrs/i })).toHaveAttribute('href', '/fpqrs');
  });
});
