import { usePublicContent } from '../../hooks/usePublicContent';
import { publicContentMediaUrl } from '../../services/publicContentService';

export default function Noticias() {
  const { content, error, loading } = usePublicContent();
  const newsItems = content?.data.filter((item) => item.kind === 'news') ?? [];
  return (
    <main className="container-page py-12 sm:py-16">
      <header className="page-intro rounded-[2rem] px-6 py-10 sm:px-10">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-fonasin-green">Actualidad institucional</p>
        <h1 className="mt-3 text-4xl font-black text-fonasin-deep sm:text-5xl">Noticias y comunicados</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">Publicaciones oficiales de FONASIN.</p>
      </header>

      {loading || error || newsItems.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-fonasin-green/10 bg-white p-8 text-slate-600" aria-label="Estado de publicaciones">
          {loading ? 'Cargando publicaciones…' : error ? 'No fue posible consultar las publicaciones. Intenta nuevamente más tarde.' : 'FONASIN aún no ha suministrado publicaciones aprobadas para esta sección.'}
        </section>
      ) : (
        <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Publicaciones">
          {newsItems.map((item) => (
            <article key={item.id} className="rounded-3xl border border-fonasin-green/10 bg-white p-7 shadow-sm">
              <time className="text-sm font-semibold text-fonasin-green" dateTime={item.published_at ?? undefined}>
                {item.published_at ? new Date(item.published_at).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
              </time>
              {item.image_url && <img src={publicContentMediaUrl(item.image_url) ?? undefined} alt="" className="mt-4 max-h-56 w-full rounded-xl object-cover" />}
              <h2 className="mt-3 text-2xl font-black text-fonasin-deep">{item.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{item.summary}</p>
              {item.document_url && <a href={publicContentMediaUrl(item.document_url) ?? undefined} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block font-bold text-fonasin-green underline focus-ring">Leer comunicado</a>}
              {!item.document_url && item.link_url && <a href={item.link_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block font-bold text-fonasin-green underline focus-ring">Leer comunicado</a>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
