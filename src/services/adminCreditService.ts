export type AdminCredit = {
  id: string;
  associate_id: string;
  credit_line: string;
  initial_balance: string;
  current_balance: string;
  term_months: number | null;
  interest_rate: string | null;
  installment_amount: string;
  last_payment_date?: string | null;
  status: string;
  registered_by_user_id: string;
  associate: {
    id: string;
    full_name: string;
    document_type: string;
    status: string;
  } | null;
};

export type AdminImportType = 'credits' | 'contributions' | 'voluntary_savings' | 'permanent_savings';

export type AdminImportBatch = {
  id: string;
  import_type: AdminImportType | string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  status: string;
  rows_total: number;
  rows_created: number;
  rows_updated: number;
  rows_rejected: number;
  errors: Array<{ row: number | null; message: string }> | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string | null;
  imported_by: {
    id: string;
    email: string;
  } | null;
};

export type AdminImportBatchPage = {
  data: AdminImportBatch[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
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

export async function fetchAdminCredits(page = 1, perPage = 50): Promise<AdminCredit[]> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });
  const response = await requestJson<{ data: AdminCredit[] }>(`/admin/credits?${params.toString()}`);

  return response.data;
}

export async function fetchAdminImportBatches(type = '', page = 1, perPage = 50): Promise<AdminImportBatchPage> {
  const params = new URLSearchParams({
    page: String(page),
    per_page: String(perPage),
  });

  if (type) {
    params.set('type', type);
  }

  const response = await requestJson<AdminImportBatchPage>(`/admin/import-batches?${params.toString()}`);

  return response;
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

export async function importAdminCredits(file: File): Promise<AdminImportBatch> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await requestJson<{ data: AdminImportBatch }>('/admin/import-batches/credits', {
    method: 'POST',
    body: formData,
  });

  return response.data;
}

export async function importAdminContributions(file: File): Promise<AdminImportBatch> {
  return importAdminSpreadsheet('contributions', file);
}

export async function importAdminSpreadsheet(type: AdminImportType, file: File): Promise<AdminImportBatch> {
  const formData = new FormData();
  formData.append('file', file);

  const routeType = type.replaceAll('_', '-');

  const response = await requestJson<{ data: AdminImportBatch }>(`/admin/import-batches/${routeType}`, {
    method: 'POST',
    body: formData,
  });

  return response.data;
}

export async function downloadAdminImportTemplate(type: AdminImportType): Promise<void> {
  const routeType = type.replaceAll('_', '-');
  const response = await fetch(buildUrl(`/admin/import-batches/templates/${routeType}`), {
    credentials: 'include',
    headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  });

  if (!response.ok) {
    throw new Error(response.status === 403
      ? 'Tu usuario no tiene permisos para descargar plantillas de importacion.'
      : 'No fue posible descargar la plantilla.');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const filenames: Record<AdminImportType, string> = {
    credits: 'plantilla-cartera.xlsx',
    contributions: 'plantilla-aportes.xlsx',
    voluntary_savings: 'plantilla-ahorro-voluntario.xlsx',
    permanent_savings: 'plantilla-ahorro-permanente.xlsx',
  };
  link.download = filenames[type];
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function downloadAdminImportErrorReport(batchId: string): Promise<void> {
  const response = await fetch(buildUrl(`/admin/import-batches/${batchId}/errors`), {
    credentials: 'include',
    headers: { Accept: 'text/csv' },
  });

  if (!response.ok) {
    throw new Error(response.status === 403
      ? 'Tu usuario no tiene permisos para descargar el reporte.'
      : 'No fue posible descargar el reporte de errores.');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `errores-importacion-${batchId}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
