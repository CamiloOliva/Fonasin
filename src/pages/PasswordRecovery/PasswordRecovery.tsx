import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { requestPasswordReset, resetPassword } from '../../services/passwordRecoveryService';

export default function PasswordRecovery() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') ?? '';
  const emailFromUrl = searchParams.get('email') ?? '';
  const from = searchParams.get('from') ?? '';
  const isResetMode = token !== '' && emailFromUrl !== '';
  const backTarget = from === 'admin' ? '/admin-fonasin' : '/portal-asociado';

  const [email, setEmail] = useState(emailFromUrl);
  const [documentNumber, setDocumentNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [requestSent, setRequestSent] = useState(false);

  const title = useMemo(
    () => (isResetMode ? 'Crea una nueva contrasena' : 'Recupera tu contrasena'),
    [isResetMode],
  );

  useEffect(() => {
    if (!requestSent || isResetMode) return undefined;

    const timeout = window.setTimeout(() => {
      navigate(backTarget, { replace: true });
    }, 3500);

    return () => window.clearTimeout(timeout);
  }, [backTarget, isResetMode, navigate, requestSent]);

  async function handleRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await requestPasswordReset({ email, documentNumber });
      setMessage(response.message);
      setRequestSent(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible solicitar la recuperacion.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    if (password !== passwordConfirmation) {
      setLoading(false);
      setError('Las contrasenas no coinciden.');
      return;
    }

    try {
      const response = await resetPassword({ email, token, password, passwordConfirmation });
      setMessage(response.message);
      setPassword('');
      setPasswordConfirmation('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible cambiar la contrasena.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="min-h-[70vh] bg-slate-50 py-14">
      <div className="container-page">
        <Link
          to={backTarget}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Volver al inicio de sesion
        </Link>

        <div className="mt-8 grid gap-7 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="rounded-[2rem] border border-emerald-100 bg-white p-7 shadow-sm">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              <ShieldCheck size={28} />
            </div>
            <p className="mt-5 text-xs font-black uppercase tracking-[0.24em] text-emerald-700">Acceso FONASIN</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">{title}</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              {isResetMode
                ? 'El enlace temporal permite establecer una nueva contrasena para tu cuenta.'
                : 'Ingresa tu correo y cedula. Si coinciden con nuestros registros, enviaremos un enlace temporal al correo registrado.'}
            </p>
          </div>

          <form
            onSubmit={isResetMode ? handleReset : handleRequest}
            className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.08)] sm:p-8"
          >
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
              {isResetMode ? <KeyRound size={24} /> : <Mail size={24} />}
            </div>
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              {isResetMode ? 'Cambiar contrasena' : 'Solicitar enlace'}
            </h2>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-800">Correo electronico</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  readOnly={isResetMode}
                  disabled={requestSent}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition read-only:bg-slate-50 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                />
              </label>

              {!isResetMode ? (
                <label className="block">
                  <span className="text-sm font-bold text-slate-800">Cedula</span>
                  <input
                    required
                    inputMode="text"
                    maxLength={16}
                    value={documentNumber}
                    onChange={(event) => setDocumentNumber(event.target.value)}
                    disabled={requestSent}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                  />
                </label>
              ) : (
                <>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-800">Nueva contrasena</span>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-slate-800">Confirmar contrasena</span>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={passwordConfirmation}
                      onChange={(event) => setPasswordConfirmation(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 shadow-sm outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </label>
                </>
              )}
            </div>

            {error ? <p className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</p> : null}
            {message ? (
              <p className="mt-5 flex gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                <CheckCircle2 className="mt-0.5 shrink-0" size={18} />
                <span>
                  {message}
                  {!isResetMode && requestSent ? ' Volveras al inicio de sesion en unos segundos.' : ''}
                </span>
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading || requestSent}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? 'Procesando...'
                : requestSent
                  ? 'Enlace solicitado'
                  : isResetMode
                    ? 'Guardar nueva contrasena'
                    : 'Enviar enlace temporal'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
