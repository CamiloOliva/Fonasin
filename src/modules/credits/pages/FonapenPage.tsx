import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CalendarRange,
  Check,
  Coins,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { WHATSAPP_URL } from '../../../data/siteConfig';
import { getCreditLineBySlug } from '../data/creditLines';

const usageItems = [
  'Libre inversión y gastos personales para el bienestar del pensionado.',
  'Sostenimiento familiar y mejora de la calidad de vida.',
  'Atención de compromisos de salud, tratamientos o medicamentos.',
  'Adecuaciones o remodelaciones del hogar.',
  'Viajes, recreación, descanso y tiempo de ocio.',
  'Consolidación o pago de deudas en condiciones ventajosas.',
];

const amountRows = [
  {
    tier: 'Hasta 2 SMMLV de pensión',
    amount: 'Hasta $15.000.000',
    description:
      'Monto máximo otorgado a asociados con mesada pensional de hasta 2 SMMLV.',
  },
  {
    tier: 'De 2 a 4 SMMLV de pensión',
    amount: 'Hasta $25.000.000',
    description:
      'Monto otorgado para asociados con mesada pensional entre 2 y 4 SMMLV.',
  },
  {
    tier: 'Más de 4 SMMLV de pensión',
    amount: 'Hasta $40.000.000',
    description:
      'Aplica para asociados con mesadas superiores a 4 SMMLV según capacidad de pago.',
  },
];

