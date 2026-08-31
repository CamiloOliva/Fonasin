export type PasswordResetRequestPayload = {
  email: string;
  documentNumber: string;
};

export type PasswordResetPayload = {
  email: string;
  token: string;
  password: string;
  passwordConfirmation: string;
};

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL?.trim().replace(/\/$/, '') ?? '';
let cachedCsrfToken = '';

function buildUrl(path: string): string {
  return `${backendBaseUrl}${path}`;
}

async function csrfToken(): Promise<string> {
  if (cachedCsrfToken) return cachedCsrfToken;

  const response = await fetch(buildUrl('/csrf-token'), {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => null);
  cachedCsrfToken = typeof payload?.data?.token === 'string' ? payload.data.token : '';

  return cachedCsrfToken;
}

async function requestJson(path: string, body: unknown, retried = false): Promise<{ message: string }> {
  const token = await csrfToken();
  const response = await fetch(buildUrl(path), {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { 'X-CSRF-TOKEN': token } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json().catch(() => null);

  if (response.status === 419 && !retried) {
    cachedCsrfToken = '';

    return requestJson(path, body, true);
  }

  if (!response.ok) {
    const message = typeof payload?.message === 'string' ? payload.message : 'No fue posible completar la solicitud.';
    throw new Error(translatePasswordRecoveryError(message, response.status));
  }

  return payload as { message: string };
}

function translatePasswordRecoveryError(message: string, status: number): string {
  if (status === 419) return 'La sesion expiro. Recarga la pagina e intenta de nuevo.';
  if (status === 422) {
    if (message.includes('password')) return 'La nueva contrasena debe tener minimo 8 caracteres, letras y numeros.';
    if (message.includes('token')) return 'El enlace no es valido o ya expiro.';

    return 'Revisa el correo, la cedula y los campos obligatorios.';
  }
  if (message.includes('Failed to fetch')) return 'No fue posible conectar con Laravel en este momento.';

  return message;
}

export function requestPasswordReset(payload: PasswordResetRequestPayload): Promise<{ message: string }> {
  return requestJson('/password/forgot', {
    email: payload.email.trim(),
    document_number: payload.documentNumber.trim(),
  });
}

export function resetPassword(payload: PasswordResetPayload): Promise<{ message: string }> {
  return requestJson('/password/reset', {
    email: payload.email.trim(),
    token: payload.token,
    password: payload.password,
    password_confirmation: payload.passwordConfirmation,
  });
}
