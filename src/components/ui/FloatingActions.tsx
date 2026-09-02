import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator,
  ChevronLeft,
  ClipboardPenLine,

  QrCode,
  X,
} from 'lucide-react';
const transaccionesImage = '/images/breve.png';

const actions = [
  { label: 'Actualizar datos', icon: ClipboardPenLine },
  { label: 'Simulador', icon: Calculator, to: '/creditos/simulador-fonasin' },
  { label: 'Transacciones', icon: QrCode },
];

type ActionListProps = {
  open: boolean;
  transactionsOpen: boolean;
  onToggleTransactions: () => void;
};

function ActionList({ open, transactionsOpen, onToggleTransactions }: ActionListProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2">
      {actions.map(({ label, icon: Icon, to }, index) => {
        const isTransactions = label === 'Transacciones';

        return (
          <button
            key={label}
            type="button"
            disabled={!to && !isTransactions}
            aria-pressed={isTransactions ? transactionsOpen : undefined}
            onClick={() => {
              if (isTransactions) {
                onToggleTransactions();
                return;
              }

              if (!to) return;
              navigate(to);
            }}
            style={{ transitionDelay: open ? `${index * 70}ms` : '0ms' }}
            className={`flex w-52 items-center gap-3 rounded-r-2xl py-3 pl-7 pr-4 text-left transition-all duration-300 ease-out lg:w-56 ${
              open ? 'translate-x-0 scale-100 opacity-100 blur-0' : 'translate-x-5 scale-95 opacity-0 blur-[1px]'
            } ${
              isTransactions
                ? 'border border-fonasin-lime/30 bg-white/95 text-fonasin-deep shadow-[0_18px_40px_rgba(13,71,56,0.16)] backdrop-blur hover:-translate-y-0.5 hover:shadow-[0_20px_48px_rgba(13,71,56,0.22)]'
                : 'bg-gradient-to-r from-fonasin-green to-fonasin-deep text-white shadow-lg shadow-fonasin-deep/25 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-fonasin-deep/30'
            } ${to || isTransactions ? 'cursor-pointer' : 'cursor-default'} [clip-path:polygon(0_50%,14%_0,100%_0,100%_100%,14%_100%)]`}
          >
            <span
              className={`grid h-10 w-10 place-items-center rounded-2xl ${
                isTransactions ? 'bg-fonasin-surface text-fonasin-green' : 'bg-white/10 text-fonasin-lime'
              }`}
            >
              <Icon size={19} aria-hidden="true" />
            </span>

            <span className="min-w-0 flex-1 leading-tight">
              <strong className="block text-[15px] lg:text-base">{label}</strong>
              {!isTransactions ? (
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/70">
                  {to ? 'Abrir simulador' : 'Próximamente'}
                </span>
              ) : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type TransactionImagePanelProps = {
  open: boolean;
  onExpand: () => void;
};

function TransactionImagePanel({ open, onExpand }: TransactionImagePanelProps) {
  return (
    <section
      aria-hidden={!open}
      className={`w-[min(23rem,calc(100vw-4.5rem))] overflow-hidden rounded-[1.5rem] border border-fonasin-lime/25 bg-white/95 p-3 shadow-[0_28px_70px_rgba(13,71,56,0.22)] backdrop-blur transition-all duration-300 ease-out ${
        open ? 'pointer-events-auto max-h-[34rem] translate-y-0 scale-100 opacity-100' : 'pointer-events-none max-h-0 translate-y-2 scale-95 opacity-0'
      }`}
    >
      <div className="rounded-xl bg-white p-2 shadow-[0_12px_28px_rgba(13,71,56,0.12)] ring-1 ring-fonasin-green/10">
        <button
          type="button"
          onClick={onExpand}
          aria-label="Ampliar imagen de transacciones"
          className="block w-full cursor-zoom-in rounded-lg focus-ring"
        >
          <img
            src={transaccionesImage}
            alt="Datos para realizar transacciones"
            className="max-h-[30rem] w-full rounded-lg object-contain"
          />
        </button>
      </div>
    </section>
  );
}

function TransactionImageLightbox({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Imagen ampliada de transacciones"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-fonasin-deep/85 p-4 backdrop-blur-sm sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative max-h-full max-w-5xl rounded-2xl bg-white p-2 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={transaccionesImage}
          alt="Información ampliada para realizar transacciones"
          className="max-h-[calc(100vh-2.5rem)] max-w-full rounded-xl object-contain sm:max-h-[calc(100vh-4rem)]"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar imagen ampliada"
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-fonasin-deep/90 text-white shadow-lg transition hover:bg-fonasin-green focus-ring"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
export default function FloatingActions() {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [imageExpanded, setImageExpanded] = useState(false);

  return (
    <>
      <aside className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 md:block" aria-label="Accesos rápidos">
        <div className="relative flex items-center gap-3">
          <div
            aria-hidden={!desktopOpen}
            className={`absolute right-16 top-1/2 flex -translate-y-1/2 origin-right items-center gap-3 transition-all duration-300 ease-out ${
              desktopOpen
                ? 'pointer-events-auto translate-x-0 scale-100 opacity-100'
                : 'pointer-events-none translate-x-4 scale-95 opacity-0'
            }`}
          >
            <TransactionImagePanel open={desktopOpen && transactionsOpen} onExpand={() => setImageExpanded(true)} />
            <ActionList
              open={desktopOpen}
              transactionsOpen={transactionsOpen}
              onToggleTransactions={() => setTransactionsOpen((isOpen) => !isOpen)}
            />
          </div>

          <button
            type="button"
            onClick={() => setDesktopOpen((isOpen) => !isOpen)}
            aria-expanded={desktopOpen}
            aria-label={desktopOpen ? 'Ocultar accesos rápidos' : 'Mostrar accesos rápidos'}
            className="flex h-14 w-14 items-center justify-center rounded-l-2xl bg-fonasin-green text-white shadow-lg shadow-fonasin-deep/25 transition duration-200 ease-out hover:-translate-x-0.5 hover:bg-fonasin-deep focus-ring"
          >
            {desktopOpen ? <X size={21} /> : <ChevronLeft size={24} />}
          </button>
        </div>
      </aside>

      <aside className="fixed bottom-6 right-0 z-40 md:hidden" aria-label="Accesos rápidos">
        <div className="relative flex items-end gap-3">
          <div
            aria-hidden={!mobileOpen}
            className={`absolute bottom-16 right-0 flex flex-col items-end gap-3 origin-bottom-right transition-all duration-300 ease-out ${
              mobileOpen
                ? 'pointer-events-auto translate-y-0 scale-100 opacity-100'
                : 'pointer-events-none translate-y-3 scale-95 opacity-0'
            }`}
          >
            <TransactionImagePanel open={mobileOpen && transactionsOpen} onExpand={() => setImageExpanded(true)} />
            <ActionList
              open={mobileOpen}
              transactionsOpen={transactionsOpen}
              onToggleTransactions={() => setTransactionsOpen((isOpen) => !isOpen)}
            />
          </div>

          <button
            type="button"
            onClick={() => setMobileOpen((isOpen) => !isOpen)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Ocultar accesos rápidos' : 'Mostrar accesos rápidos'}
            className="flex h-14 w-14 items-center justify-center rounded-l-2xl bg-fonasin-green text-white shadow-lg shadow-fonasin-deep/25 transition duration-200 ease-out hover:-translate-x-0.5 hover:bg-fonasin-deep focus-ring"
          >
            {mobileOpen ? <X size={21} /> : <ChevronLeft size={24} />}
          </button>
        </div>
      </aside>
      <TransactionImageLightbox open={imageExpanded} onClose={() => setImageExpanded(false)} />
    </>
  );
}
