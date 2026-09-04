export type AffiliationSectionKey = 'personal' | 'employment' | 'financial' | 'beneficiaries' | 'sarlaft';

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
  status: string;
  current_step: string;
  submitted_at: string | null;
  reviewed_by_user_id: string | null;
  reviewed_at: string | null;
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
const DRAFT_STORAGE_KEY = 'fonasin.affiliation.draft.v1';

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

function draftAccessToken(): string {
  try {
    const raw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return '';

    const stored = JSON.parse(raw) as { draftAccessToken?: unknown };

    return typeof stored.draftAccessToken === 'string' ? stored.draftAccessToken : '';
  } catch {
    return '';
  }
}

async function requestJson<T>(path: string, options: AffiliationRequestOptions = {}): Promise<T> {
  const token = csrfToken();
  const storedDraftAccessToken = draftAccessToken();

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