const rateRows = [
  {
    term: '1 – 24 meses',
    ea: '16.80%',
    na: '15.60%',
    monthly: '1.3%',
  },
  {
    term: '25 – 48 meses',
    ea: '18.16%',
    na: '16.80%',
    monthly: '1.4%',
  },
  {
    term: '49 – 72 meses',
    ea: '19.56%',
    na: '18.00%',
    monthly: '1.5%',
  },
];

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-100 via-gray-100 to-slate-200 py-10 sm:py-14">
      <div className="container-page relative z-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-slate-300 bg-white/80 p-6 text-slate-800 shadow-xl backdrop-blur-md sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-200/80 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-slate-700">
            <Sparkles size={14} aria-hidden="true" />
            Próximamente
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            Esta línea todavía no tiene su ficha completa publicada.
          </p>

          <div className="mt-8">
            <Link
              to="/creditos"
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 px-5 py-3 font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-900 focus-ring"
            >
              <ArrowLeft size={18} aria-hidden="true" />
              Volver a créditos
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreditLinePage() {
  const line = getCreditLineBySlug('fonapen');

  if (!line) {
    return <ComingSoon title="Línea de crédito no encontrada" />;
  }

  if (line.slug !== 'fonapen') {
    return <ComingSoon title={line.name} />;
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-slate-200/90 via-slate-100/85 to-slate-300/80 py-6 sm:py-10">
      {/* =========================================================
          FONDO GENERAL (GRIS PLATINADO / SUAVE Y ELEGANTE)
      ========================================================== */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(226,232,240,0.95),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(148,163,184,0.34),transparent_50%)]" />

      <div className="container-page relative z-10">

        {/* =========================================================
            HERO
        ========================================================== */}
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-300/80 bg-gradient-to-r from-slate-800 via-slate-700 to-zinc-800 text-white shadow-2xl shadow-slate-900/10">

          {/* Imagen de fondo sutil */}
          <div className="absolute inset-0 opacity-35 mix-blend-soft-light">
            <img
              src="/images/fonapen.png"
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(15,23,42,0.72)_0%,rgba(15,23,42,0.5)_38%,rgba(78, 80, 87, 0.88)_100%)]" />

          {/* Destello Plateado / Brillo de Seda */}
          <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-slate-400/20 blur-3xl" />

          <div className="relative p-6 sm:p-8 lg:p-10">

            {/* Volver */}
            <Link
              to="/creditos"
              className="inline-flex items-center gap-2 rounded-full border border-slate-400/30 bg-white/10 px-4 py-2 text-sm font-bold text-slate-100 transition hover:bg-white/20 focus-ring"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Volver a créditos
            </Link>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">

              {/* Información principal */}
              <div className="max-w-3xl">

                <span className="inline-flex items-center gap-2 rounded-full border border-slate-300/30 bg-slate-100/15 px-3.5 py-1.5 text-xs font-black uppercase tracking-[.18em] text-slate-200 shadow-sm">
                  <HeartHandshake size={14} aria-hidden="true" />
                  Línea especial para pensionados
                </span>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-50 sm:text-5xl lg:text-6xl drop-shadow-sm">
                  {line.name}
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200/90 sm:text-lg sm:leading-8 font-medium">
                  Crédito preferencial diseñado para asociados pensionados, ofreciendo liquidez financiera, tasas especiales y cómodos plazos con deducción directa de su mesada pensional.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-400/20 bg-slate-900/40 px-3.5 py-1.5 text-xs font-bold text-slate-200">
                    Deducción por mesada
                  </span>

                  <span className="rounded-full border border-slate-400/20 bg-slate-900/40 px-3.5 py-1.5 text-xs font-bold text-slate-200">
                    Hasta $40.000.000
                  </span>

                  <span className="rounded-full border border-slate-400/20 bg-slate-900/40 px-3.5 py-1.5 text-xs font-bold text-slate-200">
                    Hasta 72 meses
                  </span>
                </div>
              </div>

              {/* =====================================================
                  TARJETAS DESTACADAS EN HERO
              ====================================================== */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">

                {/* Monto */}
                <div className="rounded-2xl border border-slate-500/30 bg-slate-900/40 p-4 shadow-sm backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-900 font-black shadow-md">
                      <Coins size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">
                        Monto máximo
                      </p>

                      <p className="mt-0.5 text-base font-black text-slate-100">
                        Hasta $40.000.000
                      </p>
                    </div>
                  </div>
                </div>

                {/* Plazo */}
                <div className="rounded-2xl border border-slate-500/30 bg-slate-900/40 p-4 shadow-sm backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-900 shadow-sm">
                      <CalendarRange size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">
                        Plazo máximo
                      </p>

                      <p className="mt-0.5 text-base font-black text-slate-100">
                        Hasta 72 meses
                      </p>
                    </div>
                  </div>
                </div>

                {/* Modalidad de pago */}
                <div className="rounded-2xl border border-slate-500/30 bg-slate-900/40 p-4 shadow-sm backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-900 shadow-sm">
                      <Banknote size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">
                        Amortización
                      </p>

                      <p className="mt-0.5 text-base font-black text-slate-100">
                        Cuota fija mensual
                      </p>
                    </div>
                  </div>
                </div>

                {/* Garantía */}
                <div className="rounded-2xl border border-slate-500/30 bg-slate-900/40 p-4 shadow-sm backdrop-blur-md sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-900 shadow-sm">
                      <ShieldCheck size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-slate-400">
                        Garantía
                      </p>

                      <p className="mt-0.5 text-base font-black text-slate-100">
                        Pagaré + Libranza / Mesada pensional
                      </p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* =========================================================
            ¿QUÉ ES? + CONDICIONES CLAVE
        ========================================================== */}
        <section className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,1.9fr)_minmax(280px,0.8fr)]">

          {/* ¿Qué es? */}
          <article className="rounded-[1.75rem] border border-slate-300/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-7">

            <p className="text-sm font-black uppercase tracking-[.18em] text-slate-600">
              ¿Qué es?
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Tranquilidad y respaldo para disfrutar tu retiro laboral
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              FONAPEN es una línea de crédito preferencial enfocada exclusivamente en brindar apoyo financiero, estabilidad y bienestar a los asociados en etapa de jubilación o pensión. Su descuento por libranza o débito automático garantiza una gestión sin complicaciones ni desplazamientos.
            </p>

            {/* Destinos */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {usageItems.map((item) => (
                <div
                  key={item}
                  className="flex min-h-[70px] items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm font-semibold leading-6 text-slate-800"
                >
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-200 text-slate-800 shadow-sm">
                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          {/* Condiciones clave */}
          <aside className="rounded-[1.75rem] border border-slate-400/40 bg-gradient-to-br from-slate-700 via-slate-800 to-zinc-800 p-6 text-white shadow-xl shadow-slate-900/10 sm:p-7">

            <p className="text-sm font-black uppercase tracking-[.18em] text-slate-300">
              Atención preferencial
            </p>

            <div className="mt-5 space-y-3">

              <div className="rounded-2xl border border-slate-500/30 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-black uppercase tracking-[.16em] text-slate-300">
                  Beneficiarios
                </p>

                <p className="mt-1 text-base font-extrabold text-white">
                  Asociados Pensionados
                </p>
              </div>

              <div className="rounded-2xl border border-slate-500/30 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-black uppercase tracking-[.16em] text-slate-300">
                  Forma de pago
                </p>

                <p className="mt-1 text-base font-extrabold text-white">
                  Deducción de mesada pensional
                </p>
              </div>

              <div className="rounded-2xl border border-slate-500/30 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-black uppercase tracking-[.16em] text-slate-300">
                  Agilidad
                </p>

                <p className="mt-1 text-sm font-bold leading-6 text-white">
                  Trámite ágil y acompañamiento personalizado
                </p>
              </div>

            </div>

            <div className="mt-5 rounded-2xl border border-slate-500/30 bg-slate-950/30 p-4">
              <p className="text-xs leading-5 text-slate-300 font-medium">
                Sujeto al cupo de endeudamiento disponible y a la capacidad legal de afectación sobre la mesada pensional del asociado.
              </p>
            </div>
          </aside>
        </section>

        {/* =========================================================
            MONTOS SEGÚN MESADA PENSIONAL
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-slate-300/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-7">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-slate-600">
                  Cupos de financiación
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                  Monto máximo asignado según mesada pensional
                </h2>
              </div>

              <p className="text-sm font-medium text-slate-500">
                Condiciones oficiales FONAPEN
              </p>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">

              {amountRows.map((row) => (
                <div
                  key={row.tier}
                  className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100/50 p-5"
                >
                  {/* Borde superior decorativo */}
                  <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-slate-400 via-slate-600 to-slate-800" />

                  <div className="flex items-start justify-between gap-4 mt-1">

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.16em] text-slate-600">
                        {row.tier}
                      </p>

                      <p className="mt-2 text-2xl font-black text-slate-900">
                        {row.amount}
                      </p>
                    </div>

                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-200 text-slate-800 shadow-sm">
                      <UserCheck size={20} aria-hidden="true" />
                    </span>

                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

                    <p className="text-xs font-black uppercase tracking-[.15em] text-slate-500">
                      Detalle del cupo
                    </p>

                    <p className="mt-1.5 text-xs font-medium leading-5 text-slate-600">
                      {row.description}
                    </p>

                  </div>
                </div>
              ))}

            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-slate-600"
                aria-hidden="true"
              />

              <p className="text-sm font-medium leading-6 text-slate-700">
                El monto definitivo dependerá de la capacidad de pago libre en tu comprobante de pago de pensión y de tu historial crediticio dentro de la entidad.
              </p>

            </div>
          </article>
        </section>

        {/* =========================================================
            PLAZOS Y TASAS
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-slate-300/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-7">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-slate-600">
                  Plazos y tasas
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                  Tasas de interés preferenciales
                </h2>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-extrabold text-slate-800 shadow-sm">
                <Banknote size={16} aria-hidden="true" />
                Desde 1.3% mensual
              </div>

            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">

              <div className="overflow-x-auto">

                <table className="min-w-[680px] w-full text-left text-sm">

                  <thead className="bg-slate-100 text-xs font-black uppercase tracking-[.14em] text-slate-600">

                    <tr>
                      <th className="px-4 py-3.5">
                        Plazo
                      </th>

                      <th className="px-4 py-3.5">
                        Tasa E.A.
                      </th>

                      <th className="px-4 py-3.5">
                        Tasa N.A.
                      </th>

                      <th className="bg-slate-200/80 px-4 py-3.5 text-slate-900">
                        Tasa mensual efectiva
                      </th>
                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-100 bg-white">

                    {rateRows.map((row) => (
                      <tr
                        key={row.term}
                        className="text-slate-700 transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {row.term}
                        </td>

                        <td className="px-4 py-3.5 font-medium">
                          {row.ea}
                        </td>

                        <td className="px-4 py-3.5 font-medium">
                          {row.na}
                        </td>

                        <td className="bg-slate-50 px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-slate-800 px-3.5 py-1 font-black text-slate-100 shadow-sm">
                            {row.monthly}
                          </span>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>

              </div>
            </div>

            {/* Nota de facilidades */}
            <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[auto_1fr] md:items-start">

              <span className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-black uppercase tracking-[.12em] text-slate-800 shadow-sm">
                Ventaja
              </span>

              <p className="text-sm font-medium leading-6 text-slate-700">
                <strong className="font-extrabold text-slate-900">
                  Cuota fija y descuento directo:
                </strong>{' '}
                Tu cuota se mantiene estable durante todo el plazo del crédito y se deduce mensualmente de tu paga pensional para evitar desplazamientos, colas o recargos por mora.
              </p>

            </div>

          </article>
        </section>

        {/* =========================================================
            RESUMEN FINAL DE REQUISITOS Y GARANTÍAS
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-slate-300/80 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-7">

            <div className="flex items-center gap-3">

              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-800">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-slate-600">
                  Garantías y Requisitos
                </p>

                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Resguardo e idoneidad del crédito
                </h2>
              </div>

            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">

                <p className="text-xs font-black uppercase tracking-[.15em] text-slate-500">
                  Documentación requerida
                </p>

                <p className="mt-2 text-lg font-black text-slate-900">
                  Comprobantes de pago de pensión
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Últimos 2 o 3 desprendibles de pago pensional y fotocopia de la cédula de ciudadanía del asociado.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">

                <p className="text-xs font-black uppercase tracking-[.15em] text-slate-500">
                  Garantía del crédito
                </p>

                <p className="mt-2 text-lg font-black text-slate-900">
                  Pagaré y Libranza
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Firma de pagaré con cartas de instrucciones y autorización de descuento automático sobre la mesada.
                </p>

              </div>

            </div>

          </article>
        </section>

        {/* =========================================================
            CTA FINAL
        ========================================================== */}
        <section className="mt-7 overflow-hidden rounded-[2rem] border border-slate-300/80 bg-gradient-to-r from-slate-800 via-slate-700 to-zinc-800 text-white shadow-xl shadow-slate-900/10">

          <div className="relative p-6 sm:p-8">

            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-slate-400/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <p className="text-sm font-black uppercase tracking-[.18em] text-slate-300">
                  Siguiente paso
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                  ¿Quieres solicitar tu línea FONAPEN?
                </h2>

                <p className="mt-2 max-w-2xl font-medium text-slate-300">
                  Comunícate con uno de nuestros asesores para brindarte asistencia personalizada en la solicitud de tu crédito.
                </p>

              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">

                <Link
                  to="/creditos"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-500/40 bg-white/10 px-5 py-3 font-bold text-white transition hover:bg-white/20 focus-ring"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  Ver más líneas
                </Link>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-5 py-3 font-bold text-slate-900 shadow-md transition hover:-translate-y-0.5 hover:bg-white focus-ring"
                >
                  <BadgeCheck size={18} aria-hidden="true" />
                  Solicitar por WhatsApp
                </a>

              </div>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
