export type PortalUser = {
  id: string;
  email: string;
  roles: string[];
  must_change_password: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
  remember: boolean;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  password: string;
  passwordConfirmation: string;
};

export type PortalCredit = {
  id: string;
  associate_id: string;
  credit_line: string;
  initial_balance: string;
  current_balance: string;
  term_months: number;
  interest_rate: string;
  installment_amount: string;
  status: string;
  registered_by_user_id: string;
};

export type PortalAffiliationDocument = {
  id: string;
  document_type: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  uploaded_at: string | null;
  links: {
    preview: string;
  };
};

export type PortalAffiliation = {
  id: string;
  status: string;
  submitted_at: string | null;
  enabled_at: string | null;
  documents: PortalAffiliationDocument[];
};

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: BodyInit | null;
  headers?: HeadersInit;
};

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL?.trim().replace(/\/$/, '') ?? '';
let cachedCsrfToken = '';

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    if (!backendBaseUrl) {
      const url = new URL(path);

      return `${url.pathname}${url.search}`;
    }

    return path;
  }

  return `${backendBaseUrl}${path}`;
}

export function portalDocumentPreviewUrl(path: string): string {
  return buildUrl(path);
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

async function requestJson<T>(path: string, options: RequestOptions = {}, retried = false): Promise<T> {
  const token = (options.method ?? 'GET') === 'GET' ? '' : await csrfToken();

  const response = await fetch(buildUrl(path), {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { 'X-CSRF-TOKEN': token } : {}),
      ...(options.headers ?? {}),
    },
    body: options.body ?? null,
  });

  const payload = await response.json().catch(() => null);

  if (response.status === 419 && !retried) {
    cachedCsrfToken = '';

    return requestJson<T>(path, options, true);
  }

  if (!response.ok) {
    const message = typeof payload?.message === 'string'
      ? payload.message
      : 'No fue posible completar la solicitud.';

    throw new Error(translatePortalError(message, response.status));
  }

  return payload as T;
}

function translatePortalError(message: string, status: number): string {
  if (status === 401) return 'Inicia sesion para entrar al portal.';
  if (status === 403) return 'Tu usuario no tiene permisos para acceder a esta seccion.';
  if (status === 419) return 'La sesion expiro. Recarga la pagina e intenta de nuevo.';
  if (status === 429) return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
  if (status === 423) return 'Debes cambiar la contrasena temporal antes de continuar.';
  if (message.includes('current password')) return 'La contrasena temporal no es correcta.';
  if (message === 'Invalid credentials.') return 'Correo o contrasena incorrectos.';
  if (message === 'User account is inactive.') return 'La cuenta de usuario esta inactiva.';
  if (message.includes('associate profile')) return 'Tu usuario aun no tiene un asociado vinculado.';

  return message;
}

export async function currentPortalUser(): Promise<PortalUser> {
  const response = await requestJson<{ data: PortalUser }>('/auth/user');

  return response.data;
}

export async function loginPortal(payload: LoginPayload): Promise<PortalUser> {
  const response = await requestJson<{ data: PortalUser }>('/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function logoutPortal(): Promise<void> {
  await requestJson<{ message: string }>('/logout', {
    method: 'POST',
  });
}

export async function changeOwnPassword(payload: ChangePasswordPayload): Promise<PortalUser> {
  const response = await requestJson<{ data: PortalUser }>('/auth/password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: payload.currentPassword,
      password: payload.password,
      password_confirmation: payload.passwordConfirmation,
    }),
  });

  return response.data;
}

export async function fetchPortalCredits(): Promise<PortalCredit[]> {
  const response = await requestJson<{ data: PortalCredit[] }>('/portal/credits');

  return response.data;
}

export async function fetchPortalAffiliation(): Promise<PortalAffiliation | null> {
  const response = await requestJson<{ data: PortalAffiliation | null }>('/portal/affiliation');

  return response.data;
}
