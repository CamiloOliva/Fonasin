import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calculator, ChevronLeft, ClipboardPenLine, Landmark, X } from 'lucide-react';

const actions = [
  { label: 'Actualizar datos', icon: ClipboardPenLine },
  { label: 'Simulador', icon: Calculator, to: '/creditos/simulador-fonasin' },
  { label: 'Transacciones', icon: Landmark },
];

type ActionListProps = {
  open: boolean;
};

function ActionList({ open }: ActionListProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-2">
      {actions.map(({ label, icon: Icon, to }, index) => (
        <button
          key={label}
          type="button"
          disabled={!to}
          onClick={() => {
            if (!to) return;
            navigate(to);
          }}
          style={{ transitionDelay: open ? `${index * 70}ms` : '0ms' }}
          className={`flex w-52 items-center gap-3 rounded-r-2xl bg-gradient-to-r from-fonasin-green to-fonasin-deep py-3 pl-7 pr-4 text-left text-white shadow-lg shadow-fonasin-deep/25 transition-all duration-300 ease-out lg:w-56 ${
            open ? 'translate-x-0 scale-100 opacity-100 blur-0' : 'translate-x-5 scale-95 opacity-0 blur-[1px]'
          } ${to ? 'cursor-pointer' : 'cursor-default'} [clip-path:polygon(0_50%,14%_0,100%_0,100%_100%,14%_100%)]`}
        >
          <Icon size={20} aria-hidden="true" className="shrink-0 text-fonasin-lime" />
          <span className="min-w-0 leading-tight">
            <strong className="block text-[15px] lg:text-base">{label}</strong>
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/70">
              {to ? 'Abrir simulador' : 'Próximamente'}
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}

export default function FloatingActions() {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="fixed right-0 top-1/2 z-40 hidden -translate-y-1/2 md:block" aria-label="Accesos rápidos">
        <div className="relative">
          <div
            aria-hidden={!desktopOpen}
            className={`absolute right-16 top-1/2 -translate-y-1/2 origin-right transition-all duration-300 ease-out ${
              desktopOpen ? 'pointer-events-auto translate-x-0 scale-100 opacity-100' : 'pointer-events-none translate-x-4 scale-95 opacity-0'
            }`}
          >
            <ActionList open={desktopOpen} />
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
        <div className="relative">
          <div
            aria-hidden={!mobileOpen}
            className={`absolute bottom-16 right-0 origin-bottom-right transition-all duration-300 ease-out ${
              mobileOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-3 scale-95 opacity-0'
            }`}
          >
            <ActionList open={mobileOpen} />
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
    </>
  );
}
