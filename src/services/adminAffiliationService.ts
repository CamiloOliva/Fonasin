import { currentPortalUser, loginPortal, logoutPortal, type LoginPayload, type PortalUser } from './portalService';

export type AdminAffiliationApplication = {
  id: string;
  status: string;
  current_step: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewer: {
    id: string;
    email: string;
  } | null;
  sections_count: number;
  documents_count: number;
  consents_count: number;
  updated_at: string | null;
  created_at: string | null;
};

export type AdminAffiliationSection = {
  id: string;
  application_id: string;
  section: string;
  schema_version: number;
  completed_at: string | null;
  data: Record<string, unknown>;
};

export type AdminAffiliationDocument = {
  id: string;
  application_id: string;
  document_type: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  status: string;
  uploaded_at: string | null;
  links: {
    download: string;
    preview: string;
  };
};

export type AdminAffiliationConsent = {
  id: string;
  application_id: string;
  consent_type: string;
  policy_version: string;
  accepted_at: string | null;
};

export type AdminAffiliationDetail = AdminAffiliationApplication & {
  rejection_reason: string | null;
  sections: AdminAffiliationSection[];
  documents: AdminAffiliationDocument[];
  consents: AdminAffiliationConsent[];
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

    throw new Error(translateAdminError(message, response.status));
  }

  return payload as T;
}

function translateAdminError(message: string, status: number): string {
  if (status === 401) return 'Inicia sesion para entrar al panel administrativo.';
  if (status === 403) return 'Tu usuario no tiene permisos administrativos para esta accion.';
  if (status === 404) return 'No se encontro la solicitud seleccionada.';
  if (status === 422) return message;

  return message;
}

export async function currentAdminUser(): Promise<PortalUser> {
  const user = await currentPortalUser();

  if (!user.roles.some((role) => ['admin', 'reviewer'].includes(role))) {
    throw new Error('Tu usuario no tiene permisos administrativos para esta accion.');
  }

  return user;
}

export async function loginAdmin(payload: LoginPayload): Promise<PortalUser> {
  const user = await loginPortal(payload);

  if (!user.roles.some((role) => ['admin', 'reviewer'].includes(role))) {
    await logoutPortal();
    throw new Error('Tu usuario no tiene permisos administrativos para esta accion.');
  }

  return user;
}

export { logoutPortal as logoutAdmin };

export async function fetchAdminAffiliationApplications(): Promise<AdminAffiliationApplication[]> {
  const response = await requestJson<{ data: AdminAffiliationApplication[] }>('/admin/affiliation-applications');

  return response.data;
}

export async function fetchAdminAffiliationApplication(id: string): Promise<AdminAffiliationDetail> {
  const response = await requestJson<{ data: AdminAffiliationDetail }>(`/admin/affiliation-applications/${id}`);

  return response.data;
}

export async function startAdminAffiliationReview(id: string): Promise<AdminAffiliationDetail> {
  const response = await requestJson<{ data: AdminAffiliationDetail }>(`/admin/affiliation-applications/${id}/review`, {
    method: 'POST',
  });

  return fetchAdminAffiliationApplication(response.data.id);
}

export async function requestAdminAffiliationCorrection(id: string, reason: string): Promise<AdminAffiliationDetail> {
  const response = await requestJson<{ data: AdminAffiliationDetail }>(`/admin/affiliation-applications/${id}/correction`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });

  return fetchAdminAffiliationApplication(response.data.id);
}

export async function rejectAdminAffiliationApplication(id: string, reason: string): Promise<AdminAffiliationDetail> {
  const response = await requestJson<{ data: AdminAffiliationDetail }>(`/admin/affiliation-applications/${id}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });

  return fetchAdminAffiliationApplication(response.data.id);
}

export async function approveAdminAffiliationApplication(id: string): Promise<AdminAffiliationDetail> {
  const response = await requestJson<{ data: AdminAffiliationDetail }>(`/admin/affiliation-applications/${id}/approve`, {
    method: 'POST',
  });

  return fetchAdminAffiliationApplication(response.data.id);
}

