import { socialBalanceReports } from '../../data/institutionalUpdates';

export default function BalanceSocial() {
  return (
    <main className="container-page py-12 sm:py-16">
      <header className="page-intro rounded-[2rem] px-6 py-10 sm:px-10">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-fonasin-green">Transparencia</p>
        <h1 className="mt-3 text-4xl font-black text-fonasin-deep sm:text-5xl">Balance social</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">Información institucional sobre el impacto y bienestar de nuestros asociados.</p>
      </header>

      {socialBalanceReports.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-fonasin-green/10 bg-white p-8 text-slate-600" aria-label="Estado de informes">
          FONASIN aún no ha suministrado un informe de balance social aprobado para publicar.
        </section>
      ) : (
        <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Informes de balance social">
          {socialBalanceReports.map((report) => (
            <article key={`${report.year}-${report.href}`} className="rounded-3xl border border-fonasin-green/10 bg-white p-7 shadow-sm">
              <p className="text-sm font-bold text-fonasin-green">Vigencia {report.year}</p>
              <h2 className="mt-3 text-2xl font-black text-fonasin-deep">{report.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{report.description}</p>
              <a href={report.href} className="mt-5 inline-block font-bold text-fonasin-green underline focus-ring">Consultar informe</a>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
