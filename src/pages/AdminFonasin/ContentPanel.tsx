import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  adminContentMediaUrl, createPublicContent, fetchAdminPublicContent,
  updatePublicContent, updatePublicSiteSettings, uploadPublicContentMedia,
  type PublicContentInput, type PublicContentItem, type PublicSiteSettings,
} from '../../services/publicContentService';

const empty: PublicContentInput = {
  kind: 'news', title: '', summary: '', category: null, link_url: null, sort_order: 0, published: false,
};

const labels = { news: 'Noticia o comunicado', social_balance: 'Balance social', agreement: 'Convenio', banner: 'Banner de inicio' };
const categories = ['Salud y bienestar', 'Funerarios', 'Turismo', 'Servicios vehiculares'];

export default function ContentPanel({ canManage }: { canManage: boolean }) {
  const [items, setItems] = useState<PublicContentItem[]>([]);
  const [settings, setSettings] = useState<PublicSiteSettings | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [form, setForm] = useState<PublicContentInput>(empty);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const response = await fetchAdminPublicContent();
    setItems(response.data);
    setSettings(response.settings);
  }, []);

  useEffect(() => {
    load().catch(() => setError('No fue posible cargar el contenido institucional.'));
  }, [load]);

  function choose(item: PublicContentItem | null) {
    setSelected(item?.id ?? null);
    setForm(item ? {
      kind: item.kind, title: item.title, summary: item.summary,
      category: item.category, link_url: item.link_url,
      sort_order: item.sort_order, published: item.published,
    } : empty);
    setMessage('');
    setError('');
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setMessage(''); setError('');
    try {
      const result = selected ? await updatePublicContent(selected, form) : await createPublicContent(form);
      await load();
      choose(result.data);
      setMessage('Contenido guardado. Solo los elementos publicados son visibles en el sitio.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible guardar el contenido.');
    } finally { setBusy(false); }
  }

  async function upload(kind: 'image' | 'document', file: File) {
    if (!selected) return;
    setBusy(true); setError(''); setMessage('');
    try {
      const result = await uploadPublicContentMedia(selected, kind, file);
      await load();
      choose(result.data);
      setMessage('Archivo cargado como borrador. Verifica la vista previa y vuelve a publicar el contenido.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible cargar el archivo.');
    } finally { setBusy(false); }
  }

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    if (!settings) return;
    setBusy(true); setError(''); setMessage('');
    try {
      await updatePublicSiteSettings(settings);
      await load();
      setMessage('Datos de contacto guardados.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible guardar los datos de contacto.');
    } finally { setBusy(false); }
  }

  const inputClass = 'w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900';
  const selectedItem = items.find((item) => item.id === selected);

  return <div className="grid gap-5 lg:grid-cols-[minmax(230px,0.8fr)_minmax(0,1.4fr)]">
    <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-black text-slate-950">Publicaciones</h2>
        {canManage && <button type="button" onClick={() => choose(null)} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white">Nueva</button>}
      </div>
      <p className="mt-2 text-sm text-slate-600">Borrador no se muestra al público. Publica únicamente contenido aprobado por FONASIN.</p>
      <div className="mt-4 space-y-2">
        {items.map((item) => <button type="button" key={item.id} onClick={() => choose(item)} className={`w-full rounded-xl border p-3 text-left text-sm ${selected === item.id ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200'}`}>
          <span className="block font-bold text-slate-900">{item.title}</span>
          <span className="text-slate-600">{labels[item.kind]} · {item.published ? 'Publicado' : 'Borrador'}</span>
        </button>)}
      </div>
    </section>
    <div className="space-y-5">
      {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
      {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p>}
      {canManage && <form onSubmit={save} className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">{selected ? 'Editar publicación' : 'Nueva publicación'}</h2>
        <label className="block text-sm font-bold text-slate-700">Tipo
          <select className={inputClass} value={form.kind} disabled={Boolean(selected)} onChange={(event) => setForm({ ...form, kind: event.target.value as PublicContentInput['kind'], category: null })}>
            {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-bold text-slate-700">Título
          <input className={inputClass} maxLength={255} required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
        </label>
        <label className="block text-sm font-bold text-slate-700">Descripción
          <textarea className={inputClass} maxLength={3000} rows={3} value={form.summary ?? ''} onChange={(event) => setForm({ ...form, summary: event.target.value })} />
        </label>
        {form.kind === 'agreement' && <label className="block text-sm font-bold text-slate-700">Categoría
          <select className={inputClass} value={form.category ?? ''} onChange={(event) => setForm({ ...form, category: event.target.value || null })}>
            <option value="">Seleccionar</option>{categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </label>}
        <label className="block text-sm font-bold text-slate-700">Enlace externo HTTPS (opcional)
          <input className={inputClass} type="url" pattern="https://.*" value={form.link_url ?? ''} onChange={(event) => setForm({ ...form, link_url: event.target.value || null })} />
        </label>
        <label className="block text-sm font-bold text-slate-700">Orden
          <input className={inputClass} type="number" min={0} max={100000} value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value) })} />
        </label>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> Publicar en el sitio
        </label>
        <button type="submit" disabled={busy} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Guardar</button>
        {selected && <div className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">Imagen (JPG/PNG/WebP)
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload('image', file); }} className="mt-2 block w-full text-xs" />
          </label>
          <label className="text-sm font-bold text-slate-700">Documento (PDF)
            <input type="file" accept="application/pdf" disabled={busy} onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload('document', file); }} className="mt-2 block w-full text-xs" />
          </label>
          {selectedItem?.image_url && <a href={adminContentMediaUrl(selectedItem, selectedItem.image_url) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-700 underline">Ver imagen {selectedItem.published ? 'publicada' : 'en borrador'}</a>}
          {selectedItem?.document_url && <a href={adminContentMediaUrl(selectedItem, selectedItem.document_url) ?? undefined} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-700 underline">Ver PDF {selectedItem.published ? 'publicado' : 'en borrador'}</a>}
        </div>}
      </form>}
      {settings && <form onSubmit={saveSettings} className="space-y-3 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black text-slate-950">Contacto y redes</h2>
        {(['contact_email', 'facebook_url', 'instagram_url', 'youtube_url'] as const).map((field) => <label key={field} className="block text-sm font-bold text-slate-700">
          {{ contact_email: 'Correo oficial', facebook_url: 'Facebook', instagram_url: 'Instagram', youtube_url: 'YouTube' }[field]}
          <input className={inputClass} type={field === 'contact_email' ? 'email' : 'url'} disabled={!canManage} value={settings[field] ?? ''} onChange={(event) => setSettings({ ...settings, [field]: event.target.value || (field === 'contact_email' ? '' : null) })} />
        </label>)}
        {canManage && <button type="submit" disabled={busy} className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50">Guardar contacto</button>}
      </form>}
    </div>
  </div>;
}
