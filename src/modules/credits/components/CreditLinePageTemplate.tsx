import type { LucideIcon } from 'lucide-react';
import { ArrowLeft, BadgeCheck, Banknote, Check, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export type CreditLineTheme = {
  page: string;
  ambient: string;
  ambientGlowTop: string;
  ambientGlowLeft: string;
  ambientGlowRight: string;
  hero: string;
  heroImage: string;
  heroOverlay: string;
  heroGlow: string;
  heroBackLink: string;
  heroBadge: string;
  heroStatCard: string;
  heroStatIcon: string;
  softCard: string;
  darkCard: string;
  cta: string;
  sectionGrid: string;
  tableCard: string;
};

type HeroStat = {
  icon: LucideIcon;
  label: string;
  value: string;
};

type InfoCard = {
  label: string;
  value: string;
};

type AmountRow = {
  tier: string;
  amount?: string;
  percentage?: string;
  description: string;
};

type RateRow = {
  term: string;
  ea: string;
  na: string;
  monthly: string;
};

type CreditLinePageTemplateProps = {
  theme: CreditLineTheme;
  hero: {
    image: string;
    eyebrow: string;
    title: string;
    description: string;
    chips: string[];
    stats: HeroStat[];
  };
  overview: {
    eyebrow: string;
    title: string;
    description: string;
    itemsTitle: string;
    items: string[];
    itemLayout?: 'row' | 'center';
    sideEyebrow: string;
    sideCards: InfoCard[];
    sideNote: string;
  };
  amounts: {
    eyebrow: string;
    title: string;
    subtitle: string;
    rows: AmountRow[];
    note: string;
  };
  rates: {
    eyebrow: string;
    title: string;
    badge: string;
    rows: RateRow[];
    noteTitle: string;
    note: string;
  };
  summary: {
    eyebrow: string;
    title: string;
    cards: {
      label: string;
      title: string;
      description: string;
    }[];
  };
  cta: {
    eyebrow: string;
    title: string;
    description: string;
    primary: {
      href: string;
      label: string;
    };
    secondary: {
      href: string;
      label: string;
    };
  };
};

function HeroStatCard({ theme, stat }: { theme: CreditLineTheme; stat: HeroStat }) {
  const Icon = stat.icon;

  return (
    <div className={`${theme.heroStatCard} h-full`}>
      <div className="flex items-center gap-3">
        <span className={theme.heroStatIcon}>
          <Icon size={20} aria-hidden="true" />
        </span>
        <div>
          <p className="text-xs font-black uppercase tracking-[.18em] text-inherit/70">{stat.label}</p>
          <p className="mt-0.5 text-base font-black text-inherit">{stat.value}</p>
        </div>
      </div>
    </div>
  );
}

export default function CreditLinePageTemplate({
  theme,
  hero,
  overview,
  amounts,
  rates,
  summary,
  cta,
}: CreditLinePageTemplateProps) {
  return (
    <div className={theme.page}>
      <div className={theme.ambient} />
      <div className={theme.ambientGlowTop} />
      <div className={theme.ambientGlowLeft} />
      <div className={theme.ambientGlowRight} />

      <div className="container-page relative z-10">
        <section className={theme.hero}>
          <div className={theme.heroImage}>
            <img src={hero.image} alt="" className="h-full w-full object-cover object-center" />
          </div>
          <div className={theme.heroOverlay} />
          <div className={theme.heroGlow} />

          <div className="relative p-6 sm:p-8 lg:p-10">
            <Link to="/creditos" className={theme.heroBackLink}>
              <ArrowLeft size={16} aria-hidden="true" />
              Volver a créditos
            </Link>

            <div className="mt-6 grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
              <div className="max-w-3xl">
                <span className={theme.heroBadge}>
                  <Sparkles size={14} aria-hidden="true" />
                  {hero.eyebrow}
                </span>

                <h1 className="mt-4 text-4xl font-black tracking-tight text-current drop-shadow-sm sm:text-5xl lg:text-6xl">
                  {hero.title}
                </h1>

                <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-current/90 sm:text-lg sm:leading-8">
                  {hero.description}
                </p>

                <div className="mt-6 flex flex-wrap gap-2">
                  {hero.chips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full border border-current/10 bg-white/60 px-3.5 py-1.5 text-xs font-bold text-current"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
                {hero.stats.map((stat) => (
                  <HeroStatCard key={stat.label} theme={theme} stat={stat} />
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={theme.sectionGrid}>
          <article className={`${theme.softCard} h-full`}>
            <div className="flex h-full flex-col">
              <p className="text-sm font-black uppercase tracking-[.18em] text-slate-500">{overview.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">{overview.title}</h2>
              <p className="mt-3 max-w-3xl leading-7 text-slate-600">{overview.description}</p>
              <p className="mt-6 text-sm font-black uppercase tracking-[.18em] text-slate-500">{overview.itemsTitle}</p>

              <div className="mt-6 grid flex-1 content-start gap-3 sm:grid-cols-2 xl:grid-cols-3 auto-rows-fr">
                {overview.items.map((item) => {
                  if (overview.itemLayout === 'center') {
                    return (
                      <div
                        key={item}
                        className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-center text-sm font-semibold leading-6 text-slate-700"
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-950/10 text-slate-700">
                          <Check size={14} strokeWidth={3} aria-hidden="true" />
                        </span>
                        <span className="max-w-[18ch]">{item}</span>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={item}
                      className="flex h-full items-start gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm font-semibold leading-6 text-slate-700"
                    >
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-slate-950/10 text-slate-700">
                        <Check size={14} strokeWidth={3} aria-hidden="true" />
                      </span>
                      <span>{item}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </article>

          <aside className={`${theme.darkCard} h-full`}>
            <div className="flex h-full flex-col">
              <p className="text-sm font-black uppercase tracking-[.18em] text-current/75">{overview.sideEyebrow}</p>
              <div className="mt-5 space-y-3">
              {overview.sideCards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-current/15 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs font-black uppercase tracking-[.16em] text-current/65">{card.label}</p>
                  <p className="mt-1 text-base font-extrabold text-current">{card.value}</p>
                </div>
              ))}
            </div>
              <div className="mt-5 rounded-2xl border border-current/15 bg-black/15 p-4">
                <p className="text-sm font-medium leading-6 text-current/75">{overview.sideNote}</p>
              </div>
            </div>
          </aside>
        </section>

        <section className="mt-7">
          <article className={theme.tableCard}>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-slate-500">{amounts.eyebrow}</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{amounts.title}</h2>
              </div>
              <p className="text-sm text-slate-500">{amounts.subtitle}</p>
            </div>

            <div
              className={`mt-6 grid gap-4 ${
                amounts.rows.length === 1
                  ? 'mx-auto max-w-xl grid-cols-1'
                  : '[grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]'
              }`}
            >
              {amounts.rows.map((row) => (
                <div key={row.tier} className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white/80 p-5">
                  <div className="absolute left-0 top-0 h-1.5 w-full bg-slate-200" />
                  <div className="mt-1 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[.16em] text-slate-500">{row.tier}</p>
                      <p className="mt-2 text-2xl font-black text-slate-900">{row.amount ?? row.percentage}</p>
                    </div>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-950/10 text-slate-700 shadow-sm">
                      <Banknote size={20} aria-hidden="true" />
                    </span>
                  </div>
                  <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[.15em] text-slate-500">Detalle</p>
                    <p className="mt-1.5 text-xs font-medium leading-5 text-slate-600">{row.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4">
              <Banknote size={18} className="mt-0.5 shrink-0 text-slate-500" aria-hidden="true" />
              <p className="text-sm font-medium leading-6 text-slate-600">{amounts.note}</p>
            </div>
          </article>
        </section>

        <section className="mt-7">
          <article className={theme.tableCard}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-slate-500">{rates.eyebrow}</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">{rates.title}</h2>
              </div>
              <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-bold text-white shadow-sm">
                <Banknote size={16} aria-hidden="true" />
                {rates.badge}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
              <div className="overflow-x-auto">
                <table className="min-w-[680px] w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-black uppercase tracking-[.14em] text-slate-500">
                    <tr>
                      <th className="px-4 py-3.5">Plazo</th>
                      <th className="px-4 py-3.5">Tasa E.A.</th>
                      <th className="px-4 py-3.5">Tasa N.A.</th>
                      <th className="bg-slate-100 px-4 py-3.5 text-slate-700">{rates.noteTitle}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 bg-white">
                    {rates.rows.map((row) => (
                      <tr key={row.term} className="text-slate-700 transition hover:bg-slate-50">
                        <td className="px-4 py-3.5 font-bold text-slate-900">{row.term}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-700">{row.ea}</td>
                        <td className="px-4 py-3.5 font-medium text-slate-700">{row.na}</td>
                        <td className="bg-slate-50 px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-slate-950 px-3.5 py-1 font-black text-white shadow-sm">
                            {row.monthly}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-white/70 p-4 md:grid-cols-[auto_1fr] md:items-start">
              <span className="rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-black uppercase tracking-[.12em] text-white shadow-sm">
                {rates.noteTitle}
              </span>
              <p className="text-sm font-medium leading-6 text-slate-600">{rates.note}</p>
            </div>
          </article>
        </section>

        <section className="mt-7">
          <article className={theme.tableCard}>
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-950/10 text-slate-700">
                <Banknote size={20} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-slate-500">{summary.eyebrow}</p>
                <h2 className="text-2xl font-black tracking-tight text-slate-900">{summary.title}</h2>
              </div>
            </div>

            <div
              className={`mt-6 grid gap-3 ${
                summary.cards.length === 1
                  ? 'mx-auto max-w-2xl grid-cols-1'
                  : summary.cards.length === 2
                    ? 'mx-auto max-w-3xl grid-cols-1 sm:grid-cols-2'
                    : '[grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]'
              }`}
            >
              {summary.cards.map((card) => (
                <div key={card.label} className="rounded-2xl border border-slate-200 bg-white/80 p-5">
                  <p className="text-xs font-black uppercase tracking-[.15em] text-slate-400">{card.label}</p>
                  <p className="mt-2 text-lg font-black text-slate-900">{card.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{card.description}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className={theme.cta}>
          <div className="relative p-6 sm:p-8">
            <div className="pointer-events-none absolute right-0 top-0 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-[.18em] text-current/70">{cta.eyebrow}</p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-current sm:text-3xl">{cta.title}</h2>
                <p className="mt-2 max-w-2xl font-medium text-current/75">{cta.description}</p>
              </div>

              <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                <Link
                  to={cta.primary.href}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-current/10 bg-white/40 px-5 py-3 font-bold text-current transition hover:bg-white/70 focus-ring"
                >
                  <ArrowLeft size={18} aria-hidden="true" />
                  {cta.primary.label}
                </Link>
                <a
                  href={cta.secondary.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-slate-800 focus-ring"
                >
                  <BadgeCheck size={18} aria-hidden="true" />
                  {cta.secondary.label}
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
