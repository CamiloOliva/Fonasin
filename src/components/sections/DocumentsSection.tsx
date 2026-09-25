import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Building2, Download, FileText, Gavel, PieChart, ShieldCheck, X } from 'lucide-react';
import { documents, type DocumentCategory } from '../../data/documents';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SectionHeading from '../ui/SectionHeading';
import StatutesBookViewer from './StatutesBookViewer';

type DocumentsSectionProps = {
  variant?: 'home' | 'estatutos';
};

type DocumentItem = (typeof documents)[number];

const categories = [
  { id: 'marco-institucional', number: '01', title: 'Marco institucional', description: 'Documentos que establecen la estructura, principios y funcionamiento de FONASIN.', icon: Building2, category: 'institutional' as DocumentCategory },
  { id: 'reglamentos', number: '02', title: 'Normativa y reglamentos', description: 'Reglamentos y politicas que rigen nuestros servicios y la convivencia institucional.', icon: Gavel, category: 'regulations' as DocumentCategory },
  { id: 'informacion-financiera', number: '03', title: 'Informacion financiera', description: 'Estados financieros, informes y reportes que reflejan la gestion y solidez de FONASIN.', icon: PieChart, category: 'financial' as DocumentCategory },
  { id: 'tratamiento-datos', number: '04', title: 'Transparencia y datos', description: 'Politicas y documentos relacionados con la proteccion de datos y la transparencia.', icon: ShieldCheck, category: 'data' as DocumentCategory },
];

