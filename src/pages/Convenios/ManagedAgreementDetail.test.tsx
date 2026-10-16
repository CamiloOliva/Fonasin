import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import ManagedAgreementDetail from './ManagedAgreementDetail';

vi.mock('../../hooks/usePublicContent', () => ({
  usePublicContent: () => ({
    error: false,
    loading: false,
    content: {
      data: [{
        id: 'convenio-1', kind: 'agreement', title: 'Convenio aprobado',
        summary: 'Resumen breve', conditions: 'Condición uno.\nCondición dos.',
        category: 'Salud y bienestar', link_url: null, image_url: null,
        legacy_detail_slug: null, legacy_detail_modified: true,
      }],
    },
  }),
}));

describe('ficha administrable de convenio', () => {
  it('muestra las condiciones completas aparte del resumen', () => {
    render(<MemoryRouter initialEntries={['/convenios/convenio-1']}>
      <Routes><Route path="/convenios/:slug" element={<ManagedAgreementDetail />} /></Routes>
    </MemoryRouter>);

    expect(screen.getByRole('heading', { name: 'Convenio aprobado' })).toBeInTheDocument();
    expect(screen.getByText('Resumen breve')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Condiciones del convenio' })).toBeInTheDocument();
    expect(screen.getByText(/Condición uno/)).toHaveTextContent('Condición dos.');
  });
});
