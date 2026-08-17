import { Download, ExternalLink, FileText } from 'lucide-react';
import { documents } from '../../data/documents';
import SectionHeading from '../ui/SectionHeading';

export default function DocumentsSection() {
  return (
    <section className="bg-fonasin-surface py-16">
      <div className="container-page">
        <SectionHeading
          eyebrow="Documentos"
          title="Estatutos y reglamentos"
          text="Espacio documental preparado para incorporar los archivos oficiales."
        />
        <div className="mt-9 grid gap-5 md:grid-cols-3">
          {documents.map((document) => (
            <article key={document.id} className="rounded-2xl border bg-white p-6">
              <FileText className="text-fonasin-green" size={30} />
              <h3 className="mt-4 text-xl font-black text-fonasin-deep">{document.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{document.description}</p>
              {document.href ? (
                <div className="mt-5 flex gap-4">
                  <a href={document.href} className="inline-flex items-center gap-1 text-sm font-bold text-fonasin-green">
                    Ver documento <ExternalLink size={16} />
                  </a>
                  <a href={document.href} download className="inline-flex items-center gap-1 text-sm font-bold text-fonasin-green">
                    Descargar <Download size={16} />
                  </a>
                </div>
              ) : (
                <span className="mt-5 inline-flex rounded-full bg-fonasin-surface px-3 py-1.5 text-sm font-bold text-fonasin-deep/70">
                  Pendiente de publicación
                </span>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
