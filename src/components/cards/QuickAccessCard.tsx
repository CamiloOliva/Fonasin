import { ArrowRight, HandCoins, HeartHandshake, MessageSquareText, WalletCards } from 'lucide-react';
import { Link } from 'react-router-dom';

const icons = {
  Ahorros: WalletCards,
  Créditos: HandCoins,
  Convenios: HeartHandshake,
  FPQRS: MessageSquareText,
} as const;

type QuickAccessCardProps = {
  title: keyof typeof icons;
  description: string;
  to: string;
  state?: unknown;
};

export default function QuickAccessCard({ title, description, to, state }: QuickAccessCardProps) {
  const Icon = icons[title];

  return (
    <Link
      to={to}
      state={state}
      className="group block rounded-2xl border border-fonasin-green/10 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-fonasin-surface text-fonasin-green">
        <Icon size={25} />
      </div>
      <h3 className="mt-5 text-xl font-bold text-fonasin-deep">{title}</h3>
      <p className="mt-2 leading-6 text-slate-600">{description}</p>
      <span className="mt-5 inline-flex items-center gap-2 font-bold text-fonasin-green">
        Conocer más <ArrowRight size={18} className="transition group-hover:translate-x-1" />
      </span>
    </Link>
  );
}
