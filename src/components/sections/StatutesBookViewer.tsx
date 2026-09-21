import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, RotateCcw } from 'lucide-react';

type PageImage = {
  dataUrl: string;
  width: number;
  height: number;
};

type BookViewerState = 'loading' | 'ready' | 'error';
type FlipDirection = 'next' | 'prev';

type StatutesBookViewerProps = {
  url: string;
  title: string;
};

const FLIP_DURATION = 680;
const MAX_RENDER_WIDTH = 1400;
const BOOK_PERSPECTIVE = 1800;

export default function StatutesBookViewer({ url, title }: StatutesBookViewerProps) {
  const [status, setStatus] = useState<BookViewerState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [flipState, setFlipState] = useState<{ from: number; to: number; direction: FlipDirection } | null>(null);
  const [flipIn, setFlipIn] = useState(false);
  const [, setCacheTick] = useState(0);
  const [viewerWidth, setViewerWidth] = useState(0);

  const pdfDocumentRef = useRef<any>(null);
  const pageImageCacheRef = useRef<Record<number, PageImage>>({});
  const pageRenderPromiseRef = useRef<Map<number, Promise<PageImage>>>(new Map());
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const loadingTaskRef = useRef<{ destroy?: () => void } | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      loadingTaskRef.current?.destroy?.();
      pdfDocumentRef.current?.destroy?.();
    };
  }, []);

  useEffect(() => {
    const element = viewerRef.current;

    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }

    const updateWidth = () => {
      setViewerWidth(element.clientWidth);
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadDocument = async () => {
      try {
        setStatus('loading');
        setErrorMessage(null);

        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
          import.meta.url,
        ).toString();

        const loadingTask = pdfjs.getDocument({ url });
        loadingTaskRef.current = loadingTask;

        const pdfDocument = await loadingTask.promise;

        if (cancelled) {
          return;
        }

        pdfDocumentRef.current = pdfDocument;
        setPageCount(pdfDocument.numPages);
        setCurrentPage(1);
        setStatus('ready');

        void ensurePageImage(1);
        if (pdfDocument.numPages > 1) {
          void ensurePageImage(2);
        }
      } catch {
        if (cancelled) {
          return;
        }

        setStatus('error');
        setErrorMessage('No se pudo cargar el visor interactivo. Usa Descargar para abrir el PDF.');
      }
    };

    void loadDocument();

    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    if (status !== 'ready') {
      return;
    }

    void ensurePageImage(currentPage);
    if (currentPage < pageCount) {
      void ensurePageImage(currentPage + 1);
    }
  }, [currentPage, pageCount, status]);

  useEffect(() => {
    if (!flipState) {
      setFlipIn(false);
      return;
    }

    const animationFrame = window.requestAnimationFrame(() => {
      setFlipIn(true);
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [flipState]);

  const ensurePageImage = async (pageNumber: number) => {
    const pdfDocument = pdfDocumentRef.current;

    if (!pdfDocument || pageNumber < 1 || pageNumber > pdfDocument.numPages) {
      throw new Error('PDF document is not ready.');
    }

    const cachedImage = pageImageCacheRef.current[pageNumber];
    if (cachedImage) {
      return cachedImage;
    }

    const pendingImage = pageRenderPromiseRef.current.get(pageNumber);
    if (pendingImage) {
      return pendingImage;
    }

    const renderPromise = (async () => {
      const page = await pdfDocument.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const availableWidth = Math.max(720, viewerWidth || window.innerWidth * 0.52);
      const renderWidth = Math.min(MAX_RENDER_WIDTH, availableWidth);
      const scale = renderWidth / baseViewport.width;
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas context unavailable.');
      }

      const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
      canvas.width = Math.floor(viewport.width * pixelRatio);
      canvas.height = Math.floor(viewport.height * pixelRatio);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      context.scale(pixelRatio, pixelRatio);

      await page.render({
        canvasContext: context,
        viewport,
      }).promise;

      const image = {
        dataUrl: canvas.toDataURL('image/png'),
        width: viewport.width,
        height: viewport.height,
      };

      pageImageCacheRef.current[pageNumber] = image;
      pageRenderPromiseRef.current.delete(pageNumber);

      if (mountedRef.current) {
        setCacheTick((value) => value + 1);
      }

      return image;
    })().catch((error) => {
      pageRenderPromiseRef.current.delete(pageNumber);
      throw error;
    });

    pageRenderPromiseRef.current.set(pageNumber, renderPromise);
    return renderPromise;
  };

  const openPage = async (direction: FlipDirection) => {
    if (status !== 'ready' || flipState || pageCount === 0) {
      return;
    }

    const targetPage = direction === 'next' ? currentPage + 1 : currentPage - 1;

    if (targetPage < 1 || targetPage > pageCount) {
      return;
    }

    try {
      await ensurePageImage(targetPage);
      setFlipState({ from: currentPage, to: targetPage, direction });

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        finalizeFlip();
      }, FLIP_DURATION + 120);
    } catch {
      setStatus('error');
      setErrorMessage('No se pudo abrir esa pagina. Usa Descargar para revisar el archivo completo.');
    }
  };

  const finalizeFlip = () => {
    if (!flipState) {
      return;
    }

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setCurrentPage(flipState.to);
    setFlipState(null);
    setFlipIn(false);

    void ensurePageImage(flipState.to + 1);
    void ensurePageImage(flipState.to - 1);
  };

  const currentImage = pageImageCacheRef.current[currentPage];
  const flipTargetImage = flipState ? pageImageCacheRef.current[flipState.to] : null;
  const progressLabel =
    status === 'ready' ? `Pagina ${currentPage} de ${pageCount}` : status === 'loading' ? 'Cargando paginas...' : 'Visor no disponible';
  const flipShadow =
    flipState?.direction === 'next'
      ? '0 30px 70px -18px rgba(91, 59, 23, 0.46), 18px 0 36px -24px rgba(91, 59, 23, 0.35)'
      : '0 30px 70px -18px rgba(91, 59, 23, 0.46), -18px 0 36px -24px rgba(91, 59, 23, 0.35)';

  return (
    <div
      ref={viewerRef}
      className="relative flex min-h-0 h-full flex-col overflow-hidden rounded-[2rem] border border-amber-100/50 bg-[#faf4e7] p-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] sm:p-3"
    >
      <div className="flex flex-col gap-3 border-b border-amber-200/80 px-2 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-amber-900/60 sm:text-[11px]">Vista de libro</div>
          <div className="mt-1 text-sm font-bold text-amber-950 sm:text-base">{title}</div>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-950">{progressLabel}</span>
      </div>

      <div
        className="relative mt-3 flex min-h-0 flex-1 items-start justify-center overflow-y-auto overflow-x-hidden rounded-[1.4rem] border border-amber-200/80 bg-[linear-gradient(135deg,#fdfaf1,#f5ead5)] px-2 py-3 sm:px-3 sm:py-4"
        style={{ perspective: `${BOOK_PERSPECTIVE}px` }}
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-[linear-gradient(90deg,rgba(91,59,23,0.14),rgba(91,59,23,0.06),transparent)] sm:w-16" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-[linear-gradient(270deg,rgba(91,59,23,0.14),rgba(91,59,23,0.06),transparent)] sm:w-16" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-[linear-gradient(180deg,rgba(255,255,255,0.85),transparent)]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-[linear-gradient(0deg,rgba(91,59,23,0.06),transparent)]" />

        {status === 'loading' || (status === 'ready' && !currentImage) ? (
          <div className="flex flex-col items-center gap-4 text-amber-950">
            <Loader2 className="animate-spin" size={28} />
            <div className="text-sm font-semibold">{progressLabel}</div>
          </div>
        ) : status === 'error' ? (
          <div className="max-w-md rounded-[1.25rem] border border-amber-200/80 bg-white/90 p-5 text-center text-amber-950 shadow-lg">
            <div className="text-lg font-black">Visor temporalmente no disponible</div>
            <p className="mt-2 text-sm leading-6 text-amber-950/75">{errorMessage}</p>
          </div>
        ) : currentImage ? (
          <div className="relative w-full max-w-[760px] px-1 py-2 sm:px-2 sm:py-3">
            <div
              className="relative aspect-[0.74/1] w-full overflow-hidden rounded-[1.1rem] border border-amber-200/80 bg-[#fffdf8] shadow-[0_24px_80px_rgba(91,59,23,0.15)] sm:aspect-[0.72/1]"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {flipTargetImage ? (
                <img
                  src={flipTargetImage.dataUrl}
                  alt={`Pagina ${flipState?.to ?? currentPage}`}
                  className="absolute inset-0 h-full w-full object-contain"
                />
              ) : null}

              <img
                src={currentImage.dataUrl}
                alt={`Pagina ${currentPage}`}
                draggable={false}
                onTransitionEnd={(event) => {
                  if (event.propertyName !== 'transform' || !flipState || !flipIn) {
                    return;
                  }

                  finalizeFlip();
                }}
                className="absolute inset-0 h-full w-full origin-center object-contain will-change-transform [backface-visibility:hidden]"
                style={{
                  transitionDuration: flipState ? `${FLIP_DURATION}ms` : '0ms',
                  transitionProperty: 'transform, box-shadow, filter',
                  transitionTimingFunction: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
                  transformStyle: 'preserve-3d',
                  transformOrigin: flipState?.direction === 'prev' ? 'left center' : 'right center',
                  boxShadow: flipState ? flipShadow : '0 18px 50px rgba(91, 59, 23, 0.08)',
                  filter: flipState ? 'brightness(1.02) contrast(1.03)' : 'none',
                  transform: flipState
                    ? flipIn
                      ? flipState.direction === 'next'
                        ? 'translateX(-1.5%) rotateY(-180deg)'
                        : 'translateX(1.5%) rotateY(180deg)'
                      : 'translateX(0) rotateY(0deg)'
                    : 'translateX(0) rotateY(0deg)',
                }}
              />

              <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-amber-900/10" />
              <div
                className={[
                  'pointer-events-none absolute inset-y-0 w-12 transition-opacity duration-300',
                  flipState?.direction === 'next' ? 'right-0 bg-[linear-gradient(270deg,rgba(91,59,23,0.24),rgba(91,59,23,0.12),transparent)]' : 'left-0 bg-[linear-gradient(90deg,rgba(91,59,23,0.24),rgba(91,59,23,0.12),transparent)]',
                  flipState ? 'opacity-100' : 'opacity-0',
                ].join(' ')}
              />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 flex flex-col gap-3 px-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-semibold uppercase tracking-[.18em] text-amber-900/55">
          {status === 'ready' ? 'Lectura continua' : 'Documento oficial'}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => void openPage('prev')}
            disabled={status !== 'ready' || currentPage <= 1 || Boolean(flipState)}
            className="inline-flex min-w-[7.25rem] items-center justify-center gap-2 rounded-full border border-amber-900/15 bg-white px-3.5 py-2 text-sm font-bold text-amber-950 transition hover:-translate-y-0.5 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft size={16} />
            Anterior
          </button>
          <div className="rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-950">
            {currentPage} / {pageCount || '--'}
          </div>
          <button
            type="button"
            onClick={() => void openPage('next')}
            disabled={status !== 'ready' || currentPage >= pageCount || Boolean(flipState)}
            className="inline-flex min-w-[7.25rem] items-center justify-center gap-2 rounded-full border border-amber-900/15 bg-amber-950 px-3.5 py-2 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Siguiente
            <ChevronRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => {
              setCurrentPage(1);
              setFlipState(null);
              setFlipIn(false);
              void ensurePageImage(1);
            }}
            disabled={status !== 'ready' || currentPage === 1 || Boolean(flipState)}
            className="inline-flex min-w-[7.25rem] items-center justify-center gap-2 rounded-full border border-amber-900/15 bg-white px-3.5 py-2 text-sm font-bold text-amber-950 transition hover:-translate-y-0.5 hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={16} />
            Inicio
          </button>
        </div>
      </div>
    </div>
  );
}
