import {
  ArrowLeft,
  ArrowUpRight,
  Building2,
  CircleHelp,
  Facebook,
  Globe2,
  HeartPulse,
  Hotel,
  Instagram,
  Mail,
  MapPinned,
  MessageCircle,
  Plane,
  Phone,
  Sparkles,
  Ticket,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

type Contact = {
  label: string;
  href: string;
  icon: LucideIcon;
  external?: boolean;
};

type TourismTheme = {
  page: string;
  eyebrow: string;
  heroOverlay: string;
  logoRing: string;
  primaryButton: string;
  sectionEyebrow: string;
  serviceBorder: string;
  serviceIcon: string;
  contactBand: string;
  contactEyebrow: string;
  contactButton: string;
};

type TourismPageProps = {
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  brandLogo: string;
  services: Array<{ title: string; description: string; icon: LucideIcon }>;
  contacts: Contact[];
  theme: TourismTheme;
  tagline: string;
  contactLead: string;
  promotion?: {
    image: string;
    imageAlt: string;
    title: string;
    description: string;
    date: string;
    departure: string;
    includes: string[];
  };
};

function TourismPage({
  name,
  description,
  image,
  imageAlt,
  brandLogo,
  services,
  contacts,
  theme,
  tagline,
  contactLead,
  promotion,
}: TourismPageProps) {
  const primaryContact = contacts[0];
  const PrimaryContactIcon = primaryContact.icon;

  return (
    <main className={`min-h-screen overflow-x-hidden text-slate-900 ${theme.page}`}>
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page py-4">
          <Link
            to="/convenios"
            className="inline-flex min-h-10 items-center gap-2 rounded-md px-2 text-sm font-bold text-fonasin-green transition hover:bg-emerald-50 hover:text-fonasin-deep"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Volver a convenios
          </Link>
        </div>
      </div>

      <section className="relative min-h-[520px] overflow-hidden bg-slate-950">
        <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
        <div className={`absolute inset-0 ${theme.heroOverlay}`} />
        <div className="container-page relative flex min-h-[520px] items-center py-14">
          <div className="w-full min-w-0 max-w-3xl text-white">
            <img
              src={brandLogo}
              alt={`Logo de ${name}`}
              className={`mb-7 h-32 w-32 rounded-lg bg-white object-contain p-2 shadow-2xl ring-4 ${theme.logoRing}`}
            />
            <p className={`text-xs font-black uppercase tracking-[0.18em] ${theme.eyebrow}`}>
              Convenio de turismo
            </p>
            <h1 className="mt-3 max-w-3xl break-words text-4xl font-black leading-tight sm:text-5xl">
              {name}
            </h1>
            <p className="mt-3 text-xl font-extrabold text-white">{tagline}</p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-100 sm:text-lg">{description}</p>
            <a
              href={primaryContact.href}
              target={primaryContact.external ? '_blank' : undefined}
              rel={primaryContact.external ? 'noreferrer' : undefined}
              className={`mt-7 inline-flex min-h-12 items-center gap-2 rounded-md px-5 py-3 font-black shadow-lg transition hover:-translate-y-0.5 ${theme.primaryButton}`}
            >
              <PrimaryContactIcon size={20} aria-hidden="true" />
              Contactar ahora
              <ArrowUpRight size={18} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="max-w-2xl">
          <p className={`text-xs font-black uppercase tracking-[0.18em] ${theme.sectionEyebrow}`}>
            Servicios
          </p>
          <h2 className="mt-2 text-3xl font-black text-fonasin-deep">Todo para preparar tu viaje</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Consulta directamente con la agencia las alternativas disponibles para tu destino.
          </p>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ title, description: serviceDescription, icon: Icon }) => (
            <article
              key={title}
              className={`min-w-0 rounded-lg border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${theme.serviceBorder}`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${theme.serviceIcon}`}>
                <Icon className="h-6 w-6" aria-hidden="true" />
              </div>
              <h3 className="mt-5 text-lg font-black text-fonasin-deep">{title}</h3>
              <p className="mt-2 leading-6 text-slate-600">{serviceDescription}</p>
            </article>
          ))}
        </div>
      </section>

      {promotion && (
        <section className="container-page pb-14" aria-labelledby="tourism-promotion-title">
          <div className="mb-6 flex items-center gap-3">
            <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${theme.serviceIcon}`}>
              <Sparkles className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className={`text-xs font-black uppercase tracking-[0.18em] ${theme.sectionEyebrow}`}>
                Plan destacado
              </p>
              <h2 id="tourism-promotion-title" className="text-2xl font-black text-fonasin-deep">
                {promotion.title}
              </h2>
            </div>
          </div>
          <figure className="overflow-hidden rounded-lg border border-sky-200 bg-white shadow-xl">
            <img src={promotion.image} alt={promotion.imageAlt} className="block h-auto w-full" />
            <figcaption className="sr-only">
              {promotion.description} {promotion.date}. {promotion.departure}. Incluye:{' '}
              {promotion.includes.join(', ')}.
            </figcaption>
          </figure>
        </section>
      )}

      <section className={theme.contactBand}>
        <div className="container-page grid gap-8 py-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-center">
          <div>
            <p className={`text-xs font-black uppercase tracking-[0.18em] ${theme.contactEyebrow}`}>
              Contacto directo
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">Habla con la agencia</h2>
            <p className="mt-3 max-w-xl leading-7 text-slate-200">{contactLead}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {contacts.map(({ label, href, icon: Icon, external }) => (
              <a
                key={`${label}-${href}`}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                className={`inline-flex min-h-14 min-w-0 items-center gap-3 rounded-lg border px-4 py-3 font-bold shadow-sm transition hover:-translate-y-0.5 ${theme.contactButton}`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 break-words">{label}</span>
                {external && <ArrowUpRight className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" />}
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const caribbeanTheme: TourismTheme = {
  page: 'bg-sky-50/40',
  eyebrow: 'text-amber-300',
  heroOverlay: 'bg-gradient-to-r from-sky-950/95 via-blue-900/72 to-cyan-700/10',
  logoRing: 'ring-cyan-300/40',
  primaryButton: 'bg-amber-400 text-sky-950 hover:bg-amber-300',
  sectionEyebrow: 'text-sky-700',
  serviceBorder: 'border-sky-200 hover:border-cyan-400',
  serviceIcon: 'bg-sky-100 text-sky-700',
  contactBand: 'border-y border-sky-800 bg-gradient-to-r from-sky-950 via-blue-950 to-cyan-950',
  contactEyebrow: 'text-amber-300',
  contactButton: 'border-sky-700 bg-white/10 text-white hover:border-amber-300 hover:bg-white/15',
};

const luzMarinaTheme: TourismTheme = {
  page: 'bg-emerald-50/30',
  eyebrow: 'text-yellow-300',
  heroOverlay: 'bg-gradient-to-r from-emerald-950/95 via-teal-950/76 to-slate-900/15',
  logoRing: 'ring-yellow-300/40',
  primaryButton: 'bg-yellow-300 text-emerald-950 hover:bg-yellow-200',
  sectionEyebrow: 'text-teal-700',
  serviceBorder: 'border-teal-200 hover:border-yellow-400',
  serviceIcon: 'bg-teal-100 text-teal-800',
  contactBand: 'border-y border-teal-800 bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950',
  contactEyebrow: 'text-yellow-300',
  contactButton: 'border-teal-700 bg-white/10 text-white hover:border-yellow-300 hover:bg-white/15',
};

const caribbeanServices = [
  { title: 'Tiquetes aéreos', description: 'Opciones nacionales e internacionales.', icon: Ticket },
  { title: 'Hoteles', description: 'Alojamiento nacional e internacional.', icon: Hotel },
  { title: 'Tours y experiencias', description: 'Planes completos para disfrutar cada destino.', icon: MapPinned },
  { title: 'Asistencia médica', description: 'Acompañamiento para viajeros durante el recorrido.', icon: HeartPulse },
  { title: 'Pasaportes y visas', description: 'Orientación para trámites y solicitudes de viaje.', icon: Globe2 },
  { title: 'Asesoría personalizada', description: 'Apoyo para elegir destinos y organizar el plan.', icon: CircleHelp },
];

export function ConvenioCaribbean() {
  return (
    <TourismPage
      name="Caribbean Sol y Mar"
      tagline="Tu viaje comienza con nosotros."
      description="Hacemos realidad tus viajes y tus sueños con alternativas de transporte, alojamiento, experiencias y asesoría personalizada."
      image="/images/convenios/caribbean-sol-mar-hero.jpg"
      imageAlt="Playa del Caribe y avión representando los servicios de Caribbean Sol y Mar"
      brandLogo="/images/convenios/caribbean-sol-mar-logo.jpg"
      services={caribbeanServices}
      theme={caribbeanTheme}
      contactLead="Consulta destinos, fechas y alternativas de viaje por WhatsApp o Instagram."
      promotion={{
        image: '/images/convenios/caribbean-punta-cana.jpg',
        imageAlt: 'Promoción de viaje a Punta Cana de Caribbean Sol y Mar',
        title: 'Punta Cana',
        description: 'Sol, playa y diversión en un solo destino.',
        date: 'Del 30 al 4 de diciembre',
        departure: 'Salida desde Bucaramanga',
        includes: [
          'Tiquetes aéreos ida y regreso',
          'Alimentación en plan completo',
          'Asistencia médica',
          'Tour a Isla Saona',
          'Transporte aeropuerto, hotel y aeropuerto',
        ],
      }}
      contacts={[
        { label: 'WhatsApp 324 558 0932', href: 'https://wa.me/573245580932', icon: MessageCircle, external: true },
        { label: 'WhatsApp 318 829 7925', href: 'https://wa.me/573188297925', icon: MessageCircle, external: true },
        { label: 'Instagram', href: 'https://www.instagram.com/caribbeansolymar110', icon: Instagram, external: true },
      ]}
    />
  );
}

export function ConvenioLuzMarina() {
  const services = [
    { title: 'Viajes personalizados', description: 'Orientación para organizar planes de viaje según tus necesidades.', icon: Plane },
    { title: 'Atención directa', description: 'Comunicación por teléfono, correo electrónico y redes sociales.', icon: MessageCircle },
    { title: 'Agencia de viajes', description: 'Acompañamiento para consultar destinos y alternativas turísticas.', icon: Building2 },
  ];

  return (
    <TourismPage
      name="Luz Marina Vargas"
      tagline="Experiencias pensadas para ti."
      description="Agente líder de viajes con atención personalizada para consultar destinos y organizar tus próximas experiencias."
      image="/images/convenios/luz-marina-vargas-hero.jpg"
      imageAlt="Aeropuerto y elementos de planificación de viajes"
      brandLogo="/images/convenios/luz-marina-vargas-logo.jpg"
      services={services}
      theme={luzMarinaTheme}
      contactLead="Recibe atención personalizada por teléfono, correo electrónico o Facebook."
      contacts={[
        { label: '314 368 0054', href: 'tel:+573143680054', icon: Phone },
        { label: '316 730 8644', href: 'tel:+573167308644', icon: Phone },
        { label: '607 683 4279', href: 'tel:+576076834279', icon: Phone },
        { label: 'lumavapa@hotmail.com', href: 'mailto:lumavapa@hotmail.com', icon: Mail },
        { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61569011393925', icon: Facebook, external: true },
      ]}
    />
  );
}
