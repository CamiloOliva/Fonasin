const statutesPdfHref = encodeURI('/ESTATUTOS DEFINITIVOS 2024.pdf');
const dataPolicyPdfHref = encodeURI('/Politica_Tratamiento_Datos_Personales_FONASIN_2026.pdf');

export const documents = [
  {
    id: 1,
    title: 'Estatutos',
    description: 'Documento institucional disponible para consulta y descarga.',
    href: statutesPdfHref,
    downloadName: 'ESTATUTOS DEFINITIVOS 2024.pdf',
  },
  {
    id: 2,
    title: 'Reglamentos',
    description: 'Reglamentos institucionales pendientes de publicación.',
    href: null,
  },
  {
    id: 3,
    title: 'Política de tratamiento de datos',
    description: 'Política institucional de tratamiento de datos personales disponible para consulta y descarga.',
    href: dataPolicyPdfHref,
    downloadName: 'Politica_Tratamiento_Datos_Personales_FONASIN_2026.pdf',
  },
];
