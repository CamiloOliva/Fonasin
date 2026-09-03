import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { flyers } from '../../data/flyers';

export default function FlyerCarousel() {
  const [index, setIndex] = useState(0);
  const next = useCallback(() => setIndex((current) => (current + 1) % flyers.length), []);

  useEffect(() => {
    const id = window.setInterval(next, 6500);
    return () => clearInterval(id);
  }, [next]);

  const flyer = flyers[index];
  const previous = () => setIndex((current) => (current - 1 + flyers.length) % flyers.length);

  return (
    <section className="bg-fonasin-deep" aria-label="Comunicaciones destacadas">
      <div className="relative isolate overflow-hidden">
        <div className="relative flex min-h-[clamp(240px,34vw,520px)] items-center justify-center overflow-hidden bg-fonasin-deep/95 px-2 sm:px-4">
          <img
            src={flyer.image}
            alt={flyer.title}
            className="block h-auto max-h-[70vh] w-full object-contain object-center"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-fonasin-deep/25 to-transparent" />
        <button onClick={previous} aria-label="Flyer anterior" className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/90 text-fonasin-deep shadow-lg transition hover:scale-105 hover:bg-white focus-ring sm:left-6 sm:h-12 sm:w-12">
          <ChevronLeft size={22} />
        </button>
        <button onClick={next} aria-label="Siguiente flyer" className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/90 text-fonasin-deep shadow-lg transition hover:scale-105 hover:bg-white focus-ring sm:right-6 sm:h-12 sm:w-12">
          <ChevronRight size={22} />
        </button>
        <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2" aria-label="Seleccionar flyer">
          {flyers.map((item, itemIndex) => (
            <button
              key={item.id}
              aria-label={`Ir al flyer ${itemIndex + 1}`}
              onClick={() => setIndex(itemIndex)}
              className={`h-2.5 rounded-full transition-all focus-ring ${itemIndex === index ? 'w-8 bg-fonasin-lime' : 'w-2.5 bg-white/70 hover:bg-white'}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
