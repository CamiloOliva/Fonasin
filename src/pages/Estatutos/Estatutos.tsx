import DocumentsSection from '../../components/sections/DocumentsSection';

export default function Estatutos() {
  return (
    <>
      <section className="bg-fonasin-surface py-14 sm:py-16">
        <div className="container-page">
          <span className="text-xs font-bold uppercase tracking-[.18em] text-fonasin-green">Institucional</span>
          <h1 className="mt-2 text-4xl font-black text-fonasin-deep sm:text-5xl">Estatutos</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
            Consulta el espacio documental de FONASIN para acceder a los estatutos y reglamentos institucionales cuando estén publicados.
          </p>
        </div>
      </section>

      <DocumentsSection variant="estatutos" />
    </>
  );
}
