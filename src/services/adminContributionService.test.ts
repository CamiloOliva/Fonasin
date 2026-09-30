import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const json = (payload: unknown, status = 200) => new Response(JSON.stringify(payload), { status });

describe('administrative savings CSRF recovery', () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllGlobals());

  it('refreshes an obsolete session token and retries the same review once', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ data: { token: 'old-token' } }))
      .mockResolvedValueOnce(json({}, 419))
      .mockResolvedValueOnce(json({ data: { token: 'new-token' } }))
      .mockResolvedValueOnce(json({ data: { id: 'request', status: 'rejected' } }));
    vi.stubGlobal('fetch', fetchMock);
    const { reviewAdminVoluntarySavingsRequest } = await import('./adminContributionService');
    await expect(reviewAdminVoluntarySavingsRequest('request', 'rejected', 'Reason')).resolves.toMatchObject({ status: 'rejected' });
    expect(fetchMock).toHaveBeenCalledTimes(4);
    expect(fetchMock.mock.calls[1][1].headers['X-CSRF-TOKEN']).toBe('old-token');
    expect(fetchMock.mock.calls[3][1].headers['X-CSRF-TOKEN']).toBe('new-token');
    expect(fetchMock.mock.calls[3][1].body).toBe(fetchMock.mock.calls[1][1].body);
    expect(fetchMock.mock.calls[3][1].method).toBe('PATCH');
  });

  it('preserves the uploaded file and lets the browser choose its multipart boundary on retry', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ data: { token: 'old' } }))
      .mockResolvedValueOnce(json({}, 419))
      .mockResolvedValueOnce(json({ data: { token: 'new' } }))
      .mockResolvedValueOnce(json({ data: { id: 'request' } }));
    vi.stubGlobal('fetch', fetchMock);
    const { uploadSignedVoluntarySavingsAuthorization } = await import('./adminContributionService');
    const file = new File(['%PDF-fixture'], 'signed.pdf', { type: 'application/pdf' });
    await uploadSignedVoluntarySavingsAuthorization('request', file);
    const retry = fetchMock.mock.calls[3][1];
    expect(retry.body).toBe(fetchMock.mock.calls[1][1].body);
    expect(retry.body.get('file')).toBe(file);
    expect(retry.headers).not.toHaveProperty('Content-Type');
    expect(retry.credentials).toBe('include');
    expect(retry.method).toBe('POST');
  });

  it('stops after a second 419 instead of repeatedly replaying a mutation', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ data: { token: 'old' } }))
      .mockResolvedValueOnce(json({}, 419))
      .mockResolvedValueOnce(json({ data: { token: 'new' } }))
      .mockResolvedValueOnce(json({ message: 'Session expired.' }, 419));
    vi.stubGlobal('fetch', fetchMock);
    const { reviewAdminVoluntarySavingsRequest } = await import('./adminContributionService');
    await expect(reviewAdminVoluntarySavingsRequest('request', 'approved')).rejects.toThrow('Session expired.');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('does not retry permission failures', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json({ data: { token: 'valid' } }))
      .mockResolvedValueOnce(json({ message: 'Forbidden.' }, 403));
    vi.stubGlobal('fetch', fetchMock);
    const { reviewAdminVoluntarySavingsRequest } = await import('./adminContributionService');
    await expect(reviewAdminVoluntarySavingsRequest('request', 'approved')).rejects.toThrow('Forbidden.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
