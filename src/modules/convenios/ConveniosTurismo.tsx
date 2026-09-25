import {
  ArrowLeft,
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

type TourismPageProps = {
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  brandLogo?: string;
  logoMode?: boolean;
  services: Array<{ title: string; description: string; icon: LucideIcon }>;
  contacts: Contact[];
};

function TourismPage({
  name,
  description,
  image,
  imageAlt,
  brandLogo,
  logoMode = false,
  services,
  contacts,
}: TourismPageProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page py-4">
          <Link
            to="/convenios"
            className="inline-flex items-center gap-2 text-sm font-bold text-fonasin-green hover:text-fonasin-deep"
          >
            <ArrowLeft size={18} aria-hidden="true" />
            Volver a convenios
          </Link>
        </div>
      </div>

      <section
        className={
          logoMode
            ? 'border-b border-emerald-100 bg-emerald-50/50'
            : 'relative min-h-[430px] overflow-hidden bg-slate-900'
        }
      >
        {logoMode ? (
          <div className="container-page grid min-h-[430px] place-items-center py-12 text-center">
            <div className="max-w-3xl">
              <img
                src={image}
                alt={imageAlt}
                className="mx-auto h-32 w-56 object-contain sm:h-40 sm:w-72"
              />
              <p className="mt-7 text-xs font-black uppercase tracking-[0.18em] text-fonasin-green">
                Convenio de turismo
              </p>
              <h1 className="mt-2 text-4xl font-black text-fonasin-deep sm:text-5xl">{name}</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                {description}
              </p>
            </div>
          </div>
        ) : (
          <>
            <img src={image} alt={imageAlt} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/55 to-transparent" />
            <div className="container-page relative flex min-h-[430px] items-center py-14">
              <div className="min-w-0 w-full max-w-2xl text-white">
                {brandLogo && (
                  <img
                    src={brandLogo}
                    alt={`Logo de ${name}`}
                    className="mb-6 h-20 w-20 rounded-lg bg-white object-contain p-1 shadow-lg"
                  />
                )}
                <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-300">
                  Convenio de turismo
                </p>
                <h1 className="mt-3 max-w-full break-words text-3xl font-black sm:text-5xl">{name}</h1>
                <p className="mt-5 max-w-full text-base leading-7 text-slate-100 sm:text-lg">{description}</p>
              </div>
            </div>
          </>
        )}
      </section>

      <section className="container-page py-14">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-fonasin-green">Servicios</p>
        <h2 className="mt-2 text-3xl font-black text-fonasin-deep">Planea tu próximo viaje</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ title, description: serviceDescription, icon: Icon }) => (
            <article key={title} className="min-w-0 rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
              <Icon className="h-7 w-7 text-fonasin-green" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-black text-fonasin-deep">{title}</h3>
              <p className="mt-2 leading-6 text-slate-600">{serviceDescription}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-emerald-100 bg-emerald-50/50">
        <div className="container-page py-12">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-fonasin-green">Contacto</p>
          <h2 className="mt-2 text-3xl font-black text-fonasin-deep">Habla directamente con la agencia</h2>
          <div className="mt-7 flex flex-wrap gap-3">
            {contacts.map(({ label, href, icon: Icon, external }) => (
              <a
                key={`${label}-${href}`}
                href={href}
                target={external ? '_blank' : undefined}
                rel={external ? 'noreferrer' : undefined}
                className="inline-flex min-h-12 max-w-full items-center gap-2 break-all rounded-lg border border-emerald-200 bg-white px-5 py-3 font-bold text-fonasin-deep shadow-sm transition hover:border-fonasin-green hover:text-fonasin-green"
              >
                <Icon size={19} aria-hidden="true" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

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
      description="Hacemos realidad tus viajes y tus sueños con alternativas de transporte, alojamiento, experiencias y asesoría personalizada."
      image="/images/convenios/caribbean-sol-mar-hero.jpg"
      imageAlt="Playa del Caribe y avión representando los servicios de Caribbean Sol y Mar"
      brandLogo="/images/convenios/caribbean-sol-mar-logo.jpg"
      services={caribbeanServices}
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
      description="Agente líder de viajes con atención personalizada para consultar destinos y organizar tus próximas experiencias."
      image="/images/convenios/luz-marina-vargas.png"
      imageAlt="Logo de Luz Marina Vargas, agente líder de viajes"
      logoMode
      services={services}
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
