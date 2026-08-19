import { Banknote, CalendarRange, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import CreditLinePageTemplate from '../components/CreditLinePageTemplate';
import { getCreditLineBySlug } from '../data/creditLines';
import { fonalibreStyles } from '../styles/creditPageStyles';
import { WHATSAPP_URL } from '../../../data/siteConfig';

const usageItems = [
  'Adquisición de bienes y servicios.',
  'Consolidación de obligaciones.',
  'Adecuaciones locativas.',
  'Gastos personales.',
  'Apoyo familiar.',
  'Cualquier otra necesidad lícita.',
];

const amountRows = [
  {
    tier: 'Hasta 5 SMMLV',
    amount: '0.5 – 5 SMMLV',
    description: 'Sujeto a capacidad de pago y consulta de riesgo cuando corresponda.',
  },
  {
    tier: 'Más de 5 hasta 10 SMMLV',
    amount: '>5 – 10 SMMLV',
    description: 'El codeudor o deudor solidario debe acreditar capacidad de pago.',
  },
];

const rateRows = [
  { term: '1 – 18 meses', ea: '18.16%', na: '16.80%', monthly: '1.4%' },
  { term: '19 – 24 meses', ea: '19.56%', na: '18.00%', monthly: '1.5%' },
  { term: '25 – 36 meses', ea: '20.98%', na: '19.20%', monthly: '1.6%' },
  { term: '37 – 48 meses', ea: '22.42%', na: '20.40%', monthly: '1.7%' },
  { term: '49 – 60 meses', ea: '23.87%', na: '21.60%', monthly: '1.8%' },
];

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-emerald-950 via-emerald-900 to-slate-950 py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(167,243,208,0.18),transparent_55%),linear-gradient(135deg,rgba(2,44,34,0.96),rgba(3,24,18,0.98))]" />
      <div className="container-page relative z-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/8 p-6 text-white shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-emerald-200">
            <Sparkles size={14} aria-hidden="true" />
            Próximamente
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">{title}</h1>

          <p className="mt-4 max-w-2xl text-white/80">
            Esta línea todavía no tiene su ficha completa publicada.
          </p>

          <div className="mt-8">
            <Link
              to="/creditos"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-300 px-5 py-3 font-bold text-emerald-950 transition hover:-translate-y-0.5 hover:bg-white focus-ring"
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
  const { slug } = useParams();
  const line = getCreditLineBySlug(slug);

  if (!line) {
    return <ComingSoon title="Línea de crédito no encontrada" />;
  }

  if (line.slug !== 'fonalibre') {
    return <ComingSoon title={line.name} />;
  }

  return (
    <CreditLinePageTemplate
      theme={fonalibreStyles}
      hero={{
        image: '/images/fonalibre.png',
        eyebrow: 'Línea de crédito',
        title: line.name,
        description:
          'Línea de crédito destinada a atender necesidades de libre inversión del asociado, orientadas al mejoramiento de su calidad de vida y la de su grupo familiar.',
        chips: ['Libre inversión', 'Hasta 10 SMMLV', 'Hasta 48 meses*'],
        stats: [
          { icon: Banknote, label: 'Monto', value: '0.5 a 10 SMMLV' },
          { icon: CalendarRange, label: 'Plazo', value: 'Hasta 48 meses*' },
          { icon: Banknote, label: 'Amortización', value: 'Mensual' },
          { icon: ShieldCheck, label: 'Garantía', value: 'Aportes y ahorros' },
        ],
      }}
      overview={{
        eyebrow: '¿Qué es?',
        title: 'Libre inversión para mejorar tu calidad de vida',
        description:
          'FONALIBRE está pensado para atender necesidades personales y familiares con un enfoque flexible, sujeto a capacidad de pago, consulta de riesgo cuando corresponda y las garantías requeridas.',
        itemsTitle: '¿Para qué se puede utilizar?',
        items: usageItems,
        sideEyebrow: 'Condiciones clave',
        sideCards: [
          { label: 'Amortización capital', value: 'Mensual' },
          { label: 'Amortización intereses', value: 'Mensual' },
          { label: 'Destino', value: 'Necesidades de libre inversión' },
        ],
        sideNote:
          'No se exige soporte específico del destino, salvo que FONASIN lo requiera por razones de riesgo, control o trazabilidad.',
      }}
      amounts={{
        eyebrow: 'Monto y garantías',
        title: 'Garantía según el monto solicitado',
        subtitle: 'Condiciones establecidas para FONALIBRE',
        rows: amountRows,
        note:
          'El monto está sujeto a capacidad de pago y a consulta de riesgo cuando corresponda.',
      }}
      rates={{
        eyebrow: 'Plazos y tasas',
        title: 'Escala de plazo y tasa',
        badge: 'Desde 1.4% mensual',
        rows: rateRows,
        noteTitle: 'Importante',
        note:
          'El plazo máximo para las líneas de crédito es de 48 meses. Excepcionalmente, los créditos por valor de 10 SMMLV pueden otorgarse hasta 60 meses, de acuerdo con las condiciones financieras y previa aprobación de la instancia competente.',
      }}
      summary={{
        eyebrow: 'Garantías',
        title: 'Resumen de respaldo del crédito',
        cards: [
          {
            label: 'Hasta 5 SMMLV',
            title: 'Aportes y ahorros',
            description: 'Sujeto a capacidad de pago y consulta de riesgo cuando corresponda.',
          },
          {
            label: 'Más de 5 hasta 10 SMMLV',
            title: 'Aportes + ahorros + codeudor',
            description: 'Puede ser codeudor o deudor solidario y debe acreditar capacidad de pago.',
          },
          {
            label: 'Condición general',
            title: 'Sujeto a capacidad de pago',
            description: 'Las condiciones del crédito están sujetas a las políticas y validaciones correspondientes de FONASIN.',
          },
        ],
      }}
      cta={{
        eyebrow: 'Siguiente paso',
        title: '¿Este crédito se ajusta a lo que necesitas?',
        description:
          'Puedes volver al listado de créditos o escribirnos por WhatsApp para recibir orientación sobre la línea que mejor se ajuste a tu caso.',
        primary: { href: '/creditos', label: 'Ver más líneas' },
        secondary: { href: WHATSAPP_URL, label: 'Consultar por WhatsApp' },
      }}
    />
  );
}
