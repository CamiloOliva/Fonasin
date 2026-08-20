import { Banknote, CalendarRange, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import CreditLinePageTemplate from '../components/CreditLinePageTemplate';
import { getCreditLineBySlug } from '../data/creditLines';
import { fonarotativoStyles } from '../styles/creditPageStyles';
import { WHATSAPP_URL } from '../../../data/siteConfig';

const usageItems = [
  'Atención de necesidades inmediatas.',
  'Urgencias médicas o imprevistos familiares.',
  'Gastos de menor cuantía.',
  'Coyunturas temporales de liquidez.',
  'Pagos rápidos o compras imprevistas.',
  'Cualquier otra necesidad lícita de corto plazo.',
];

const amountRows = [
  {
    tier: 'Cupo único',
    amount: 'Hasta $1.500.000',
    description: 'Límite según capacidad de pago, buen comportamiento interno y disponibilidad del cupo aprobado.',
  },
];

const rateRows = [{ term: '01 - 12 meses', ea: '19.56%', na: '18.00%', monthly: '1.5%' }];

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="relative overflow-hidden bg-[#0a1d47] py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.2),transparent_55%),linear-gradient(135deg,rgba(8,20,58,0.96),rgba(6,12,36,0.98))]" />
      <div className="container-page relative z-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/8 p-6 text-white shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-sky-200">
            <Sparkles size={14} aria-hidden="true" />
            Próximamente
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>

          <p className="mt-4 max-w-2xl text-white/80">Esta línea todavía no tiene su ficha completa publicada.</p>

          <div className="mt-8">
            <Link
              to="/creditos"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-300 px-5 py-3 font-bold text-[#0a1d47] transition hover:-translate-y-0.5 hover:bg-white focus-ring"
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
  const line = getCreditLineBySlug('fonarotativo');

  if (!line) {
    return <ComingSoon title="Línea de crédito no encontrada" />;
  }

  if (line.slug !== 'fonarotativo') {
    return <ComingSoon title={line.name} />;
  }

  return (
    <CreditLinePageTemplate
      theme={fonarotativoStyles}
      hero={{
        image: '/images/fonarotativo.png',
        eyebrow: 'Línea de crédito',
        title: line.name,
        description:
          'Línea de crédito bajo modalidad de cupo rotativo controlado de corto plazo, destinada a cubrir necesidades inmediatas de liquidez del asociado, permitiendo atender gastos personales, familiares, emergencias o eventualidades lícitas.',
        chips: ['Liquidez inmediata', 'Hasta $1.500.000', 'Hasta 12 meses'],
        stats: [
          { icon: Banknote, label: 'Monto', value: 'Hasta $1.500.000' },
          { icon: CalendarRange, label: 'Plazo', value: 'Hasta 12 meses' },
          { icon: Banknote, label: 'Amortización', value: 'Descuento por nómina' },
          { icon: ShieldCheck, label: 'Garantía', value: 'Pagaré, libranza o autorización de descuento' },
        ],
      }}
      overview={{
        eyebrow: '¿Qué es?',
        title: 'Un cupo ágil para imprevistos y liquidez rápida',
        description:
          'FONAROTATIVO funciona como un cupo interno rotativo y controlado para el asociado. Los valores abonados a capital liberan nuevamente disponibilidad dentro del cupo aprobado, siempre que se mantenga buen comportamiento de pago, ausencia de mora y cumplimiento de las condiciones establecidas por FONASIN.',
        itemsTitle: '¿En qué lo puedes usar?',
        items: usageItems,
        sideEyebrow: 'Condiciones clave',
        sideCards: [
          { label: 'Amortización capital', value: 'Descuento por nómina' },
          { label: 'Amortización intereses', value: 'Mensual' },
          { label: 'Destino', value: 'Liquidez inmediata y emergencias' },
        ],
        sideNote:
          'La disponibilidad del cupo rotativo depende de la capacidad de pago, del buen comportamiento de pago y de la ausencia de mora en las obligaciones vigentes.',
      }}
      amounts={{
        eyebrow: 'Monto y garantías',
        title: 'Garantía respaldada en tus aportes',
        subtitle: 'Condiciones establecidas para FONAROTATIVO',
        rows: amountRows,
        note:
          'El cupo otorgado estará sujeto a capacidad de endeudamiento, capacidad de pago, buen comportamiento interno y disponibilidad de recursos.',
      }}
      rates={{
        eyebrow: 'Plazos y tasas',
        title: 'Tasa y plazo del cupo rotativo',
        badge: '1.5% mensual',
        rows: rateRows,
        noteTitle: 'Importante',
        note:
          'El plazo máximo para esta línea de crédito es de 12 meses. Al tratarse de una línea rotativa, a medida que abonas a capital vas liberando cupo para futuras utilizaciones.',
      }}
      summary={{
        eyebrow: 'Garantías',
        title: 'Resumen de respaldo del crédito',
        cards: [
          {
            label: 'Cupo aprobado',
            title: 'Hasta $1.500.000',
            description: 'Respaldo con aportes y ahorros vigentes, además de la capacidad de pago del asociado.',
          },
          {
            label: 'Condición general',
            title: 'Buen comportamiento',
            description: 'Las renovaciones, aumentos de cupo o reutilizaciones dependen del comportamiento de pago y la disponibilidad de recursos.',
          },
        ],
      }}
      cta={{
        eyebrow: 'Siguiente paso',
        title: '¿Necesitas liquidez inmediata?',
        description:
          'Solicita la activación o desembolso de tu FONAROTATIVO directamente por WhatsApp o explora otras opciones.',
        primary: { href: '/creditos', label: 'Ver más líneas' },
        secondary: { href: WHATSAPP_URL, label: 'Solicitar por WhatsApp' },
      }}
    />
  );
}
