export type AdminAssociate = {
  id: string;
  user_id: string | null;
  document_type: string;
  document_number_masked: string;
  full_name: string;
  status: string;
  user: {
    id: string;
    email: string;
    status: string;
  } | null;
  temporary_password?: string | null;
  affiliation_applications_count: number;
  credit_accounts_count: number;
  created_at: string | null;
  updated_at: string | null;
};

export type CreateAssociatePayload = {
  document_type: string;
  document_number: string;
  full_name: string;
  email: string;
  password?: string;
  status?: string;
};

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: BodyInit | null;
  headers?: HeadersInit;
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
      : response.status === 423
        ? 'Debes cambiar la contrasena temporal antes de usar el panel administrativo.'
      : response.status === 419
        ? 'La sesion expiro. Recarga la pagina e intenta de nuevo.'
        : 'No fue posible completar la solicitud.';

    throw new Error(message);
  }

  return payload as T;
}

export async function fetchAdminAssociates(): Promise<AdminAssociate[]> {
  const response = await requestJson<{ data: AdminAssociate[] }>('/admin/associates');

  return response.data;
}

export async function createAdminAssociate(payload: CreateAssociatePayload): Promise<AdminAssociate> {
  const response = await requestJson<{ data: AdminAssociate }>('/admin/associates', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function activateAdminAssociate(id: string): Promise<AdminAssociate> {
  const response = await requestJson<{ data: AdminAssociate }>(`/admin/associates/${id}/activate`, {
    method: 'POST',
  });

  return response.data;
}

export async function deactivateAdminAssociate(id: string): Promise<AdminAssociate> {
  const response = await requestJson<{ data: AdminAssociate }>(`/admin/associates/${id}/deactivate`, {
    method: 'POST',
  });

  return response.data;
}
