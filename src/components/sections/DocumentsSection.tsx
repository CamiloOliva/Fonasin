import { useEffect, useState } from 'react';
import { BookOpen, Download, ExternalLink, FileText, X } from 'lucide-react';
import { documents } from '../../data/documents';
import SectionHeading from '../ui/SectionHeading';
import StatutesBookViewer from './StatutesBookViewer';

type DocumentsSectionProps = {
  variant?: 'home' | 'estatutos';
};

type DocumentItem = (typeof documents)[number];

export default function DocumentsSection({ variant = 'home' }: DocumentsSectionProps) {
  const isHome = variant === 'home';
  const visibleDocuments = isHome ? documents.filter((document) => document.id === 3) : documents;
  const [activeDocument, setActiveDocument] = useState<DocumentItem | null>(null);

  useEffect(() => {
    if (!activeDocument) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveDocument(null);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDocument]);

  return (
    <>
      <section className="bg-fonasin-surface py-16">
        <div className="container-page">
          <SectionHeading
            eyebrow="Documentos"
            title={isHome ? 'Documentacion institucional' : 'Estatutos y reglamentos'}
            text={
              isHome
                ? 'Consulta los documentos institucionales disponibles en esta vista.'
                : 'Consulta el espacio documental de FONASIN para acceder a los estatutos y reglamentos institucionales cuando esten publicados.'
            }
          />

          <div className="mt-9 grid gap-5 md:grid-cols-3">
            {visibleDocuments.map((document) => {
              const hasViewer = Boolean(document.href) && variant === 'estatutos' && (document.id === 1 || document.id === 3);

              return (
                <article
                  key={document.id}
                  className="flex h-full flex-col rounded-[1.75rem] border border-amber-200/60 bg-white/95 p-6 shadow-lg shadow-black/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <FileText className="text-fonasin-green" size={30} />
                    {hasViewer ? (
                      <span className="rounded-full bg-fonasin-surface px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-fonasin-deep/70">
                        Disponible
                      </span>
                    ) : null}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <h3 className="mt-4 text-xl font-black text-fonasin-deep">{document.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{document.description}</p>
                  {document.href ? (
                      <div className="mt-auto flex flex-wrap gap-3 pt-5">
                      {hasViewer ? (
                        <button
                          type="button"
                          onClick={() => setActiveDocument(document)}
                          className="inline-flex items-center gap-2 rounded-full border border-fonasin-green/15 bg-fonasin-surface px-4 py-2 text-sm font-bold text-fonasin-green transition hover:-translate-y-0.5 hover:bg-fonasin-green/10 focus-ring"
                        >
                          Ver en la pagina <BookOpen size={16} />
                        </button>
                      ) : (
                        <a
                          href={document.href}
                          className="inline-flex items-center gap-2 rounded-full border border-fonasin-green/15 bg-fonasin-surface px-4 py-2 text-sm font-bold text-fonasin-green transition hover:-translate-y-0.5 hover:bg-fonasin-green/10 focus-ring"
                        >
                          Ver documento <ExternalLink size={16} />
                        </a>
                      )}
                      <a
                        href={document.href}
                        download={document.downloadName}
                        className="inline-flex items-center gap-2 rounded-full border border-fonasin-green/15 bg-white px-4 py-2 text-sm font-bold text-fonasin-green transition hover:-translate-y-0.5 hover:bg-fonasin-surface focus-ring"
                      >
                        Descargar <Download size={16} />
                      </a>
                      </div>
                    ) : (
                      <span className="mt-auto inline-flex rounded-full bg-fonasin-surface px-3 py-1.5 text-sm font-bold text-fonasin-deep/70">
                        Pendiente de publicacion
                      </span>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
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
              setActiveDocument(null);
            }
          }}
        >
          <div className="relative flex h-[calc(100dvh-1rem)] w-full max-w-[1280px] flex-col overflow-hidden rounded-[2.25rem] border border-amber-200/40 bg-[linear-gradient(135deg,#5b3b17,#2c1b0a_38%,#140c04)] p-2 shadow-2xl shadow-black/50 sm:h-[calc(100dvh-2rem)] sm:p-3">
            <button
              type="button"
              onClick={() => setActiveDocument(null)}
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
                        onClick={() => setActiveDocument(null)}
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
