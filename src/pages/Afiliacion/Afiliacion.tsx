import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AffiliationForm from '../../components/forms/AffiliationForm';

export type AffiliationFlow = 'initial_affiliation' | 'data_update' | 'profile_completion';

type AfiliacionProps = {
  flow?: AffiliationFlow;
};

const flowContent: Record<AffiliationFlow, { eyebrow: string; title: string; description: string }> = {
  initial_affiliation: {
    eyebrow: 'Afiliacion',
    title: 'Formulario de afiliacion',
    description: 'Complete la solicitud con los datos personales, laborales, financieros y de cumplimiento que exige el proceso de vinculacion.',
  },
  data_update: {
    eyebrow: 'Portal asociado',
    title: 'Actualizar datos',
    description: 'Revise y actualice la informacion de su formulario. Sus documentos y la libranza existente no seran reemplazados.',
  },
  profile_completion: {
    eyebrow: 'Primer ingreso',
    title: 'Completar perfil',
    description: 'Complete la informacion requerida para habilitar su perfil de asociado. Este proceso genera solamente el formulario interno.',
  },
};

export default function Afiliacion({ flow = 'initial_affiliation' }: AfiliacionProps) {
  const content = flowContent[flow];
  const isPortalFlow = flow !== 'initial_affiliation';

  return (
    <div className="bg-[#f6f7f2] py-12 sm:py-16">
      <div className="container-page space-y-8">
        <div className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
          <Link
            to={isPortalFlow ? '/portal-asociado' : '/'}
            className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <ArrowLeft size={16} /> {isPortalFlow ? 'Volver al portal' : 'Volver al inicio'}
          </Link>

          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
              {content.eyebrow}
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              {content.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              {content.description}
            </p>
          </div>
        </div>

        <AffiliationForm flow={flow} />
      </div>
    </div>
  );
}
