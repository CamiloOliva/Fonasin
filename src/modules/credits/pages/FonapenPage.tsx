import { Banknote, CalendarRange, Coins, ShieldCheck, Sparkles } from 'lucide-react';
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
          'Línea orientada a asociados pensionados, destinada a financiar necesidades de libre destinación y apoyo económico, sujeta a evaluación de capacidad de pago, nivel de endeudamiento, fuente de pensión y políticas de riesgo definidas por FONASIN.',
        chips: ['Mesada pensional', 'Hasta 10 SMMLV', 'Hasta 60 meses'],
        stats: [
          { icon: Coins, label: 'Monto máximo', value: 'Hasta 10 SMMLV' },
          { icon: CalendarRange, label: 'Plazo máximo', value: 'Hasta 60 meses' },
          { icon: Banknote, label: 'Amortización', value: 'Cuota fija mensual' },
          { icon: ShieldCheck, label: 'Garantía', value: 'Pagaré + libranza o autorización de descuento' },
        ],
      }}
      overview={{
        eyebrow: '¿Qué es?',
        title: 'Tranquilidad y respaldo para disfrutar tu retiro laboral',
        description:
          'FONAPEN está diseñada para brindar apoyo financiero a los asociados en etapa de jubilación o pensión, con descuento por la fuente de pago que corresponda y análisis de riesgo acorde con la capacidad real del pensionado.',
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
          { label: 'Beneficiarios', value: 'Asociados pensionados' },
          { label: 'Forma de pago', value: 'Deducción por mesada pensional' },
          { label: 'Evaluación', value: 'Capacidad de pago, edad y asegurabilidad' },
        ],
        sideNote:
          'Sujeto al cupo de endeudamiento disponible y a la capacidad legal de afectación sobre la mesada pensional del asociado.',
      }}
      amounts={{
        eyebrow: 'Cupos de financiación',
        title: 'Monto máximo según aportes y ahorros',
        subtitle: 'Condiciones oficiales FONAPEN',
        rows: [
          {
            tier: 'Hasta el valor de aportes y ahorros',
            amount: 'Según saldo disponible',
            description: 'Sujeto a capacidad de pago y fuente de pensión.',
          },
          {
            tier: 'Doble de aportes y ahorros hasta 10 SMMLV',
            amount: 'Hasta 10 SMMLV',
            description: 'Aportes, ahorros y un codeudor o garantía adicional según el perfil de riesgo.',
          },
        ],
        note:
          'El monto definitivo dependerá de la capacidad de pago libre en tu comprobante de pensión, de la fuente de pago y de tu historial crediticio dentro de la entidad.',
      }}
      rates={{
        eyebrow: 'Plazos y tasas',
        title: 'Tasas de interés preferenciales',
        badge: 'Desde 1.4% mensual',
        noteTitle: 'Importante',
        rows: [
          { term: '01 - 18 meses', ea: '18.16%', na: '16.80%', monthly: '1.4%' },
          { term: '19 - 24 meses', ea: '19.56%', na: '18.00%', monthly: '1.5%' },
          { term: '25 - 36 meses', ea: '20.98%', na: '19.20%', monthly: '1.6%' },
          { term: '37 - 48 meses', ea: '22.42%', na: '20.40%', monthly: '1.7%' },
          { term: '49 - 60 meses', ea: '23.87%', na: '21.60%', monthly: '1.8%' },
        ],
        note:
          'Solo los créditos de 10 SMMLV podrán tener un plazo de 60 meses, a la tasa estipulada en las condiciones financieras. La edad, asegurabilidad y estabilidad de la fuente de pago deberán hacer parte del análisis de riesgo.',
      }}
      summary={{
        eyebrow: 'Garantías y requisitos',
        title: 'Resumen de respaldo del crédito',
        cards: [
          {
            label: 'Documentación requerida',
            title: 'Soporte de pensión',
            description: 'Soporte de pensión o desprendible de pago de mesada pensional.',
          },
          {
            label: 'Garantía del crédito',
            title: 'Pagaré y libranza',
            description: 'Firma de pagaré con cartas de instrucciones y autorización de descuento sobre la mesada cuando aplique.',
          },
          {
            label: 'Evaluación de riesgo',
            title: 'Fuente y asegurabilidad',
            description: 'La edad, la asegurabilidad y la estabilidad de la fuente de pago forman parte del estudio.',
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
