export type Flyer = {
  id: number;
  title: string;
  description: string;
  date: string;
  image: string;
  link: string;
};

export const flyers: Flyer[] = [
  {
    id: 1,
    title: 'Información FONASIN',
    description: 'Espacio reservado para campañas y comunicaciones institucionales.',
    date: 'Contenido provisional',
    image: '/flyer1.png',
    link: '#',
  },
  {
    id: 2,
    title: 'Bienestar para nuestros asociados',
    description: 'Contenido visual administrable para futuras campañas.',
    date: 'Contenido provisional',
    image: '/flyer2.png',
    link: '#',
  },
  {
    id: 3,
    title: 'Beneficios y convenios',
    description: 'Aquí podrán destacarse novedades y beneficios vigentes.',
    date: 'Contenido provisional',
    image: '/flyer3.png',
    link: '#',
  },
];
