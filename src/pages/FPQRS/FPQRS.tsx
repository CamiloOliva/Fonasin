import FPQRSForm from '../../components/forms/FPQRSForm';

export default function FPQRS() {
  return (
    <div className="bg-fonasin-surface py-14">
      <div className="container-page grid items-start gap-10 lg:grid-cols-[0.7fr_1.3fr]">
        <div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-fonasin-green">
            Canales de atencion
          </span>
          <h1 className="mt-2 text-4xl font-black text-fonasin-deep sm:text-5xl">FPQRS</h1>
          <p className="mt-5 text-lg leading-8 text-slate-600">
            Utiliza este formulario para enviar una peticion, queja, reclamo, solicitud o sugerencia.
          </p>
          <div className="mt-7 rounded-2xl border border-emerald-100 bg-white p-5">
            <strong className="text-fonasin-deep">Canal institucional</strong>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              La informacion se remite al correo de atencion al cliente configurado por FONASIN.
            </p>
          </div>
        </div>
        <FPQRSForm />
      </div>
    </div>
  );
}
