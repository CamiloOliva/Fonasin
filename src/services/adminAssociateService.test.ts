import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchAdminAssociatePage, fetchAdminAssociates } from './adminAssociateService';

afterEach(() => vi.unstubAllGlobals());

describe('Listado de asociados', () => {
  it('preserves pagination metadata for the administrative list', async () => {
    const page = { data: [{ id: 'last' }], meta: { current_page: 2, last_page: 2, per_page: 50, total: 51 } };
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => page });
    vi.stubGlobal('fetch', fetch);
    expect(await fetchAdminAssociatePage(2)).toEqual(page);
    expect(fetch.mock.calls[0][0]).toContain('/admin/associates?page=2&per_page=50');
  });

  it('loads subsequent pages for selectors rather than silently truncating their options', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: 'first' }], meta: { last_page: 2 } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: 'last' }], meta: { last_page: 2 } }) });
    vi.stubGlobal('fetch', fetch);
    expect(await fetchAdminAssociates()).toEqual([{ id: 'first' }, { id: 'last' }]);
    expect(fetch.mock.calls[1][0]).toContain('page=2&per_page=100');
  });
});
