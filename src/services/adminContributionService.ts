export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type AdminContributionAccount = {
  id: string;
  associate_id: string;
  permanent_savings_balance: string;
  voluntary_savings_balance: string;
  total_balance: string;
  status: string;
  last_period: string | null;
  last_cut_off_date: string | null;
  last_movement_at: string | null;
  movements_count: number | null;
  associate: {
    id: string;
    full_name: string;
    document_type: string;
    status: string;
  } | null;
};

export type AdminContributionMovement = {
  id: string;
  movement_type: string;
  period: string;
  cut_off_date: string;
  amount: string;
  balance_after: string;
  status: string;
  source: string;
  reference: string;
  recorded_at: string;
  recorded_by: {
    id: string;
    email: string;
  } | null;
};

export type AdminContributionAccountFilters = {
  associateId?: string;
  status?: string;
  period?: string;
  page?: number;
  perPage?: number;
};

export type AdminContributionMovementFilters = {
  movementType?: string;
  status?: string;
  period?: string;
  page?: number;
  perPage?: number;
};

export type AdminContributionAccountPage = {
  data: AdminContributionAccount[];
  meta: PaginationMeta;
};

export type AdminContributionMovementPage = {
  data: AdminContributionMovement[];
  account: AdminContributionAccount;
  meta: PaginationMeta;
};

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL?.trim().replace(/\/$/, '') ?? '';

function queryString(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams();

  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });

  return params.toString();
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${backendBaseUrl}${path}`, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(typeof payload?.message === 'string'
      ? payload.message
      : response.status === 403
        ? 'Tu usuario no tiene permisos para consultar aportes.'
        : 'No fue posible consultar los aportes.');
  }

  return payload as T;
}

export function fetchAdminContributionAccounts(
  filters: AdminContributionAccountFilters = {},
): Promise<AdminContributionAccountPage> {
  const query = queryString({
    associate_id: filters.associateId,
    status: filters.status,
    period: filters.period,
    page: filters.page ?? 1,
    per_page: filters.perPage ?? 25,
  });

  return getJson<AdminContributionAccountPage>(`/admin/contributions?${query}`);
}

export function fetchAdminContributionMovements(
  accountId: string,
  filters: AdminContributionMovementFilters = {},
): Promise<AdminContributionMovementPage> {
  const query = queryString({
    movement_type: filters.movementType,
    status: filters.status,
    period: filters.period,
    page: filters.page ?? 1,
    per_page: filters.perPage ?? 25,
  });

  return getJson<AdminContributionMovementPage>(`/admin/contributions/${accountId}/movements?${query}`);
}