export default function DocumentsSection({ variant = 'home' }: DocumentsSectionProps) {
  const isHome = variant === 'home';
  const location = useLocation();
  const navigate = useNavigate();
  const visibleDocuments = isHome ? documents.filter((document) => document.id === 'data-policy') : documents;
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null);

  const closeDocument = useCallback(() => {
    setActiveDocument(null);

    if (new URLSearchParams(location.search).has('document')) {
      navigate({ pathname: location.pathname, hash: location.hash }, { replace: true });
    }
  }, [location.hash, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (isHome || !location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    target?.scrollIntoView?.({ block: 'start' });
  }, [isHome, location.hash]);

  useEffect(() => {
    if (isHome) return;
    const documentId = new URLSearchParams(location.search).get('document');
    const requestedDocument = documents.find((document) => document.id === documentId);

    if (requestedDocument) {
      setActiveDocument(requestedDocument);
    }
  }, [isHome, location.search]);

  useEffect(() => {
    if (!activeDocument) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeDocument();
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDocument, closeDocument]);

  const openDocument = (document: DocumentItem) => setActiveDocument(document);

  return (
    <>
      <section className="relative overflow-hidden bg-[#f8f9f3] py-14 sm:py-20">
        <div className="pointer-events-none absolute -left-24 bottom-0 h-56 w-96 rounded-full bg-fonasin-lime/10 blur-3xl" />
        <div className="container-page relative">
          {isHome ? (
            <SectionHeading eyebrow="Documentos" title="Documentacion institucional" text="Consulta los documentos institucionales disponibles en esta vista." />
          ) : (
            <>
              <div className="relative overflow-hidden rounded-[2.5rem] bg-[#f4f5ec] px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
                <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-[42%] overflow-hidden rounded-l-[45%] rounded-br-[5rem] bg-fonasin-deep lg:block">
                  <div className="absolute -left-8 top-0 h-full w-8 bg-fonasin-lime" />
                  <img
                    src="/images/librofonasin.png"
                    alt="Libro institucional de FONASIN"
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-fonasin-deep/20 via-transparent to-transparent" />
                </div>
                <div className="relative z-10 max-w-full lg:max-w-[52%]">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-fonasin-green">Centro documental</p>
                  <h1 aria-label="Estatutos" className="mt-4 font-heading text-5xl font-black leading-[0.95] tracking-[-0.05em] text-fonasin-deep sm:text-6xl lg:text-7xl">Informacion <span className="block text-amber-500">institucional</span></h1>
                  <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">Consulta y descarga los documentos institucionales, reglamentos y estados financieros de FONASIN.</p>
                </div>
                <div className="relative z-10 mt-9 grid max-w-full gap-5 sm:grid-cols-3 lg:max-w-[52%]">
                  {[['Transparencia', 'Informacion clara y confiable.'], ['Accesibilidad', 'Documentos disponibles cuando los necesites.'], ['Compromiso', 'Cumplimos con las mejores practicas y normativas.']].map(([title, text], index) => (
                    <div key={title} className="border-l border-fonasin-green/40 pl-4"><ShieldCheck size={20} className="text-fonasin-green" /><p className="mt-2 text-sm font-black text-fonasin-deep">{title}</p><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></div>
                  ))}
                </div>
              </div>
              <div className="mt-12 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.2em] text-fonasin-green">Explora nuestras categorias</p><h2 className="mt-2 font-heading text-2xl font-black text-fonasin-deep">Encuentra la informacion que necesitas</h2></div><BookOpen className="hidden text-fonasin-green sm:block" size={30} /></div>
            </>
          )}

          <div className={`mt-8 grid gap-5 ${isHome ? 'md:grid-cols-3' : 'sm:grid-cols-2 xl:grid-cols-4'}`}>
            {isHome ? visibleDocuments.map((document) => {
              return (
                <article key={document.id} className="flex h-full flex-col rounded-[1.5rem] border border-fonasin-green/10 bg-white p-6 shadow-lg shadow-fonasin-deep/5">
                  <FileText className="text-fonasin-green" size={30} /><h3 className="mt-4 text-xl font-black text-fonasin-deep">{document.title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{document.description}</p>
                  <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => openDocument(document)} className="inline-flex items-center gap-2 rounded-full bg-fonasin-green px-4 py-2 text-sm font-bold text-white focus-ring">Ver en la pagina <BookOpen size={16} /></button><a href={document.href} download={document.downloadName} className="inline-flex items-center gap-2 rounded-full border border-fonasin-green/20 px-4 py-2 text-sm font-bold text-fonasin-green focus-ring">Descargar <Download size={16} /></a></div>
                </article>
              );
            }) : categories.map((category) => {
              const categoryDocuments = documents.filter((document) => document.category === category.category);
              const Icon = category.icon;
              return (
                <article id={category.id} key={category.title} className="group relative flex min-h-[20rem] scroll-mt-28 flex-col overflow-hidden rounded-[1.4rem] border border-fonasin-green/20 bg-white p-5 shadow-[0_10px_30px_rgba(13,71,56,0.06)] transition hover:-translate-y-1 hover:border-fonasin-green/40 hover:shadow-[0_18px_36px_rgba(13,71,56,0.12)]">
                  <span className="pointer-events-none absolute right-4 top-0 text-6xl font-black leading-none text-fonasin-green/20">{category.number}</span>
                  <div className="relative grid h-11 w-11 place-items-center rounded-xl bg-fonasin-deep text-fonasin-lime"><Icon size={23} /></div>
                  <h3 aria-label={category.category === 'institutional' ? 'Estatutos' : category.title} className="relative mt-5 font-heading text-lg font-black text-fonasin-deep">{category.title}</h3>
                  <div className="mt-2 h-1 w-10 rounded-full bg-fonasin-lime" />
                  <p lang="es" className="mt-3 text-sm leading-6 text-slate-600">{category.description}</p>
                  <div className="mt-5 divide-y divide-slate-200 border-y border-slate-200">
                    {categoryDocuments.map((document) => (
                      <div key={document.id} className="py-4">
                        <p className="pr-8 text-sm font-black leading-5 text-fonasin-deep">{document.title}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <button type="button" onClick={() => openDocument(document)} aria-label={`Ver ${document.title}`} className="inline-flex items-center gap-1 rounded-lg bg-fonasin-deep px-3 py-2 text-xs font-bold text-white focus-ring">Ver <BookOpen size={14} /></button>
                          <a href={document.href} download={document.downloadName} aria-label={`Descargar ${document.title}`} className="inline-flex items-center gap-1 rounded-lg border border-fonasin-green/20 px-3 py-2 text-xs font-bold text-fonasin-green focus-ring">Descargar <Download size={14} /></a>
                        </div>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          {!isHome ? <div className="mt-5 flex flex-col items-center justify-between gap-4 rounded-[1.5rem] border border-fonasin-green/10 bg-white/70 px-6 py-5 sm:flex-row"><div className="flex items-center gap-3"><FileText className="text-fonasin-green" size={28} /><div><h3 className="font-heading font-black text-fonasin-deep">No encuentras lo que buscas?</h3><p className="text-sm text-slate-600">Envia tu consulta mediante nuestro formulario de atencion.</p></div></div><Link to="/fpqrs" className="inline-flex items-center rounded-lg bg-fonasin-deep px-5 py-2.5 text-sm font-bold text-white focus-ring">Ir a FPQRS</Link></div> : null}
        </div>
      </section>
      {activeDocument?.href ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/80 px-2 py-2 backdrop-blur-md sm:px-4 sm:py-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="estatutos-viewer-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDocument();
            }
          }}
        >
          <div className="relative flex h-[calc(100dvh-1rem)] w-full max-w-[1280px] flex-col overflow-hidden rounded-[2.25rem] border border-amber-200/40 bg-[linear-gradient(135deg,#5b3b17,#2c1b0a_38%,#140c04)] p-2 shadow-2xl shadow-black/50 sm:h-[calc(100dvh-2rem)] sm:p-3">
            <button
              type="button"
              onClick={closeDocument}
              className="absolute right-4 top-4 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 focus-ring"
              aria-label="Cerrar visor"
            >
              <X size={18} />
            </button>

            <div className="grid flex-1 min-h-0 gap-3 lg:grid-cols-[minmax(260px,0.78fr)_minmax(0,1.22fr)]">
              <aside className="relative flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-amber-100/50 bg-[#fff8ea] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] sm:p-5 lg:p-6">
                <div className="absolute inset-y-0 right-0 w-4 bg-[linear-gradient(180deg,rgba(92,58,22,0.08),rgba(92,58,22,0.18),rgba(92,58,22,0.08))]" />
                <div className="absolute left-8 top-0 h-full w-px bg-amber-900/10" />
                <div className="relative flex h-full flex-col">
                  <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-amber-950">
                    <BookOpen size={14} />
                    Lectura institucional
                  </span>
                  <h2 id="estatutos-viewer-title" className="mt-5 text-3xl font-black leading-tight text-amber-950">
                    {activeDocument.title}
                  </h2>
                  <p className="mt-4 text-sm leading-6 text-amber-950/80 sm:leading-7">
                    Abre el documento en un formato de lectura tipo libro, con una experiencia mas comoda para revisar
                    el contenido sin salir de la pagina.
                  </p>

                  <div className="mt-6 space-y-4 rounded-[1.5rem] border border-amber-200/80 bg-white/70 p-4 sm:mt-8 sm:p-5">
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[.18em] text-amber-900/60">
                        Documento
                      </div>
                      <div className="mt-1 font-bold text-amber-950">{activeDocument.title}</div>
                    </div>
                    <div>
                      <div className="text-[11px] font-black uppercase tracking-[.18em] text-amber-900/60">
                        Recomendacion
                      </div>
                      <div className="mt-1 text-sm leading-6 text-amber-950/80">
                        Usa el boton de descargar si necesitas guardar una copia local. El visor queda disponible para
                        consulta inmediata.
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-5 sm:pt-8">
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={activeDocument.href}
                        download={activeDocument.downloadName}
                        className="inline-flex items-center gap-2 rounded-full bg-amber-950 px-4 py-2.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-amber-900 focus-ring"
                      >
                        Descargar <Download size={16} />
                      </a>
                      <button
                        type="button"
                        onClick={closeDocument}
                        className="inline-flex items-center gap-2 rounded-full border border-amber-900/15 bg-white px-4 py-2.5 text-sm font-bold text-amber-950 transition hover:-translate-y-0.5 hover:bg-amber-50 focus-ring"
                      >
                        Cerrar lector <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </aside>

              <StatutesBookViewer url={activeDocument.href} title={activeDocument.title} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
