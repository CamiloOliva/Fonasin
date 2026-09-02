import { Headphones, LockKeyhole, MessageCircle, ShieldCheck } from 'lucide-react';
import FPQRSForm from '../../components/forms/FPQRSForm';

const highlights = [
  { icon: MessageCircle, title: 'Te escuchamos', description: 'Tu opinion es importante para nosotros.' },
  { icon: ShieldCheck, title: 'Respuesta oportuna', description: 'Gestionamos tu solicitud con compromiso.' },
  { icon: LockKeyhole, title: 'Confidencialidad', description: 'Manejamos tu informacion con seguridad.' },
];

export default function FPQRS() {
  return (
    <main className="relative isolate overflow-hidden bg-[#fbfaf2]">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -right-32 -top-52 h-[34rem] w-[48rem] rotate-[20deg] rounded-[50%] border border-fonasin-lime/50" />
        <div className="absolute -right-28 -top-64 h-[34rem] w-[48rem] rotate-[20deg] rounded-[50%] border border-fonasin-green/30" />
        <div className="absolute -bottom-56 -left-40 h-[22rem] w-[55rem] -rotate-[8deg] rounded-[50%] bg-fonasin-deep" />
        <div className="absolute -bottom-48 -left-36 h-60 w-[54rem] -rotate-[8deg] rounded-[50%] bg-fonasin-green" />
        <div className="absolute -bottom-40 -left-28 h-52 w-[52rem] -rotate-[8deg] rounded-[50%] bg-fonasin-lime" />
      </div>
      <div className="container-page relative z-10 grid min-h-[calc(100vh-5rem)] items-center gap-12 py-14 lg:grid-cols-[0.88fr_1.12fr] lg:gap-16 lg:py-20">
        <section className="relative z-10 max-w-xl pb-10 lg:pb-24">
          <div className="flex items-center gap-2 text-fonasin-deep"><Headphones size={20} strokeWidth={2.5} aria-hidden="true" /><span className="text-xs font-black uppercase tracking-[0.22em]">FPQRS</span></div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.26em] text-slate-600">Canales de atencion</p>
          <h1 className="mt-12 max-w-md font-heading text-6xl font-black leading-[0.92] tracking-[-0.05em] text-fonasin-deep sm:text-7xl">Tu voz<span className="block text-fonasin-green">nos impulsa</span></h1>
          <div className="mt-5 h-2 w-48 rotate-[-3deg] rounded-[50%] border-t-4 border-fonasin-green sm:w-64" />
          <p className="mt-8 max-w-md text-lg leading-8 text-slate-700 sm:text-xl">Utiliza este formulario para preparar una <strong className="text-fonasin-green">peticion, queja, reclamo</strong> o <strong className="text-fonasin-green">sugerencia.</strong></p>
          <div className="mt-12 space-y-7">
            {highlights.map(({ icon: Icon, title, description }) => (
              <div key={title} className="flex items-center gap-4">
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-gradient-to-br from-fonasin-green to-fonasin-deep text-white shadow-lg shadow-fonasin-deep/20 ring-4 ring-white/70"><Icon size={27} strokeWidth={2.2} aria-hidden="true" /></div>
                <div className="border-l-2 border-fonasin-green/70 pl-4"><h2 className="font-heading text-lg font-black text-fonasin-deep">{title}</h2><p className="text-sm leading-5 text-slate-600">{description}</p></div>
              </div>
            ))}
          </div>
        </section>
        <FPQRSForm />
      </div>
    </main>
  );
}
