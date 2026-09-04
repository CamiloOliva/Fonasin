import { history } from '../../data/history';
import SectionHeading from '../ui/SectionHeading';
import { CalendarDays, HeartHandshake, Landmark, UsersRound } from 'lucide-react';

const milestoneIcons = [CalendarDays, UsersRound, Landmark, HeartHandshake];

export default function HistorySection() {
  const origin = history[0]!;
  const current = history[1]!;

  return (
    <section className="relative overflow-hidden bg-fonasin-surface py-16">
      <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-fonasin-lime/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-fonasin-green/5 blur-3xl" />
      <div className="container-page">
        <SectionHeading
          eyebrow="Trayectoria"
          title="Nuestra historia"
          text="Conoce los momentos que dieron vida a FONASIN y el compromiso que nos impulsa a seguir creciendo."
          center
        />

        <div className="mx-auto mt-12 grid max-w-6xl gap-6 lg:grid-cols-[1.7fr_1fr] lg:items-start">
          <article className="group relative overflow-hidden rounded-3xl border border-fonasin-green/10 bg-gradient-to-br from-white via-white to-fonasin-surface/70 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8">
            <div className="absolute right-0 top-0 h-36 w-36 rounded-bl-full bg-fonasin-lime/10" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-fonasin-green/10 px-3 py-1.5 text-xs font-black uppercase tracking-[.14em] text-fonasin-green">
                  <CalendarDays size={15} />
                  {origin.year}
                </span>
                <span className="text-sm font-bold text-slate-400">Nuestra raíz solidaria</span>
              </div>
              <h3 className="mt-5 border-l-4 border-fonasin-lime pl-4 text-2xl font-black text-fonasin-deep sm:text-3xl">{origin.title}</h3>
              <p className="mt-2 text-lg font-bold text-fonasin-green">{origin.intro}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {origin.milestones?.map((milestone, index) => {
                  const Icon = milestoneIcons[index]!;
                  return (
                    <div key={milestone.title} className="flex h-full flex-col rounded-2xl border border-slate-100 bg-fonasin-surface/60 p-4">
                      <div className="flex min-h-10 items-start gap-2 text-xs font-black uppercase tracking-wide text-fonasin-green">
                        <Icon size={17} />
                        {milestone.date}
                      </div>
                      <h4 className="mt-3 min-h-12 font-black text-fonasin-deep">{milestone.title}</h4>
                      <p className="mt-2 flex-1 text-justify text-sm leading-6 text-slate-600">{milestone.text}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 space-y-4 border-t border-slate-100 pt-6 text-justify text-[0.98rem] leading-7 text-slate-600">
                {origin.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              <p className="mt-6 rounded-2xl bg-fonasin-deep px-5 py-4 text-base font-bold leading-7 text-white">{origin.closing}</p>
            </div>
          </article>

          <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-fonasin-green/10 bg-gradient-to-br from-white via-white to-fonasin-surface/70 p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg sm:p-8">
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-fonasin-lime/15" />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-black text-fonasin-green">{current.year}</div>
                <HeartHandshake size={22} className="text-fonasin-green" />
              </div>
              <h3 className="mt-3 border-l-4 border-fonasin-lime pl-4 text-2xl font-black text-fonasin-deep">{current.title}</h3>
              <p className="mt-2 text-lg font-bold leading-7 text-fonasin-green">{current.intro}</p>

              <div className="relative mt-7 overflow-hidden rounded-2xl bg-gradient-to-br from-fonasin-deep to-fonasin-green px-5 py-4 text-white shadow-sm">
                <div className="text-3xl font-black text-fonasin-lime">{current.stat}</div>
                <div className="mt-1 text-sm font-medium text-white/75">Una comunidad que crece unida</div>
              </div>

              <div className="mt-7 space-y-4 text-justify text-[0.98rem] leading-7 text-slate-600">
                {current.paragraphs?.slice(1).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              </div>
              <div className="mt-7 overflow-hidden rounded-2xl border border-fonasin-green/10 bg-fonasin-surface shadow-sm">
                <img
                  src="/images/Junta.png"
                  alt="Junta de FONASIN"
                  className="h-48 w-full object-cover sm:h-56"
                />
              </div>
              <p className="mt-7 rounded-2xl border border-fonasin-green/15 bg-fonasin-surface px-5 py-4 text-justify text-sm font-bold leading-6 text-fonasin-deep">{current.closing}</p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}