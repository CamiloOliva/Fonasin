import { Banknote, CalendarRange, Coins, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { WHATSAPP_URL } from '../../../data/siteConfig';
import { getCreditLineBySlug } from '../data/creditLines';
import CreditLinePageTemplate from '../components/CreditLinePageTemplate';
import { fonapenStyles } from '../styles/creditPageStyles';

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 py-10 sm:py-14">
      <div className="container-page relative z-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-300 bg-white/80 p-6 text-slate-800 shadow-xl backdrop-blur-md sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-200/80 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-slate-700">
            <Sparkles size={14} aria-hidden="true" />
            Próximamente
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">{title}</h1>

          <p className="mt-4 max-w-2xl text-slate-600">Esta línea todavía no tiene su ficha completa publicada.</p>

          <div className="mt-8">
            <a
              href="/creditos"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-900 focus-ring"
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

export default function FonapenPage() {
  const line = getCreditLineBySlug('fonapen');

  if (!line) {
    return <ComingSoon title="Línea de crédito no encontrada" />;
  }

  if (line.slug !== 'fonapen') {
    return <ComingSoon title={line.name} />;
  }

  return (
    <CreditLinePageTemplate
      theme={fonapenStyles}
      hero={{
        image: '/images/fonapen.png',
        eyebrow: 'Línea especial para pensionados',
        title: line.name,
        description:
          'Crédito preferencial diseñado para asociados pensionados, ofreciendo liquidez financiera, tasas especiales y cómodos plazos con deducción directa de su mesada pensional.',
        chips: ['Deducción por mesada', 'Hasta $40.000.000', 'Hasta 72 meses'],
        stats: [
          { icon: Coins, label: 'Monto máximo', value: 'Hasta $40.000.000' },
          { icon: CalendarRange, label: 'Plazo máximo', value: 'Hasta 72 meses' },
          { icon: Banknote, label: 'Amortización', value: 'Cuota fija mensual' },
          { icon: ShieldCheck, label: 'Garantía', value: 'Pagaré + Libranza / Mesada pensional' },
        ],
      }}
      overview={{
        eyebrow: '¿Qué es?',
        title: 'Tranquilidad y respaldo para disfrutar tu retiro laboral',
        description:
          'FONAPEN es una línea de crédito preferencial enfocada exclusivamente en brindar apoyo financiero, estabilidad y bienestar a los asociados en etapa de jubilación o pensión. Su descuento por libranza o débito automático garantiza una gestión sin complicaciones ni desplazamientos.',
        itemsTitle: 'Destinos del crédito',
        items: [
          'Libre inversión y gastos personales para el bienestar del pensionado.',
          'Sostenimiento familiar y mejora de la calidad de vida.',
          'Atención de compromisos de salud, tratamientos o medicamentos.',
          'Adecuaciones o remodelaciones del hogar.',
          'Viajes, recreación, descanso y tiempo de ocio.',
          'Consolidación o pago de deudas en condiciones ventajosas.',
        ],
        sideEyebrow: 'Atención preferencial',
        sideCards: [
          { label: 'Beneficiarios', value: 'Asociados Pensionados' },
          { label: 'Forma de pago', value: 'Deducción de mesada pensional' },
          { label: 'Agilidad', value: 'Trámite ágil y acompañamiento personalizado' },
        ],
        sideNote:
          'Sujeto al cupo de endeudamiento disponible y a la capacidad legal de afectación sobre la mesada pensional del asociado.',
      }}
      amounts={{
        eyebrow: 'Cupos de financiación',
        title: 'Monto máximo asignado según mesada pensional',
        subtitle: 'Condiciones oficiales FONAPEN',
        rows: [
          {
            tier: 'Hasta 2 SMMLV de pensión',
            amount: 'Hasta $15.000.000',
            description: 'Monto máximo otorgado a asociados con mesada pensional de hasta 2 SMMLV.',
          },
          {
            tier: 'De 2 a 4 SMMLV de pensión',
            amount: 'Hasta $25.000.000',
            description: 'Monto otorgado para asociados con mesada pensional entre 2 y 4 SMMLV.',
          },
          {
            tier: 'Más de 4 SMMLV de pensión',
            amount: 'Hasta $40.000.000',
            description: 'Aplica para asociados con mesadas superiores a 4 SMMLV según capacidad de pago.',
          },
        ],
        note:
          'El monto definitivo dependerá de la capacidad de pago libre en tu comprobante de pago de pensión y de tu historial crediticio dentro de la entidad.',
      }}
      rates={{
        eyebrow: 'Plazos y tasas',
        title: 'Tasas de interés preferenciales',
        badge: 'Desde 1.3% mensual',
        noteTitle: 'Importante',
        rows: [
          { term: '1 – 24 meses', ea: '16.80%', na: '15.60%', monthly: '1.3%' },
          { term: '25 – 48 meses', ea: '18.16%', na: '16.80%', monthly: '1.4%' },
          { term: '49 – 72 meses', ea: '19.56%', na: '18.00%', monthly: '1.5%' },
        ],
        note:
          'Modalidad de pago única a capital: durante el tiempo del crédito solo pagas la cuota mensual de intereses. El valor total del capital prestado se descuenta o cancela en un solo pago directo al recibo de la prima.',
      }}
      summary={{
        eyebrow: 'Garantías y Requisitos',
        title: 'Resumen de respaldo del crédito',
        cards: [
          {
            label: 'Documentación requerida',
            title: 'Comprobantes de pago de pensión',
            description:
              'Últimos 2 o 3 desprendibles de pago pensional y fotocopia de la cédula de ciudadanía del asociado.',
          },
          {
            label: 'Garantía del crédito',
            title: 'Pagaré y Libranza',
            description: 'Firma de pagaré con cartas de instrucciones y autorización de descuento automático sobre la mesada.',
          },
        ],
      }}
      cta={{
        eyebrow: 'Siguiente paso',
        title: '¿Quieres solicitar tu línea FONAPEN?',
        description:
          'Comunícate con uno de nuestros asesores para brindarte asistencia personalizada en la solicitud de tu crédito.',
        primary: { href: '/creditos', label: 'Ver más líneas' },
        secondary: { href: WHATSAPP_URL, label: 'Solicitar por WhatsApp' },
      }}
    />
  );
}
