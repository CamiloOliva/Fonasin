import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { convenios, ConvenioCategory } from '../../data/convenios';

const cats: Array<'Todos' | ConvenioCategory> = [
  'Todos',
  'Salud y bienestar',
  'Funerarios',
  'Turismo',
  'Servicios vehiculares',
];

export default function Convenios() {
  const [cat, setCat] = useState<(typeof cats)[number]>('Todos');
  const items = useMemo(
    () => (cat === 'Todos' ? convenios : convenios.filter((c) => c.category === cat)),
    [cat],
  );

  return (
    <div className="py-14">
      <div className="container-page">
        <span className="text-xs uppercase tracking-[.18em] font-bold text-fonasin-green">
          Beneficios
        </span>
        <h1 className="text-4xl sm:text-5xl font-black text-fonasin-deep mt-2">Convenios</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl">
          Explora los convenios organizados por categoría. Los datos no confirmados están
          marcados como provisionales.
        </p>

        <div className="flex flex-wrap gap-2 mt-8">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-2.5 rounded-full font-bold text-sm ${
                cat === c
                  ? 'bg-fonasin-green text-white'
                  : 'bg-fonasin-surface text-fonasin-deep hover:bg-fonasin-green/10'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-9">
          {items.map((c) => {
            const isEmi = c.name === 'EMI';
            const isLosOlivos = c.name === 'Funeraria Los Olivos';
            const isSanitas = c.name === 'Sanitas';
            const isEmermedica = c.name === 'Emermédica';
            const isUmaIps = c.name === 'UMA IPS';
            const isPracticar = c.name === 'Practicar';
            const isManejar = c.name === 'Manejar';
            const isCoorserpark = c.name === 'Coorserpark';
            const isFeatured = isEmi || isEmermedica || isUmaIps || isLosOlivos || isSanitas || isPracticar || isManejar || isCoorserpark;
            const card = (
              <article
                className={`group relative h-full rounded-2xl border bg-white p-6 shadow-sm transition duration-200 ${
                  isEmi
                    ? 'border-emerald-200 bg-gradient-to-br from-white via-white to-emerald-50/70 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/10'
                    : isLosOlivos
                      ? 'border-[#d4dbbe] bg-gradient-to-br from-white via-white to-[#f7f8f0] hover:-translate-y-1 hover:border-[#859f48] hover:shadow-xl hover:shadow-[#556b2f]/10'
                      : isSanitas
                        ? 'border-sky-200 bg-gradient-to-br from-white via-white to-sky-50 hover:-translate-y-1 hover:border-sky-400 hover:shadow-xl hover:shadow-sky-900/10'
                        : isEmermedica
                          ? 'border-blue-200 bg-gradient-to-br from-white via-white to-blue-50 hover:-translate-y-1 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-900/10'
                          : isPracticar
                            ? 'border-red-200 bg-gradient-to-br from-white via-white to-red-50 hover:-translate-y-1 hover:border-red-400 hover:shadow-xl hover:shadow-red-900/10'
                            : isManejar
                          ? 'border-amber-200 bg-gradient-to-br from-white via-white to-amber-50 hover:-translate-y-1 hover:border-amber-400 hover:shadow-xl hover:shadow-amber-900/10'
                          : isCoorserpark
                          ? 'border-emerald-200 bg-gradient-to-br from-white via-white to-teal-50 hover:-translate-y-1 hover:border-emerald-400 hover:shadow-xl hover:shadow-emerald-900/10'
                          : 'hover:border-fonasin-green/30 hover:shadow-md'
                }`}
              >
                {isFeatured && (
                  <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                    isEmi ? 'bg-red-50 text-red-600' : isSanitas ? 'bg-sky-100 text-sky-700' : isEmermedica ? 'bg-blue-100 text-blue-700' : isUmaIps ? 'bg-emerald-100 text-emerald-700' : isPracticar ? 'bg-red-100 text-red-700' : isCoorserpark ? 'bg-emerald-100 text-emerald-700' : 'bg-[#fefce8] text-[#556b2f]'
                  }`}>
                    {isEmi ? 'Salud 24/7' : isSanitas ? 'Plan Premium' : isEmermedica ? 'Atención médica' : isPracticar ? 'Formación vial' : isCoorserpark ? 'Previsión exequial' : 'Protección familiar'}
                  </span>
                )}
                <img
                  src={c.logo}
                  alt="Logo provisional"
                  className="h-16 w-28 rounded-lg object-contain"
                />
                <div className="mt-4 text-xs font-bold uppercase tracking-wider text-fonasin-green">
                  {c.category}
                </div>
                <h2 className="mt-1 max-w-[12rem] break-words text-xl font-black leading-tight text-fonasin-deep">{c.name}</h2>
                <p className="mt-2 leading-6 text-slate-600">{c.description}</p>
                {isFeatured && (
                  <span className={`mt-5 inline-flex items-center gap-1.5 font-bold transition group-hover:gap-2.5 ${
                    isEmi ? 'text-emerald-700' : isSanitas ? 'text-sky-700' : isEmermedica ? 'text-blue-700' : isUmaIps ? 'text-emerald-700' : isPracticar ? 'text-red-700' : isManejar ? 'text-amber-700' : isCoorserpark ? 'text-emerald-700' : 'text-[#556b2f]'
                  }`}>
                    Conoce el convenio
                    <ChevronRight size={18} aria-hidden="true" />
                  </span>
                )}
              </article>
            );

            return isFeatured ? (
              <Link
                key={c.id}
                to={isEmi ? '/convenios/emi' : isSanitas ? '/convenios/sanitas' : isEmermedica ? '/convenios/emermedica' : isUmaIps ? '/convenios/uma-ips' : isPracticar ? '/convenios/practicar' : isManejar ? '/convenios/manejar' : isCoorserpark ? '/convenios/coorserpark' : '/convenios/los-olivos'}
                className="block h-full rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                {card}
              </Link>
            ) : (
              <div key={c.id}>{card}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
