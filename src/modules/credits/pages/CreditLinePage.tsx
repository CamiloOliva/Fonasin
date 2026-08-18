import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  CalendarRange,
  Check,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { WHATSAPP_URL } from '../../../data/siteConfig';
import { getCreditLineBySlug } from '../data/creditLines';

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
    amount: '0.5 – 5 SMMLV',
    guarantee: 'Aportes y ahorros',
    description:
      'Sujeto a capacidad de pago y consulta de riesgo cuando corresponda.',
  },
  {
    amount: '>5 – 10 SMMLV',
    guarantee: 'Aportes, ahorros y 1 codeudor o deudor solidario',
    description:
      'El codeudor o deudor solidario debe acreditar capacidad de pago.',
  },
];

const rateRows = [
  {
    term: '1 – 18 meses',
    ea: '18.16%',
    na: '16.80%',
    monthly: '1.4%',
  },
  {
    term: '19 – 24 meses',
    ea: '19.56%',
    na: '18.00%',
    monthly: '1.5%',
  },
  {
    term: '25 – 36 meses',
    ea: '20.98%',
    na: '19.20%',
    monthly: '1.6%',
  },
  {
    term: '37 – 48 meses',
    ea: '22.42%',
    na: '20.40%',
    monthly: '1.7%',
  },
  {
    term: '49 – 60 meses',
    ea: '23.87%',
    na: '21.60%',
    monthly: '1.8%',
  },
];

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="relative overflow-hidden bg-fonasin-deep py-10 sm:py-14">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(245,204,114,0.18),transparent_55%),linear-gradient(135deg,rgba(0,61,34,0.95),rgba(0,39,22,0.96))]" />

      <div className="container-page relative z-10">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/8 p-6 text-white shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[.18em] text-fonasin-lime">
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
              className="inline-flex items-center gap-2 rounded-xl bg-fonasin-lime px-5 py-3 font-bold text-fonasin-deep transition hover:-translate-y-0.5 hover:bg-white focus-ring"
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
  const { slug } = useParams();
  const line = getCreditLineBySlug(slug);

  if (!line) {
    return <ComingSoon title="Línea de crédito no encontrada" />;
  }

  if (line.slug !== 'fonalibre') {
    return <ComingSoon title={line.name} />;
  }

  return (
    <div className="relative overflow-hidden bg-fonasin-deep py-6 sm:py-10">
      {/* =========================================================
          FONDO GENERAL
      ========================================================== */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,244,210,0.18),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(183,121,31,0.20),transparent_45%),linear-gradient(135deg,rgba(0,61,34,0.94),rgba(0,39,22,0.98))]" />

      <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:linear-gradient(135deg,transparent_0_48%,rgba(245,204,114,0.09)_48%_49%,transparent_49%_100%)] [background-size:42px_42px]" />

      <div className="container-page relative z-10">

        {/* =========================================================
            HERO
        ========================================================== */}
        <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/8 text-white shadow-2xl shadow-black/20 backdrop-blur-md">

          {/* Imagen de fondo */}
          <div className="absolute inset-0 opacity-35">
            <img
              src="/images/fonalibre.png"
              alt=""
              className="h-full w-full object-cover object-center"
            />
          </div>

          {/* Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,39,22,0.97)_0%,rgba(0,61,34,0.88)_48%,rgba(17, 77, 50, 0.52)%)]" />

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

                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-black uppercase tracking-[.18em] text-fonasin-lime">
                  <Sparkles size={14} aria-hidden="true" />
                  Línea de crédito
                </span>

                <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                  {line.name}
                </h1>

                <p className="mt-4 max-w-2xl text-base leading-7 text-white/85 sm:text-lg sm:leading-8">
                  Línea de crédito destinada a atender necesidades de libre
                  inversión del asociado, orientadas al mejoramiento de su
                  calidad de vida y la de su grupo familiar.
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                    Libre inversión
                  </span>

                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                    Hasta 10 SMMLV
                  </span>

                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80">
                    Hasta 48 meses*
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
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-fonasin-lime text-fonasin-deep">
                      <Banknote size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-white/55">
                        Monto
                      </p>

                      <p className="mt-1 text-sm font-bold text-white">
                        0.5 a 10 SMMLV
                      </p>
                    </div>
                  </div>
                </div>

                {/* Plazo */}
                <div className="rounded-2xl border border-white/15 bg-black/20 p-4 shadow-lg shadow-black/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fdf0cc] text-[#805718]">
                      <CalendarRange size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-white/55">
                        Plazo
                      </p>

                      <p className="mt-1 text-sm font-bold text-white">
                        Hasta 48 meses*
                      </p>
                    </div>
                  </div>
                </div>

                {/* Amortización capital */}
                <div className="rounded-2xl border border-white/15 bg-black/20 p-4 shadow-lg shadow-black/10 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff7e6] text-[#805718]">
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
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff7e6] text-[#805718]">
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
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fff7e6] text-[#805718]">
                      <ShieldCheck size={20} aria-hidden="true" />
                    </span>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.18em] text-white/55">
                        Garantía
                      </p>

                      <p className="mt-1 text-sm font-bold text-white">
                        Según monto solicitado
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
          <article className="rounded-[1.75rem] border border-fonasin-green/10 bg-white/95 p-6 shadow-xl shadow-black/5 sm:p-7">

            <p className="text-sm font-black uppercase tracking-[.18em] text-fonasin-green">
              ¿Qué es?
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-fonasin-deep sm:text-3xl">
              Libre inversión para mejorar tu calidad de vida
            </h2>

            <p className="mt-3 max-w-3xl leading-7 text-slate-600">
              FONALIBRE está pensado para atender necesidades personales y
              familiares con un enfoque flexible, sujeto a capacidad de pago,
              consulta de riesgo cuando corresponda y las garantías requeridas.
            </p>

            {/* Destinos */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {usageItems.map((item) => (
                <div
                  key={item}
                  className="flex min-h-[70px] items-start gap-3 rounded-2xl border border-fonasin-green/10 bg-fonasin-surface/60 p-4 text-sm font-medium leading-6 text-slate-700"
                >
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-fonasin-green/10 text-fonasin-green">
                    <Check size={14} strokeWidth={3} aria-hidden="true" />
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          {/* Condiciones clave */}
          <aside className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,#003d22,#08783f)] p-6 text-white shadow-xl shadow-black/10 sm:p-7">

            <p className="text-sm font-black uppercase tracking-[.18em] text-[#f5cc72]">
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
                  Necesidades de libre inversión
                </p>
              </div>

            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/8 p-4">
              <p className="text-sm leading-6 text-white/80">
                No se exige soporte específico del destino, salvo que FONASIN
                lo requiera por razones de riesgo, control o trazabilidad.
              </p>
            </div>
          </aside>
        </section>

        {/* =========================================================
            MONTO Y GARANTÍAS
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-fonasin-green/10 bg-white/95 p-6 shadow-xl shadow-black/5 sm:p-7">

            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-fonasin-green">
                  Monto y garantías
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-fonasin-deep">
                  Garantía según el monto solicitado
                </h2>
              </div>

              <p className="text-sm text-slate-500">
                Condiciones establecidas para FONALIBRE
              </p>

            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              {amountRows.map((row, index) => (
                <div
                  key={row.amount}
                  className="relative overflow-hidden rounded-2xl border border-fonasin-green/10 bg-fonasin-surface/50 p-5"
                >
                  {/* Indicador lateral */}
                  <div
                    className={`absolute left-0 top-0 h-full w-1 ${
                      index === 0
                        ? 'bg-fonasin-green'
                        : 'bg-[#d1d900]'
                    }`}
                  />

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-xs font-black uppercase tracking-[.16em] text-fonasin-green">
                        {index === 0
                          ? 'Hasta 5 SMMLV'
                          : 'Más de 5 SMMLV'}
                      </p>

                      <p className="mt-2 text-xl font-black text-fonasin-deep">
                        {row.amount}
                      </p>
                    </div>

                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-fonasin-green shadow-sm">
                      <ShieldCheck size={19} aria-hidden="true" />
                    </span>

                  </div>

                  <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">

                    <p className="text-xs font-black uppercase tracking-[.15em] text-slate-400">
                      Garantía mínima
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
                className="mt-0.5 shrink-0 text-fonasin-green"
                aria-hidden="true"
              />

              <p className="text-sm leading-6 text-slate-600">
                El monto está sujeto a capacidad de pago y a consulta de riesgo
                cuando corresponda.
              </p>

            </div>
          </article>
        </section>

        {/* =========================================================
            PLAZOS Y TASAS
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-fonasin-green/10 bg-white/95 p-6 shadow-xl shadow-black/5 sm:p-7">

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-fonasin-green">
                  Plazos y tasas
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-fonasin-deep">
                  Escala de plazo y tasa
                </h2>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-fonasin-surface px-4 py-2 text-sm font-bold text-fonasin-green">
                <Banknote size={16} aria-hidden="true" />
                Desde 1.4% mensual
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

                      <th className="bg-fonasin-surface px-4 py-3.5 text-fonasin-green">
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

                        <td className="bg-fonasin-surface/50 px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-fonasin-green px-3 py-1 font-black text-white">
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
                  El plazo máximo para las líneas de crédito es de 48 meses.
                </strong>{' '}
                Excepcionalmente, los créditos por valor de 10 SMMLV pueden
                otorgarse hasta 60 meses, de acuerdo con las condiciones
                financieras y previa aprobación de la instancia competente.
              </p>

            </div>

          </article>
        </section>

        {/* =========================================================
            RESUMEN FINAL DE CONDICIONES
        ========================================================== */}
        <section className="mt-7">

          <article className="rounded-[1.75rem] border border-fonasin-green/10 bg-white/95 p-6 shadow-xl shadow-black/5 sm:p-7">

            <div className="flex items-center gap-3">

              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-fonasin-surface text-fonasin-green">
                <ShieldCheck size={20} aria-hidden="true" />
              </span>

              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-fonasin-green">
                  Garantías
                </p>

                <h2 className="text-2xl font-black tracking-tight text-fonasin-deep">
                  Resumen de respaldo del crédito
                </h2>
              </div>

            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <p className="text-xs font-black uppercase tracking-[.15em] text-slate-400">
                  Hasta 5 SMMLV
                </p>

                <p className="mt-2 text-lg font-black text-fonasin-deep">
                  Aportes y ahorros
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sujeto a capacidad de pago y consulta de riesgo cuando
                  corresponda.
                </p>

              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <p className="text-xs font-black uppercase tracking-[.15em] text-slate-400">
                  Más de 5 hasta 10 SMMLV
                </p>

                <p className="mt-2 text-lg font-black text-fonasin-deep">
                  Aportes + ahorros + codeudor
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Puede ser codeudor o deudor solidario y debe acreditar
                  capacidad de pago.
                </p>

              </div>

              <div className="rounded-2xl border border-fonasin-green/15 bg-fonasin-surface p-5 sm:col-span-2 lg:col-span-1">

                <p className="text-xs font-black uppercase tracking-[.15em] text-fonasin-green">
                  Condición general
                </p>

                <p className="mt-2 text-lg font-black text-fonasin-deep">
                  Sujeto a capacidad de pago
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Las condiciones del crédito están sujetas a las políticas y
                  validaciones correspondientes de FONASIN.
                </p>

              </div>

            </div>

          </article>
        </section>

        {/* =========================================================
            CTA FINAL
        ========================================================== */}
        <section className="mt-7 overflow-hidden rounded-[2rem] border border-fonasin-green/10 bg-white/95 shadow-xl shadow-black/5">

          <div className="relative p-6 sm:p-8">

            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-fonasin-lime/10 blur-3xl" />

            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

              <div>

                <p className="text-sm font-black uppercase tracking-[.18em] text-fonasin-green">
                  Siguiente paso
                </p>

                <h2 className="mt-2 text-2xl font-black tracking-tight text-fonasin-deep sm:text-3xl">
                  ¿Este crédito se ajusta a lo que necesitas?
                </h2>

                <p className="mt-3 max-w-2xl text-slate-600">
                  Puedes volver al listado de créditos o escribirnos por
                  WhatsApp para recibir orientación sobre la línea que mejor
                  se ajuste a tu caso.
                </p>

              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">

                <Link
                  to="/creditos"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-fonasin-green/20 bg-white px-5 py-3 font-bold text-fonasin-deep transition hover:-translate-y-0.5 hover:border-fonasin-green/35 hover:bg-fonasin-surface focus-ring"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  Ver más líneas
                </Link>

                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-fonasin-lime px-5 py-3 font-bold text-fonasin-deep transition hover:-translate-y-0.5 hover:bg-white focus-ring"
                >
                  <BadgeCheck size={18} aria-hidden="true" />
                  Consultar por WhatsApp
                </a>

              </div>

            </div>
          </div>
        </section>

      </div>
    </div>
  );
}