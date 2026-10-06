import { afterEach, describe, expect, it, vi } from 'vitest';

describe('URL de contenido público', () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.resetModules(); });

  it('separa archivos estáticos del dominio web y archivos cargados del API', async () => {
    vi.stubEnv('VITE_BACKEND_BASE_URL', 'https://api.fonasin.com');
    const { publicContentMediaUrl } = await import('./publicContentService');
    expect(publicContentMediaUrl('/images/convenios/emi.png')).toBe('/images/convenios/emi.png');
    expect(publicContentMediaUrl('/public/content/123/image')).toBe('https://api.fonasin.com/public/content/123/image');
    expect(publicContentMediaUrl(null)).toBeNull();
  });

  it('permite previsualizar un archivo en borrador solo por la ruta administrativa', async () => {
    vi.stubEnv('VITE_BACKEND_BASE_URL', 'https://api.fonasin.com');
    const { adminContentMediaUrl } = await import('./publicContentService');
    const item = { id: '123', published: false } as Parameters<typeof adminContentMediaUrl>[0];
    expect(adminContentMediaUrl(item, '/public/content/123/document')).toBe('https://api.fonasin.com/admin/content/123/document');
    expect(adminContentMediaUrl({ ...item, published: true }, '/public/content/123/document')).toBe('https://api.fonasin.com/public/content/123/document');
  });
});
