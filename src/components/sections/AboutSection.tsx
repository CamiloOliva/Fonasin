import { ChevronDown } from 'lucide-react';
import SectionHeading from '../ui/SectionHeading';

type AboutItem = {
  title: string;
  content: string;
};

const aboutItems: AboutItem[] = [
  {
    title: 'Quiénes somos',
    content:
      'FONASIN es el Fondo de Empleados creado para contribuir al bienestar y desarrollo integral de sus asociados y sus familias, promoviendo el ahorro, facilitando el acceso a soluciones de crédito y ofreciendo servicios y beneficios que aporten al mejoramiento de su calidad de vida. Trabajamos bajo los principios de solidaridad, confianza, responsabilidad y ayuda mutua, buscando construir relaciones cercanas y sostenibles con nuestros asociados. En FONASIN creemos que cada aporte cuenta y que, cuando trabajamos juntos, podemos generar mayores oportunidades para todos.',
  },
  {
    title: 'Misión',
    content:
      'FONASIN es una organización solidaria que fomenta la cultura del ahorro y brinda soluciones de crédito a sus asociados, contribuyendo al bienestar económico, social y familiar mediante servicios oportunos, condiciones favorables y programas que promueven el desarrollo integral, la ayuda mutua y la solidaridad.',
  },
  {
    title: 'Visión',
    content:
      'Para el año 2030, FONASIN será reconocido como un fondo de empleados sólido, sostenible e innovador, líder en el sector minero energético, destacándose como la primera opción de respaldo financiero y social para sus asociados y sus familias. A través de servicios ágiles, oportunos y apoyados en herramientas tecnológicas, fortalecerá el bienestar de sus asociados, manteniendo indicadores financieros saludables y generando confianza, crecimiento y valor para la comunidad solidaria.',
  },
  {
    title: 'Objetivo estratégico general',
    content:
      'Fortalecer el crecimiento sostenible de FONASIN mediante el desarrollo de soluciones financieras, programas de bienestar, innovación tecnológica y una gestión eficiente de los recursos, generando valor para los asociados y sus familias.',
  },
  {
    title: 'Valores',
    content:
      'Trabajamos bajo los principios de solidaridad, confianza, responsabilidad y ayuda mutua, buscando construir relaciones cercanas y sostenibles con nuestros asociados.',
  },
];

export default function AboutSection() {
  return (
    <section id="quienes-somos" className="py-16 sm:py-20">
      <div className="container-page grid items-center gap-12 lg:grid-cols-[.85fr_1.15fr]">
        <div className="relative overflow-hidden rounded-3xl bg-fonasin-surface shadow-lg shadow-fonasin-deep/5">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fonasin-lime/30 blur-2xl" />
          <img
            src="/images/institutional.svg"
            alt="Imagen institucional provisional de FONASIN"
            className="relative w-full"
          />
        </div>

        <div>
          <SectionHeading
            eyebrow="Institucional"
            title="Quiénes somos"
            text="Conoce el propósito que orienta a FONASIN y su compromiso con el bienestar de los asociados y sus familias."
          />

          <div className="mt-8 space-y-3">
            {aboutItems.map((item) => (
              <details
                key={item.title}
                className="group overflow-hidden rounded-2xl border border-fonasin-green/15 bg-white shadow-sm transition hover:border-fonasin-lime/80 hover:shadow-md"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left font-black text-fonasin-deep marker:content-none sm:px-6">
                  <span className="flex items-center gap-3">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-fonasin-lime ring-4 ring-fonasin-lime/15" />
                    {item.title}
                  </span>
                  <ChevronDown
                    size={20}
                    aria-hidden="true"
                    className="shrink-0 text-fonasin-green transition-transform duration-200 group-open:rotate-180"
                  />
                </summary>
                <div className="border-t border-fonasin-green/10 bg-fonasin-surface/70 px-5 py-4 sm:px-6">
                  <p className="text-justify leading-7 text-slate-700">{item.content}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
