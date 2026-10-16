export type AffiliationSectionKey = 'personal' | 'employment' | 'financial' | 'beneficiaries' | 'sarlaft';
export type AffiliationPurpose = 'initial_affiliation' | 'data_update' | 'profile_completion';

export type AffiliationDraftLinks = {
  read: string;
  sections: Record<AffiliationSectionKey, string>;
  documents: string;
  consents: string;
  submit: string;
};

export type GeneratedAffiliationDocument = {
  id: string;
  application_id: string;
  document_type: 'affiliation_summary' | 'payroll_authorization';
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

export type AffiliationDraft = {
  id: string;
  purpose: AffiliationPurpose;
  source_application_id: string | null;
  status: string;
  current_step: string;
  submitted_at: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
  correction?: { id: string; reason: string; requested_at: string | null; completed_at: string | null } | null;
  draft_access_token?: string;
  generated_documents?: GeneratedAffiliationDocument[];
  sections?: Array<{
    id: string;
    application_id: string;
    section: AffiliationSectionKey;
    schema_version: number;
    completed_at: string | null;
    data: Record<string, unknown>;
  }>;
  documents?: Array<{
    id: string;
    application_id: string;
    document_type: 'identity' | 'employment_certificate';
    original_filename: string;
    mime_type: string;
    byte_size: number;
    status: string;
    uploaded_at: string | null;
    links: {
      download: string;
      preview: string;
    };
  }>;
  consents?: Array<{
    id: string;
    application_id: string;
    consent_type: 'data_processing' | 'bylaws';
    policy_version: string;
    accepted_at: string | null;
  }>;
  links: AffiliationDraftLinks;
};

export type AffiliationSectionPayload = {
  schemaVersion: number;
  data: Record<string, unknown>;
  completed?: boolean;
};

export type AffiliationDocumentPayload = {
  documentType: 'identity' | 'employment_certificate';
  file: File;
};

export type AffiliationConsentPayload = {
  consentType: 'data_processing' | 'bylaws';
  policyVersion: string;
};

type AffiliationRequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  body?: BodyInit | null;
  headers?: HeadersInit;
};

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL?.trim().replace(/\/$/, '') ?? '';
const DRAFT_STORAGE_KEYS = [
  'fonasin.portal.affiliation.draft.v1',
  'fonasin.affiliation.draft.v1',
] as const;

// Only technical access data is stored; remove the fragment before any request.
export function consumeAffiliationCorrectionInvitation(): AffiliationPurpose | null {
  const params = new URLSearchParams(window.location.hash.slice(1));
  if (!params.has('correction')) {
    const savedPurpose = window.history.state?.fonasinCorrectionPurpose;
    return ['initial_affiliation', 'data_update', 'profile_completion'].includes(savedPurpose) ? savedPurpose as AffiliationPurpose : null;
  }
  const id = params.get('correction') ?? '';
  const token = params.get('token') ?? '';
  const read = params.get('read') ?? '';
  const purpose = params.get('purpose');
  window.history.replaceState(window.history.state, '', window.location.pathname + window.location.search);
  if (!/^[0-9a-f-]{36}$/i.test(id) || !/^[a-zA-Z0-9]{64}$/.test(token)
    || !read.startsWith(`/affiliation-applications/${id}?`)
    || !['initial_affiliation', 'data_update', 'profile_completion'].includes(purpose ?? '')) {
    throw new Error('El enlace de correccion no es valido. Solicita uno nuevo a FONASIN.');
  }
  const storageKey = purpose === 'initial_affiliation' ? DRAFT_STORAGE_KEYS[1] : DRAFT_STORAGE_KEYS[0];
  window.sessionStorage.setItem(storageKey, JSON.stringify({
    savedAt: Date.now(), id, readUrl: read, draftAccessToken: token,
    status: 'pending_correction', purpose,
  }));
  window.history.replaceState({ ...window.history.state, fonasinCorrectionPurpose: purpose }, '', window.location.pathname + window.location.search);
  return purpose as AffiliationPurpose;
}

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

function csrfToken(): string {
  return document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';
}

function draftAccessToken(path: string): string {
  for (const storageKey of DRAFT_STORAGE_KEYS) {
    try {
      const raw = window.sessionStorage.getItem(storageKey);
      if (!raw) continue;

      const stored = JSON.parse(raw) as { id?: unknown; draftAccessToken?: unknown };
      if (typeof stored.id !== 'string' || !path.includes(stored.id)) continue;
      if (typeof stored.draftAccessToken === 'string') return stored.draftAccessToken;
    } catch {
      // Ignore invalid browser state and continue checking the remaining key.
    }
  }

  return '';
}

async function requestJson<T>(path: string, options: AffiliationRequestOptions = {}): Promise<T> {
  const token = csrfToken();
  const storedDraftAccessToken = draftAccessToken(path);

  const response = await fetch(buildUrl(path), {
    method: options.method ?? 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(token ? { 'X-CSRF-TOKEN': token } : {}),
      ...(storedDraftAccessToken ? { 'X-Affiliation-Draft-Token': storedDraftAccessToken } : {}),
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(options.headers ?? {}),
    },
    body: options.body ?? null,
  });

  if (!response.ok) {
    const rawMessage = await response.text().catch(() => '');
    let message = rawMessage;

    try {
      const payload = JSON.parse(rawMessage) as { message?: string };
      message = payload.message ?? rawMessage;
    } catch {
      message = rawMessage;
    }

    throw new Error(message || `Request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as { data?: T };

  if (!payload.data) {
    throw new Error('La respuesta del backend no incluyó datos.');
  }

  return payload.data;
}

export function affiliationDownloadUrl(path: string): string {
  return buildUrl(path);
}

export async function createAffiliationDraft(): Promise<AffiliationDraft> {
  return requestJson<AffiliationDraft>('/affiliation-applications', {
    method: 'POST',
  });
}

export async function readAffiliationDraft(readUrl: string): Promise<AffiliationDraft> {
  return requestJson<AffiliationDraft>(readUrl, {
    method: 'GET',
  });
}

export async function saveAffiliationSection(
  sectionUrl: string,
  payload: AffiliationSectionPayload,
): Promise<void> {
  await requestJson(sectionUrl, {
    method: 'POST',
    body: JSON.stringify({
      schema_version: payload.schemaVersion,
      data: payload.data,
      completed: payload.completed ?? true,
    }),
  });
}

export async function uploadAffiliationDocument(
  documentUrl: string,
  payload: AffiliationDocumentPayload,
): Promise<void> {
  const formData = new FormData();
  formData.append('document_type', payload.documentType);
  formData.append('file', payload.file);

  await requestJson(documentUrl, {
    method: 'POST',
    body: formData,
  });
}

export async function acceptAffiliationConsent(
  consentUrl: string,
  payload: AffiliationConsentPayload,
): Promise<void> {
  await requestJson(consentUrl, {
    method: 'POST',
    body: JSON.stringify({
      consent_type: payload.consentType,
      policy_version: payload.policyVersion,
    }),
  });
}

export async function submitAffiliationApplication(
  submitUrl: string,
  policyVersion: string,
  signature: { city: string; date: string },
): Promise<AffiliationDraft> {
  return requestJson<AffiliationDraft>(submitUrl, {
    method: 'POST',
    body: JSON.stringify({
      policy_version: policyVersion,
      signature_city: signature.city,
      signature_date: signature.date,
    }),
  });
}
