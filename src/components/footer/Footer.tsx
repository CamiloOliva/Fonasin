import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { siteConfig, WHATSAPP_URL } from '../../data/siteConfig';

const navigationLinks = [
  ['Inicio', '/'],
  ['Mi Fondo', '/mi-fondo'],
  ['Productos y servicios', '/productos-y-servicios'],
  ['Convenios', '/convenios'],
  ['FPQRS', '/fpqrs'],
];

const legalDocuments = [
  { label: 'Estatutos', status: 'Disponible' },
  { label: 'Reglamentos', status: 'Pendiente de publicación' },
  { label: 'Política de tratamiento de datos', status: 'Disponible' },
];

export default function Footer() {
  return (
    <footer className="mt-16 bg-fonasin-deep text-white">
      <div className="container-page py-12">
        <div className="flex flex-col gap-5 border-b border-white/15 pb-9 sm:flex-row sm:items-center">
          <img src="/logotipo.png" alt="Logotipo de FONASIN" className="h-20 w-20 shrink-0 object-contain" />
          <div className="max-w-3xl">
            <h2 className="text-xl font-black leading-snug sm:text-2xl">{siteConfig.name}</h2>
            <p className="mt-2 leading-6 text-white/75">Información institucional y servicios para nuestros asociados.</p>
          </div>
        </div>

        <div className="mt-9 grid gap-10 sm:grid-cols-3">
          <div>
            <h2 className="text-lg font-bold text-fonasin-lime">Navegación</h2>
            <div className="mt-4 space-y-2.5 text-white/80">
              {navigationLinks.map(([label, to]) => (
                <Link key={to} className="block hover:text-white" to={to}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-fonasin-lime">Atención</h2>
            <div className="mt-4 space-y-3">
              <a
                className="flex items-center gap-2 text-white/80 hover:text-white"
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={19} /> WhatsApp
              </a>
              <Link className="block text-white/80 hover:text-white" to="/portal-asociado">
                Portal asociado
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-fonasin-lime">Legal</h2>
            <ul className="mt-4 space-y-3 text-white/80">
              {legalDocuments.map((document) => (
                <li key={document.label}>
                  <span className="block">{document.label}</span>
                  <span className="text-xs text-white/55">{document.status}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <span className="mt-10 inline-block rounded bg-white/10 px-2 py-1 text-xs text-white/70">
          Contenido institucional provisional
        </span>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page py-5 text-sm text-white/60">
          © {new Date().getFullYear()} {siteConfig.name}
        </div>
      </div>
    </footer>
  );
}
