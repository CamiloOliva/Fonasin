import { Banknote, CalendarRange, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreditLinePageTemplate from '../components/CreditLinePageTemplate';
import { getCreditLineBySlug } from '../data/creditLines';
import { fonaportesStyles } from '../styles/creditPageStyles';
import { WHATSAPP_URL } from '../../../data/siteConfig';

const usageItems = [
  'Cubrimiento de necesidades personales o familiares.',
  'Coyunturas y requerimientos de liquidez.',
  'Financiación respaldada en ahorros permanentes.',
  'Consolidación de compromisos financieros.',
  'Proyectos o gastos de mediano y largo plazo.',
  'Cualquier otra necesidad lícita del asociado.',
];

const amountRows = [
  {
    tier: 'Cupo total',
    amount: 'Hasta el 100% de aportes y ahorros',
    description:
      'Monto sujeto a saldos disponibles, obligaciones vigentes y reglas de compensación en FONASIN.',
  },
];

const rateRows = [
  { term: '1 – 18 meses', ea: '15.39%', na: '14.40%', monthly: '1.2%' },
  { term: '19 – 24 meses', ea: '16.77%', na: '15.60%', monthly: '1.3%' },
  { term: '25 – 36 meses', ea: '18.16%', na: '16.80%', monthly: '1.4%' },
  { term: '37 – 48 meses', ea: '19.56%', na: '18.00%', monthly: '1.5%' },
  { term: '49 – 60 meses', ea: '20.98%', na: '19.20%', monthly: '1.6%' },
];

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="relative overflow-hidden bg-[#1f1a08] py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(254,240,138,0.25),transparent_55%),linear-gradient(135deg,rgba(31,26,8,0.96),rgba(15,12,3,0.98))]" />
      <div className="container-page relative z-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-yellow-300/30 bg-white/5 p-6 text-white shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/50 bg-amber-200/20 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-yellow-200">
            <Sparkles size={14} aria-hidden="true" />
            Próximamente
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>

          <p className="mt-4 max-w-2xl text-amber-100/80">
            Esta línea todavía no tiene su ficha completa publicada.
          </p>

          <div className="mt-8">
            <Link
              to="/creditos"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 px-5 py-3 font-bold text-slate-950 transition hover:-translate-y-0.5 hover:brightness-110 focus-ring"
            >
              <CalendarRange size={18} aria-hidden="true" />
              Volver a créditos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreditLinePage() {
  const line = getCreditLineBySlug('fonaportes');

  if (!line) {
    return <ComingSoon title="Línea de crédito no encontrada" />;
  }

  if (line.slug !== 'fonaportes') {
    return <ComingSoon title={line.name} />;
  }

  return (
    <CreditLinePageTemplate
      theme={fonaportesStyles}
      hero={{
        image: '/images/fonaportes.png',
        eyebrow: 'Línea de crédito',
        title: line.name,
        description:
          'Financiación respaldada directamente en tus aportes sociales y ahorros permanentes, diseñada para cubrir necesidades personales con excelentes condiciones financieras.',
        chips: ['Garantía de aportes', 'Desde 1.2% mensual', 'Hasta 60 meses'],
        stats: [
          { icon: Banknote, label: 'Monto', value: 'Hasta el valor de tus aportes y ahorros' },
          { icon: CalendarRange, label: 'Plazo', value: 'Hasta 60 meses' },
          { icon: Banknote, label: 'Amortización', value: 'Mensual' },
          { icon: ShieldCheck, label: 'Garantía', value: 'Aportes y ahorros permanentes' },
        ],
      }}
      overview={{
        eyebrow: '¿Qué es FONAPORTES?',
        title: 'Financiación sólida garantizada con tus propios ahorros',
        description:
          'FONAPORTES te permite acceder a créditos aprovechando el respaldo de tus aportes sociales y ahorros acumulados en FONASIN, brindándote una alternativa de financiación ágil con bajas tasas de interés y amplia flexibilidad.',
        itemsTitle: '¿En qué lo puedes usar?',
        items: usageItems,
        sideEyebrow: 'Condiciones clave',
        sideCards: [
          { label: 'Amortización capital', value: 'Mensual' },
          { label: 'Amortización intereses', value: 'Mensual' },
          { label: 'Destino', value: 'Necesidades personales, familiares y liquidez general' },
        ],
        sideNote:
          'Sin consulta a centrales de riesgo: cuando el monto solicitado es menor o igual al acumulado en aportes y ahorros permanentes, no se consulta centrales de riesgo.',
      }}
      amounts={{
        eyebrow: 'Monto y garantías',
        title: 'Garantías respaldadas en tu patrimonio en el Fondo',
        subtitle: 'Condiciones oficiales del Manual FONAPORTES',
        rows: amountRows,
        note:
          'El monto aprobado estará sujeto al saldo disponible de tus aportes, deduciendo obligaciones previas y respetando tu capacidad de pago.',
      }}
      rates={{
        eyebrow: 'Plazos y tasas',
        title: 'Tabla de tasas según el plazo del crédito',
        badge: 'Desde 1.2% mensual',
        rows: rateRows,
        noteTitle: 'Nota de evaluación',
        note:
          'Plazos superiores a 48 meses deberán ser validados frente al monto solicitado, la capacidad de pago y las políticas internas de gestión de riesgo de FONASIN.',
      }}
      summary={{
        eyebrow: 'Garantías',
        title: 'Resumen de respaldo del crédito',
        cards: [
          {
            label: 'Respaldo directo',
            title: 'Aportes y ahorros',
            description: 'Tus propios aportes acumulados sirven como fuente primaria de garantía.',
          },
          {
            label: 'Sin trámites complejos',
            title: 'Estudio ágil',
            description: 'Al estar respaldado por tu saldo disponible, el proceso de aprobación y desembolso es más rápido y sencillo.',
          },
        ],
      }}
      cta={{
        eyebrow: 'Siguiente paso',
        title: '¿Quieres solicitar tu FONAPORTES?',
        description:
          'Ponte en contacto con nuestro equipo por WhatsApp para calcular tu cupo disponible según tus aportes acumulados.',
        primary: { href: '/creditos', label: 'Ver más líneas' },
        secondary: { href: WHATSAPP_URL, label: 'Solicitar por WhatsApp' },
      }}
    />
  );
}
