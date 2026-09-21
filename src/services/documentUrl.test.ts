import { afterEach, describe, expect, it, vi } from 'vitest';

describe('document URL helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('targets relative affiliation document links to the configured backend', async () => {
    vi.stubEnv('VITE_BACKEND_BASE_URL', 'https://api.fonasin.com');
    vi.resetModules();

    const [{ affiliationDownloadUrl }, { adminAffiliationDocumentUrl }, { portalDocumentPreviewUrl }] = await Promise.all([
      import('./affiliationService'),
      import('./adminAffiliationService'),
      import('./portalService'),
    ]);
    const relativePath = '/affiliation-applications/application-id/documents/document-id/preview?signature=test';
    const expected = `https://api.fonasin.com${relativePath}`;

    expect(affiliationDownloadUrl(relativePath)).toBe(expected);
    expect(adminAffiliationDocumentUrl(relativePath)).toBe(expected);
    expect(portalDocumentPreviewUrl(relativePath)).toBe(expected);
  });
});
