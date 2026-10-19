import { ChevronRight, FileText, Globe, Home, Instagram, MessageCircle, Users, Youtube } from 'lucide-react';
import { useState, type ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { navigation } from '../../data/navigation';
import { CONTACT_EMAIL, OFFICIAL_SOCIAL_URLS, WHATSAPP_URL } from '../../data/siteConfig';
import { usePublicContent } from '../../hooks/usePublicContent';
import { officialSocialUrl } from '../../data/siteConfig';

const legalLinks = [
  { label: 'Estatutos', to: '/estatutos?document=statutes' },
  { label: 'Manual de líneas de crédito', to: '/estatutos?document=credit-manual' },
  { label: 'Reglamento de crédito y cartera', to: '/estatutos?document=credit-regulation' },
  { label: 'Política de tratamiento de datos', to: '/estatutos?document=data-policy' },
];

function IconPill({
  icon: Icon,
  label,
  href,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  href: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/85 transition hover:border-white/30 hover:bg-white/10 focus-ring"
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </a>
  );
}

export default function Footer() {
  const [emailCopyStatus, setEmailCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const { content } = usePublicContent();
  const currentYear = new Date().getFullYear();
  const contactEmail = content?.settings.contact_email || CONTACT_EMAIL;
  async function copyEmail() {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(contactEmail);
      setEmailCopyStatus('copied');
    } catch {
      setEmailCopyStatus('failed');
    }
  }
  const socialLinks = [
    { label: 'Facebook', icon: Globe, href: content ? officialSocialUrl(content.settings.facebook_url ?? undefined, ['facebook.com']) : OFFICIAL_SOCIAL_URLS.facebook },
    { label: 'Instagram', icon: Instagram, href: content ? officialSocialUrl(content.settings.instagram_url ?? undefined, ['instagram.com']) : OFFICIAL_SOCIAL_URLS.instagram },
    { label: 'YouTube', icon: Youtube, href: content ? officialSocialUrl(content.settings.youtube_url ?? undefined, ['youtube.com', 'youtu.be']) : OFFICIAL_SOCIAL_URLS.youtube },
  ].filter((social): social is { label: string; icon: typeof Globe; href: string } => social.href !== null);

  return (
    <footer className="relative mt-8 overflow-hidden bg-[#062f1a] text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(109,201,64,0.28),transparent_26%),radial-gradient(circle_at_top_right,rgba(215,205,0,0.24),transparent_22%),linear-gradient(180deg,rgba(5,29,16,0.35),rgba(2,14,8,0.2))]" />
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#8cc63f]/35 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-[#d9d500]/25 blur-3xl" />

      <div className="container-page relative py-6 sm:py-7 lg:py-8">
        <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr] xl:items-center">
          <div className="grid gap-3 lg:grid-cols-[auto_1fr] lg:items-center">
            <div className="flex items-center justify-center lg:justify-start">
              <div className="rounded-[1.5rem] border border-white/30 bg-white p-2.5 shadow-[0_14px_36px_rgba(0,0,0,0.14)] backdrop-blur-sm">
                <img src="/logotipo.png" alt="Logotipo de FONASIN" className="h-20 w-20 object-contain  " />
              </div>
            </div>

            <div className="legacy-space-y-2.5 text-center lg:text-left lg:pl-1">
              <div className="max-w-4xl mx-auto lg:mx-0">
                <p className="text-2xl font-black leading-tight tracking-[0.03em] text-white sm:text-3xl lg:text-4xl">FONASIN</p>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-tight  sm:text-base sm:leading-tight">
                  Fondo de Empleados del Sector Mineroenergético y Empleados Sintraelecol
                </p>
                <p className="mt-2.5 text-xs italic text-white/80 sm:text-sm">
                  Trabajamos para el bienestar de nuestros asociados
                </p>
              </div>

              <div className="flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center lg:justify-start lg:pl-0">
                <div className="rounded-[1.35rem] border border-white/15  px-4 py-2.5 shadow-[0_10px_24px_rgba(0,0,0,0.14)] backdrop-blur-sm">
                  <p className="text-lg font-light italic leading-tight text-white sm:text-xl">Juntos construimos</p>
                  <p className="text-xl font-black italic leading-tight text-[#d9d500] sm:text-2xl">mas bienestar!</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1 xl:justify-items-end">
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noreferrer"
              className="group inline-flex items-center justify-between gap-4 rounded-full legacy-bg-gradient-to-r from-[#13b84c] to-[#0b7f39] px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(13,122,58,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(13,122,58,0.34)] focus-ring"
            >
              <span className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full  ring-1 ring-white/20">
                  <MessageCircle className="h-5 w-5" />
                </span>
                Atencion por WhatsApp
              </span>
              <ChevronRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </a>

            <Link
              to="/portal-asociado"
              className="group inline-flex items-center justify-between gap-4 rounded-full border border-white/35 bg-black/10 px-4 py-2.5 text-sm font-bold text-white shadow-[0_12px_26px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-white/10 focus-ring"
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

        <div className="my-4 h-px w-full legacy-bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        <div className="grid gap-3 xl:grid-cols-4">
          <section className="rounded-[1.35rem] border  bg-black/10 p-3.5 backdrop-blur-sm">
            <div className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#d9d500]/15 text-[#d9d500] ring-1 ring-[#d9d500]/20">
              <Home className="h-5 w-5" />
            </div>
            <h2 className="text-base font-black leading-tight text-[#d9d500]">Navegacion</h2>
            <div className="mt-2.5 legacy-space-y-1.5 leading-tight">
              {navigation.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group flex items-center gap-3 text-sm font-medium  transition hover:text-white"
                >
                  <ChevronRight className="h-4 w-4 text-[#d9d500] transition group-hover:translate-x-1" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[1.35rem] border  bg-black/10 p-3.5 backdrop-blur-sm">
            <div className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#d9d500]/15 text-[#d9d500] ring-1 ring-[#d9d500]/20">
              <MessageCircle className="h-5 w-5" />
            </div>
            <h2 className="text-base font-black leading-tight text-[#d9d500]">Atencion al asociado</h2>
            <div className="mt-2.5 legacy-space-y-1.5 leading-tight">
              <Link
                to="/portal-asociado"
                className="flex items-center gap-3 text-sm font-medium  transition hover:text-white"
              >
                <ChevronRight className="h-4 w-4 text-[#d9d500]" />
                Portal asociado
              </Link>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 text-sm font-medium  transition hover:text-white"
              >
                <ChevronRight className="h-4 w-4 text-[#d9d500]" />
                WhatsApp
              </a>
              <div>
                <p className="ml-7 mt-1 select-text break-all text-sm text-white">{contactEmail}</p>
                <button type="button" onClick={copyEmail}
                  className="group flex items-center gap-3 text-sm font-medium  transition hover:text-white">
                  <ChevronRight className="h-4 w-4 text-[#d9d500] transition group-hover:translate-x-1" />
                  Copiar correo
                </button>
                <p role="status" className="ml-7 mt-1 text-sm text-white">{emailCopyStatus === 'copied' ? 'Correo copiado' : emailCopyStatus === 'failed' ? 'No fue posible copiar automaticamente. Selecciona la direccion visible y copiala manualmente.' : ''}</p>
              </div>
              <div className="flex items-start gap-3 text-sm font-medium ">
                <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[#d9d500]" />
                <span>Lunes a viernes, 9:00 a. m. - 1:00 p. m.</span>
              </div>
              <a
                href="https://www.google.com/maps/@7.1297229,-73.1261016,976a,75y,280.5h,85.21t/data=!3m7!1e1!3m5!1sW3PTyLJZ4c20uLXzQjIiuQ!2e0!6shttps:%2F%2Fstreetviewpixels-pa.googleapis.com%2Fv1%2Fthumbnail%3Fcb_client%3Dmaps_sv.tactile%26w%3D900%26h%3D600%26pitch%3D4.790603214045703%26panoid%3DW3PTyLJZ4c20uLXzQjIiuQ%26yaw%3D280.5047369856187!7i16384!8i8192?entry=ttu&g_ep=EgoyMDI2MDkwMS4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-3 text-sm font-medium  transition hover:text-white"
              >
                <ChevronRight className="h-4 w-4 text-[#d9d500] transition group-hover:translate-x-1" />
                Nuestra ubicacion
              </a>
            </div>
          </section>

          <section className="rounded-[1.35rem] border  bg-black/10 p-3.5 backdrop-blur-sm">
            <div className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#d9d500]/15 text-[#d9d500] ring-1 ring-[#d9d500]/20">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="text-base font-black leading-tight text-[#d9d500]">Legales</h2>
            <div className="mt-2.5 legacy-space-y-1.5 leading-tight">
              {legalLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="group flex items-center gap-3 text-sm font-medium  transition hover:text-white"
                >
                  <ChevronRight className="h-4 w-4 text-[#d9d500] transition group-hover:translate-x-1" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section className="rounded-[1.35rem] border  bg-black/10 p-3.5 backdrop-blur-sm">
            <div className="mb-2.5 inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-[#d9d500]/15 text-[#d9d500] ring-1 ring-[#d9d500]/20">
              <Users className="h-5 w-5" />
            </div>
            <h2 className="text-base font-black leading-tight text-[#d9d500]">Siguenos</h2>
            {socialLinks.length > 0 ? (
              <div className="mt-3.5 flex flex-wrap gap-2">
                {socialLinks.map((social) => (
                  <IconPill key={social.label} icon={social.icon} label={social.label} href={social.href} />
                ))}
              </div>
            ) : (
              <p className="mt-4 max-w-xs text-sm leading-6 ">FONASIN aún no ha confirmado enlaces oficiales de redes sociales.</p>
            )}
          </section>
        </div>

        <div className="mt-4 flex flex-col gap-2.5 rounded-[1.25rem] border border-white/10 bg-black/15 px-4 py-2.5 text-xs text-white/80 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between lg:gap-3">
          <div className="flex items-start gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#d9d500]/15 text-[#d9d500] ring-1 ring-[#d9d500]/20 mt-0.5">
              <span className="text-lg">🤝</span>
            </span>
            <p>
              Comprometidos con el desarrollo y bienestar de nuestra familia <strong className="text-white">FONASIN</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 ">
            <span className="h-3.5 w-px bg-white/20" />
            <span>© {currentYear} FONASIN</span>
            <span className="h-3.5 w-px bg-white/20" />
            <span>Todos los derechos reservados.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
