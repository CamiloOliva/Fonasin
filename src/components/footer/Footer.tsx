import { ChevronRight, FileText, Globe, Home, Instagram, Link2, MapPin, MessageCircle, Radio, Send, Users, Youtube } from 'lucide-react';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { navigation } from '../../data/navigation';
import { WHATSAPP_URL } from '../../data/siteConfig';

const legalLinks = [
  { label: 'Estatutos', to: '/estatutos' },
  { label: 'Reglamentos' },
  {
    label: 'Politica de tratamiento de datos',
    href: '/Politica_Tratamiento_Datos_Personales_FONASIN_2026.pdf',
    download: 'Politica_Tratamiento_Datos_Personales_FONASIN_2026.pdf',
  },
];

const socialLinks = [
  { label: 'Facebook', icon: Globe },
  { label: 'Instagram', icon: Instagram },
  { label: 'YouTube', icon: Youtube },
  { label: 'Canal web', icon: Radio },
];

function SoftButton({
  icon: Icon,
  label,
  href,
  to,
  download,
  muted = false,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  to?: string;
  download?: string;
  muted?: boolean;
}) {
  const baseClass =
    'group inline-flex items-center justify-between gap-3 rounded-full border px-4 py-3 text-sm font-semibold transition duration-300 focus-ring';
  const activeClass = 'border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30';
  const mutedClass = 'border-white/15 bg-transparent text-white/55 cursor-not-allowed';

  const inner = (
    <>
      <span className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/90 ring-1 ring-white/15 transition group-hover:bg-white/15">
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-left">{label}</span>
      </span>
      {!muted ? <ChevronRight className="h-4 w-4 shrink-0 text-white/75 transition group-hover:translate-x-0.5 group-hover:text-white" /> : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${baseClass} ${activeClass}`}>
        {inner}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} download={download} className={`${baseClass} ${activeClass}`}>
        {inner}
      </a>
    );
  }

  return (
    <button type="button" aria-disabled="true" title="Proximamente" className={`${baseClass} ${muted ? mutedClass : activeClass}`}>
      {inner}
    </button>
  );
}

function IconPill({
  icon: Icon,
  label,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-disabled="true"
      title="Proximamente"
      className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/85 transition hover:border-white/30 hover:bg-white/10 focus-ring"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </button>
  );
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative mt-16 overflow-hidden bg-[#062f1a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(109,201,64,0.28),transparent_26%),radial-gradient(circle_at_top_right,rgba(215,205,0,0.24),transparent_22%),linear-gradient(180deg,rgba(5,29,16,0.35),rgba(2,14,8,0.2))]" />
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#8cc63f]/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#d9d500]/25 blur-3xl" />

      <div className="container-page relative py-10 sm:py-12 lg:py-14">
        <div className="grid gap-8 xl:grid-cols-[1.25fr_0.75fr] xl:items-center">
          <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="flex items-center justify-center lg:justify-start">
              <div className="rounded-[2rem] border border-white/30 bg-white p-3 shadow-[0_18px_50px_rgba(0,0,0,0.16)] backdrop-blur-sm">
                <img src="/logotipo.png" alt="Logotipo de FONASIN" className="h-28 w-28 object-contain sm:h-32 sm:w-32" />
              </div>
            </div>

            <div className="space-y-5 text-center lg:text-left lg:pl-2">
              <div className="max-w-4xl mx-auto lg:mx-0">
                <p className="text-4xl font-black leading-none tracking-[0.03em] text-white sm:text-5xl lg:text-6xl">FONASIN</p>
                <p className="mt-3 max-w-3xl text-lg font-semibold leading-tight text-white/92 sm:text-[1.55rem] sm:leading-tight">
                  Fondo de Empleados del Sector Mineroenergético y Empleados Sintraelecol
                </p>
                <p className="mt-5 text-base italic text-white/80 sm:text-lg">
                  Trabajamos para el bienestar de nuestros asociados
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start lg:pl-1">
                <div className="rounded-[2rem] border border-white/15 bg-black/12 px-5 py-4 shadow-[0_16px_40px_rgba(0,0,0,0.18)] backdrop-blur-sm">
                  <p className="text-2xl font-light italic leading-tight text-white sm:text-3xl">Juntos construimos</p>
                  <p className="text-3xl font-black italic leading-tight text-[#d9d500] sm:text-4xl">mas bienestar!</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1 xl:justify-items-end">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center justify-between gap-4 rounded-full bg-gradient-to-r from-[#13b84c] to-[#0b7f39] px-5 py-4 text-sm font-bold text-white shadow-[0_18px_45px_rgba(13,122,58,0.4)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(13,122,58,0.5)] focus-ring"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-white/12 ring-1 ring-white/20">
                  <MessageCircle className="h-5 w-5" />
                </span>
                Atencion por WhatsApp
              </span>
              <ChevronRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </a>

            <Link
              to="/portal-asociado"
              className="group inline-flex items-center justify-between gap-4 rounded-full border border-white/35 bg-black/10 px-5 py-4 text-sm font-bold text-white shadow-[0_18px_45px_rgba(0,0,0,0.22)] transition hover:-translate-y-0.5 hover:bg-white/10 focus-ring"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full border border-white/20 bg-white/10">
                  <Users className="h-5 w-5" />
                </span>
                Portal Asociado
              </span>
              <ChevronRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>

        <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="grid gap-6 xl:grid-cols-4">
          <section className="rounded-[1.75rem] border border-white/12 bg-black/10 p-6 backdrop-blur-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d9d500]/15 text-[#d9d500] ring-1 ring-[#d9d500]/20">
              <Home className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black leading-tight text-[#d9d500]">Navegacion</h2>
            <div className="mt-4 space-y-2.5 leading-none">
              {navigation.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex items-center gap-3 text-sm font-medium text-white/82 transition hover:text-white"
                >
                  <ChevronRight className="h-4 w-4 text-[#d9d500] transition group-hover:translate-x-1" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-white/12 bg-black/10 p-6 backdrop-blur-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d9d500]/15 text-[#d9d500] ring-1 ring-[#d9d500]/20">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black leading-tight text-[#d9d500]">Atencion al asociado</h2>
            <div className="mt-4 space-y-3 leading-none">
              <Link
                to="/portal-asociado"
                className="flex items-center gap-3 text-sm font-medium text-white/82 transition hover:text-white"
              >
                <ChevronRight className="h-4 w-4 text-[#d9d500]" />
                Portal asociado
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm font-medium text-white/82 transition hover:text-white"
              >
                <ChevronRight className="h-4 w-4 text-[#d9d500]" />
                WhatsApp
              </a>
              <SoftButton icon={Send} label="Contactenos" muted />
              <SoftButton icon={MapPin} label="Nuestra ubicacion" muted />
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-white/12 bg-black/10 p-6 backdrop-blur-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d9d500]/15 text-[#d9d500] ring-1 ring-[#d9d500]/20">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black leading-tight text-[#d9d500]">Legales</h2>
            <div className="mt-4 space-y-3 leading-none">
              {legalLinks.map((item) =>
                item.to ? (
                  <Link
                    key={item.label}
                    to={item.to}
                    className="group flex items-center gap-3 text-sm font-medium text-white/82 transition hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4 text-[#d9d500] transition group-hover:translate-x-1" />
                    <span>{item.label}</span>
                  </Link>
                ) : item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    download={item.download}
                    className="group flex items-center gap-3 text-sm font-medium text-white/82 transition hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4 text-[#d9d500] transition group-hover:translate-x-1" />
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <SoftButton key={item.label} icon={Link2} label={item.label} muted />
                ),
              )}
            </div>
          </section>

          <section className="rounded-[1.75rem] border border-white/12 bg-black/10 p-6 backdrop-blur-sm">
            <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d9d500]/15 text-[#d9d500] ring-1 ring-[#d9d500]/20">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-xl font-black leading-tight text-[#d9d500]">Siguenos</h2>
            <p className="mt-4 max-w-xs text-sm leading-6 text-white/78">
              Conoce nuestras novedades a traves de nuestros canales.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              {socialLinks.map((social) => (
                <IconPill key={social.label} icon={social.icon} label={social.label} />
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-black/15 px-5 py-4 text-sm text-white/80 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <div className="flex items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#d9d500]/15 text-[#d9d500] ring-1 ring-[#d9d500]/20 mt-0.5">
              <span className="text-lg">🤝</span>
            </span>
            <p>
              Comprometidos con el desarrollo y bienestar de nuestra familia <strong className="text-white">FONASIN</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-white/72">
            <span className="h-5 w-px bg-white/20" />
            <span>© {currentYear} FONASIN</span>
            <span className="h-5 w-px bg-white/20" />
            <span>Todos los derechos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}