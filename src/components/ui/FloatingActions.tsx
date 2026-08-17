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
        <div
          key={label}
          className="flex w-52 items-center gap-3 bg-fonasin-green bg-gradient-to-r from-transparent to-fonasin-lime/15 py-3 pl-7 pr-4 text-left text-white shadow-lg shadow-fonasin-deep/20 [clip-path:polygon(0_50%,14%_0,100%_0,100%_100%,14%_100%)] lg:w-56"
        >
          <Icon size={20} aria-hidden="true" className="shrink-0 text-fonasin-lime" />
          <span className="min-w-0 leading-tight">
            <strong className="block text-[15px] lg:text-base">{label}</strong>
            <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/70">Próximamente</span>
          </span>
        </div>
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
