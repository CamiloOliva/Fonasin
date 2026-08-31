export type AdminCredit = {
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
  associate: {
    id: string;
    full_name: string;
    document_type: string;
    status: string;
  } | null;
};

export type CreateCreditPayload = {
  associate_id: string;
  credit_line: string;
  initial_balance: string;
  current_balance: string;
  term_months: number;
  interest_rate: string;
  installment_amount: string;
  status?: string;
};

export type UpdateCreditPayload = Partial<Omit<CreateCreditPayload, 'associate_id'>>;

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH';
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

export async function fetchAdminCredits(): Promise<AdminCredit[]> {
  const response = await requestJson<{ data: AdminCredit[] }>('/admin/credits');

  return response.data;
}

export async function createAdminCredit(payload: CreateCreditPayload): Promise<AdminCredit> {
  const response = await requestJson<{ data: AdminCredit }>('/admin/credits', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function updateAdminCredit(id: string, payload: UpdateCreditPayload): Promise<AdminCredit> {
  const response = await requestJson<{ data: AdminCredit }>(`/admin/credits/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

  return response.data;
}

export async function archiveAdminCredit(id: string): Promise<AdminCredit> {
  const response = await requestJson<{ data: AdminCredit }>(`/admin/credits/${id}/archive`, {
    method: 'POST',
  });

  return response.data;
}
