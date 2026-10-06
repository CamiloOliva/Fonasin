export type PublicContentKind = 'news' | 'social_balance' | 'agreement' | 'banner';

export type PublicContentItem = {
  id: string;
  kind: PublicContentKind;
  title: string;
  summary: string | null;
  category: string | null;
  link_url: string | null;
  sort_order: number;
  published: boolean;
  published_at: string | null;
  image_url: string | null;
  document_url: string | null;
};

export type PublicSiteSettings = {
  contact_email: string;
  facebook_url: string | null;
  instagram_url: string | null;
  youtube_url: string | null;
};

export type PublicContentResponse = { data: PublicContentItem[]; settings: PublicSiteSettings };
export type PublicContentInput = Pick<PublicContentItem, 'kind' | 'title' | 'summary' | 'category' | 'link_url' | 'sort_order' | 'published'>;

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL?.trim().replace(/\/$/, '') ?? '';
let csrf = '';

export function publicContentMediaUrl(path: string | null): string | null {
  if (!path) return null;
  // Migrated images are still web assets; uploaded media comes from the API.
  return path.startsWith('/public/content/') ? `${backendBaseUrl}${path}` : path;
}

export function adminContentMediaUrl(item: PublicContentItem, path: string | null): string | null {
  if (!path) return null;
  if (!item.published && path.startsWith(`/public/content/${item.id}/`)) {
    return `${backendBaseUrl}${path.replace('/public/content/', '/admin/content/')}`;
  }
  return publicContentMediaUrl(path);
}

async function request<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const response = await fetch(`${backendBaseUrl}${path}`, {
    ...init,
    credentials: 'include',
    headers: { Accept: 'application/json', ...init.headers },
  });
  if (response.status === 419 && retry && init.method) {
    csrf = '';
    return mutation<T>(path, init.method, init.body ?? undefined, false);
  }
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof payload?.message === 'string' ? payload.message : 'No fue posible consultar o guardar el contenido.');
  return payload as T;
}

async function mutation<T>(path: string, method: string, body?: BodyInit, retry = true): Promise<T> {
  if (!csrf) {
    const token = await request<{ data: { token: string } }>('/csrf-token');
    csrf = token.data.token;
  }
  return request<T>(path, {
    method,
    body,
    headers: {
      'X-CSRF-TOKEN': csrf,
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    },
  }, retry);
}

export function fetchPublicContent(): Promise<PublicContentResponse> {
  return request('/public/content');
}

export function fetchAdminPublicContent(): Promise<PublicContentResponse> {
  return request('/admin/content');
}

export function createPublicContent(input: PublicContentInput): Promise<{ data: PublicContentItem }> {
  return mutation('/admin/content', 'POST', JSON.stringify(input));
}

export function updatePublicContent(id: string, input: Partial<PublicContentInput>): Promise<{ data: PublicContentItem }> {
  return mutation(`/admin/content/${encodeURIComponent(id)}`, 'PATCH', JSON.stringify(input));
}

export function uploadPublicContentMedia(id: string, kind: 'image' | 'document', file: File): Promise<{ data: PublicContentItem }> {
  const body = new FormData();
  body.set('kind', kind);
  body.set('file', file);
  return mutation(`/admin/content/${encodeURIComponent(id)}/media`, 'POST', body);
}

export function updatePublicSiteSettings(settings: PublicSiteSettings): Promise<{ settings: PublicSiteSettings }> {
  return mutation('/admin/content/settings', 'PUT', JSON.stringify(settings));
}
