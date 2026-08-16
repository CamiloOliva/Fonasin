import { useState } from 'react';
import { Menu, MessageCircle, X } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { navigation } from '../../data/navigation';
import { siteConfig, WHATSAPP_URL } from '../../data/siteConfig';
import WhatsAppIcon from '../ui/WhatsAppIcon';

const portalButtonClass =
  'ml-2 rounded-lg border-2 border-fonasin-green bg-white bg-[radial-gradient(circle_at_center,_rgba(195,201,27,0.45)_0%,_transparent_0%)] bg-center bg-no-repeat bg-[length:0%_0%] px-2 py-2 text-xs font-bold text-fonasin-green transition-[background-size,transform] duration-300 hover:-translate-y-px hover:bg-[length:220%_220%] focus-ring min-[1280px]:px-4 min-[1280px]:py-2.5 min-[1280px]:text-base';
const affiliateButtonClass =
  'ml-2 rounded-lg bg-fonasin-green bg-[radial-gradient(circle_at_center,_rgba(195,201,27,0.9)_0%,_transparent_0%)] bg-center bg-no-repeat bg-[length:0%_0%] px-2 py-2 text-xs font-bold text-white shadow-sm transition-[background-size,transform] duration-300 hover:-translate-y-px hover:bg-[length:220%_220%] focus-ring min-[1280px]:px-4 min-[1280px]:py-2.5 min-[1280px]:text-base';

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-fonasin-green/10 bg-white/95 backdrop-blur">
      <div className="container-page flex min-h-[96px] items-center gap-3">
        <Link to="/" className="shrink-0 focus-ring" aria-label={`${siteConfig.name}, inicio`}>
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/logotipo.png" alt="Logotipo de FONASIN" className="h-20 w-20 object-contain" />
            <div className="hidden max-w-[172px] items-center border-l border-fonasin-green/20 pl-3 lg:flex min-[1280px]:max-w-[255px] min-[1280px]:pl-4">
              <p className="text-xs font-bold leading-4 text-fonasin-deep min-[1280px]:text-sm min-[1280px]:leading-5">
                <span className="block text-lg font-black tracking-wide text-fonasin-green min-[1280px]:text-xl">FONASIN</span>
                Fondo de Empleados del Sector Mineroenergético
              </p>
            </div>
          </div>
        </Link>

        <nav className="ml-auto hidden shrink-0 items-center gap-0 lg:flex" aria-label="Navegación principal">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-2 py-2 text-xs font-semibold transition min-[1280px]:px-3 min-[1280px]:py-2.5 min-[1280px]:text-[15px] ${isActive ? 'bg-fonasin-surface text-fonasin-deep' : 'text-fonasin-ink hover:bg-fonasin-surface'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" title="Contáctanos por WhatsApp" aria-label="Contáctanos por WhatsApp" className="ml-0.5 rounded-full p-2 text-fonasin-green transition hover:bg-fonasin-surface min-[1280px]:ml-1 min-[1280px]:p-3">
            <WhatsAppIcon className="h-[22px] w-[22px]" />
          </a>
          <Link to="/portal-asociado" className={portalButtonClass}>Portal asociado</Link>
          <Link to="/afiliacion" className={affiliateButtonClass}>Afíliate</Link>
        </nav>

        <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} className="ml-auto rounded-lg p-3 hover:bg-fonasin-surface lg:hidden">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <nav className="border-t bg-white p-4 lg:hidden" aria-label="Navegación móvil">
          {navigation.map((item) => (
            <NavLink onClick={() => setOpen(false)} key={item.to} to={item.to} className="block rounded-lg px-4 py-3 font-semibold hover:bg-fonasin-surface">
              {item.label}
            </NavLink>
          ))}
          <div className="mt-3 grid grid-cols-2 gap-3">
            <a href={WHATSAPP_URL} className="flex items-center justify-center gap-2 rounded-lg bg-fonasin-surface p-3 font-semibold">
              <MessageCircle size={20} /> WhatsApp
            </a>
            <Link onClick={() => setOpen(false)} to="/portal-asociado" className="rounded-lg border p-3 text-center font-semibold">Portal asociado</Link>
          </div>
          <Link onClick={() => setOpen(false)} to="/afiliacion" className="mt-3 block rounded-lg bg-fonasin-green p-3 text-center font-bold text-white">Afíliate</Link>
        </nav>
      )}
    </header>
  );
}
