import { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePublicContent } from '../../hooks/usePublicContent';
import { publicContentMediaUrl } from '../../services/publicContentService';

export default function FlyerCarousel() {
  const { content } = usePublicContent();
  const flyers = content?.data.filter((item) => item.kind === 'banner' && item.image_url) ?? [];
  const [index, setIndex] = useState(0);
  const next = useCallback(() => setIndex((current) => (current + 1) % Math.max(flyers.length, 1)), [flyers.length]);

  useEffect(() => {
    if (flyers.length < 2) return;
    const id = window.setInterval(next, 6500);
    return () => clearInterval(id);
  }, [next, flyers.length]);

  const flyer = flyers[index % Math.max(flyers.length, 1)];
  const previous = () => setIndex((current) => (current - 1 + flyers.length) % Math.max(flyers.length, 1));

  if (!flyer) return null;
  const image = publicContentMediaUrl(flyer.image_url) ?? '';

  return (
    <section className="bg-fonasin-deep" aria-label="Comunicaciones destacadas">
      <div className="relative isolate overflow-hidden">
        <div
          className="relative flex h-[clamp(240px,34vw,520px)] items-center justify-center overflow-hidden bg-fonasin-deep/95 px-2 sm:px-4"
          style={{ backgroundImage: `url(${image})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
        >
          <div className="pointer-events-none absolute inset-0 scale-110 bg-fonasin-deep/55 backdrop-blur-2xl" />
          <div className="pointer-events-none absolute inset-0 bg-fonasin-deep/35" />
          <img
            src={image}
            alt={flyer.title}
            className="relative z-10 block h-full w-full object-contain object-center drop-shadow-[0_10px_22px_rgba(0,0,0,0.2)]"
          />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-fonasin-deep/25 to-transparent" />
        {(flyer.title || flyer.summary) && <div className="absolute bottom-12 left-1/2 z-20 w-[min(90%,40rem)] -translate-x-1/2 rounded-2xl bg-fonasin-deep/80 px-5 py-3 text-center text-white shadow-lg backdrop-blur-sm">
          <p className="text-base font-black sm:text-xl">{flyer.title}</p>
          {flyer.summary && <p className="mt-1 hidden text-sm sm:block">{flyer.summary}</p>}
          {flyer.link_url && <a href={flyer.link_url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block rounded-lg bg-fonasin-lime px-3 py-1 text-xs font-bold text-fonasin-deep focus-ring">Conocer más</a>}
        </div>}
        {flyers.length > 1 && <button onClick={previous} aria-label="Flyer anterior" className="absolute left-4 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/90 text-fonasin-deep shadow-lg transition hover:scale-105 hover:bg-white focus-ring sm:left-6 sm:h-12 sm:w-12">
          <ChevronLeft size={22} />
        </button>}
        {flyers.length > 1 && <button onClick={next} aria-label="Siguiente flyer" className="absolute right-4 top-1/2 z-30 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/30 bg-white/90 text-fonasin-deep shadow-lg transition hover:scale-105 hover:bg-white focus-ring sm:right-6 sm:h-12 sm:w-12">
          <ChevronRight size={22} />
        </button>}
        <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 gap-2" aria-label="Seleccionar flyer">
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
