import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Noticias from './Noticias/Noticias';
import BalanceSocial from './BalanceSocial/BalanceSocial';
import Convenios from './Convenios/Convenios';
import FlyerCarousel from '../components/carousel/FlyerCarousel';
import * as contentService from '../services/publicContentService';

vi.mock('../services/publicContentService', () => ({
  fetchPublicContent: vi.fn(),
  publicContentMediaUrl: vi.fn((path: string | null) => path),
}));

const content: contentService.PublicContentResponse = {
  settings: { contact_email: 'fonasin.bucaramanga@fonasin.com', facebook_url: null, instagram_url: null, youtube_url: null },
  data: [
    { id: 'news-1', kind: 'news', title: 'Comunicado autorizado', summary: 'Detalle aprobado', category: null, link_url: null, sort_order: 0, published: true, published_at: '2026-10-05T00:00:00Z', image_url: null, document_url: null },
    { id: 'balance-1', kind: 'social_balance', title: 'Balance 2025', summary: 'Informe oficial', category: null, link_url: null, sort_order: 0, published: true, published_at: '2026-10-05T00:00:00Z', image_url: null, document_url: '/public/content/balance-1/document' },
    { id: 'agreement-1', kind: 'agreement', title: 'Convenio actualizado', summary: 'Beneficio nuevo', category: 'Turismo', link_url: null, sort_order: 0, published: true, published_at: '2026-10-05T00:00:00Z', image_url: '/images/convenios/example.png', document_url: null },
    { id: 'banner-1', kind: 'banner', title: 'Campaña vigente', summary: 'Beneficio especial', category: null, link_url: 'https://fonasin.com/campana', sort_order: 0, published: true, published_at: '2026-10-05T00:00:00Z', image_url: '/flyer1.png', document_url: null },
  ],
};

describe('contenido institucional público', () => {
  beforeEach(() => { vi.mocked(contentService.fetchPublicContent).mockResolvedValue(content); });

  it('usa las publicaciones de la API para noticias y balance', async () => {
    const news = render(<Noticias />);
    expect(await screen.findByText('Comunicado autorizado')).toBeInTheDocument();
    news.unmount();
    render(<BalanceSocial />);
    expect(await screen.findByText('Balance 2025')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Consultar informe' })).toHaveAttribute('href', '/public/content/balance-1/document');
  });

  it('muestra los convenios y banners publicados desde el servidor', async () => {
    const agreements = render(<MemoryRouter><Convenios /></MemoryRouter>);
    expect(await screen.findByText('Convenio actualizado')).toBeInTheDocument();
    expect(screen.queryByText('Caribbean Sol y Mar')).not.toBeInTheDocument();
    agreements.unmount();
    render(<FlyerCarousel />);
    expect(await screen.findByAltText('Campaña vigente')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Conocer más' })).toHaveAttribute('href', 'https://fonasin.com/campana');
  });
});
