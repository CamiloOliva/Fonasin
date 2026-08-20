import { useEffect, useState } from 'react';
import { CircleDollarSign, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import CreditLoadingOverlay from '../components/CreditLoadingOverlay';
import { WHATSAPP_URL } from '../../../data/siteConfig';
import { creditLines } from '../data/creditLines';

type CreditsLocationState = {
  showCreditLoader?: boolean;
};

export default function CreditsPage() {
  const location = useLocation();
  const locationState = location.state as CreditsLocationState | null;
  const [isLoading, setIsLoading] = useState(Boolean(locationState?.showCreditLoader));

  useEffect(() => {
    if (!isLoading) {
      return;
    }

    const timeout = window.setTimeout(() => setIsLoading(false), 2200);
    return () => window.clearTimeout(timeout);
  }, [isLoading]);

  return (
    <>
      <div className="relative overflow-hidden bg-fonasin-deep py-8 sm:py-12">
        <img src="/images/DineroPlaya.png" alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[60%_center]" />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(0,61,34,0.72),rgba(0,61,34,0.42)_46%,rgba(255,244,210,0.40))]" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -left-32 top-28 h-72 w-[72%] -rotate-6 rounded-[100%] border-y border-[#b7791f]/20 bg-[linear-gradient(90deg,rgba(183,121,31,0.2),rgba(245,204,114,0.2),transparent)] blur-[1px]" />
          <div className="absolute -right-48 bottom-12 h-80 w-[70%] rotate-[9deg] rounded-[100%] border-y border-[#b7791f]/15 bg-[linear-gradient(90deg,transparent,rgba(218,166,57,0.16),rgba(255,244,210,0.46))] blur-[1px]" />
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(135deg,transparent_0_48%,rgba(154,100,22,0.08)_48%_49%,transparent_49%_100%)] [background-size:42px_42px]" />
          <div className="absolute -left-24 bottom-0 h-80 w-80 rounded-full bg-[#d99e2f]/20 blur-3xl" />
          <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-white/70 blur-3xl" />
        </div>

        <div className="container-page relative z-10">
          <section className="relative isolate overflow-hidden rounded-[2.25rem] border border-fonasin-green/20 px-5 py-8 text-white shadow-2xl shadow-fonasin-green/20 sm:px-8 sm:py-10 lg:min-h-[520px] lg:px-14 lg:py-16">
            <img src="/images/credits-hero.jpg" alt="Pareja revisando opciones de crédito desde casa" className="absolute inset-0 -z-20 h-full w-full object-cover object-center" />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(0,39,22,0.88)_0%,rgba(0,61,34,0.74)_40%,rgba(0,61,34,0.18)_73%,rgba(0,61,34,0.04)_100%)]" />
            <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),transparent_45%,rgba(0,0,0,0.12))]" />

            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(240px,280px)] lg:items-start">
              <div className="relative max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[.15em] text-fonasin-lime backdrop-blur-sm">
                  <Sparkles size={15} aria-hidden="true" /> Soluciones de crédito
                </span>
                <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.03] tracking-tight sm:text-5xl lg:text-6xl">
                  Un impulso para cada uno de tus proyectos.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/85 sm:mt-6 sm:text-lg sm:leading-8">
                  Explora nuestras líneas de crédito y encuentra una alternativa pensada para acompañarte cuando más lo necesitas.
                </p>

                <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
                  <a href="#credit-lines" className="rounded-xl bg-fonasin-lime px-5 py-3 font-bold text-fonasin-deep shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-white focus-ring">
                    Ver líneas de crédito
                  </a>
                  <a href={WHATSAPP_URL} target="_blank" rel="noreferrer" className="rounded-xl border border-white/45 bg-white/10 px-5 py-3 font-bold text-white backdrop-blur-sm transition hover:-translate-y-0.5 hover:bg-white/20 focus-ring">
                    Contáctanos
                  </a>
                </div>
              </div>

              <div className="relative grid gap-3 lg:pt-2">
                <div className="flex items-start gap-3 rounded-2xl border border-white/20 bg-black/12 px-4 py-3 shadow-lg shadow-black/10 backdrop-blur-[2px]">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-fonasin-green text-white">
                    <CircleDollarSign size={20} aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-[0.65rem] font-black uppercase tracking-[.22em] text-white/65">Línea destacada</span>
                    <strong className="mt-0.5 block text-lg font-black leading-tight">5 líneas de crédito</strong>
                    <span className="mt-0.5 block text-xs leading-5 text-white/72">Para diferentes necesidades</span>
                  </span>
                </div>
                <div className="rounded-2xl border border-white/20 bg-black/12 px-4 py-3 text-sm font-semibold leading-6 text-white/92 shadow-lg shadow-black/10 backdrop-blur-[2px]">
                  Conoce la que mejor se adapta a ti
                </div>
              </div>
            </div>
          </section>

          <section className="relative mt-10 rounded-[2rem] border border-fonasin-green/10 bg-white/80 p-5 shadow-xl shadow-fonasin-green/10 backdrop-blur-sm sm:p-8 lg:p-10" aria-label="Líneas de crédito FONASIN">
            <div className="absolute right-8 top-7 hidden h-16 w-16 rounded-full border-[10px] border-fonasin-lime/30 lg:block" />
            <div className="relative flex flex-col gap-4 border-b border-fonasin-green/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[.16em] text-fonasin-green">Elige tu línea</p>
                <h2 className="mt-1 text-3xl font-black tracking-tight text-fonasin-deep sm:text-4xl">Créditos a tu medida</h2>
              </div>
              <p className="max-w-md text-sm leading-6 text-slate-600">Selecciona una alternativa para conocer más. Las condiciones y requisitos detallados se publicarán próximamente.</p>
            </div>

            <div id="credit-lines" className="relative mt-8 grid gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-6">
              {creditLines.map(({ slug, number, name, description, icon: Icon, gradient, iconSurface, layout }) => (
                <article
                  key={name}
                  className={`group relative flex min-h-[250px] flex-col overflow-hidden rounded-3xl border border-white/20 bg-[linear-gradient(145deg,#003d22_0%,#08783f_100%)] p-5 shadow-[0_16px_32px_-14px_rgba(0,61,34,0.42)] transition duration-500 hover:-translate-y-1.5 hover:border-[#f7c95e] hover:shadow-[0_0_0_3px_rgba(247,201,94,0.58),0_0_34px_rgba(238,183,51,0.72),0_26px_42px_-18px_rgba(0,61,34,0.5)] sm:min-h-[270px] sm:p-6 lg:p-7 ${layout}`}
                >
                  <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${gradient}`} />
                  <div className="absolute right-2 -top-4 select-none text-6xl font-black tracking-tighter text-[#f7d77f]/15 sm:text-7xl xl:text-8xl" aria-hidden="true">
                    {number}
                  </div>
                  <div className={`relative grid h-12 w-12 place-items-center rounded-2xl ${iconSurface} ring-1 ring-inset ring-[#b7791f]/10 transition duration-300 group-hover:scale-110 sm:h-14 sm:w-14`}>
                    <Icon size={24} className="sm:size-7" aria-hidden="true" />
                  </div>
                  <div className="relative mt-5 sm:mt-6">
                    <span className="text-[0.65rem] font-black tracking-[.2em] text-[#f5cc72] sm:text-xs">LÍNEA {number}</span>
                    <h3 className="mt-2 text-xl font-black tracking-wide text-white sm:text-2xl">{name}</h3>
                  </div>
                  <p className="relative mt-3 max-w-md text-sm leading-6 text-white/80 sm:text-base sm:leading-7">{description}</p>
                  <div className="relative mt-auto pt-5">
                    <Link
                      to={`/creditos/${slug}`}
                      className="inline-flex items-center justify-center rounded-full bg-[#fdf0cc] px-4 py-2 text-xs font-black uppercase tracking-[.14em] text-[#805718] transition hover:bg-white hover:text-[#5f421b] focus-ring"
                    >
                      Conoce más
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>

      <CreditLoadingOverlay isLoading={isLoading} />
    </>
  );
}
