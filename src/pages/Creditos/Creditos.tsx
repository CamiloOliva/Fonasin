import { ArrowUpRight, BadgeDollarSign, CircleDollarSign, HandCoins, Landmark, PiggyBank, ShieldCheck, Sparkles } from 'lucide-react';

const creditLines = [
  {
    number: '01',
    name: 'FONALIBRE',
    description: 'Tu crédito de libre inversión para lo que necesites, cuándo lo necesites.',
    icon: HandCoins,
    gradient: 'from-fonasin-green to-fonasin-dark',
    iconSurface: 'bg-fonasin-green/10 text-fonasin-green',
    layout: 'xl:col-span-3',
  },
  {
    number: '02',
    name: 'FONAROTATIVO',
    description: 'Liquidez inmediata a tu alcance. Úsalo, págalo y vuelve a disfrutarlo.',
    icon: BadgeDollarSign,
    gradient: 'from-fonasin-deep to-fonasin-green',
    iconSurface: 'bg-fonasin-deep/10 text-fonasin-deep',
    layout: 'xl:col-span-3',
  },
  {
    number: '03',
    name: 'FONAPRIMA',
    description: 'No esperes a mitad o fin de año; recibe el anticipo de tu prima sin complicaciones.',
    icon: Landmark,
    gradient: 'from-[#8b8e10] to-fonasin-green',
    iconSurface: 'bg-fonasin-lime/25 text-fonasin-deep',
    layout: 'xl:col-span-2',
  },
  {
    number: '04',
    name: 'FONAPEN',
    description: 'Disfruta tu tranquilidad con un crédito diseñado especialmente para ti.',
    icon: ShieldCheck,
    gradient: 'from-fonasin-dark to-fonasin-deep',
    iconSurface: 'bg-fonasin-deep/10 text-fonasin-deep',
    layout: 'xl:col-span-2',
  },
  {
    number: '05',
    name: 'FONAPORTES',
    description: 'Tu propio respaldo. Financiación garantizada con tus aportes sociales.',
    icon: PiggyBank,
    gradient: 'from-fonasin-green to-[#81920d]',
    iconSurface: 'bg-fonasin-lime/25 text-fonasin-deep',
    layout: 'xl:col-span-2',
  },
];

export default function Creditos() {
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(160deg,#003d22_0%,#005c31_34%,#08783f_64%,#e5efd0_100%)] py-10 sm:py-14">
      <div className="pointer-events-none absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-fonasin-lime/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
      <div className="container-page">
        <section className="relative isolate overflow-hidden rounded-[2.25rem] border border-white/15 bg-gradient-to-br from-fonasin-deep/90 via-fonasin-dark/90 to-fonasin-green/90 px-6 py-11 text-white shadow-2xl shadow-fonasin-deep/30 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
          <div className="absolute inset-0 -z-10 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:18px_18px]" />
          <div className="absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-fonasin-lime/15 blur-3xl" />
          <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full bg-fonasin-lime/25 blur-3xl" />

          <div className="relative max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-fonasin-lime/30 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[.15em] text-fonasin-lime">
              <Sparkles size={15} aria-hidden="true" /> Soluciones de crédito
            </span>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.03] tracking-tight sm:text-5xl lg:text-6xl">
              Un impulso para cada uno de tus proyectos.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
              Explora nuestras líneas de crédito y encuentra una alternativa pensada para acompañarte cuando más lo necesitas.
            </p>
          </div>

          <div className="relative mt-9 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-fonasin-lime text-fonasin-deep"><CircleDollarSign size={21} aria-hidden="true" /></span>
              <span><strong className="block text-sm">5 líneas de crédito</strong><span className="text-xs text-white/65">Para diferentes necesidades</span></span>
            </div>
            <div className="inline-flex items-center rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white/85 backdrop-blur-sm">
              Conoce la que mejor se adapta a ti
            </div>
          </div>
        </section>

        <section className="relative mt-10 rounded-[2rem] border border-white/15 bg-fonasin-deep/15 p-6 shadow-xl shadow-fonasin-deep/15 backdrop-blur-sm sm:p-8 lg:p-10" aria-label="Líneas de crédito FONASIN">
          <div className="absolute right-8 top-7 hidden h-16 w-16 rounded-full border-[10px] border-fonasin-lime/25 lg:block" />
          <div className="relative flex flex-col gap-4 border-b border-white/15 pb-7 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.16em] text-fonasin-lime">Elige tu línea</p>
              <h2 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl">Créditos a tu medida</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-white/70">Selecciona una alternativa para conocer más. Las condiciones y requisitos detallados se publicarán próximamente.</p>
          </div>

          <div className="relative mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-6">
            {creditLines.map(({ number, name, description, icon: Icon, gradient, iconSurface, layout }) => (
              <article key={name} className={`group relative flex min-h-[300px] flex-col overflow-hidden rounded-3xl border border-white/40 bg-[linear-gradient(145deg,#f8faed_0%,#e4efcf_100%)] p-7 shadow-xl shadow-fonasin-deep/15 transition duration-500 hover:-translate-y-1.5 hover:border-amber-300 hover:shadow-[0_0_0_2px_rgba(253,230,138,0.45),0_24px_35px_-22px_rgba(0,61,34,0.5)] ${layout}`}>
                <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${gradient}`} />
                <div className="absolute -right-5 -top-8 select-none text-8xl font-black tracking-tighter text-fonasin-deep/15" aria-hidden="true">{number}</div>
                <div className={`relative grid h-14 w-14 place-items-center rounded-2xl ${iconSurface} ring-1 ring-inset ring-fonasin-green/10 transition duration-300 group-hover:scale-110`}>
                  <Icon size={28} aria-hidden="true" />
                </div>
                <div className="relative mt-6">
                  <span className="text-xs font-black tracking-[.2em] text-fonasin-green/65">LÍNEA {number}</span>
                  <h3 className="mt-2 text-2xl font-black tracking-wide text-fonasin-deep">{name}</h3>
                </div>
                <p className="relative mt-3 max-w-md leading-7 text-slate-600">{description}</p>
                <a
                  href="#"
                  onClick={(event) => event.preventDefault()}
                  aria-label={`Conoce más sobre ${name}. Información detallada próximamente.`}
                  className="group/cta relative mt-auto inline-flex w-fit items-center gap-2 overflow-hidden rounded-xl border border-fonasin-green/15 bg-fonasin-green/10 px-4 py-2.5 text-sm font-black text-fonasin-green transition duration-300 hover:border-fonasin-green hover:text-white focus-ring"
                >
                  <span className="absolute inset-0 origin-left scale-x-0 bg-gradient-to-r from-fonasin-green to-fonasin-dark transition-transform duration-500 ease-out group-hover/cta:scale-x-100" />
                  <span className="relative">Conoce más</span>
                  <ArrowUpRight size={17} aria-hidden="true" className="relative transition duration-300 group-hover/cta:translate-x-1 group-hover/cta:-translate-y-1 group-hover/cta:rotate-12" />
                </a>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
