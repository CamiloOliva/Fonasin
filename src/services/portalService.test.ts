import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPortalCredits, PortalServiceError } from './portalService';

describe('portalService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('expone el estado 403 para que la interfaz muestre sin permisos', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Forbidden.' }), { status: 403 })));

    await expect(fetchPortalCredits()).rejects.toMatchObject({ status: 403 });
  });

  it('expone el estado 419 cuando la sesion vencio', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ message: 'Expired.' }), { status: 419 })));

    await expect(fetchPortalCredits()).rejects.toMatchObject({ status: 419 });
  });
});