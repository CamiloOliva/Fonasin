import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
  UserCog,
  XCircle,
} from 'lucide-react';
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
import type { PortalUser } from '../../services/portalService';

type SessionState = 'checking' | 'guest' | 'authenticated';
type DataState = 'idle' | 'loading' | 'ready' | 'error';

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
};

const sectionLabels: Record<string, string> = {
  personal: 'Datos personales',
  employment: 'Informacion laboral',
  financial: 'Informacion economica',
  beneficiaries: 'Beneficiarios',
  sarlaft: 'SARLAFT',
};

const documentLabels: Record<string, string> = {
  identity: 'Documento de identidad',
  affiliation_summary: 'Formulario de afiliacion generado',
  payroll_authorization: 'Libranza generada',
  signed_payroll_authorization: 'Libranza firmada externa',
};

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

function flattenValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Sin dato';
  if (typeof value === 'boolean') return value ? 'Si' : 'No';
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)))
      .join(', ');
  }
  if (typeof value === 'object') return JSON.stringify(value);

  return String(value);
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
  const [user, setUser] = useState<PortalUser | null>(null);
  const [applications, setApplications] = useState<AdminAffiliationApplication[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminAffiliationDetail | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [reason, setReason] = useState('');
  const [signedPayrollFile, setSignedPayrollFile] = useState<File | null>(null);
  const [enableResult, setEnableResult] = useState<EnableAffiliationResult | null>(null);
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

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const currentUser = await currentAdminUser();
        if (!active) return;
        setUser(currentUser);
        setSessionState('authenticated');
        await loadApplications();
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
      await loadApplications();
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
    setDetail(null);
    setSelectedId(null);
    setSessionState('guest');
    setDataState('idle');
    setMessage('Sesion cerrada.');
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

  return (
    <section className="bg-slate-50 py-8">
      <div className="container-page space-y-5">
        <header className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Admin FONASIN</p>
              <h1 className="mt-2 text-3xl font-black text-slate-950">Solicitudes de afiliacion</h1>
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
                onClick={() => loadApplications(selectedId)}
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
      </div>
    </section>
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
  const generatedDocuments = application.documents.filter((document) =>
    ['affiliation_summary', 'payroll_authorization'].includes(document.document_type),
  );
  const uploadedDocuments = application.documents.filter((document) => document.document_type === 'identity');
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
        <DocumentList title="Archivos cargados" documents={uploadedDocuments} />
        <DocumentList title="Documentos generados" documents={generatedDocuments} />
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
        <DocumentList title="Libranza externa registrada" documents={signedPayrollDocuments} />
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

      <section className="space-y-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Formulario</p>
          <h3 className="mt-1 text-xl font-black text-slate-950">Datos enviados por seccion</h3>
        </div>
        {application.sections.map((section) => (
          <details key={section.id} open className="rounded-2xl border border-slate-200 bg-white p-4">
            <summary className="cursor-pointer text-base font-black text-slate-950">
              {sectionLabels[section.section] ?? section.section}
            </summary>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {Object.entries(section.data).map(([key, value]) => (
                <div key={key} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">{key}</p>
                  <p className="mt-1 break-words text-sm font-semibold text-slate-800">{flattenValue(value)}</p>
                </div>
              ))}
            </div>
          </details>
        ))}
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

function DocumentList({ title, documents }: { title: string; documents: AdminAffiliationDocument[] }) {
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
          <a
            key={document.id}
            href={document.links.preview}
            target="_blank"
            rel="noreferrer"
            className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm transition hover:border-emerald-200 hover:bg-emerald-50"
          >
            <FileText className="mt-0.5 shrink-0 text-emerald-700" size={18} />
            <span>
              <span className="block font-black text-slate-950">{documentLabel(document.document_type)}</span>
              <span className="mt-1 block text-xs font-semibold text-slate-500">{document.original_filename}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
