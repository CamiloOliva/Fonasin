import { beforeEach, describe, expect, it } from 'vitest';
import { consumeAffiliationCorrectionInvitation } from './affiliationService';

const id = '12345678-1234-1234-1234-123456789012';
const token = 'a'.repeat(64);

describe('enlace de correccion', () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    window.history.replaceState({}, '', '/afiliacion');
  });

  it('retira el secreto de la URL y guarda solo acceso tecnico, incluso con inicializacion doble de React', () => {
    const params = new URLSearchParams({ correction: id, token, purpose: 'profile_completion', read: `/affiliation-applications/${id}?signature=synthetic` });
    window.history.replaceState({}, '', `/afiliacion#${params}`);
    expect(consumeAffiliationCorrectionInvitation()).toBe('profile_completion');
    expect(window.location.hash).toBe('');
    expect(consumeAffiliationCorrectionInvitation()).toBe('profile_completion');
    const stored = JSON.parse(window.sessionStorage.getItem('fonasin.portal.affiliation.draft.v1') ?? '{}');
    expect(stored).toMatchObject({ id, draftAccessToken: token, purpose: 'profile_completion', status: 'pending_correction' });
    expect(stored).not.toHaveProperty('data');
  });

  it('rechaza URLs externas antes de almacenar o enviar el token', () => {
    const params = new URLSearchParams({ correction: id, token, purpose: 'initial_affiliation', read: 'https://external.invalid/capture' });
    window.history.replaceState({}, '', `/afiliacion#${params}`);
    expect(() => consumeAffiliationCorrectionInvitation()).toThrow(/no es valido/);
    expect(window.location.hash).toBe('');
    expect(window.sessionStorage.length).toBe(0);
  });
});
