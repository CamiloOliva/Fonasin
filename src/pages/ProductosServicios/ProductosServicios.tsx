import { ArrowRight, HandCoins, HeartHandshake, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';

const products = [
  {
    title: 'Ahorros',
    description: 'Opciones de ahorro permanente y voluntario para acompañar tus metas.',
    to: '/mi-fondo',
    icon: WalletCards,
    accent: 'bg-fonasin-green',
    iconSurface: 'bg-fonasin-green/10 text-fonasin-green',
  },
  {
    title: 'Créditos',
    description: 'Información de productos de crédito. Condiciones por confirmar.',
    to: '/creditos',
    icon: HandCoins,
    accent: 'bg-fonasin-deep',
    iconSurface: 'bg-fonasin-deep/10 text-fonasin-deep',
  },
  {
    title: 'Convenios',
    description: 'Beneficios disponibles a través de aliados para ti y tu familia.',
    to: '/convenios',
    icon: HeartHandshake,
    accent: 'bg-fonasin-lime',
    iconSurface: 'bg-fonasin-lime/20 text-fonasin-deep',
  },
];

export default function ProductosServicios() {
  return (
    <div className="py-10 sm:py-14">
      <div className="container-page">
        <section className="page-intro overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-fonasin-green/10 px-3 py-1 text-xs font-bold uppercase tracking-[.16em] text-fonasin-green">
              Portafolio FONASIN
            </span>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-fonasin-deep sm:text-5xl">
              Productos y servicios
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">
              Encuentra alternativas pensadas para acompañar tu bienestar financiero y aprovechar los beneficios de ser asociado.
            </p>
          </div>
          <div className="mt-7 inline-flex items-center gap-2 rounded-xl border border-fonasin-green/10 bg-white/75 px-4 py-3 text-sm font-semibold text-fonasin-ink shadow-sm">
            <span className="h-2.5 w-2.5 rounded-full bg-fonasin-lime ring-4 ring-fonasin-lime/20" />
            Explora las opciones disponibles
          </div>
        </section>

        <section className="mt-10 rounded-[2rem] bg-fonasin-surface/75 p-6 sm:p-8" aria-label="Categorías de productos y servicios">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[.16em] text-fonasin-green">Opciones disponibles</p>
              <h2 className="mt-1 text-2xl font-black text-fonasin-deep sm:text-3xl">Elige lo que necesitas</h2>
            </div>
            <p className="text-sm text-slate-500">Los accesos activos te llevan a su información detallada.</p>
          </div>

          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => {
              const Icon = product.icon;
              const content = (
                <>
                  <div className={`absolute inset-x-0 top-0 h-1.5 ${product.accent}`} />
                  <div className={`grid h-14 w-14 place-items-center rounded-2xl ${product.iconSurface}`}>
                    <Icon size={28} aria-hidden="true" />
                  </div>
                  <h3 className="mt-6 text-2xl font-black text-fonasin-deep">{product.title}</h3>
                  <p className="mt-3 max-w-sm leading-7 text-slate-600">{product.description}</p>
                  <div className="mt-auto pt-7">
                    {product.to ? (
                      <span className="inline-flex items-center gap-2 font-bold text-fonasin-green">
                        Conocer más <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-fonasin-surface px-3 py-1.5 text-sm font-bold text-fonasin-deep/70">
                        Próximamente
                      </span>
                    )}
                  </div>
                </>
              );

              const className = `relative flex min-h-[280px] flex-col overflow-hidden rounded-3xl border border-fonasin-green/10 bg-white p-7 shadow-sm transition duration-300 hover:border-amber-400 hover:shadow-[0_0_0_2px_rgba(251,191,36,0.3),0_20px_30px_-20px_rgba(0,61,34,0.32)] ${product.to ? 'group focus-ring hover:-translate-y-1' : ''}`;

              return product.to ? (
                <Link key={product.title} to={product.to} className={className}>{content}</Link>
              ) : (
                <article key={product.title} className={className}>{content}</article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
