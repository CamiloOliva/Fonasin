import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, CreditCard, Loader2, LogOut, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import ForcedPasswordChange from '../../components/auth/ForcedPasswordChange';
import {
  changeOwnPassword,
  currentPortalUser,
  fetchPortalCredits,
  loginPortal,
  logoutPortal,
  type PortalCredit,
  type PortalUser,
} from '../../services/portalService';

type SessionState = 'checking' | 'guest' | 'authenticated';
type CreditsState = 'idle' | 'loading' | 'ready' | 'error';

const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

function formatMoney(value: string): string {
  const amount = Number.parseFloat(value);

  return Number.isFinite(amount) ? currency.format(amount) : value;
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Activo',
    settled: 'Pagado',
    archived: 'Archivado',
  };

  return labels[status] ?? status;
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    reviewer: 'Revisor',
    associate: 'Asociado',
  };

  return labels[role] ?? role;
}

function ensureAssociatePortalUser(user: PortalUser): PortalUser {
  if (!user.roles.includes('associate')) {
    throw new Error('Tu usuario no tiene acceso al portal asociado.');
  }

  return user;
}

export default function PortalAsociado() {
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [creditsState, setCreditsState] = useState<CreditsState>('idle');
  const [user, setUser] = useState<PortalUser | null>(null);
  const [credits, setCredits] = useState<PortalCredit[]>([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalBalance = useMemo(
    () => credits.reduce((total, credit) => total + Number.parseFloat(credit.current_balance || '0'), 0),
    [credits],
  );

  async function loadCredits() {
    setCreditsState('loading');
    setError(null);

    try {
      const result = await fetchPortalCredits();
      setCredits(result);
      setCreditsState('ready');
    } catch (caught) {
      setCredits([]);
      setCreditsState('error');
      setError(caught instanceof Error ? caught.message : 'No fue posible cargar tus creditos.');
    }
  }

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const currentUser = ensureAssociatePortalUser(await currentPortalUser());
        if (!active) return;
        setUser(currentUser);
        setSessionState('authenticated');
        if (!currentUser.must_change_password) {
          await loadCredits();
        }
      } catch {
        if (!active) return;
        setSessionState('guest');
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSessionState('checking');

    try {
      const loggedUser = ensureAssociatePortalUser(await loginPortal({ email, password, remember }));
      setUser(loggedUser);
      setSessionState('authenticated');
      setPassword('');
      setMessage('Sesion iniciada correctamente.');
      if (!loggedUser.must_change_password) {
        await loadCredits();
      }
    } catch (caught) {
      await logoutPortal().catch(() => undefined);
      setUser(null);
      setCredits([]);
      setSessionState('guest');
      setCreditsState('idle');
      setError(caught instanceof Error ? caught.message : 'No fue posible iniciar sesion.');
    }
  }

  async function handleLogout() {
    setError(null);
    setMessage(null);

    try {
      await logoutPortal();
    } catch {
      // La sesion visual se limpia aunque el backend ya no tenga una sesion activa.
    }

    setUser(null);
    setCredits([]);
    setEmail('');
    setPassword('');
    setRemember(false);
    setSessionState('guest');
    setCreditsState('idle');
    setMessage('Sesion cerrada.');
  }

  async function handlePasswordChange(payload: {
    currentPassword: string;
    password: string;
    passwordConfirmation: string;
  }) {
    const updatedUser = await changeOwnPassword(payload);
    setUser(updatedUser);
    setMessage('Contrasena actualizada correctamente.');
    await loadCredits();
  }

  if (sessionState === 'checking') {
    return (
      <section className="min-h-[58vh] bg-slate-50 py-16">
        <div className="container-page grid place-items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-5 py-4 text-sm font-bold text-emerald-700 shadow-sm">
            <Loader2 className="animate-spin" size={18} />
            Validando sesion del portal
          </div>
        </div>
      </section>
    );
  }

  if (sessionState === 'guest') {
    return (
      <section className="portal-login-scene relative min-h-[calc(100vh-5rem)] overflow-hidden bg-slate-950 bg-[url(/Fondo.png)] bg-cover bg-center py-10 sm:py-14">
        <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-[1px]" /><div className="portal-login-light pointer-events-none absolute -left-24 top-[-20%] h-[145%] w-[48%]" /><div className="absolute inset-0 bg-gradient-to-r from-amber-50/65 via-white/20 to-transparent" /><div className="container-page relative grid min-h-[calc(100vh-5rem)] gap-7 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div className="portal-login-content relative rounded-[2rem] border border-white/40 bg-white/25 p-5 shadow-lg shadow-slate-950/10 backdrop-blur-[3px] sm:p-7">
            <div className="mb-7 grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-white/70 bg-white/85 p-2 shadow-xl backdrop-blur sm:h-20 sm:w-20"><img src="/logotipo.png" alt="Logo FONASIN" className="max-h-full max-w-full object-contain" /></div><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-900">Portal asociado</p>
            <h1 className="mt-3 max-w-xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Consulta tus creditos y servicios en linea
            </h1>
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
              Ingresa con tu usuario registrado para consultar la informacion asociada a tu perfil FONASIN.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/60 bg-slate-900/35 p-5 text-white shadow-lg backdrop-blur-md">
                <ShieldCheck className="text-fonasin-lime" size={24} />
                <p className="mt-3 font-black text-white drop-shadow-sm">Acceso protegido</p>
                <p className="mt-1 text-sm leading-6 text-white drop-shadow-sm">El portal usa sesion Laravel y roles registrados.</p>
              </div>
              <div className="rounded-2xl border border-white/60 bg-slate-900/35 p-5 text-white shadow-lg backdrop-blur-md">
                <CreditCard className="text-fonasin-lime" size={24} />
                <p className="mt-3 font-black text-white drop-shadow-sm">Creditos asociados</p>
                <p className="mt-1 text-sm leading-6 text-white drop-shadow-sm">Consulta saldos y condiciones de tus creditos activos.</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="portal-login-card rounded-[2rem] border border-white/70 bg-white/75 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.28)] backdrop-blur-xl sm:p-8">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <UserRound size={24} />
            </div>
            <h2 className="mt-4 text-2xl font-black text-slate-950">Iniciar sesion</h2>
            <p className="mt-2 text-sm leading-6 text-slate-800">Usa el correo y contrasena asignados por FONASIN.</p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-950">Correo electronico</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
              <label className="block">
                <span className="text-sm font-bold text-slate-950">Contrasena</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </label>
              <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Mantener sesion iniciada
              </label>
              <Link
                to="/recuperar-contrasena?from=portal"
                className="inline-flex rounded-md px-1 text-sm font-bold text-emerald-900 underline decoration-emerald-700/40 underline-offset-4 hover:text-emerald-950 focus-ring"
              >
                Olvide mi contrasena
              </Link>
            </div>

            {error ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
            {message ? <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</p> : null}

            <button
              type="submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-600 to-lime-500 px-5 py-3.5 text-base font-black text-white shadow-lg shadow-emerald-700/25 transition hover:from-emerald-700 hover:to-emerald-600 focus-ring"
            >
              Entrar al portal <ArrowRight size={18} />
            </button>
          </form>
        </div>
      </section>
    );
  }

  if (user?.must_change_password) {
    return (
      <ForcedPasswordChange
        email={user.email}
        contextLabel="Portal asociado"
        onSubmit={handlePasswordChange}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <section className="relative overflow-hidden bg-[#f5f7e8] py-10 sm:py-14"><div className="pointer-events-none absolute -right-32 top-10 h-72 w-72 rounded-full bg-fonasin-lime/20 blur-3xl" /><div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-fonasin-green/10 blur-3xl" />
      <div className="container-page relative space-y-7">
        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_20px_55px_rgba(13,71,56,0.10)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-7 grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-white/70 bg-white/85 p-2 shadow-xl backdrop-blur sm:h-20 sm:w-20"><img src="/logotipo.png" alt="Logo FONASIN" className="max-h-full max-w-full object-contain" /></div><p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-900">Portal asociado</p>
              <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-fonasin-deep sm:text-4xl">Hola, {user?.email}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {(user?.roles ?? []).map((role) => (
                  <span key={role} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                    {roleLabel(role)}
                  </span>
                ))}
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-fonasin-green/20 bg-white px-5 py-3 text-sm font-bold text-fonasin-deep transition hover:border-fonasin-green hover:bg-fonasin-surface focus-ring"
            >
              <LogOut size={18} />
              Cerrar sesion
            </button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-fonasin-deep via-fonasin-green to-emerald-600 p-6 text-white shadow-lg shadow-fonasin-green/20">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100">Saldo actual</p>
            <p className="mt-3 font-heading text-3xl font-black">{currency.format(totalBalance)}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-fonasin-deep/5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Creditos activos</p>
            <p className="mt-3 text-3xl font-black text-slate-950">{credits.length}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-6 shadow-lg shadow-fonasin-deep/5 backdrop-blur">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Estado</p>
            <p className="mt-3 text-lg font-black text-emerald-700">Sesion protegida</p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/80 bg-white/95 p-5 shadow-[0_20px_55px_rgba(13,71,56,0.10)] sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Mis creditos</p>
              <h2 className="mt-1 font-heading text-2xl font-black text-fonasin-deep sm:text-3xl">Resumen de creditos registrados</h2>
            </div>
            <button
              type="button"
              onClick={loadCredits}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-fonasin-green/20 bg-fonasin-surface px-4 py-2.5 text-sm font-bold text-fonasin-green transition hover:bg-fonasin-lime/20 focus-ring"
            >
              <RefreshCw size={16} />
              Actualizar
            </button>
          </div>

          {creditsState === 'loading' ? (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
              <Loader2 className="animate-spin" size={18} />
              Cargando creditos
            </div>
          ) : null}

          {creditsState === 'error' ? (
            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
              {error ?? 'No fue posible cargar tus creditos.'}
            </div>
          ) : null}

          {creditsState === 'ready' && credits.length === 0 ? (
            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
              <p className="font-black text-slate-950">Aun no tienes creditos activos registrados.</p>
              <p className="mt-2 text-sm text-slate-600">Cuando FONASIN registre un credito asociado a tu perfil, aparecera aqui.</p>
            </div>
          ) : null}

          {creditsState === 'ready' && credits.length > 0 ? (
            <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.16em] text-slate-500">
                    <th className="py-3 pr-4">Linea</th>
                    <th className="py-3 pr-4">Saldo inicial</th>
                    <th className="py-3 pr-4">Saldo actual</th>
                    <th className="py-3 pr-4">Cuota</th>
                    <th className="py-3 pr-4">Plazo</th>
                    <th className="py-3 pr-4">Tasa</th>
                    <th className="py-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {credits.map((credit) => (
                    <tr key={credit.id} className="border-b border-slate-200/70 transition hover:bg-white last:border-b-0">
                      <td className="py-4 pr-4 font-black text-slate-950">{credit.credit_line}</td>
                      <td className="py-4 pr-4 text-slate-700">{formatMoney(credit.initial_balance)}</td>
                      <td className="py-4 pr-4 font-bold text-slate-950">{formatMoney(credit.current_balance)}</td>
                      <td className="py-4 pr-4 text-slate-700">{formatMoney(credit.installment_amount)}</td>
                      <td className="py-4 pr-4 text-slate-700">{credit.term_months} meses</td>
                      <td className="py-4 pr-4 text-slate-700">{credit.interest_rate}%</td>
                      <td className="py-4">
                        <span className="rounded-full bg-fonasin-surface px-3 py-1 text-xs font-bold text-fonasin-green">
                          {statusLabel(credit.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
