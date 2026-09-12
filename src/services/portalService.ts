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
  credit_line: string;
  initial_balance: string;
  current_balance: string;
  term_months: number | null;
  interest_rate: string | null;
  installment_amount: string;
  last_payment_date: string | null;
  status: string;
};

export type PortalContributionAccount = {
  id: string;
  contribution_balance: string;
  permanent_savings_balance: string;
  voluntary_savings_balance: string;
  total_balance: string;
  status: string;
  last_period: string | null;
  last_cut_off_date: string | null;
  last_movement_at: string | null;
};

export type PortalContributionMovement = {
  id: string;
  movement_type: string;
  period: string;
  cut_off_date: string;
  amount: string;
  balance_after: string;
  status: string;
  source: string;
  reference: string | null;
  recorded_at: string;
};

export type PortalContributions = {
  state: 'module_disabled' | 'empty' | 'available';
  account: PortalContributionAccount | null;
  movements: PortalContributionMovement[];
};

export type PortalAccountStatement = {
  state: 'empty' | 'available';
  generated_at: string;
  associate: {
    id: string;
    full_name: string;
    document_type: string;
    status: string;
  };
  credits: {
    state: 'empty' | 'available';
    total_current_balance: number;
    items: PortalCredit[];
  };
  contributions: PortalContributions;
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

export type PortalAffiliationUpdateDraft = {
  id: string;
  status: string;
  draft_access_token: string;
  links: {
    read: string;
  };
};

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: BodyInit | null;
  headers?: HeadersInit;
};

export class PortalServiceError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'PortalServiceError';
    this.status = status;
  }
}

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

    throw new PortalServiceError(translatePortalError(message, response.status), response.status);
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

export async function fetchPortalContributions(): Promise<PortalContributions> {
  const response = await requestJson<{ data: PortalContributions }>('/portal/contributions');

  return response.data;
}

export async function fetchPortalAccountStatement(): Promise<PortalAccountStatement> {
  const response = await requestJson<{ data: PortalAccountStatement }>('/portal/account-statement');

  return response.data;
}

export async function fetchPortalAffiliation(): Promise<PortalAffiliation | null> {
  const response = await requestJson<{ data: PortalAffiliation | null }>('/portal/affiliation');

  return response.data;
}

export async function startPortalAffiliationUpdate(): Promise<PortalAffiliationUpdateDraft> {
  const response = await requestJson<{ data: PortalAffiliationUpdateDraft }>('/portal/affiliation/update-draft', {
    method: 'POST',
  });

  return response.data;
}
