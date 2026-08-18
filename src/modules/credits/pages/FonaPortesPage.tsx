import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CalendarRange,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { WHATSAPP_URL } from '../../../data/siteConfig';
import { getCreditLineBySlug } from '../data/creditLines';

/* =========================================================
   DATOS ESPECÍFICOS DE FONAPORTES (LÍNEA 10 SEGÚN EL MANUAL)
========================================================== */

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
    amount: 'Hasta el 100% de aportes y ahorros',
    guarantee: 'Aportes Sociales y Ahorros Permanentes',
    description:
      'Monto sujeto a saldos disponibles, obligaciones vigentes y reglas de compensación en FONASIN.',
  },
];

const rateRows = [
  {
    term: '1 – 18 meses',
    ea: '15.39%',
    na: '14.40%',
    monthly: '1.2%',
  },
  {
    term: '19 – 24 meses',
    ea: '16.77%',
    na: '15.60%',
    monthly: '1.3%',
  },
  {
    term: '25 – 36 meses',
    ea: '18.16%',
    na: '16.80%',
    monthly: '1.4%',
  },
  {
    term: '37 – 48 meses',
    ea: '19.56%',
    na: '18.00%',
    monthly: '1.5%',
  },
  {
    term: '49 – 60 meses',
    ea: '20.98%',
    na: '19.20%',
    monthly: '1.6%',
  },
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

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-2xl text-amber-100/80">
            Esta línea todavía no tiene su ficha completa publicada.
          </p>

          <div className="mt-8">
            <Link
              to="/creditos"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 px-5 py-3 font-bold text-slate-950 transition hover:-translate-y-0.5 hover:brightness-110 focus-ring"
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
  const line = getCreditLineBySlug('fonaportes');

  if (!line) {
    return <ComingSoon title="Línea de crédito no encontrada" />;
  }

  if (line.slug !== 'fonaportes') {
    return <ComingSoon title={line.name} />;
  }

  return (
    <div className="relative overflow-hidden bg-[#1c1708] py-6 sm:py-10">
      {/* =========================================================
          FONDO GENERAL EN DORADO CLARO Y LUMINOSO
      ========================================================== */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(254,240,138,0.22),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(253,224,71,0.18),transparent_48%),linear-gradient(135deg,rgba(31,25,8,0.98),rgba(12,9,2,0.99))]" />

      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_0_48%,rgba(254,240,138,0.2)_48%_49%,transparent_49%_100%)] [background-size:42px_42px]" />

      <div className="container-page relative z-10">

        {/* =========================================================
            HERO DEDICADO A FONAPORTES (DORADO CLARO / CHAMPAGNE)
        ========================================================== */}
        <section className="relative overflow-hidden rounded-[2rem] border border-amber-200/40 bg-amber-950/20 text-white shadow-2xl shadow-black/40 backdrop-blur-md">

          {/* Imagen de fondo */}
          <div className="absolute inset-0 opacity-20">
            <img
              src="/images/fonaportes.png"
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Overlay Dorado Claro Suave */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(22,17,4,0.98)_0%,rgba(80, 66, 30, 0.9)_48%,rgba(146, 127, 70, 0.55)_100%)]" />

          <div className="relative p-5 sm:p-7 lg:p-9">

            {/* Volver */}
            <Link
              to="/creditos"
              className="inline-flex items-center gap-2 rounded-full border border-amber-200/40 bg-amber-200/10 px-4 py-2 text-sm font-bold text-yellow-100 transition hover:bg-amber-200/25 hover:text-white focus-ring"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Volver a créditos
            </Link>

            <div className="mt-7 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">

              {/* Información principal */}
              <div className="max-w-3xl">

                <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/40 bg-gradient-to-r from-amber-300/20 to-yellow-200/20 px-3.5 py-1.5 text-xs font-black uppercase tracking-[.18em] text-yellow-200 shadow-sm">
                  <Sparkles size={14} aria-hidden="true" className="text-yellow-300" />
                  Línea de crédito
                </span>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-50 via-yellow-100 to-amber-200 sm:text-5xl lg:text-6xl">
                  {line.name}
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-amber-100/90 sm:text-lg sm:leading-8">
                  Financiación respaldada directamente en tus aportes sociales y ahorros permanentes, 
                  diseñada para cubrir necesidades personales con excelentes condiciones financieras.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1.5 text-xs font-bold text-yellow-100">
                    Garantía de Aportes
                  </span>

                  <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1.5 text-xs font-bold text-yellow-100">
                    Desde 1.2% Mensual
                  </span>

                  <span className="rounded-full border border-amber-200/30 bg-amber-200/10 px-3 py-1.5 text-xs font-bold text-yellow-100">
                    Hasta 60 meses
                  </span>
                </div>
              </div>

              {/* =====================================================
                  INFORMACIÓN DESTACADA
              ====================================================== */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">

                {/* Monto */}
                <div className="rounded-2xl border border-amber-200/30 bg-black/40 p-4 shadow-lg shadow-black/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-100 to-yellow-300 text-slate-950 font-bold shadow-md">
                      <Banknote size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-yellow-200/80">
                        Monto Máximo
                      </p>

                      <p className="mt-1 text-sm font-bold text-amber-50">
                        Hasta el valor de tus Aportes y Ahorros
                      </p>
                    </div>
                  </div>
                </div>

                {/* Plazo */}
                <div className="rounded-2xl border border-amber-200/30 bg-black/40 p-4 shadow-lg shadow-black/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-yellow-100 text-amber-950 shadow-md">
                      <CalendarRange size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-yellow-200/80">
                        Plazo
                      </p>

                      <p className="mt-1 text-sm font-bold text-amber-50">
                        Hasta 60 meses
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amortización capital */}
                <div className="rounded-2xl border border-amber-200/30 bg-black/40 p-4 shadow-lg shadow-black/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-yellow-100 text-amber-950 shadow-md">
                      <CalendarRange size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-yellow-200/80">
                        Amortización capital
                      </p>

                      <p className="mt-1 text-sm font-bold text-amber-50">
                        Mensual
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amortización intereses */}
                <div className="rounded-2xl border border-amber-200/30 bg-black/40 p-4 shadow-lg shadow-black/20 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-yellow-100 text-amber-950 shadow-md">
                      <Banknote size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-yellow-200/80">
                        Amortización intereses
                      </p>

                      <p className="mt-1 text-sm font-bold text-amber-50">
                        Mensual
                      </p>
                    </div>
                  </div>
                </div>

                {/* Garantía */}
                <div className="rounded-2xl border border-amber-200/30 bg-black/40 p-4 shadow-lg shadow-black/20 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-yellow-100 text-amber-950 shadow-md">
                      <ShieldCheck size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-yellow-200/80">
                        Garantía Mínima
                      </p>

                      <p className="mt-1 text-sm font-bold text-amber-50">
                        Aportes y Ahorros Permanentes
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
          <article className="rounded-[1.75rem] border border-amber-200/60 bg-white/95 p-6 shadow-xl shadow-black/5 sm:p-7">

            <p className="text-sm font-black uppercase tracking-[.18em] text-amber-800">
              ¿Qué es FONAPORTES?
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Financiación sólida garantizada con tus propios ahorros
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              FONAPORTES te permite acceder a créditos aprovechando el respaldo de tus aportes sociales y ahorros acumulados en FONASIN, brindándote una alternativa de financiación ágil con bajas tasas de interés y amplia flexibilidad.
            </p>

            {/* Destinos */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {usageItems.map((item) => (
                <div
                  key={item}
                  className="flex min-h-[70px] items-start gap-3 rounded-2xl border border-yellow-200/80 bg-gradient-to-b from-yellow-50/70 to-amber-50/40 p-4 text-sm font-medium leading-6 text-slate-800"
                >
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-to-r from-amber-200 to-yellow-300 text-amber-950 shadow-sm">
                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          {/* Condiciones clave */}
          <aside className="rounded-[1.75rem] border border-amber-200/30 bg-[linear-gradient(180deg,#241e0a,#140f03)] p-6 text-white shadow-xl shadow-black/20 sm:p-7">

            <p className="text-sm font-black uppercase tracking-[.18em] text-yellow-200">
              Condiciones clave
            </p>

            <div className="mt-5 space-y-3">

              <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 p-4">
                <p className="text-xs font-black uppercase tracking-[.16em] text-yellow-100/70">
                  Amortización capital
                </p>

                <p className="mt-1 text-base font-bold text-amber-100">
                  Mensual
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 p-4">
                <p className="text-xs font-black uppercase tracking-[.16em] text-yellow-100/70">
                  Amortización intereses
                </p>

                <p className="mt-1 text-base font-bold text-amber-100">
                  Mensual
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200/20 bg-amber-200/10 p-4">
                <p className="text-xs font-black uppercase tracking-[.16em] text-yellow-100/70">
                  Destino
                </p>

                <p className="mt-1 text-sm font-semibold leading-6 text-amber-100/90">
                  Necesidades personales, familiares y liquidez general.
                </p>
              </div>

            </div>

            <div className="mt-5 rounded-2xl border border-amber-200/30 bg-gradient-to-r from-amber-300/15 to-yellow-200/15 p-4">
              <p className="text-sm leading-6 text-amber-100">
                <strong className="text-yellow-200">Sin consulta a centrales de riesgo:</strong> Cuando el monto solicitado es menor o igual al acumulado en aportes y ahorros permanentes, no se consulta centrales de riesgo.
              </p>
            </div>
          </aside>
        </section>

        {/* =========================================================
            MONTO Y GARANTÍAS
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-amber-200/60 bg-white/95 p-6 shadow-xl shadow-black/5 sm:p-7">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-amber-800">
                  Monto y garantías
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                  Garantías respaldadas en tu patrimonio en el Fondo
                </h2>
              </div>

              <p className="text-sm text-slate-500">
                Condiciones oficiales del Manual FONAPORTES
              </p>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-1">

              {amountRows.map((row) => (
                <div
                  key={row.amount}
                  className="relative overflow-hidden rounded-2xl border border-amber-200/60 bg-yellow-50/40 p-5"
                >
                  {/* Indicador lateral Dorado Claro */}
                  <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-amber-200 via-yellow-300 to-amber-400" />

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.16em] text-amber-900">
                        Monto Máximo
                      </p>

                      <p className="mt-2 text-xl font-black text-amber-950">
                        {row.amount}
                      </p>
                    </div>

                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-200 to-yellow-300 text-slate-950 shadow-sm">
                      <ShieldCheck size={19} aria-hidden="true" />
                    </span>

                  </div>

                  <div className="mt-5 rounded-xl border border-yellow-200/80 bg-white p-4 shadow-sm">

                    <p className="text-xs font-black uppercase tracking-[.15em] text-amber-800">
                      Garantía requerida
                    </p>

                    <p className="mt-1 text-sm font-bold leading-6 text-slate-900">
                      {row.guarantee}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {row.description}
                    </p>

                  </div>
                </div>
              ))}

            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200/60 bg-amber-50/40 p-4">

              <Banknote
                size={18}
                className="mt-0.5 shrink-0 text-amber-700"
                aria-hidden="true"
              />

              <p className="text-sm leading-6 text-slate-600">
                El monto aprobado estará sujeto al saldo disponible de tus aportes, deduciendo obligaciones previas y respetando tu capacidad de pago.
              </p>

            </div>
          </article>
        </section>

        {/* =========================================================
            PLAZOS Y TASAS
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-amber-200/60 bg-white/95 p-6 shadow-xl shadow-black/5 sm:p-7">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-amber-800">
                  Plazos y tasas
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                  Tabla de Tasas según el Plazo del Crédito
                </h2>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-yellow-300/60 bg-gradient-to-r from-yellow-50 to-amber-100 px-4 py-2 text-sm font-bold text-amber-950 shadow-sm">
                <Banknote size={16} aria-hidden="true" className="text-amber-800" />
                Desde 1.2% mensual
              </div>

            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-amber-200/80">

              <div className="overflow-x-auto">

                <table className="min-w-[680px] w-full text-left text-sm">

                  <thead className="bg-gradient-to-r from-amber-100/60 to-yellow-100/60 text-xs font-black uppercase tracking-[.14em] text-amber-950">

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

                      <th className="bg-amber-100/80 px-4 py-3.5 text-amber-950">
                        Tasa mensual efectiva
                      </th>
                    </tr>

                  </thead>

                  <tbody className="divide-y divide-amber-100 bg-white">

                    {rateRows.map((row) => (
                      <tr
                        key={row.term}
                        className="text-slate-700 transition hover:bg-yellow-50/50"
                      >
                        <td className="px-4 py-3.5 font-bold text-slate-900">
                          {row.term}
                        </td>

                        <td className="px-4 py-3.5">
                          {row.ea}
                        </td>

                        <td className="px-4 py-3.5">
                          {row.na}
                        </td>

                        <td className="bg-amber-50/60 px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 px-3 py-1 font-black text-slate-950 shadow-sm">
                            {row.monthly}
                          </span>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>

              </div>
            </div>

            {/* Condición especial */}
            <div className="mt-4 grid gap-3 rounded-2xl border border-yellow-300/80 bg-amber-50/60 p-4 md:grid-cols-[auto_1fr] md:items-start">

              <span className="rounded-lg bg-gradient-to-r from-amber-200 to-yellow-300 px-3 py-2 text-xs font-black uppercase tracking-[.12em] text-slate-950 shadow-sm">
                Nota de Evaluación
              </span>

              <p className="text-sm leading-6 text-slate-800">
                <strong>Plazos superiores a 48 meses:</strong> Deberán ser validados frente al monto solicitado, la capacidad de pago y las políticas internas de gestión de riesgo de FONASIN.
              </p>

            </div>

          </article>
        </section>

        {/* =========================================================
            RESUMEN FINAL DE CONDICIONES
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-amber-200/60 bg-white/95 p-6 shadow-xl shadow-black/5 sm:p-7">

            <div className="flex items-center gap-3">

              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-200 to-yellow-300 text-slate-950 shadow-md">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-amber-800">
                  Garantías
                </p>

                <h2 className="text-2xl font-black tracking-tight text-slate-900">
                  Resumen de respaldo del crédito
                </h2>
              </div>

            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <p className="text-xs font-black uppercase tracking-[.15em] text-slate-400">
                  Respaldo directo
                </p>

                <p className="mt-2 text-lg font-black text-slate-900">
                  Aportes y ahorros
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Tus propios aportes acumulados sirven como fuente primaria de garantía.
                </p>

              </div>

              <div className="rounded-2xl border border-amber-200/60 bg-gradient-to-br from-yellow-50/70 to-amber-50/30 p-5">

                <p className="text-xs font-black uppercase tracking-[.15em] text-amber-800">
                  Sin Trámites Complejos
                </p>

                <p className="mt-2 text-lg font-black text-slate-900">
                  Estudio Ágil
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Al estar respaldado por tu saldo disponible, el proceso de aprobación y desembolso es más rápido y sencillo.
                </p>

              </div>

            </div>

          </article>
        </section>

        {/* =========================================================
            CTA FINAL
        ========================================================== */}
        <section className="mt-7 overflow-hidden rounded-[2rem] border border-amber-200/60 bg-white/95 shadow-xl shadow-black/5">

          <div className="relative p-6 sm:p-8">

            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-yellow-200/30 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <p className="text-sm font-black uppercase tracking-[.18em] text-amber-800">
                  Siguiente paso
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                  ¿Quieres solicitar tu FONAPORTES?
                </h2>

                <p className="mt-3 max-w-2xl text-slate-600">
                  Ponte en contacto con nuestro equipo por WhatsApp para calcular tu cupo disponible según tus aportes acumulados.
                </p>

              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">

                <Link
                  to="/creditos"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-5 py-3 font-bold text-slate-900 transition hover:-translate-y-0.5 hover:bg-amber-50/50 focus-ring"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  Ver más líneas
                </Link>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 px-5 py-3 font-bold text-slate-950 shadow-md transition hover:-translate-y-0.5 hover:brightness-105 focus-ring"
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