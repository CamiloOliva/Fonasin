import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, CreditCard, FileText, Loader2, LogOut, PiggyBank, RefreshCw, ShieldCheck, UserRound } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import ForcedPasswordChange from '../../components/auth/ForcedPasswordChange';
import {
  changeOwnPassword,
  currentPortalUser,
  fetchPortalAffiliation,
  fetchPortalCredits,
  loginPortal,
  logoutPortal,
  portalDocumentPreviewUrl,
  startPortalAffiliationUpdate,
  type PortalAffiliation,
  type PortalAffiliationDocument,
  type PortalAffiliationUpdateDraft,
  type PortalCredit,
  type PortalUser,
} from '../../services/portalService';

type SessionState = 'checking' | 'guest' | 'authenticated';
type CreditsState = 'idle' | 'loading' | 'ready' | 'error';
type AffiliationState = 'idle' | 'loading' | 'ready' | 'error';
type PortalTab = 'statement' | 'contributions' | 'form';
const AFFILIATION_DRAFT_STORAGE_KEY = 'fonasin.affiliation.draft.v1';

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

function affiliationStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    enabled: 'Afiliacion habilitada',
    approved: 'Aprobada',
    submitted: 'Enviada',
    under_review: 'En revision',
  };

  return labels[status] ?? status;
}

function documentLabel(documentType: string): string {
  const labels: Record<string, string> = {
    affiliation_summary: 'Formulario de afiliacion',
    payroll_authorization: 'Libranza',
  };

  return labels[documentType] ?? documentType;
}

