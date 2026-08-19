import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CalendarRange,
  Check,
  Coins,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { WHATSAPP_URL } from '../../../data/siteConfig';
import { getCreditLineBySlug } from '../data/creditLines';

const usageItems = [
  'Anticipo de prima de servicios de mitad de año (junio).',
  'Anticipo de prima de servicios de fin de año (diciembre).',
  'Anticipo sobre la prima de antigüedad (enero).',
  'Gastos de temporada navideña o vacaciones.',
  'Atención de compromisos financieros de liquidez inmediata.',
  'Cualquier otra necesidad lícita respaldada por tu prima.',
];

const amountRows = [
  {
    tier: 'Hasta 2 SMMLV de sueldo',
    percentage: 'Hasta el 90%',
    description:
      'Aplica para asociados con ingresos de hasta 2 Salarios Mínimos Mensuales Legales Vigentes.',
  },
  {
    tier: 'De 2 a 3 SMMLV de sueldo',
    percentage: 'Hasta el 80%',
    description:
      'Aplica para asociados con ingresos superiores a 2 y hasta 3 SMMLV.',
  },
  {
    tier: 'De 3 a 4 SMMLV de sueldo',
    percentage: 'Hasta el 70%',
    description:
      'Aplica para asociados con ingresos superiores a 3 y hasta 4 SMMLV.',
  },
];

