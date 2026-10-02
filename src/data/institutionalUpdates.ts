// Publicar aqui solo contenido y documentos aprobados por FONASIN.
// El sitio no incluye un CMS en el alcance actual.
export type NewsItem = {
  id: string;
  title: string;
  summary: string;
  publishedAt: string;
  href?: string;
};

export type SocialBalanceReport = {
  year: number;
  title: string;
  description: string;
  href: string;
};

export const newsItems: NewsItem[] = [];
export const socialBalanceReports: SocialBalanceReport[] = [];
