import type { LucideIcon } from 'lucide-react';
import { BadgeDollarSign, HandCoins, Landmark, PiggyBank, ShieldCheck } from 'lucide-react';

export type CreditLine = {
  slug: string;
  number: string;
  name: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  iconSurface: string;
  layout: string;
};

export const creditLines: CreditLine[] = [
  { slug: 'fonalibre', number: '01', name: 'FONALIBRE', description: 'Crédito de libre inversión para atender necesidades personales y familiares.', icon: HandCoins, gradient: 'from-[#b7791f] to-[#f3c969]', iconSurface: 'bg-[#fdf3d7] text-[#9a6416]', layout: 'xl:col-span-3' },
  { slug: 'fonapen', number: '02', name: 'FONAPEN', description: 'Disfruta tu tranquilidad con un crédito diseñado especialmente para ti.', icon: BadgeDollarSign, gradient: 'from-[#7c5319] to-[#dba73f]', iconSurface: 'bg-[#fff7e6] text-[#805718]', layout: 'xl:col-span-3' },
  { slug: 'fonaprima', number: '03', name: 'FONAPRIMA', description: 'No esperes a mitad o fin de año; recibe el anticipo de tu prima sin complicaciones.', icon: Landmark, gradient: 'from-[#9a6416] to-[#f0bf56]', iconSurface: 'bg-[#fff4d6] text-[#9a6416]', layout: 'xl:col-span-2' },
  { slug: 'fonarotativo', number: '04', name: 'FONAROTATIVO', description: 'Liquidez inmediata a tu alcance. Úsalo, págalo y vuelve a disfrutarlo.', icon: ShieldCheck, gradient: 'from-[#5f421b] to-[#c9912f]', iconSurface: 'bg-[#fbf1db] text-[#72501d]', layout: 'xl:col-span-2' },
  { slug: 'fonaportes', number: '05', name: 'FONAPORTES', description: 'Tu propio respaldo. Financiación garantizada con tus aportes sociales.', icon: PiggyBank, gradient: 'from-[#c08a29] to-[#f4cf78]', iconSurface: 'bg-[#fff5df] text-[#9a6416]', layout: 'xl:col-span-2' },
];

export function getCreditLineBySlug(slug: string | undefined) {
  return creditLines.find((line) => line.slug === slug);
}
