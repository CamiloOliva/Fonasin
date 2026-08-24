export type PortalUser = {
  id: string;
  email: string;
  roles: string[];
};

export type LoginPayload = {
  email: string;
  password: string;
  remember: boolean;
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

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: BodyInit | null;
  headers?: HeadersInit;
};

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL?.trim().replace(/\/$/, '') ?? '';

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

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(buildUrl(path), {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers ?? {}),
    },
    body: options.body ?? null,
  });

  const payload = await response.json().catch(() => null);

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
  if (status === 429) return 'Demasiados intentos. Espera un momento y vuelve a intentar.';
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

export async function fetchPortalCredits(): Promise<PortalCredit[]> {
  const response = await requestJson<{ data: PortalCredit[] }>('/portal/credits');

  return response.data;
}
