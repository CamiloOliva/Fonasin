import { useState, type FormEvent } from 'react';
import { KeyRound, Loader2, LogOut, ShieldCheck } from 'lucide-react';

type ForcedPasswordChangeProps = {
  email: string;
  contextLabel: string;
  onSubmit: (payload: {
    currentPassword: string;
    password: string;
    passwordConfirmation: string;
  }) => Promise<void>;
  onLogout: () => Promise<void> | void;
};

export default function ForcedPasswordChange({
  email,
  contextLabel,
  onSubmit,
  onLogout,
}: ForcedPasswordChangeProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [state, setState] = useState<'idle' | 'saving'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirmation) {
      setError('La nueva contrasena y su confirmacion no coinciden.');

      return;
    }

    setState('saving');

    try {
      await onSubmit({ currentPassword, password, passwordConfirmation });
      setCurrentPassword('');
      setPassword('');
      setPasswordConfirmation('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible cambiar la contrasena.');
    } finally {
      setState('idle');
    }
  }

  return (
    <section className="bg-slate-50 py-14">
      <div className="container-page grid gap-7 lg:grid-cols-[.85fr_1.15fr] lg:items-center">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">{contextLabel}</p>
          <h1 className="mt-3 max-w-xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Actualiza tu contrasena para continuar
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            Esta cuenta ingreso con una contrasena temporal. Por seguridad, define una nueva antes de usar las funciones privadas.
          </p>
          <div className="mt-7 rounded-[1.25rem] border border-emerald-100 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
                <ShieldCheck size={21} />
              </div>
              <div>
                <p className="font-black text-slate-950">{email}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Usa minimo 8 caracteres e incluye letras y numeros.
                </p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <KeyRound size={24} />
          </div>
          <h2 className="mt-4 text-2xl font-black text-slate-950">Cambio obligatorio</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Despues de guardar, podras continuar normalmente.
          </p>

          <div className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-bold text-slate-800">Contrasena temporal</span>
              <input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-800">Nueva contrasena</span>
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-800">Confirmar nueva contrasena</span>
              <input
                type="password"
                autoComplete="new-password"
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                minLength={8}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              type="submit"
              disabled={state === 'saving'}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {state === 'saving' ? <Loader2 className="animate-spin" size={18} /> : <KeyRound size={18} />}
              Guardar contrasena
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <LogOut size={18} />
              Salir
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