function formatPortalDate(value: string | null): string {
  if (!value) return 'Sin fecha';

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
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

function storeAffiliationUpdateDraft(draft: PortalAffiliationUpdateDraft): void {
  try {
    window.localStorage.setItem(AFFILIATION_DRAFT_STORAGE_KEY, JSON.stringify({
      savedAt: Date.now(),
      id: draft.id,
      readUrl: draft.links.read,
      draftAccessToken: draft.draft_access_token,
      status: draft.status,
    }));
  } catch {
    // El asociado puede abrir el formulario aunque el navegador bloquee storage local.
  }
}

export default function PortalAsociado() {
  const navigate = useNavigate();
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [creditsState, setCreditsState] = useState<CreditsState>('idle');
  const [affiliationState, setAffiliationState] = useState<AffiliationState>('idle');
  const [user, setUser] = useState<PortalUser | null>(null);
  const [credits, setCredits] = useState<PortalCredit[]>([]);
  const [affiliation, setAffiliation] = useState<PortalAffiliation | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [activeTab, setActiveTab] = useState<PortalTab>('statement');
  const [startingUpdate, setStartingUpdate] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const totalBalance = useMemo(
    () => credits.reduce((total, credit) => total + Number.parseFloat(credit.current_balance || '0'), 0),
    [credits],
  );
  const totalInitialBalance = useMemo(
    () => credits.reduce((total, credit) => total + Number.parseFloat(credit.initial_balance || '0'), 0),
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

  async function loadAffiliation() {
    setAffiliationState('loading');
    setError(null);

    try {
      const result = await fetchPortalAffiliation();
      setAffiliation(result);
      setAffiliationState('ready');
    } catch (caught) {
      setAffiliation(null);
      setAffiliationState('error');
      setError(caught instanceof Error ? caught.message : 'No fue posible cargar tu formulario.');
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

  useEffect(() => {
    if (
      sessionState === 'authenticated'
      && !user?.must_change_password
      && activeTab === 'form'
      && affiliationState === 'idle'
    ) {
      void loadAffiliation();
    }
  }, [activeTab, affiliationState, sessionState, user?.must_change_password]);

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
      setAffiliation(null);
      setSessionState('guest');
      setCreditsState('idle');
      setAffiliationState('idle');
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
    setAffiliation(null);
    setEmail('');
    setPassword('');
    setRemember(false);
    setSessionState('guest');
    setCreditsState('idle');
    setAffiliationState('idle');
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

  async function handleStartAffiliationUpdate() {
    setStartingUpdate(true);
    setError(null);
    setMessage(null);

    try {
      const updateDraft = await startPortalAffiliationUpdate();
      storeAffiliationUpdateDraft(updateDraft);
      navigate('/afiliacion');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible preparar la actualizacion de datos.');
    } finally {
      setStartingUpdate(false);
    }
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
    <section className="bg-slate-50 py-8 sm:py-10">
      <div className="container-page space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border border-emerald-100 bg-white p-2 shadow-sm">
                <img src="/logotipo.png" alt="Logo FONASIN" className="max-h-full max-w-full object-contain" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-fonasin-green">Portal asociado</p>
                <h1 className="mt-2 font-heading text-3xl font-black tracking-tight text-fonasin-deep sm:text-4xl">
                  Hola, {user?.email}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(user?.roles ?? []).map((role) => (
                    <span key={role} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                      {roleLabel(role)}
                    </span>
                  ))}
                </div>
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

        <div className="grid gap-4 lg:grid-cols-4">
          <div className="rounded-xl bg-fonasin-green p-5 text-white shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">Saldo actual</p>
            <p className="mt-3 font-heading text-3xl font-black">{currency.format(totalBalance)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Saldo inicial</p>
            <p className="mt-3 text-2xl font-black text-slate-950">{currency.format(totalInitialBalance)}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Creditos activos</p>
            <p className="mt-3 text-3xl font-black text-slate-950">{credits.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Estado</p>
            <p className="mt-3 text-lg font-black text-emerald-700">Sesion protegida</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-3">
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { id: 'statement' as const, label: 'Estado de cuenta', icon: CreditCard },
                { id: 'contributions' as const, label: 'Aportes', icon: PiggyBank },
                { id: 'form' as const, label: 'Formulario', icon: FileText },
              ].map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition focus-ring ${
                      selected
                        ? 'bg-fonasin-green text-white shadow-sm'
                        : 'bg-slate-50 text-slate-600 hover:bg-fonasin-surface hover:text-fonasin-deep'
                    }`}
                  >
                    <Icon size={18} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {activeTab === 'statement' ? (
            <div className="p-5 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Estado de cuenta</p>
                  <h2 className="mt-1 font-heading text-2xl font-black text-fonasin-deep sm:text-3xl">Creditos registrados</h2>
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
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
                  <Loader2 className="animate-spin" size={18} />
                  Cargando creditos
                </div>
              ) : null}

              {creditsState === 'error' ? (
                <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
                  {error ?? 'No fue posible cargar tus creditos.'}
                </div>
              ) : null}

              {creditsState === 'ready' && credits.length === 0 ? (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center">
                  <CreditCard className="mx-auto text-slate-300" size={36} />
                  <p className="mt-3 font-black text-slate-950">No hay creditos registrados</p>
                  <p className="mt-2 text-sm text-slate-600">Cuando FONASIN registre un credito asociado a tu perfil, aparecera aqui.</p>
                </div>
              ) : null}

              {creditsState === 'ready' && credits.length > 0 ? (
                <div className="mt-6 overflow-x-auto rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-4">
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
          ) : null}

          {activeTab === 'contributions' ? (
            <div className="p-5 sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Estado de aportes</p>
              <h2 className="mt-1 font-heading text-2xl font-black text-fonasin-deep sm:text-3xl">Aportes registrados</h2>
              <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center">
                <PiggyBank className="mx-auto text-slate-300" size={40} />
                <p className="mt-3 font-black text-slate-950">No hay aportes registrados</p>
                <p className="mt-2 text-sm text-slate-600">Este modulo queda separado para conectar los aportes cuando el backend los entregue.</p>
              </div>
            </div>
          ) : null}

          {activeTab === 'form' ? (
            <div className="p-5 sm:p-7">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">Formulario</p>
                  <h2 className="mt-1 font-heading text-2xl font-black text-fonasin-deep sm:text-3xl">Documentos de afiliacion</h2>
                </div>
                <button
                  type="button"
                  onClick={loadAffiliation}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-fonasin-green/20 bg-fonasin-surface px-4 py-2.5 text-sm font-bold text-fonasin-green transition hover:bg-fonasin-lime/20 focus-ring"
                >
                  <RefreshCw size={16} />
                  Actualizar
                </button>
              </div>

              {affiliationState === 'loading' ? (
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
                  <Loader2 className="animate-spin" size={18} />
                  Cargando documentos
                </div>
              ) : null}

              {affiliationState === 'error' ? (
                <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-4 text-sm font-semibold text-amber-800">
                  {error ?? 'No fue posible cargar tu formulario.'}
                </div>
              ) : null}

              {affiliationState === 'ready' && !affiliation ? (
                <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-10 text-center">
                  <FileText className="mx-auto text-slate-300" size={40} />
                  <p className="mt-3 font-black text-slate-950">No hay formulario generado</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Cuando tu afiliacion quede habilitada, podras ver aqui el formulario generado.
                  </p>
                </div>
              ) : null}

              {affiliationState === 'ready' && affiliation ? (
                <div className="mt-5 space-y-4">
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-fonasin-green">Afiliacion</p>
                    <div className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <span className="font-black text-slate-500">Estado</span>
                        <p className="mt-1 font-bold text-slate-950">{affiliationStatusLabel(affiliation.status)}</p>
                      </div>
                      <div>
                        <span className="font-black text-slate-500">Enviada</span>
                        <p className="mt-1 font-bold text-slate-950">{formatPortalDate(affiliation.submitted_at)}</p>
                      </div>
                      <div>
                        <span className="font-black text-slate-500">Habilitada</span>
                        <p className="mt-1 font-bold text-slate-950">{formatPortalDate(affiliation.enabled_at)}</p>
                      </div>
                    </div>
                  </div>

                  {affiliation.documents.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {affiliation.documents.map((document) => (
                        <PortalDocumentCard key={document.id} document={document} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-8 text-center">
                      <FileText className="mx-auto text-slate-300" size={36} />
                      <p className="mt-3 font-black text-slate-950">No hay documentos visibles</p>
                      <p className="mt-2 text-sm text-slate-600">FONASIN aun no ha generado documentos para mostrar en el portal.</p>
                    </div>
                  )}

                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Actualizacion de datos</p>
                    <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                      Puedes preparar un borrador con la informacion vigente para revisar cambios y enviarlos nuevamente a FONASIN.
                    </p>
                    <button
                      type="button"
                      onClick={handleStartAffiliationUpdate}
                      disabled={startingUpdate}
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-fonasin-green px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 focus-ring"
                    >
                      {startingUpdate ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                      {startingUpdate ? 'Preparando borrador' : 'Actualizar datos'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function PortalDocumentCard({ document }: { document: PortalAffiliationDocument }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-start gap-4">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-fonasin-green shadow-sm">
          <FileText size={22} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-black text-slate-950">{documentLabel(document.document_type)}</p>
          <p className="mt-1 truncate text-sm font-semibold text-slate-600">{document.original_filename}</p>
          <p className="mt-2 text-xs font-bold text-slate-500">Generado: {formatPortalDate(document.uploaded_at)}</p>
          <a
            href={portalDocumentPreviewUrl(document.links.preview)}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-fonasin-green px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 focus-ring"
          >
            <FileText size={16} />
            Ver documento
          </a>
        </div>
      </div>
    </article>
  );
}
