import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  UserPlus,
  UserCog,
  Users,
  WalletCards,
  XCircle,
} from 'lucide-react';
import ForcedPasswordChange from '../../components/auth/ForcedPasswordChange';
import {
  approveAdminAffiliationApplication,
  currentAdminUser,
  enableAdminAffiliationApplication,
  fetchAdminAffiliationApplication,
  fetchAdminAffiliationApplications,
  loginAdmin,
  logoutAdmin,
  rejectAdminAffiliationApplication,
  requestAdminAffiliationCorrection,
  startAdminAffiliationReview,
  uploadSignedPayrollAuthorization,
  type AdminAffiliationApplication,
  type AdminAffiliationDetail,
  type AdminAffiliationDocument,
  type EnableAffiliationResult,
} from '../../services/adminAffiliationService';
import {
  activateAdminAssociate,
  createAdminAssociate,
  deactivateAdminAssociate,
  fetchAdminAssociates,
  type AdminAssociate,
} from '../../services/adminAssociateService';
import {
  archiveAdminCredit,
  createAdminCredit,
  fetchAdminCredits,
  updateAdminCredit,
  type AdminCredit,
} from '../../services/adminCreditService';
import { changeOwnPassword, type PortalUser } from '../../services/portalService';

type SessionState = 'checking' | 'guest' | 'authenticated';
type DataState = 'idle' | 'loading' | 'ready' | 'error';
type AdminPanelView = 'applications' | 'associates' | 'credits';

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  submitted: 'Enviada',
  under_review: 'En revision',
  pending_correction: 'Correccion solicitada',
  approved: 'Aprobada',
  enabled: 'Asociado habilitado',
  disabled: 'Inactiva',
  withdrawn: 'Retirada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  active: 'Activo',
  inactive: 'Inactivo',
  settled: 'Pagado',
  archived: 'Archivado',
};

const documentLabels: Record<string, string> = {
  identity: 'Documento de identidad',
  employment_certificate: 'Certificado laboral',
  affiliation_summary: 'Formulario de afiliacion generado',
  payroll_authorization: 'Libranza generada',
  signed_payroll_authorization: 'Libranza firmada externa',
};

const creditLineOptions = ['FONALIBRE', 'FONAPEN', 'FONAPRIMA', 'FONAROTATIVO', 'FONAPORTES'];