const rateRows = [
  {
    term: '1 – 6 meses',
    ea: '18.16%',
    na: '16.80%',
    monthly: '1.4%',
  },
  {
    term: '7 – 12 meses',
    ea: '19.56%',
    na: '18.00%',
    monthly: '1.5%',
  },
];

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-100/60 py-10 sm:py-14">
      <div className="container-page relative z-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-amber-300/40 bg-white/80 p-6 text-slate-800 shadow-xl backdrop-blur-md sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400 bg-yellow-300/30 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-amber-900">
            <Sparkles size={14} aria-hidden="true" />
            Próximamente
          </span>

          <h1 className="mt-5 text-4xl font-black tracking-tight text-amber-950 sm:text-5xl">
            {title}
          </h1>

          <p className="mt-4 max-w-2xl text-slate-600">
            Esta línea todavía no tiene su ficha completa publicada.
          </p>

          <div className="mt-8">
            <Link
              to="/creditos"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 font-bold text-amber-950 shadow-md transition hover:-translate-y-0.5 hover:bg-yellow-300 focus-ring"
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
  const line = getCreditLineBySlug('fonaprima');

  if (!line) {
    return <ComingSoon title="Línea de crédito no encontrada" />;
  }

  if (line.slug !== 'fonaprima') {
    return <ComingSoon title={line.name} />;
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-[#f2e9d7] via-[#faf4e7] to-[#e5d7bf] py-6 sm:py-10">
      {/* =========================================================
          FONDO GENERAL (AMARILLO BRILLANTE / DORADO ELEGANTE)
      ========================================================== */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.68),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(194,153,63,0.16),transparent_52%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[24rem] mx-auto h-[28rem] w-[96%] rounded-full bg-[radial-gradient(circle,rgba(214,158,36,0.26)_0%,rgba(245,199,71,0.16)_30%,rgba(255,237,213,0.05)_54%,transparent_74%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[20rem] bg-[linear-gradient(180deg,transparent,rgba(214,158,36,0.05)_20%,rgba(245,199,71,0.08)_52%,rgba(214,158,36,0.05)_80%,transparent)] blur-2xl" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[20rem] bg-[linear-gradient(180deg,transparent,rgba(214,158,36,0.04)_22%,rgba(245,199,71,0.08)_50%,rgba(214,158,36,0.04)_78%,transparent)] blur-2xl" />

      <div className="container-page relative z-10">

        {/* =========================================================
            HERO
        ========================================================== */}
        <section className="relative overflow-hidden rounded-[2rem] border border-yellow-300/55 bg-gradient-to-r from-[#cc941f] via-[#dfb34a] to-[#f2da8a] text-amber-950 shadow-2xl shadow-yellow-500/10">

          {/* Imagen de fondo sutil */}
          <div className="absolute inset-0 opacity-26 mix-blend-soft-light">
            <img
              src="/images/fonaprima.png"
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>

          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(110,60,18,0.16)_0%,rgba(180,123,32,0.10)_42%,rgba(255,255,255,0.06)_100%)]" />

          {/* Destello Neón/Brillo Dorado */}
          <div className="absolute -right-10 -top-10 h-72 w-72 rounded-full bg-yellow-200/22 blur-3xl" />

          <div className="relative p-6 sm:p-8 lg:p-10">

            {/* Volver */}
            <Link
              to="/creditos"
              className="inline-flex items-center gap-2 rounded-full border border-amber-950/15 bg-white/40 px-4 py-2 text-sm font-bold text-amber-950 transition hover:bg-white/60 focus-ring"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              Volver a créditos
            </Link>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">

              {/* Información principal */}
              <div className="max-w-3xl">

                <span className="inline-flex items-center gap-2 rounded-full border border-amber-950/20 bg-white/50 px-3.5 py-1.5 text-xs font-black uppercase tracking-[.18em] text-amber-950 shadow-sm">
                  <Sparkles size={14} aria-hidden="true" />
                  Línea de crédito
                </span>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-amber-950 sm:text-5xl lg:text-6xl drop-shadow-sm">
                  {line.name}
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-amber-950/90 sm:text-lg sm:leading-8 font-medium">
                  Anticipo diseñado para brindar liquidez inmediata al asociado con respaldo directo en su prima de servicios (junio/diciembre) o prima de antigüedad (enero).
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-amber-950/10 bg-white/60 px-3.5 py-1.5 text-xs font-bold text-amber-950">
                    Anticipo de prima
                  </span>

                  <span className="rounded-full border border-amber-950/10 bg-white/60 px-3.5 py-1.5 text-xs font-bold text-amber-950">
                    Hasta 90% de tu prima
                  </span>

                  <span className="rounded-full border border-amber-950/10 bg-white/60 px-3.5 py-1.5 text-xs font-bold text-amber-950">
                    Hasta 12 meses
                  </span>
                </div>
              </div>

              {/* =====================================================
                  TARJETAS DESTACADAS EN HERO
              ====================================================== */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">

                {/* Monto */}
                <div className="rounded-2xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-950 text-yellow-400 font-black shadow-md">
                      <Coins size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-amber-950/70">
                        Monto
                      </p>

                      <p className="mt-0.5 text-base font-black text-amber-950">
                        70% al 90% de la prima
                      </p>
                    </div>
                  </div>
                </div>

                {/* Plazo */}
                <div className="rounded-2xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-amber-950 shadow-sm">
                      <CalendarRange size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-amber-950/70">
                        Plazo
                      </p>

                      <p className="mt-0.5 text-base font-black text-amber-950">
                        1 a 12 meses
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amortización capital */}
                <div className="rounded-2xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-amber-950 shadow-sm">
                      <CalendarRange size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-amber-950/70">
                        Amortización capital
                      </p>

                      <p className="mt-0.5 text-base font-black text-amber-950">
                        1 solo pago al vencimiento
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amortización intereses */}
                <div className="rounded-2xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-amber-950 shadow-sm">
                      <Banknote size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-amber-950/70">
                        Amortización intereses
                      </p>

                      <p className="mt-0.5 text-base font-black text-amber-950">
                        Mensual
                      </p>
                    </div>
                  </div>
                </div>

                {/* Garantía */}
                <div className="rounded-2xl border border-white/60 bg-white/40 p-4 shadow-sm backdrop-blur-md sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-amber-950 shadow-sm">
                      <ShieldCheck size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-amber-950/70">
                        Garantía
                      </p>

                      <p className="mt-0.5 text-base font-black text-amber-950">
                        Prima de servicios o antigüedad
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
          <article className="rounded-[1.75rem] border border-amber-200/80 bg-[#fffaf0]/92 p-6 shadow-xl shadow-amber-950/5 sm:p-7">

            <p className="text-sm font-black uppercase tracking-[.18em] text-amber-700">
              ¿Qué es?
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-amber-950 sm:text-3xl">
              Anticipa el valor de tu prima antes de la fecha de pago
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-slate-700">
              FONAPRIMA te permite disfrutar del dinero de tu prima de servicios o de antigüedad de manera anticipada. Pagas los intereses mes a mes y cancelas la totalidad del capital en un único pago directo cuando recibas tu prima.
            </p>

            {/* Destinos */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {usageItems.map((item) => (
                <div
                  key={item}
                  className="flex min-h-[70px] items-start gap-3 rounded-2xl border border-yellow-200/70 bg-gradient-to-br from-amber-50/80 to-yellow-50/50 p-4 text-sm font-semibold leading-6 text-amber-950"
                >
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-yellow-400 text-amber-950 shadow-sm">
                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          {/* Condiciones clave */}
          <aside className="rounded-[1.75rem] border border-amber-300/50 bg-gradient-to-br from-[#c97f06] via-[#e09b16] to-[#d78a0d] p-6 text-white shadow-xl shadow-amber-900/10 sm:p-7">

            <p className="text-sm font-black uppercase tracking-[.18em] text-yellow-200">
              Condiciones clave
            </p>

            <div className="mt-5 space-y-3">

              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-black uppercase tracking-[.16em] text-yellow-100">
                  Amortización capital
                </p>

                <p className="mt-1 text-base font-extrabold text-white">
                  Un solo pago al vencimiento
                </p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-black uppercase tracking-[.16em] text-yellow-100">
                  Amortización intereses
                </p>

                <p className="mt-1 text-base font-extrabold text-white">
                  Mensual
                </p>
              </div>

              <div className="rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-sm">
                <p className="text-xs font-black uppercase tracking-[.16em] text-yellow-100">
                  Destino
                </p>

                <p className="mt-1 text-sm font-bold leading-6 text-white">
                  Anticipo sobre primas reglamentarias
                </p>
              </div>

            </div>

            <div className="mt-5 rounded-2xl border border-white/20 bg-amber-950/20 p-4">
              <p className="text-xs leading-5 text-amber-100 font-medium">
                La fecha límite de vencimiento de este crédito coincide directamente con la fecha de pago de la prima correspondiente por parte del patrono.
              </p>
            </div>
          </aside>
        </section>

        {/* =========================================================
            MONTO Y GARANTÍAS
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-amber-200/80 bg-[#fffaf0]/92 p-6 shadow-xl shadow-amber-950/5 sm:p-7">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-amber-700">
                  Monto y garantías
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-amber-950">
                  Porcentaje financiado según nivel de sueldo
                </h2>
              </div>

              <p className="text-sm font-medium text-slate-500">
                Condiciones establecidas para FONAPRIMA
              </p>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">

              {amountRows.map((row) => (
                <div
                  key={row.tier}
                  className="relative overflow-hidden rounded-2xl border border-yellow-200 bg-gradient-to-b from-yellow-50/70 to-amber-50/30 p-5"
                >
                  {/* Borde superior decorativo */}
                  <div className="absolute left-0 top-0 h-1.5 w-full bg-gradient-to-r from-yellow-400 to-amber-500" />

                  <div className="flex items-start justify-between gap-4 mt-1">

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.16em] text-amber-800">
                        {row.tier}
                      </p>

                      <p className="mt-2 text-3xl font-black text-amber-950">
                        {row.percentage}
                      </p>
                    </div>

                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800 shadow-sm">
                      <ShieldCheck size={20} aria-hidden="true" />
                    </span>

                  </div>

                  <div className="mt-5 rounded-xl border border-amber-200/60 bg-white p-4 shadow-sm">

                    <p className="text-xs font-black uppercase tracking-[.15em] text-amber-700">
                      Descripción de la escala
                    </p>

                    <p className="mt-1.5 text-xs font-medium leading-5 text-slate-600">
                      {row.description}
                    </p>

                  </div>
                </div>
              ))}

            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4">

              <Banknote
                size={18}
                className="mt-0.5 shrink-0 text-amber-700"
                aria-hidden="true"
              />

              <p className="text-sm font-medium leading-6 text-amber-950">
                El monto asignado estará respaldado por la certificación del valor liquidado de tu prima y sujeto a la verificación de tu capacidad de pago.
              </p>

            </div>
          </article>
        </section>

        {/* =========================================================
            PLAZOS Y TASAS
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-amber-200/80 bg-[#fffaf0]/92 p-6 shadow-xl shadow-amber-950/5 sm:p-7">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-amber-700">
                  Plazos y tasas
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-amber-950">
                  Tasa de interés aplicable según el plazo
                </h2>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-yellow-300 bg-yellow-100/80 px-4 py-2 text-sm font-extrabold text-amber-950 shadow-sm">
                <Banknote size={16} aria-hidden="true" />
                Desde 1.4% mensual
              </div>

            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-amber-200/60">

              <div className="overflow-x-auto">

                <table className="min-w-[680px] w-full text-left text-sm">

                  <thead className="bg-amber-50/80 text-xs font-black uppercase tracking-[.14em] text-amber-900">

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

                      <th className="bg-yellow-200/60 px-4 py-3.5 text-amber-950">
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
                        <td className="px-4 py-3.5 font-bold text-amber-950">
                          {row.term}
                        </td>

                        <td className="px-4 py-3.5 font-medium">
                          {row.ea}
                        </td>

                        <td className="px-4 py-3.5 font-medium">
                          {row.na}
                        </td>

                        <td className="bg-yellow-50/60 px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-yellow-400 px-3.5 py-1 font-black text-amber-950 shadow-sm">
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
            <div className="mt-4 grid gap-3 rounded-2xl border border-yellow-300 bg-yellow-50/60 p-4 md:grid-cols-[auto_1fr] md:items-start">

              <span className="rounded-lg bg-yellow-300 px-3 py-1.5 text-xs font-black uppercase tracking-[.12em] text-amber-950 shadow-sm">
                Importante
              </span>

              <p className="text-sm font-medium leading-6 text-amber-950">
                <strong className="font-extrabold">
                  Modalidad de pago única a capital:
                </strong>{' '}
                Durante el tiempo del crédito solo pagas la cuota mensual de intereses. El valor total del capital prestado se descuenta o cancela en un solo pago directo al recibo de la prima.
              </p>

            </div>

          </article>
        </section>

        {/* =========================================================
            RESUMEN FINAL DE CONDICIONES
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-amber-200/80 bg-[#fffaf0]/92 p-6 shadow-xl shadow-amber-950/5 sm:p-7">

            <div className="flex items-center gap-3">

              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-amber-700">
                  Garantías
                </p>

                <h2 className="text-2xl font-black tracking-tight text-amber-950">
                  Resumen de respaldo del crédito
                </h2>
              </div>

            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">

              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">

                <p className="text-xs font-black uppercase tracking-[.15em] text-slate-400">
                  Garantía principal
                </p>

                <p className="mt-2 text-lg font-black text-amber-950">
                  Prima de servicios o antigüedad
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Respaldo directo sobre el derecho causado de la prima reglamentaria fijada por ley o convenio.
                </p>

              </div>

              <div className="rounded-2xl border border-yellow-200 bg-yellow-50/50 p-5">

                <p className="text-xs font-black uppercase tracking-[.15em] text-amber-800">
                  Condición general
                </p>

                <p className="mt-2 text-lg font-black text-amber-950">
                  Capacidad de pago
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-700">
                  Sujeto a la certificación expedida por la empresa y disponibilidad del cupo reglamentario de FONASIN.
                </p>

              </div>

            </div>

          </article>
        </section>

        {/* =========================================================
            CTA FINAL
        ========================================================== */}
        <section className="mt-7 overflow-hidden rounded-[2rem] border border-yellow-300/80 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-300 text-amber-950 shadow-xl shadow-yellow-500/10">

          <div className="relative p-6 sm:p-8">

            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-white/30 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <p className="text-sm font-black uppercase tracking-[.18em] text-amber-950/70">
                  Siguiente paso
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-amber-950 sm:text-3xl">
                  ¿Quieres anticipar tu prima de servicios?
                </h2>

                <p className="mt-2 max-w-2xl font-medium text-amber-950/80">
                  Solicita el estudio o desembolso de tu FONAPRIMA de forma ágil y segura directamente a través de WhatsApp.
                </p>

              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">

                <Link
                  to="/creditos"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-950/15 bg-white/40 px-5 py-3 font-bold text-amber-950 transition hover:bg-white/70 focus-ring"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  Ver más líneas
                </Link>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-950 px-5 py-3 font-bold text-yellow-300 shadow-md transition hover:-translate-y-0.5 hover:bg-black focus-ring"
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
