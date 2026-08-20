type CreditLoadingOverlayProps = {
  isLoading: boolean;
  message?: string;
};

function PiggyVideo() {
  return (
    <div className="relative mx-auto flex h-44 w-full max-w-[15rem] items-center justify-center">
      <div className="credit-loader-coin absolute left-1/2 top-2 h-6 w-6 -translate-x-1/2 rounded-full border-2 border-[#b7791f] bg-gradient-to-br from-[#fef3c7] via-[#f5cc72] to-[#d99e2f] shadow-[0_0_0_6px_rgba(247,201,94,0.12)] motion-reduce:animate-none" />

      <div className="relative h-40 w-40 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_18px_28px_rgba(0,0,0,0.18)]">
        <video
          className="credit-loader-video h-full w-full object-cover motion-reduce:animate-none"
          src="/images/Cerdito.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          aria-label="Cerdito alcancía animado"
        />
      </div>
    </div>
  );
}

export default function CreditLoadingOverlay({ isLoading, message = 'Cargando los créditos disponibles...' }: CreditLoadingOverlayProps) {
  if (!isLoading) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/55 px-5 text-white backdrop-blur-sm animate-[credit-loader-fade-in_180ms_ease-out] motion-reduce:animate-none"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="w-full max-w-sm rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(5,34,22,0.92),rgba(0,61,34,0.88))] px-6 py-7 text-center shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]">
        <PiggyVideo />
        <p className="mt-2 text-[0.7rem] font-black uppercase tracking-[.28em] text-fonasin-lime/90">Cargando créditos</p>
        <h2 className="mt-2 text-2xl font-black tracking-tight text-white">{message}</h2>

        <div className="mt-5" aria-hidden="true">
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
            <div className="credit-loader-bar h-full w-2/3 rounded-full bg-[linear-gradient(90deg,#c3c91b_0%,#f5cc72_50%,#ffffff_100%)]" />
          </div>
          <div className="mt-3 flex justify-center gap-1.5">
            <span className="credit-loader-dot h-2.5 w-2.5 rounded-full bg-fonasin-lime" />
            <span className="credit-loader-dot h-2.5 w-2.5 rounded-full bg-[#f5cc72] [animation-delay:140ms]" />
            <span className="credit-loader-dot h-2.5 w-2.5 rounded-full bg-white/90 [animation-delay:280ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}
