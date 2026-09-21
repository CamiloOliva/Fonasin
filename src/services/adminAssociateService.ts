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
  activation_required?: boolean;
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
  status?: string;
};

export type AdminAssociateProfile = {
  associate: {
    id: string;
    document_type: string;
    document_number: string | null;
    full_name: string;
    status: string;
    email: string | null;
    user_status: string | null;
  };
  form: {
    state: 'available' | 'empty';
    application: {
      id: string;
      purpose: string;
      status: string;
      submitted_at: string | null;
      updated_at: string | null;
      sections: Array<{
        section: string;
        schema_version: number;
        data: Record<string, unknown>;
      }>;
    } | null;
  };
  credits: {
    state: 'available' | 'empty';
    items: Array<{
      id: string;
      credit_line: string;
      promissory_note_number: string | null;
      initial_balance: string;
      installment_amount: string;
      current_balance: string;
      last_payment_date: string | null;
      status: string;
    }>;
  };
  contributions: {
    state: 'available' | 'empty';
    account: {
      id: string;
      contribution_balance: string;
      permanent_savings_balance: string;
      voluntary_savings_balance: string;
      total_balance: string;
      status: string;
      last_period: string | null;
      last_cut_off_date: string | null;
    } | null;
    movements: Array<{
      id: string;
      movement_type: string;
      period: string;
      cut_off_date: string;
      amount: string;
      balance_after: string;
      status: string;
      reference: string;
    }>;
    movement_count: number;
    returned_movement_count: number;
  };
  generated_at: string;
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

export async function sendAdminAssociateActivation(id: string): Promise<void> {
  await requestJson<{ message: string }>(`/admin/associates/${id}/activation`, {
    method: 'POST',
  });
}

export async function fetchAdminAssociateProfile(id: string): Promise<AdminAssociateProfile> {
  const response = await requestJson<{ data: AdminAssociateProfile }>(`/admin/associates/${id}/profile`);

  return response.data;
}

export async function searchAdminAssociateProfile(documentNumber: string): Promise<AdminAssociateProfile> {
  const response = await requestJson<{ data: AdminAssociateProfile }>('/admin/associates/profile/search', {
    method: 'POST',
    body: JSON.stringify({ document_number: documentNumber }),
  });

  return response.data;
}

export async function downloadAdminAssociateProfile(id: string): Promise<void> {
  const response = await fetch(buildUrl(`/admin/associates/${id}/profile/export`), {
    credentials: 'include',
    headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(typeof payload?.message === 'string' ? payload.message : 'No fue posible exportar la ficha del asociado.');
  }

  const blobUrl = URL.createObjectURL(await response.blob());
  const anchor = document.createElement('a');
  anchor.href = blobUrl;
  anchor.download = `ficha-asociado-${id}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(blobUrl);
}
