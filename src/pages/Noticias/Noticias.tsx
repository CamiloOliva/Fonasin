import { newsItems } from '../../data/institutionalUpdates';

export default function Noticias() {
  return (
    <main className="container-page py-12 sm:py-16">
      <header className="page-intro rounded-[2rem] px-6 py-10 sm:px-10">
        <p className="text-sm font-bold uppercase tracking-[.16em] text-fonasin-green">Actualidad institucional</p>
        <h1 className="mt-3 text-4xl font-black text-fonasin-deep sm:text-5xl">Noticias y comunicados</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-600">Publicaciones oficiales de FONASIN.</p>
      </header>

      {newsItems.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-fonasin-green/10 bg-white p-8 text-slate-600" aria-label="Estado de publicaciones">
          FONASIN aún no ha suministrado publicaciones aprobadas para esta sección.
        </section>
      ) : (
        <section className="mt-8 grid gap-5 md:grid-cols-2" aria-label="Publicaciones">
          {newsItems.map((item) => (
            <article key={item.id} className="rounded-3xl border border-fonasin-green/10 bg-white p-7 shadow-sm">
              <time className="text-sm font-semibold text-fonasin-green" dateTime={item.publishedAt}>
                {new Date(`${item.publishedAt}T12:00:00`).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
              </time>
              <h2 className="mt-3 text-2xl font-black text-fonasin-deep">{item.title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{item.summary}</p>
              {item.href && <a href={item.href} className="mt-5 inline-block font-bold text-fonasin-green underline focus-ring">Leer comunicado</a>}
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
