import { BookOpen, Download, ShieldCheck, Sparkles } from 'lucide-react';
import DocumentsSection from '../../components/sections/DocumentsSection';

export default function Estatutos() {
  return (
    <>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(11,102,68,0.18),_transparent_42%),linear-gradient(180deg,#f8faf5_0%,#eef4ed_100%)] py-14 sm:py-18">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),transparent)]" />
        <div className="container-page relative">
          <div className="max-w-4xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-fonasin-green/15 bg-white/80 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-fonasin-green shadow-sm">
              <Sparkles size={14} />
              Institucional
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-fonasin-deep sm:text-5xl lg:text-6xl">
              Estatutos
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
              Consulta, descarga y revisa la documentación institucional de FONASIN en una vista más clara,
              cómoda y preparada para lectura prolongada.
            </p>
          </div>

          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <article className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-lg shadow-black/5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fonasin-green/10 text-fonasin-green">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[.16em] text-fonasin-deep">Lectura guiada</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Revisa los documentos sin salir de la página.</p>
                </div>
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-lg shadow-black/5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Download size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[.16em] text-fonasin-deep">Descarga rápida</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Guarda una copia local cuando la necesites.</p>
                </div>
              </div>
            </article>

            <article className="rounded-[1.5rem] border border-white/70 bg-white/85 p-5 shadow-lg shadow-black/5 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-fonasin-deep/10 text-fonasin-deep">
                  <ShieldCheck size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-black uppercase tracking-[.16em] text-fonasin-deep">Consulta segura</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">Acceso ordenado a la información institucional.</p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <DocumentsSection variant="estatutos" />
    </>
  );
}