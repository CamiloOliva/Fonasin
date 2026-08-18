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
    amount: 'Hasta $1.500.000',
    guarantee: 'Aportes y ahorros',
    description:
      'Límite según capacidad de pago y disponibilidad de cupo asignado.',
  },
];

const rateRows = [
  {
    term: '1 – 12 meses',
    ea: '18.16%',
    na: '16.80%',
    monthly: '1.4%',
  },
];

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="relative overflow-hidden bg-[#0a1d47] py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.20),transparent_55%),linear-gradient(135deg,rgba(8,20,58,0.96),rgba(6,12,36,0.98))]" />

      <div className="container-page relative z-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/8 p-6 text-white shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-sky-200">
            <Sparkles size={14} aria-hidden="true" />
            Próximamente
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-2xl text-white/80">
            Esta línea todavía no tiene su ficha completa publicada.
          </p>

          <div className="mt-8">
            <Link
              to="/creditos"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-300 px-5 py-3 font-bold text-[#0a1d47] transition hover:-translate-y-0.5 hover:bg-white focus-ring"
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
  const line = getCreditLineBySlug('fonarotativo');

  if (!line) {
    return <ComingSoon title="Línea de crédito no encontrada" />;
  }

  if (line.slug !== 'fonarotativo') {
    return <ComingSoon title={line.name} />;
  }

  return (
    <div className="relative overflow-hidden bg-[#1e3a8a] py-6 sm:py-10">
      {/* =========================================================
          FONDO GENERAL
      ========================================================== */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(191,219,254,0.20),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(56,189,248,0.18),transparent_45%),linear-gradient(135deg,rgba(12,27,74,0.96),rgba(6,12,36,0.99))]" />

      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_0_48%,rgba(125,211,252,0.10)_48%_49%,transparent_49%_100%)] [background-size:42px_42px]" />

      <div className="container-page relative z-10">

        {/* =========================================================
            HERO
        ========================================================== */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/8 text-white shadow-2xl shadow-black/20 backdrop-blur-md">

          {/* Imagen de fondo */}
          <div className="absolute inset-0 opacity-35">
            <img
              src="/images/fonarotativo.png"
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(6,18,54,0.98)_0%,rgba(12,41,100,0.88)_48%,rgba(32, 67, 124, 0.55)_100%)]" />

          <div className="relative p-5 sm:p-7 lg:p-9">

            {/* Volver */}
            <Link
              to="/creditos"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white/90 transition hover:bg-white/20 focus-ring"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Volver a créditos
            </Link>

            <div className="mt-7 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">

              {/* Información principal */}
              <div className="max-w-3xl">

                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[.18em] text-sky-200">
                  <Sparkles size={14} aria-hidden="true" />
                  Línea de crédito
                </span>

                <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {line.name}
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
                  Cupo de crédito rotativo de corto plazo diseñado para brindar
                  liquidez inmediata frente a imprevistos o gastos emergentes del asociado.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                    Liquidez inmediata
                  </span>

                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                    Hasta $1.500.000
                  </span>

                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                    Hasta 12 meses
                  </span>
                </div>
              </div>

              {/* =====================================================
                  INFORMACIÓN DESTACADA
              ====================================================== */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">

                {/* Monto */}
                <div className="rounded-2xl border border-white/15 bg-black/20 p-4 shadow-lg shadow-black/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-300 text-[#0a1d47]">
                      <Banknote size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-white/55">
                        Monto
                      </p>

                      <p className="mt-1 text-sm font-bold text-white">
                        Hasta $1.500.000
                      </p>
                    </div>
                  </div>
                </div>

                {/* Plazo */}
                <div className="rounded-2xl border border-white/15 bg-black/20 p-4 shadow-lg shadow-black/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-100 text-[#0a1d47]">
                      <CalendarRange size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-white/55">
                        Plazo
                      </p>

                      <p className="mt-1 text-sm font-bold text-white">
                        Hasta 12 meses
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amortización capital */}
                <div className="rounded-2xl border border-white/15 bg-black/20 p-4 shadow-lg shadow-black/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-100 text-[#0a1d47]">
                      <CalendarRange size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-white/55">
                        Amortización capital
                      </p>

                      <p className="mt-1 text-sm font-bold text-white">
                        Mensual
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amortización intereses */}
                <div className="rounded-2xl border border-white/15 bg-black/20 p-4 shadow-lg shadow-black/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-100 text-[#0a1d47]">
                      <Banknote size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-white/55">
                        Amortización intereses
                      </p>

                      <p className="mt-1 text-sm font-bold text-white">
                        Mensual
                      </p>
                    </div>
                  </div>
                </div>

                {/* Garantía */}
                <div className="rounded-2xl border border-white/15 bg-black/20 p-4 shadow-lg shadow-black/10 backdrop-blur-sm sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-100 text-[#0a1d47]">
                      <ShieldCheck size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-white/55">
                        Garantía
                      </p>

                      <p className="mt-1 text-sm font-bold text-white">
                        Aportes y Ahorros
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
          <article className="rounded-[1.75rem] border border-sky-200/20 bg-white/95 p-6 shadow-xl shadow-black/5 sm:p-7">

            <p className="text-sm font-black uppercase tracking-[.18em] text-sky-700">
              ¿Qué es?
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-fonasin-deep sm:text-3xl">
              Un cupo ágil para imprevistos y liquidez rápida
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              FONAROTATIVO funciona como una solución de financiamiento express para el asociado,
              permitiéndole resolver compromisos de corto plazo o emergencias con facilidad y sin trámites complejos.
            </p>

            {/* Destinos */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {usageItems.map((item) => (
                <div
                  key={item}
                  className="flex min-h-[70px] items-start gap-3 rounded-2xl border border-sky-200/20 bg-sky-50/80 p-4 text-sm font-medium leading-6 text-slate-700"
                >
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sky-100 text-sky-700">
                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          {/* Condiciones clave */}
          <aside className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,#0f172a,#172554)] p-6 text-white shadow-xl shadow-black/10 sm:p-7">

            <p className="text-sm font-black uppercase tracking-[.18em] text-sky-200">
              Condiciones clave
            </p>

            <div className="mt-5 space-y-3">

              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-xs font-black uppercase tracking-[.16em] text-white/50">
                  Amortización capital
                </p>

                <p className="mt-1 text-base font-bold text-white">
                  Mensual
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-xs font-black uppercase tracking-[.16em] text-white/50">
                  Amortización intereses
                </p>

                <p className="mt-1 text-base font-bold text-white">
                  Mensual
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/8 p-4">
                <p className="text-xs font-black uppercase tracking-[.16em] text-white/50">
                  Destino
                </p>

                <p className="mt-1 text-sm font-semibold leading-6 text-white/90">
                  Liquidez inmediata y emergencias
                </p>
              </div>

            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-sm leading-6 text-white/80">
                La disponibilidad del cupo rotativo depende de la capacidad de pago
                y del estado actual de tus aportes y ahorros en FONASIN.
              </p>
            </div>
          </aside>
        </section>

        {/* =========================================================
            MONTO Y GARANTÍAS
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-sky-200/20 bg-white/95 p-6 shadow-xl shadow-black/5 sm:p-7">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-sky-700">
                  Monto y garantías
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-fonasin-deep">
                  Garantía respaldada en tus aportes
                </h2>
              </div>

              <p className="text-sm text-slate-500">
                Condiciones establecidas para FONAROTATIVO
              </p>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-1">

              {amountRows.map((row, index) => (
                <div
                  key={row.amount}
                  className="relative overflow-hidden rounded-2xl border border-sky-200/20 bg-sky-50/70 p-5"
                >
                  {/* Indicador lateral */}
                  <div className="absolute left-0 top-0 h-full w-1 bg-sky-500" />

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.16em] text-sky-700">
                        Monto Máximo
                      </p>

                      <p className="mt-2 text-xl font-black text-fonasin-deep">
                        {row.amount}
                      </p>
                    </div>

                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-sky-700 shadow-sm">
                      <ShieldCheck size={19} aria-hidden="true" />
                    </span>

                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">

                    <p className="text-xs font-black uppercase tracking-[.15em] text-slate-400">
                      Garantía requerida
                    </p>

                    <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
                      {row.guarantee}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {row.description}
                    </p>

                  </div>
                </div>
              ))}

            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">

              <Banknote
                size={18}
                className="mt-0.5 shrink-0 text-sky-700"
                aria-hidden="true"
              />

              <p className="text-sm leading-6 text-slate-600">
                El cupo otorgado estará sujeto a tu capacidad de endeudamiento y capacidad de pago.
              </p>

            </div>
          </article>
        </section>

        {/* =========================================================
            PLAZOS Y TASAS
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-sky-200/20 bg-white/95 p-6 shadow-xl shadow-black/5 sm:p-7">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-sky-700">
                  Plazos y tasas
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-fonasin-deep">
                  Tasa y plazo del cupo rotativo
                </h2>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-100 px-4 py-2 text-sm font-bold text-sky-800">
                <Banknote size={16} aria-hidden="true" />
                1.4% mensual
              </div>

            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">

              <div className="overflow-x-auto">

                <table className="min-w-[680px] w-full text-left text-sm">

                  <thead className="bg-slate-50 text-xs font-black uppercase tracking-[.14em] text-slate-500">

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

                      <th className="bg-sky-50 px-4 py-3.5 text-sky-700">
                        Tasa mensual efectiva
                      </th>
                    </tr>

                  </thead>

                  <tbody className="divide-y divide-slate-200 bg-white">

                    {rateRows.map((row) => (
                      <tr
                        key={row.term}
                        className="text-slate-700 transition hover:bg-slate-50"
                      >
                        <td className="px-4 py-3.5 font-bold text-fonasin-deep">
                          {row.term}
                        </td>

                        <td className="px-4 py-3.5">
                          {row.ea}
                        </td>

                        <td className="px-4 py-3.5">
                          {row.na}
                        </td>

                        <td className="bg-sky-50/70 px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-sky-600 px-3 py-1 font-black text-white">
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
            <div className="mt-4 grid gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 md:grid-cols-[auto_1fr] md:items-start">

              <span className="rounded-lg bg-white px-3 py-2 text-xs font-black uppercase tracking-[.12em] text-amber-800 shadow-sm">
                Importante
              </span>

              <p className="text-sm leading-6 text-amber-900">
                <strong>
                  El plazo máximo para esta línea de crédito es de 12 meses.
                </strong>{' '}
                Al tratarse de una línea rotativa, a medida que abonas a capital vas liberando cupo para futuras utilizaciones.
              </p>

            </div>

          </article>
        </section>

        {/* =========================================================
            RESUMEN FINAL DE CONDICIONES
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-sky-200/20 bg-white/95 p-6 shadow-xl shadow-black/5 sm:p-7">

            <div className="flex items-center gap-3">

                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-100 text-sky-700">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>

              <div>
                  <p className="text-sm font-black uppercase tracking-[.18em] text-sky-700">
                  Garantías
                </p>

                <h2 className="text-2xl font-black tracking-tight text-fonasin-deep">
                  Resumen de respaldo del crédito
                </h2>
              </div>

            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <p className="text-xs font-black uppercase tracking-[.15em] text-slate-400">
                  Hasta $1.500.000
                </p>

                <p className="mt-2 text-lg font-black text-fonasin-deep">
                  Aportes y ahorros
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Respaldo automático con tus ahorros/aportes vigentes y capacidad de pago.
                </p>

              </div>

                <div className="rounded-2xl border border-sky-200/20 bg-sky-50/80 p-5">

                  <p className="text-xs font-black uppercase tracking-[.15em] text-sky-700">
                  Condición general
                </p>

                <p className="mt-2 text-lg font-black text-fonasin-deep">
                  Capacidad de pago
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Las condiciones del cupo están sujetas a la verificación del cupo disponible y normatividad de FONASIN.
                </p>

              </div>

            </div>

          </article>
        </section>

        {/* =========================================================
            CTA FINAL
        ========================================================== */}
        <section className="mt-7 overflow-hidden rounded-[2rem] border border-sky-200/20 bg-white/95 shadow-xl shadow-black/5">

          <div className="relative p-6 sm:p-8">

            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <p className="text-sm font-black uppercase tracking-[.18em] text-sky-700">
                  Siguiente paso
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-fonasin-deep sm:text-3xl">
                  ¿Necesitas liquidez inmediata?
                </h2>

                <p className="mt-3 max-w-2xl text-slate-600">
                  Solicita la activación o desembolso de tu FONAROTATIVO directamente por WhatsApp o explora otras opciones.
                </p>

              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">

                <Link
                  to="/creditos"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200/20 bg-white px-5 py-3 font-bold text-[#0a1d47] transition hover:-translate-y-0.5 hover:border-sky-200/35 hover:bg-sky-50 focus-ring"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  Ver más líneas
                </Link>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-300 px-5 py-3 font-bold text-[#0a1d47] transition hover:-translate-y-0.5 hover:bg-white focus-ring"
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
