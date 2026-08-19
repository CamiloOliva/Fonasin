import { Banknote, CalendarRange, Coins, ShieldCheck, Sparkles } from 'lucide-react';
import { WHATSAPP_URL } from '../../../data/siteConfig';
import { getCreditLineBySlug } from '../data/creditLines';
import CreditLinePageTemplate from '../components/CreditLinePageTemplate';
import { fonaprimaStyles } from '../styles/creditPageStyles';

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/60 py-10 sm:py-14">
      <div className="container-page relative z-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-300/40 bg-white/80 p-6 text-slate-800 shadow-xl backdrop-blur-md sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400 bg-yellow-300/30 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-amber-900">
            <Sparkles size={14} aria-hidden="true" />
            Próximamente
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-amber-950 sm:text-5xl">{title}</h1>

          <p className="mt-4 max-w-2xl text-slate-600">Esta línea todavía no tiene su ficha completa publicada.</p>

          <div className="mt-8">
            <a
              href="/creditos"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-bold text-amber-950 shadow-md transition hover:-translate-y-0.5 hover:bg-yellow-300 focus-ring"
            >
              <Sparkles size={18} aria-hidden="true" />
              Volver a créditos
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FonaprimaPage() {
  const line = getCreditLineBySlug('fonaprima');

  if (!line) {
    return <ComingSoon title="Línea de crédito no encontrada" />;
  }

  if (line.slug !== 'fonaprima') {
    return <ComingSoon title={line.name} />;
  }

  return (
    <CreditLinePageTemplate
      theme={fonaprimaStyles}
      hero={{
        image: '/images/fonaprima.png',
        eyebrow: 'Línea de crédito',
        title: line.name,
        description:
          'Anticipo diseñado para brindar liquidez inmediata al asociado con respaldo directo en su prima de servicios (junio/diciembre) o prima de antigüedad (enero).',
        chips: ['Anticipo de prima', 'Hasta 90% de tu prima', 'Hasta 12 meses'],
        stats: [
          { icon: Coins, label: 'Monto', value: '70% al 90% de la prima' },
          { icon: CalendarRange, label: 'Plazo', value: '1 a 12 meses' },
          { icon: Banknote, label: 'Amortización capital', value: '1 solo pago al vencimiento' },
          { icon: ShieldCheck, label: 'Amortización intereses', value: 'Mensual' },
        ],
      }}
      overview={{
        eyebrow: '¿Qué es?',
        title: 'Anticipa el valor de tu prima antes de la fecha de pago',
        description:
          'FONAPRIMA te permite disfrutar del dinero de tu prima de servicios o de antigüedad de manera anticipada. Pagas los intereses mes a mes y cancelas la totalidad del capital en un único pago directo cuando recibas tu prima.',
        itemsTitle: 'Destinos del crédito',
        items: [
          'Anticipo de prima de servicios de mitad de año (junio).',
          'Anticipo de prima de servicios de fin de año (diciembre).',
          'Anticipo sobre la prima de antigüedad (enero).',
          'Gastos de temporada navideña o vacaciones.',
          'Atención de compromisos financieros de liquidez inmediata.',
          'Cualquier otra necesidad lícita respaldada por tu prima.',
        ],
        sideEyebrow: 'Condiciones clave',
        sideCards: [
          { label: 'Amortización capital', value: 'Un solo pago al vencimiento' },
          { label: 'Amortización intereses', value: 'Mensual' },
          { label: 'Destino', value: 'Anticipo sobre primas reglamentarias' },
        ],
        sideNote:
          'La fecha límite de vencimiento de este crédito coincide directamente con la fecha de pago de la prima correspondiente por parte del patrono.',
      }}
      amounts={{
        eyebrow: 'Monto y garantías',
        title: 'Porcentaje financiado según nivel de sueldo',
        subtitle: 'Condiciones establecidas para FONAPRIMA',
        rows: [
          {
            tier: 'Hasta 2 SMMLV de sueldo',
            percentage: 'Hasta el 90%',
            description: 'Aplica para asociados con ingresos de hasta 2 Salarios Mínimos Mensuales Legales Vigentes.',
          },
          {
            tier: 'De 2 a 3 SMMLV de sueldo',
            percentage: 'Hasta el 80%',
            description: 'Aplica para asociados con ingresos superiores a 2 y hasta 3 SMMLV.',
          },
          {
            tier: 'De 3 a 4 SMMLV de sueldo',
            percentage: 'Hasta el 70%',
            description: 'Aplica para asociados con ingresos superiores a 3 y hasta 4 SMMLV.',
          },
        ],
        note:
          'El monto asignado estará respaldado por la certificación del valor liquidado de tu prima y sujeto a la verificación de tu capacidad de pago.',
      }}
      rates={{
        eyebrow: 'Plazos y tasas',
        title: 'Tasa de interés aplicable según el plazo',
        badge: 'Desde 1.4% mensual',
        noteTitle: 'Importante',
        rows: [
          { term: '1 – 6 meses', ea: '18.16%', na: '16.80%', monthly: '1.4%' },
          { term: '7 – 12 meses', ea: '19.56%', na: '18.00%', monthly: '1.5%' },
        ],
        note:
          'Modalidad de pago única a capital: durante el tiempo del crédito solo pagas la cuota mensual de intereses. El valor total del capital prestado se descuenta o cancela en un solo pago directo al recibo de la prima.',
      }}
      summary={{
        eyebrow: 'Garantías',
        title: 'Resumen de respaldo del crédito',
        cards: [
          {
            label: 'Garantía principal',
            title: 'Prima de servicios o antigüedad',
            description: 'Respaldo directo sobre el derecho causado de la prima reglamentaria fijada por ley o convenio.',
          },
          {
            label: 'Condición general',
            title: 'Capacidad de pago',
            description: 'Sujeto a la certificación expedida por la empresa y disponibilidad del cupo reglamentario de FONASIN.',
          },
        ],
      }}
      cta={{
        eyebrow: 'Siguiente paso',
        title: '¿Quieres anticipar tu prima de servicios?',
        description:
          'Solicita el estudio o desembolso de tu FONAPRIMA de forma ágil y segura directamente a través de WhatsApp.',
        primary: { href: '/creditos', label: 'Ver más líneas' },
        secondary: { href: WHATSAPP_URL, label: 'Solicitar por WhatsApp' },
      }}
    />
  );
}
