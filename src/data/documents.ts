export type DocumentCategory = 'institutional' | 'regulations' | 'financial' | 'data';

export type InstitutionalDocument = {
  id: string;
  category: DocumentCategory;
  title: string;
  description: string;
  href: string;
  downloadName: string;
};

const documentHref = (path: string) => encodeURI(path);

export const documents: InstitutionalDocument[] = [
  {
    id: 'statutes',
    category: 'institutional',
    title: 'Estatutos definitivos 2024',
    description: 'Documento institucional que establece la estructura y el funcionamiento de FONASIN.',
    href: documentHref('/ESTATUTOS DEFINITIVOS 2024.pdf'),
    downloadName: 'ESTATUTOS DEFINITIVOS 2024.pdf',
  },
  {
    id: 'credit-manual',
    category: 'regulations',
    title: 'Manual de líneas de crédito',
    description: 'Condiciones, requisitos y características de las líneas de crédito vigentes.',
    href: documentHref('/documents/manual-lineas-credito-fonasin-2026.pdf'),
    downloadName: 'Manual de lineas de credito FONASIN 2026.pdf',
  },
  {
    id: 'credit-regulation',
    category: 'regulations',
    title: 'Reglamento de crédito y administración de cartera',
    description: 'Reglas generales para el otorgamiento, seguimiento y recuperación de cartera.',
    href: documentHref('/documents/reglamento-credito-cartera-fonasin-2026.pdf'),
    downloadName: 'Reglamento de credito y administracion de cartera FONASIN 2026.pdf',
  },
  {
    id: 'financial-statements-2025',
    category: 'financial',
    title: 'Estados financieros 2025',
    description: 'Estados financieros institucionales correspondientes a la vigencia 2025.',
    href: documentHref('/documents/estados-financieros-fonasin-2025.pdf'),
    downloadName: 'Estados financieros FONASIN 2025.pdf',
  },
  {
    id: 'data-policy',
    category: 'data',
    title: 'Política de tratamiento de datos personales',
    description: 'Política institucional vigente para el tratamiento y protección de datos personales.',
    href: documentHref('/Politica_Tratamiento_Datos_Personales_FONASIN_2026.pdf'),
    downloadName: 'Politica de tratamiento de datos personales FONASIN 2026.pdf',
  },
];
