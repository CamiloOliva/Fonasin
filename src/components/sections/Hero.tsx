import { ArrowRight, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#F8F8EC] py-16 sm:py-24">
      <div className="absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#69A91B]/10 blur-3xl" />
      <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#087542]/10 blur-3xl" />

      <div className="container-page relative grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <div>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-[#087542]">
            <Users size={17} aria-hidden="true" /> Bienestar · comunidad · confianza
          </span>

          <h1 className="mt-4 max-w-3xl text-[clamp(2.7rem,5vw,4rem)] font-extrabold leading-[0.98] tracking-tight text-[#064A2E]">
            <span className="block">Un fondo que te acompaña,</span>
            <span className="block text-[clamp(1.9rem,2.8vw,2.25rem)] font-semibold leading-tight text-[#60635E]">
              porque
            </span>
            <span className="block -mt-1 text-[clamp(4rem,6.4vw,5rem)] font-extrabold leading-[0.9] text-[#69A91B]">
              tus sueños
            </span>
            <span className="relative block mt-1 text-[clamp(2.35rem,3.3vw,2.8rem)] font-bold leading-tight text-[#087542]">
              son nuestro propósito.
              <svg
                className="mt-2 h-4 w-full max-w-[19rem]"
                viewBox="0 0 320 18"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4 12.5C42 3.5 93 2 160 6.5C227 11 276 11 316 4.5"
                  stroke="#087542"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-[17px] leading-8 text-[#5F625E] sm:text-[18px]">
            Conoce la información, los beneficios y los servicios de FONASIN desde un espacio institucional claro y
            cercano.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#quienes-somos"
              className="inline-flex items-center gap-2 rounded-xl bg-[#087542] px-5 py-3 text-[16px] font-semibold text-white shadow-lg shadow-[#087542]/20 transition hover:-translate-y-0.5 hover:bg-[#064A2E] focus-ring"
            >
              Conocer FONASIN <ArrowRight size={18} aria-hidden="true" />
            </a>
            <Link
              to="/afiliacion"
              className="rounded-xl border-2 border-[#087542] bg-white px-5 py-3 text-[16px] font-semibold text-[#087542] transition hover:bg-[#F2F8EF] focus-ring"
            >
              Afíliate
            </Link>
          </div>

          <p className="mt-5 text-[14px] font-medium tracking-[0.18em] text-[#087542]">
            Bienestar · comunidad · confianza
          </p>
        </div>

        <div className="overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-[#064A2E]/10 ring-1 ring-[#087542]/10">
          <img src="/images/Asociados.png" alt="Asociados de FONASIN" className="h-auto w-full" />
        </div>
      </div>
    </section>
  );
}