function formatDate(value: string | null): string {
  if (!value) return 'Pendiente';

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function statusLabel(status: string): string {
  return statusLabels[status] ?? status;
}

function documentLabel(documentType: string): string {
  return documentLabels[documentType] ?? documentType;
}

function roleLabel(role: string): string {
  const labels: Record<string, string> = {
    admin: 'Administrador',
    reviewer: 'Revisor',
    associate: 'Asociado',
  };

  return labels[role] ?? role;
}

export default function AdminFonasin() {
  const [sessionState, setSessionState] = useState<SessionState>('checking');
  const [dataState, setDataState] = useState<DataState>('idle');
  const [associateDataState, setAssociateDataState] = useState<DataState>('idle');
  const [creditDataState, setCreditDataState] = useState<DataState>('idle');
  const [activeView, setActiveView] = useState<AdminPanelView>('applications');
  const [user, setUser] = useState<PortalUser | null>(null);
  const [applications, setApplications] = useState<AdminAffiliationApplication[]>([]);
  const [associates, setAssociates] = useState<AdminAssociate[]>([]);
  const [credits, setCredits] = useState<AdminCredit[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminAffiliationDetail | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [reason, setReason] = useState('');
  const [signedPayrollFile, setSignedPayrollFile] = useState<File | null>(null);
  const [enableResult, setEnableResult] = useState<EnableAffiliationResult | null>(null);
  const [associateForm, setAssociateForm] = useState({
    document_type: 'CC',
    document_number: '',
    full_name: '',
    email: '',
    password: '',
    status: 'active',
  });
  const [createdAssociateAccess, setCreatedAssociateAccess] = useState<{
    email: string;
    temporaryPassword: string | null;
  } | null>(null);
  const [creditForm, setCreditForm] = useState({
    associate_id: '',
    credit_line: 'FONALIBRE',
    initial_balance: '',
    current_balance: '',
    term_months: '24',
    interest_rate: '1.2500',
    installment_amount: '',
    status: 'active',
  });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submittedCount = useMemo(
    () => applications.filter((application) => ['submitted', 'under_review'].includes(application.status)).length,
    [applications],
  );

  async function loadApplications(nextSelectedId?: string | null) {
    setDataState('loading');
    setError(null);

    try {
      const result = await fetchAdminAffiliationApplications();
      setApplications(result);

      const targetId = nextSelectedId ?? selectedId ?? result[0]?.id ?? null;
      setSelectedId(targetId);

      if (targetId) {
        setDetail(await fetchAdminAffiliationApplication(targetId));
      } else {
        setDetail(null);
      }

      setDataState('ready');
    } catch (caught) {
      setDataState('error');
      setApplications([]);
      setDetail(null);
      setError(caught instanceof Error ? caught.message : 'No fue posible cargar el panel administrativo.');
    }
  }

  async function selectApplication(id: string) {
    setSelectedId(id);
    setDataState('loading');
    setError(null);

    try {
      setDetail(await fetchAdminAffiliationApplication(id));
      setDataState('ready');
    } catch (caught) {
      setDataState('error');
      setDetail(null);
      setError(caught instanceof Error ? caught.message : 'No fue posible cargar la solicitud.');
    }
  }

  async function loadAssociates() {
    setAssociateDataState('loading');
    setError(null);

    try {
      setAssociates(await fetchAdminAssociates());
      setAssociateDataState('ready');
    } catch (caught) {
      setAssociateDataState('error');
      setAssociates([]);
      setError(caught instanceof Error ? caught.message : 'No fue posible cargar los asociados.');
    }
  }

  async function loadCredits() {
    setCreditDataState('loading');
    setError(null);

    try {
      const [nextCredits, nextAssociates] = await Promise.all([
        fetchAdminCredits(),
        associates.length > 0 ? Promise.resolve(associates) : fetchAdminAssociates(),
      ]);
      setCredits(nextCredits);
      setAssociates(nextAssociates);
      setCreditForm((current) => ({
        ...current,
        associate_id: current.associate_id || nextAssociates[0]?.id || '',
      }));
      setCreditDataState('ready');
    } catch (caught) {
      setCreditDataState('error');
      setCredits([]);
      setError(caught instanceof Error ? caught.message : 'No fue posible cargar los creditos.');
    }
  }

  async function openApplications() {
    setActiveView('applications');
    await loadApplications(selectedId);
  }

  async function openAssociates() {
    setActiveView('associates');
    await loadAssociates();
  }

  async function openCredits() {
    setActiveView('credits');
    await loadCredits();
  }

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const currentUser = await currentAdminUser();
        if (!active) return;
        setUser(currentUser);
        setSessionState('authenticated');
        if (!currentUser.must_change_password) {
          await loadApplications();
        }
      } catch {
        if (!active) return;
        setSessionState('guest');
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setSessionState('checking');

    try {
      const loggedUser = await loginAdmin({ email, password, remember });
      setUser(loggedUser);
      setPassword('');
      setSessionState('authenticated');
      setMessage('Sesion administrativa iniciada.');
      if (!loggedUser.must_change_password) {
        await loadApplications();
      }
    } catch (caught) {
      setUser(null);
      setSessionState('guest');
      setError(caught instanceof Error ? caught.message : 'No fue posible iniciar sesion.');
    }
  }

  async function handleLogout() {
    try {
      await logoutAdmin();
    } catch {
      // La sesion visual se limpia aunque el backend ya haya cerrado la sesion.
    }

    setUser(null);
    setApplications([]);
    setAssociates([]);
    setCredits([]);
    setDetail(null);
    setSelectedId(null);
    setSessionState('guest');
    setDataState('idle');
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
    await loadApplications();
  }

  async function runAction(action: () => Promise<AdminAffiliationDetail>, successMessage: string) {
    setError(null);
    setMessage(null);

    try {
      const updated = await action();
      setDetail(updated);
      await loadApplications(updated.id);
      setReason('');
      setEnableResult(null);
      setMessage(successMessage);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible completar la accion.');
    }
  }

  async function handleUploadSignedPayrollAuthorization() {
    if (!detail || !signedPayrollFile) return;

    setError(null);
    setMessage(null);

    try {
      await uploadSignedPayrollAuthorization(detail.id, signedPayrollFile);
      setSignedPayrollFile(null);
      setDetail(await fetchAdminAffiliationApplication(detail.id));
      await loadApplications(detail.id);
      setMessage('Libranza firmada cargada correctamente.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible cargar la libranza firmada.');
    }
  }

  async function handleEnableApplication() {
    if (!detail) return;

    setError(null);
    setMessage(null);

    try {
      const result = await enableAdminAffiliationApplication(detail.id);
      setEnableResult(result);
      setDetail(await fetchAdminAffiliationApplication(detail.id));
      await loadApplications(detail.id);
      setMessage('Asociado habilitado correctamente.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible habilitar el asociado.');
    }
  }

  async function handleCreateAssociate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const created = await createAdminAssociate({
        ...associateForm,
        password: associateForm.password.trim() || undefined,
      });
      setAssociateForm({
        document_type: 'CC',
        document_number: '',
        full_name: '',
        email: '',
        password: '',
        status: 'active',
      });
      setCreatedAssociateAccess({
        email: created.user?.email ?? associateForm.email,
        temporaryPassword: created.temporary_password ?? null,
      });
      await loadAssociates();
      setMessage('Asociado creado correctamente.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible crear el asociado.');
    }
  }

  async function handleAssociateStatus(id: string, status: 'active' | 'inactive') {
    setError(null);
    setMessage(null);

    try {
      if (status === 'active') {
        await activateAdminAssociate(id);
      } else {
        await deactivateAdminAssociate(id);
      }

      await loadAssociates();
      setMessage(status === 'active' ? 'Asociado activado correctamente.' : 'Asociado desactivado correctamente.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible cambiar el estado del asociado.');
    }
  }

  async function handleCreateCredit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      await createAdminCredit({
        associate_id: creditForm.associate_id,
        credit_line: creditForm.credit_line,
        initial_balance: creditForm.initial_balance,
        current_balance: creditForm.current_balance || creditForm.initial_balance,
        term_months: Number(creditForm.term_months),
        interest_rate: creditForm.interest_rate,
        installment_amount: creditForm.installment_amount,
        status: creditForm.status,
      });
      setCreditForm((current) => ({
        ...current,
        initial_balance: '',
        current_balance: '',
        installment_amount: '',
      }));
      await loadCredits();
      setMessage('Credito registrado correctamente.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible registrar el credito.');
    }
  }

  async function handleCreditStatus(id: string, status: 'active' | 'settled' | 'archived') {
    setError(null);
    setMessage(null);

    try {
      if (status === 'archived') {
        await archiveAdminCredit(id);
      } else {
        await updateAdminCredit(id, { status });
      }

      await loadCredits();
      setMessage(status === 'archived' ? 'Credito archivado correctamente.' : 'Estado del credito actualizado.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible actualizar el credito.');
    }
  }

  if (sessionState === 'checking') {
    return (
      <section className="min-h-[58vh] bg-slate-50 py-16">
        <div className="container-page grid place-items-center">
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white px-5 py-4 text-sm font-bold text-emerald-700 shadow-sm">
            <Loader2 className="animate-spin" size={18} />
            Validando sesion administrativa
          </div>
        </div>
      </section>
    );
  }

  if (sessionState === 'guest') {
    return (
      <section className="bg-slate-50 py-14">
        <div className="container-page grid gap-7 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Admin FONASIN</p>
            <h1 className="mt-3 max-w-xl text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">
              Revision interna de afiliaciones
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              Acceso reservado para usuarios administradores o revisores. Aqui se revisan formularios, documentos y decisiones del flujo de afiliacion.
            </p>
          </div>

          <form onSubmit={handleLogin} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <UserCog size={24} />
            </div>
            <h2 className="mt-4 text-2xl font-black text-slate-950">Iniciar sesion administrativa</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Usa una cuenta con rol admin o reviewer.</p>

            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-800">Correo electronico</span>
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
                <span className="text-sm font-bold text-slate-800">Contrasena</span>
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
                to="/recuperar-contrasena?from=admin"
                className="inline-flex text-sm font-bold text-emerald-700 hover:text-emerald-800"
              >
                Olvide mi contrasena
              </Link>
            </div>

            {error ? <p className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
            {message ? <p className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</p> : null}

            <button
              type="submit"
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
            >
              Entrar al panel <ShieldCheck size={18} />
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
        contextLabel="Admin FONASIN"
        onSubmit={handlePasswordChange}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <section className="bg-slate-50 py-8">
      <div className="container-page space-y-5">
        <header className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Admin FONASIN</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">
                {activeView === 'applications'
                  ? 'Solicitudes de afiliacion'
                  : activeView === 'associates'
                    ? 'Administracion de asociados'
                    : 'Administracion de creditos'}
              </h1>
              <div className="mt-3 flex flex-wrap gap-2">
                {(user?.roles ?? []).map((role) => (
                  <span key={role} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                    {roleLabel(role)}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  if (activeView === 'applications') return loadApplications(selectedId);
                  if (activeView === 'associates') return loadAssociates();

                  return loadCredits();
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-100"
              >
                <RefreshCw size={16} />
                Actualizar
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <LogOut size={16} />
                Cerrar sesion
              </button>
            </div>
          </div>
        </header>

        {message ? <p className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">{message}</p> : null}
        {error ? <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}

        <nav className="flex flex-wrap gap-2 rounded-[1.25rem] border border-slate-200 bg-white p-2 shadow-sm">
          <button
            type="button"
            onClick={openApplications}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${
              activeView === 'applications'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <ClipboardCheck size={16} />
            Solicitudes
          </button>
          <button
            type="button"
            onClick={openAssociates}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${
              activeView === 'associates'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Users size={16} />
            Asociados
          </button>
          <button
            type="button"
            onClick={openCredits}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition ${
              activeView === 'credits'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <WalletCards size={16} />
            Creditos
          </button>
        </nav>

        {activeView === 'applications' ? (
        <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
          <aside className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Bandeja</p>
                <p className="mt-1 text-2xl font-black text-slate-950">{submittedCount}</p>
              </div>
              <ClipboardCheck className="text-emerald-700" size={28} />
            </div>

            <div className="mt-4 space-y-2">
              {applications.length === 0 && dataState !== 'loading' ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-600">
                  No hay solicitudes para mostrar.
                </div>
              ) : null}

              {applications.map((application) => (
                <button
                  key={application.id}
                  type="button"
                  onClick={() => selectApplication(application.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                    selectedId === application.id
                      ? 'border-emerald-300 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-slate-950">Solicitud {application.id.slice(0, 8)}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{formatDate(application.submitted_at)}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">
                      {statusLabel(application.status)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {application.sections_count} secciones · {application.documents_count} documentos · {application.consents_count} consentimientos
                  </p>
                </button>
              ))}
            </div>
          </aside>

          <main className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            {dataState === 'loading' ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
                <Loader2 className="animate-spin" size={18} />
                Cargando informacion
              </div>
            ) : null}

            {detail ? (
              <ApplicationDetail
                application={detail}
                reason={reason}
                signedPayrollFile={signedPayrollFile}
                enableResult={enableResult}
                onReasonChange={setReason}
                onSignedPayrollFileChange={setSignedPayrollFile}
                onStartReview={() => runAction(() => startAdminAffiliationReview(detail.id), 'Solicitud tomada en revision.')}
                onRequestCorrection={() => runAction(() => requestAdminAffiliationCorrection(detail.id, reason), 'Correccion solicitada.')}
                onApprove={() => runAction(() => approveAdminAffiliationApplication(detail.id), 'Solicitud aprobada.')}
                onReject={() => runAction(() => rejectAdminAffiliationApplication(detail.id, reason), 'Solicitud rechazada.')}
                onUploadSignedPayrollAuthorization={handleUploadSignedPayrollAuthorization}
                onEnable={handleEnableApplication}
              />
            ) : dataState !== 'loading' ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-12 text-center">
                <p className="font-black text-slate-950">Selecciona una solicitud</p>
                <p className="mt-2 text-sm text-slate-600">El detalle del formulario y documentos aparecera aqui.</p>
              </div>
            ) : null}
          </main>
        </div>
        ) : activeView === 'associates' ? (
          <AssociatesPanel
            associates={associates}
            dataState={associateDataState}
            form={associateForm}
            createdAccess={createdAssociateAccess}
            onFormChange={setAssociateForm}
            onCreate={handleCreateAssociate}
            onStatusChange={handleAssociateStatus}
          />
        ) : (
          <CreditsPanel
            credits={credits}
            associates={associates}
            dataState={creditDataState}
            form={creditForm}
            onFormChange={setCreditForm}
            onCreate={handleCreateCredit}
            onStatusChange={handleCreditStatus}
          />
        )}
      </div>
    </section>
  );
}

type AssociateFormState = {
  document_type: string;
  document_number: string;
  full_name: string;
  email: string;
  password: string;
  status: string;
};

function AssociatesPanel({
  associates,
  dataState,
  form,
  createdAccess,
  onFormChange,
  onCreate,
  onStatusChange,
}: {
  associates: AdminAssociate[];
  dataState: DataState;
  form: AssociateFormState;
  createdAccess: { email: string; temporaryPassword: string | null } | null;
  onFormChange: (form: AssociateFormState) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onStatusChange: (id: string, status: 'active' | 'inactive') => void;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <form onSubmit={onCreate} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <UserPlus size={22} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Nuevo asociado</p>
            <h2 className="text-xl font-black text-slate-950">Registro manual</h2>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-800">Tipo de documento</span>
            <select
              value={form.document_type}
              onChange={(event) => onFormChange({ ...form, document_type: event.target.value })}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            >
              {['CC', 'CE', 'Pasaporte', 'TI'].map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-800">Numero de documento</span>
            <input
              value={form.document_number}
              onChange={(event) => onFormChange({ ...form, document_number: event.target.value })}
              minLength={3}
              maxLength={16}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-800">Nombre completo</span>
            <input
              value={form.full_name}
              onChange={(event) => onFormChange({ ...form, full_name: event.target.value })}
              minLength={3}
              maxLength={255}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-800">Correo de acceso</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) => onFormChange({ ...form, email: event.target.value })}
              maxLength={255}
              required
              placeholder="correo@ejemplo.com"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-800">Contraseña inicial</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) => onFormChange({ ...form, password: event.target.value })}
              minLength={8}
              maxLength={128}
              placeholder="Opcional: generar automaticamente"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            />
          </label>
        </div>

        {createdAccess ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950">
            <p className="font-black">Acceso creado para {createdAccess.email}</p>
            <p className="mt-1 font-semibold">
              {createdAccess.temporaryPassword
                ? `Contraseña temporal: ${createdAccess.temporaryPassword}`
                : 'Se uso la contraseña definida por el administrador.'}
            </p>
          </div>
        ) : null}

        <button
          type="submit"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          Crear asociado
          <UserPlus size={18} />
        </button>
      </form>

      <section className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Asociados</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{associates.length} registros</h2>
          </div>
          <Users className="text-emerald-700" size={28} />
        </div>

        {dataState === 'loading' ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
            <Loader2 className="animate-spin" size={18} />
            Cargando asociados
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <th className="py-3 pr-4">Nombre</th>
                <th className="py-3 pr-4">Documento</th>
                <th className="py-3 pr-4">Usuario</th>
                <th className="py-3 pr-4">Creditos</th>
                <th className="py-3 pr-4">Estado</th>
                <th className="py-3 text-right">Accion</th>
              </tr>
            </thead>
            <tbody>
              {associates.map((associate) => (
                <tr key={associate.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-4 pr-4 font-black text-slate-950">{associate.full_name}</td>
                  <td className="py-4 pr-4 text-slate-700">{associate.document_type}</td>
                  <td className="py-4 pr-4 text-slate-700">{associate.user?.email ?? 'Sin usuario vinculado'}</td>
                  <td className="py-4 pr-4 text-slate-700">{associate.credit_accounts_count}</td>
                  <td className="py-4 pr-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                      {statusLabel(associate.status)}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onStatusChange(associate.id, associate.status === 'active' ? 'inactive' : 'active')}
                      className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
                    >
                      {associate.status === 'active' ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {associates.length === 0 && dataState !== 'loading' ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-600">
              No hay asociados registrados.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

type CreditFormState = {
  associate_id: string;
  credit_line: string;
  initial_balance: string;
  current_balance: string;
  term_months: string;
  interest_rate: string;
  installment_amount: string;
  status: string;
};

function formatCurrency(value: string): string {
  const amount = Number(value);

  if (Number.isNaN(amount)) return value;

  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function CreditsPanel({
  credits,
  associates,
  dataState,
  form,
  onFormChange,
  onCreate,
  onStatusChange,
}: {
  credits: AdminCredit[];
  associates: AdminAssociate[];
  dataState: DataState;
  form: CreditFormState;
  onFormChange: (form: CreditFormState) => void;
  onCreate: (event: FormEvent<HTMLFormElement>) => void;
  onStatusChange: (id: string, status: 'active' | 'settled' | 'archived') => void;
}) {
  const activeAssociates = associates.filter((associate) => associate.status === 'active');

  return (
    <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
      <form onSubmit={onCreate} className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <WalletCards size={22} />
          </div>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Nuevo credito</p>
            <h2 className="text-xl font-black text-slate-950">Registro administrativo</h2>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-800">Asociado</span>
            <select
              value={form.associate_id}
              onChange={(event) => onFormChange({ ...form, associate_id: event.target.value })}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            >
              {activeAssociates.length === 0 ? <option value="">No hay asociados activos</option> : null}
              {activeAssociates.map((associate) => (
                <option key={associate.id} value={associate.id}>{associate.full_name}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-800">Linea</span>
            <select
              value={form.credit_line}
              onChange={(event) => onFormChange({ ...form, credit_line: event.target.value })}
              required
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            >
              {creditLineOptions.map((line) => (
                <option key={line} value={line}>{line}</option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-bold text-slate-800">Saldo inicial</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.initial_balance}
                onChange={(event) => onFormChange({ ...form, initial_balance: event.target.value })}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-800">Saldo actual</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.current_balance}
                onChange={(event) => onFormChange({ ...form, current_balance: event.target.value })}
                placeholder="Igual al inicial"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-sm font-bold text-slate-800">Plazo</span>
              <input
                type="number"
                min={1}
                value={form.term_months}
                onChange={(event) => onFormChange({ ...form, term_months: event.target.value })}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-800">Tasa</span>
              <input
                type="number"
                min={0}
                step="0.0001"
                value={form.interest_rate}
                onChange={(event) => onFormChange({ ...form, interest_rate: event.target.value })}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate-800">Cuota</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.installment_amount}
                onChange={(event) => onFormChange({ ...form, installment_amount: event.target.value })}
                required
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={activeAssociates.length === 0}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          Registrar credito
          <WalletCards size={18} />
        </button>
      </form>

      <section className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Creditos</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">{credits.length} registros</h2>
          </div>
          <WalletCards className="text-emerald-700" size={28} />
        </div>

        {dataState === 'loading' ? (
          <div className="mt-5 flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
            <Loader2 className="animate-spin" size={18} />
            Cargando creditos
          </div>
        ) : null}

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                <th className="py-3 pr-4">Asociado</th>
                <th className="py-3 pr-4">Linea</th>
                <th className="py-3 pr-4">Saldo inicial</th>
                <th className="py-3 pr-4">Saldo actual</th>
                <th className="py-3 pr-4">Cuota</th>
                <th className="py-3 pr-4">Plazo</th>
                <th className="py-3 pr-4">Estado</th>
                <th className="py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {credits.map((credit) => (
                <tr key={credit.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-4 pr-4 font-black text-slate-950">{credit.associate?.full_name ?? 'Sin asociado'}</td>
                  <td className="py-4 pr-4 text-slate-700">{credit.credit_line}</td>
                  <td className="py-4 pr-4 text-slate-700">{formatCurrency(credit.initial_balance)}</td>
                  <td className="py-4 pr-4 font-black text-slate-950">{formatCurrency(credit.current_balance)}</td>
                  <td className="py-4 pr-4 text-slate-700">{formatCurrency(credit.installment_amount)}</td>
                  <td className="py-4 pr-4 text-slate-700">{credit.term_months} meses</td>
                  <td className="py-4 pr-4">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">
                      {statusLabel(credit.status)}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onStatusChange(credit.id, credit.status === 'settled' ? 'active' : 'settled')}
                        disabled={credit.status === 'archived'}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300"
                      >
                        {credit.status === 'settled' ? 'Reactivar' : 'Marcar pagado'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onStatusChange(credit.id, 'archived')}
                        disabled={credit.status === 'archived'}
                        className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-300"
                      >
                        Archivar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {credits.length === 0 && dataState !== 'loading' ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-600">
              No hay creditos registrados.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

type ApplicationDetailProps = {
  application: AdminAffiliationDetail;
  reason: string;
  signedPayrollFile: File | null;
  enableResult: EnableAffiliationResult | null;
  onReasonChange: (value: string) => void;
  onSignedPayrollFileChange: (file: File | null) => void;
  onStartReview: () => void;
  onRequestCorrection: () => void;
  onApprove: () => void;
  onReject: () => void;
  onUploadSignedPayrollAuthorization: () => void;
  onEnable: () => void;
};

function ApplicationDetail({
  application,
  reason,
  signedPayrollFile,
  enableResult,
  onReasonChange,
  onSignedPayrollFileChange,
  onStartReview,
  onRequestCorrection,
  onApprove,
  onReject,
  onUploadSignedPayrollAuthorization,
  onEnable,
}: ApplicationDetailProps) {
  const [previewDocument, setPreviewDocument] = useState<AdminAffiliationDocument | null>(null);
  const generatedDocuments = application.documents.filter((document) =>
    ['affiliation_summary', 'payroll_authorization'].includes(document.document_type),
  );
  const uploadedDocuments = application.documents.filter((document) =>
    ['identity', 'employment_certificate'].includes(document.document_type),
  );
  const signedPayrollDocuments = application.documents.filter((document) => document.document_type === 'signed_payroll_authorization');
  const canUploadSignedPayroll = application.status === 'approved';
  const canEnable = application.status === 'approved' && signedPayrollDocuments.length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Detalle</p>
          <h2 className="mt-1 break-all text-2xl font-black text-slate-950">{application.id}</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">Estado: {statusLabel(application.status)}</p>
          <p className="mt-1 text-sm text-slate-500">Enviada: {formatDate(application.submitted_at)}</p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={onStartReview}
            disabled={application.status !== 'submitted'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <ClipboardCheck size={16} />
            Tomar revision
          </button>
          <button
            type="button"
            onClick={onApprove}
            disabled={application.status !== 'under_review'}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <CheckCircle2 size={16} />
            Aprobar formulario
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Primera confirmacion</p>
        <h3 className="mt-1 text-lg font-black text-slate-950">Formulario de afiliacion y archivos</h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Revisa los datos guardados, el documento de identidad y los PDF generados antes de aprobar esta etapa.
        </p>
        <DocumentList title="Archivos cargados" documents={uploadedDocuments} onPreview={setPreviewDocument} />
        <DocumentList title="Documentos generados" documents={generatedDocuments} onPreview={setPreviewDocument} />
        <DocumentPreview document={previewDocument} onClose={() => setPreviewDocument(null)} />
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-700">Segunda confirmacion</p>
        <h3 className="mt-1 text-lg font-black text-slate-950">Libranza firmada por entidad externa</h3>
        <p className="mt-2 text-sm leading-6 text-amber-900">
          Carga la libranza firmada por la entidad externa. Al habilitar, el sistema crea o vincula el asociado y su usuario de portal.
        </p>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="block rounded-2xl border border-dashed border-amber-300 bg-white px-4 py-4">
            <span className="text-sm font-black text-slate-950">Archivo firmado</span>
            <span className="mt-1 block text-xs font-semibold text-slate-500">PDF, JPG o PNG hasta 5MB.</span>
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              disabled={!canUploadSignedPayroll}
              onChange={(event) => onSignedPayrollFileChange(event.target.files?.[0] ?? null)}
              className="mt-3 block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-black file:text-emerald-700 disabled:cursor-not-allowed"
            />
            {signedPayrollFile ? (
              <span className="mt-2 block text-xs font-bold text-emerald-700">{signedPayrollFile.name}</span>
            ) : null}
          </label>
          <button
            type="button"
            onClick={onUploadSignedPayrollAuthorization}
            disabled={!canUploadSignedPayroll || !signedPayrollFile}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-3 text-sm font-black text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <UploadCloud size={18} />
            Cargar libranza
          </button>
        </div>
        <DocumentList title="Libranza externa registrada" documents={signedPayrollDocuments} onPreview={setPreviewDocument} />
        <button
          type="button"
          onClick={onEnable}
          disabled={!canEnable}
          className="mt-4 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          <CheckCircle2 size={16} />
          Habilitar asociado
        </button>
        {enableResult ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm text-slate-700">
            <p className="font-black text-emerald-800">Asociado creado o vinculado</p>
            <p className="mt-1">Nombre: {enableResult.associate.full_name}</p>
            <p>Usuario: {enableResult.user.email}</p>
            {enableResult.temporary_password ? (
              <p className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 font-black text-emerald-800">
                Contrasena temporal: {enableResult.temporary_password}
              </p>
            ) : (
              <p className="mt-2 font-semibold text-slate-600">El usuario ya existia; no se genero una contrasena nueva.</p>
            )}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">Decision</p>
        <label className="mt-3 block">
          <span className="text-sm font-bold text-slate-800">Motivo para correccion o rechazo</span>
          <textarea
            value={reason}
            onChange={(event) => onReasonChange(event.target.value)}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </label>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onRequestCorrection}
            disabled={application.status !== 'under_review'}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-black text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            Solicitar correccion
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={application.status !== 'under_review'}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
          >
            <XCircle size={16} />
            Rechazar
          </button>
        </div>
      </section>
    </div>
  );
}

function DocumentPreview({ document, onClose }: { document: AdminAffiliationDocument | null; onClose: () => void }) {
  if (!document) return null;

  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-slate-950">{documentLabel(document.document_type)}</p>
          <p className="text-xs font-semibold text-slate-500">{document.original_filename}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50"
        >
          Cerrar visor
        </button>
      </div>
      <iframe
        title={documentLabel(document.document_type)}
        src={document.links.preview}
        className="mt-3 h-[520px] w-full rounded-xl border border-slate-200 bg-slate-100"
      />
    </div>
  );
}

function DocumentList({
  title,
  documents,
  onPreview,
}: {
  title: string;
  documents: AdminAffiliationDocument[];
  onPreview: (document: AdminAffiliationDocument) => void;
}) {
  return (
    <div className="mt-4">
      <p className="text-sm font-black text-slate-950">{title}</p>
      <div className="mt-2 grid gap-2 md:grid-cols-2">
        {documents.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold text-slate-500">
            No hay documentos registrados.
          </p>
        ) : null}
        {documents.map((document) => (
          <button
            key={document.id}
            type="button"
            onClick={() => onPreview(document)}
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm transition hover:border-emerald-200 hover:bg-emerald-50"
          >
            <FileText className="mt-0.5 shrink-0 text-emerald-700" size={18} />
            <span>
              <span className="block font-black text-slate-950">{documentLabel(document.document_type)}</span>
              <span className="mt-1 block text-xs font-semibold text-slate-500">{document.original_filename}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
