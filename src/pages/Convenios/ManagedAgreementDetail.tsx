import { Link, useParams } from 'react-router-dom';
import ConvenioEmi from '../../modules/convenios/ConvenioEmi.jsx';
import ConvenioEmermedica from '../../modules/convenios/ConvenioEmermedica.jsx';
import ConvenioUmaIps from '../../modules/convenios/ConvenioUmaIps.jsx';
import ConvenioGrupoManejar from '../../modules/convenios/ConvenioGrupoManejar.jsx';
import ConvenioPractiCar from '../../modules/convenios/ConvenioPractiCar.jsx';
import ConvenioLosOlivos from '../../modules/convenios/ConvenioLosOlivos.jsx';
import ConvenioSanitas from '../../modules/convenios/ConvenioSanitas.jsx';
import ConvenioCapillasDeLaFe from '../../modules/convenios/ConvenioCapillasDeLaFe.jsx';
import { ConvenioCaribbean, ConvenioLuzMarina } from '../../modules/convenios/ConveniosTurismo';
import { usePublicContent } from '../../hooks/usePublicContent';
import { publicContentMediaUrl } from '../../services/publicContentService';

const originalDetails = {
  emi: ConvenioEmi,
  emermedica: ConvenioEmermedica,
  'uma-ips': ConvenioUmaIps,
  manejar: ConvenioGrupoManejar,
  practicar: ConvenioPractiCar,
  'los-olivos': ConvenioLosOlivos,
  sanitas: ConvenioSanitas,
  coorserpark: ConvenioCapillasDeLaFe,
  'caribbean-sol-y-mar': ConvenioCaribbean,
  'luz-marina-vargas': ConvenioLuzMarina,
};

export default function ManagedAgreementDetail() {
  const { slug } = useParams();
  const resolvedSlug = slug === 'cooserpark' || slug === 'capillas-de-la-fe' ? 'coorserpark' : slug;
  const { content, error, loading } = usePublicContent();
  const agreement = content?.data.find((item) => item.kind === 'agreement' && (item.legacy_detail_slug === resolvedSlug || item.id === resolvedSlug));
  const OriginalDetail = resolvedSlug ? originalDetails[resolvedSlug as keyof typeof originalDetails] : undefined;

  if (loading) return <div className="container-page py-16 text-slate-600">Cargando convenio…</div>;
  if (error) return <div className="container-page py-16 text-slate-600">No fue posible consultar este convenio. Intenta nuevamente más tarde.</div>;
  if (!agreement) return <div className="container-page py-16"><h1 className="text-3xl font-black text-fonasin-deep">Convenio no disponible</h1><Link to="/convenios" className="mt-5 inline-block font-bold text-fonasin-green underline">Volver a convenios</Link></div>;

  // Original rich pages remain only while their seeded record has never been edited.
  // After any administrative change, render exclusively the approved CMS data.
  if (!agreement.legacy_detail_modified && OriginalDetail) return <OriginalDetail />;

  return (
    <main className="container-page py-14">
      <Link to="/convenios" className="font-bold text-fonasin-green underline focus-ring">Volver a convenios</Link>
      <article className="mt-7 grid gap-8 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm md:grid-cols-[minmax(0,14rem)_1fr] md:p-9">
        {agreement.image_url ? <img src={publicContentMediaUrl(agreement.image_url) ?? undefined} alt={`Logo de ${agreement.title}`} className="h-40 w-full rounded-xl object-contain" /> : null}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-fonasin-green">{agreement.category}</p>
          <h1 className="mt-2 font-heading text-3xl font-black text-fonasin-deep">{agreement.title}</h1>
          {agreement.summary ? <p className="mt-5 whitespace-pre-line leading-7 text-slate-700">{agreement.summary}</p> : null}
          {agreement.link_url ? <a href={agreement.link_url} target="_blank" rel="noopener noreferrer" className="mt-6 inline-block rounded-xl bg-fonasin-green px-5 py-3 font-bold text-white focus-ring">Consultar con el aliado</a> : null}
        </div>
      </article>
    </main>
  );
}
