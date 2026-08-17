import { useState } from 'react';
import { Calculator, ChevronLeft, ClipboardPenLine, Landmark, X } from 'lucide-react';

const actions = [
  { label: 'Actualizar datos', icon: ClipboardPenLine },
  { label: 'Simulador', icon: Calculator },
  { label: 'Transacciones', icon: Landmark },
];

function ActionList() {
  return (
    <div className="flex flex-col gap-2">
      {actions.map(({ label, icon: Icon }) => (
        <button
          key={label}
          type="button"
          disabled
          aria-label={`${label}: próximamente`}
          title={`${label}: próximamente`}
          className="group flex w-52 items-center gap-3 bg-fonasin-green bg-gradient-to-r from-transparent to-fonasin-lime/15 py-3.5 pl-7 pr-5 text-left text-[15px] font-bold text-white shadow-lg shadow-fonasin-deep/20 transition duration-300 [clip-path:polygon(0_50%,14%_0,100%_0,100%_100%,14%_100%)] disabled:cursor-not-allowed hover:-translate-x-2 hover:bg-fonasin-deep lg:w-56 lg:text-base"
        >
          <Icon size={20} aria-hidden="true" className="shrink-0 text-fonasin-lime" />
          <span className="min-w-0 leading-tight">{label}</span>
        </button>
      ))}
    </div>
  );
}

export default function FloatingActions() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <aside className="fixed right-0 top-[62%] z-40 hidden -translate-y-1/2 md:block" aria-label="Accesos rápidos">
        <ActionList />
      </aside>

      <aside className="fixed bottom-6 right-0 z-40 md:hidden" aria-label="Accesos rápidos">
        {mobileOpen && (
          <div className="absolute bottom-16 right-0">
            <ActionList />
          </div>
        )}
        <button
          type="button"
          onClick={() => setMobileOpen((isOpen) => !isOpen)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Ocultar accesos rápidos' : 'Mostrar accesos rápidos'}
          className="flex h-14 w-14 items-center justify-center rounded-l-2xl bg-fonasin-green text-white shadow-lg shadow-fonasin-deep/25 transition hover:bg-fonasin-deep focus-ring"
        >
          {mobileOpen ? <X size={21} /> : <ChevronLeft size={24} />}
        </button>
      </aside>
    </>
  );
}
