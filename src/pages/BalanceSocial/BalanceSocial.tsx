import { usePublicContent } from '../../hooks/usePublicContent';
import { publicContentMediaUrl } from '../../services/publicContentService';

export default function BalanceSocial() {
  const { content, error, loading } = usePublicContent();
  const reports = content?.data.filter((item) => item.kind === 'social_balance') ?? [];
  return (
    <main className="container-page py-12 sm:py-16">
      <header className="page-intro rounded-[2rem] px-6 py-10 sm:px-10">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-fonasin-green">Transparencia</p>
        <h1 className="mt-3 text-4xl font-black text-fonasin-deep sm:text-5xl">Balance social</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">Información institucional sobre el impacto y bienestar de nuestros asociados.</p>
      </header>

      {loading || error || reports.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-fonasin-green/10 bg-white p-8 text-slate-600" aria-label="Estado de informes">
          {loading ? 'Cargando informes…' : error ? 'No fue posible consultar los informes. Intenta nuevamente más tarde.' : 'FONASIN aún no ha suministrado un informe de balance social aprobado para publicar.'}
        </section>
      ) : (
        <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Informes de balance social">
          {reports.map((report) => (
            <article key={report.id} className="rounded-3xl border border-fonasin-green/10 bg-white p-7 shadow-sm">
              <h2 className="mt-3 text-2xl font-black text-fonasin-deep">{report.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{report.summary}</p>
              {(report.document_url || report.link_url) && <a href={report.document_url ? publicContentMediaUrl(report.document_url) ?? undefined : report.link_url ?? undefined} target="_blank" rel="noopener noreferrer" className="mt-5 inline-block font-bold text-fonasin-green underline focus-ring">Consultar informe</a>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
