import { history } from '../../data/history';
import SectionHeading from '../ui/SectionHeading';

export default function HistorySection() {
  return (
    <section className="bg-fonasin-surface py-16">
      <div className="container-page">
        <SectionHeading
          eyebrow="Trayectoria"
          title="Nuestra historia"
          text="Una línea de tiempo preparada para los hitos históricos oficiales de FONASIN."
          center
        />

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-2 md:gap-8 xl:gap-10">
          {history.map((item) => (
            <article
              key={item.title}
              className="relative flex h-full flex-col rounded-2xl border border-fonasin-green/10 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-7"
            >
              <div className="text-sm font-black text-fonasin-green">{item.year}</div>
              <h3 className="mt-3 text-xl font-black text-fonasin-deep">{item.title}</h3>
              <p className="mt-3 flex-1 text-slate-600 leading-7">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
