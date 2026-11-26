import { afterEach, describe, expect, it, vi } from 'vitest';
import { requestPasswordReset, resetPassword } from './passwordRecoveryService';

afterEach(() => vi.unstubAllGlobals());
const payload = { email: 'synthetic@example.test', token: 'synthetic-token', password: 'SyntheticPass123!', passwordConfirmation: 'SyntheticPass123!' };
function serverError(errors: Record<string, string[]>, message = 'Los datos enviados no son validos.') {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => url.endsWith('/csrf-token')
    ? { ok: true, json: async () => ({ data: { token: 'synthetic-csrf' } }) }
    : { ok: false, status: 422, json: async () => ({ message, errors }) }));
}

describe('Mensajes de recuperacion de acceso', () => {
  it('identifies a password validation error from field keys even when the message is localized', async () => {
    serverError({ password: ['La clave debe contener letras.'] });
    await expect(resetPassword(payload)).rejects.toThrow('entre 8 y 128 caracteres, incluir letras y numeros');
  });
  it('explains an expired token instead of asking for a cedula absent from this screen', async () => {
    serverError({ token: ['El enlace de recuperacion no es valido o ya expiro.'] });
    await expect(resetPassword(payload)).rejects.toThrow('El enlace no es valido o ya expiro. Solicita un nuevo enlace a FONASIN.');
  });
  it('keeps reset account failures generic without revealing account state', async () => {
    serverError({ email: ['No fue posible actualizar la contrasena.'] }, 'Unable to update password.');
    await expect(resetPassword(payload)).rejects.toThrow('Pide a FONASIN que revise el acceso y reenvie el enlace.');
  });
  it('still requests email and document corrections in the recovery request screen', async () => {
    serverError({ document_number: ['El campo es obligatorio.'] });
    await expect(requestPasswordReset({ email: payload.email, documentNumber: '' })).rejects.toThrow('Revisa el correo, la cedula y los campos obligatorios.');
  });
});
