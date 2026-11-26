import { useEffect, useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id' | 'className'> & {
  label: string;
};

export default function PasswordField({ label, value, disabled, ...props }: PasswordFieldProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  useEffect(() => { if (value === '') setVisible(false); }, [value]);

  return <div>
    <label htmlFor={id} className="block text-sm font-bold text-slate-800">{label}</label>
    <div className="relative mt-2">
      <input {...props} id={id} value={value} disabled={disabled} type={visible ? 'text' : 'password'}
        className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-4 pr-14 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100 disabled:opacity-60" />
      <button type="button" disabled={disabled} onClick={() => setVisible(current => !current)}
        aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} aria-pressed={visible} aria-controls={id}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-slate-600 transition hover:text-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600 disabled:opacity-50">
        {visible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
      </button>
    </div>
  </div>;
}
