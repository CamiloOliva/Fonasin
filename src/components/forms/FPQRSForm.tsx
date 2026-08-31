import { useState } from 'react';
import { AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { submitFPQRS } from '../../services/fpqrsService';

const submissionTypes = [
  { value: 'petition', label: 'Peticion' },
  { value: 'complaint', label: 'Queja' },
  { value: 'claim', label: 'Reclamo' },
  { value: 'request', label: 'Solicitud' },
  { value: 'suggestion', label: 'Sugerencia' },
];

const maxAttachmentSize = 5 * 1024 * 1024;
const allowedAttachmentTypes = ['application/pdf', 'image/jpeg', 'image/png'];

export default function FPQRSForm() {
  const [state, setState] = useState({ fullName: '', email: '', type: '', message: '' });
  const [file, setFile] = useState<File | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);

  function handleFileChange(selectedFile: File | null) {
    setErrorMessage(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!allowedAttachmentTypes.includes(selectedFile.type)) {
      setFile(null);
      setErrorMessage('El adjunto debe ser PDF, JPG o PNG.');
      return;
    }

    if (selectedFile.size > maxAttachmentSize) {
      setFile(null);
      setErrorMessage('El adjunto no puede superar 5MB.');
      return;
    }

    setFile(selectedFile);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const submission = await submitFPQRS({ ...state, file });
      setDeliveryStatus(submission.delivery_status);
      setSent(true);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No fue posible enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-[2rem] border border-emerald-100 bg-white p-8 text-center shadow-sm">
        <CheckCircle2 className="mx-auto text-fonasin-green" size={52} />
        <h3 className="mt-4 text-2xl font-black text-fonasin-deep">Solicitud enviada</h3>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
          Recibimos tu solicitud FPQRS. El equipo de FONASIN la revisara por el canal institucional.
        </p>
        {deliveryStatus ? (
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-fonasin-green">
            Estado de correo: {deliveryStatus}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setFile(null);
            setState({ fullName: '', email: '', type: '', message: '' });
          }}
          className="mt-7 rounded-xl bg-fonasin-green px-5 py-3 font-bold text-white shadow-sm transition hover:bg-emerald-700"
        >
          Enviar otra solicitud
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-[2rem] border border-fonasin-green/10 bg-white p-6 shadow-sm sm:p-8">
      {errorMessage ? (
        <div className="flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="font-semibold text-fonasin-deep">
          Nombre completo <span className="text-red-500">*</span>
          <input
            required
            maxLength={120}
            value={state.fullName}
            onChange={(event) => setState({ ...state, fullName: event.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 p-3.5 outline-none transition focus:border-fonasin-green focus:ring-2 focus:ring-fonasin-lime/40"
          />
        </label>

        <label className="font-semibold text-fonasin-deep">
          Correo electronico <span className="text-red-500">*</span>
          <input
            required
            type="email"
            maxLength={120}
            placeholder="nombre@correo.com"
            value={state.email}
            onChange={(event) => setState({ ...state, email: event.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 p-3.5 outline-none transition focus:border-fonasin-green focus:ring-2 focus:ring-fonasin-lime/40"
          />
        </label>
      </div>

      <label className="block font-semibold text-fonasin-deep">
        Tipo de solicitud <span className="text-red-500">*</span>
        <select
          required
          value={state.type}
          onChange={(event) => setState({ ...state, type: event.target.value })}
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white p-3.5 outline-none transition focus:border-fonasin-green focus:ring-2 focus:ring-fonasin-lime/40"
        >
          <option value="">Selecciona una opcion</option>
          {submissionTypes.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block font-semibold text-fonasin-deep">
        Mensaje <span className="text-red-500">*</span>
        <textarea
          required
          rows={6}
          maxLength={5000}
          value={state.message}
          onChange={(event) => setState({ ...state, message: event.target.value })}
          className="mt-2 w-full rounded-xl border border-slate-200 p-3.5 outline-none transition focus:border-fonasin-green focus:ring-2 focus:ring-fonasin-lime/40"
        />
        <span className="mt-1 block text-right text-xs font-medium text-slate-400">
          {state.message.length}/5000
        </span>
      </label>

      <label className="block font-semibold text-fonasin-deep">
        Archivo adjunto
        <span className="mt-2 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-fonasin-green/40 bg-emerald-50/40 p-4 text-slate-600 transition hover:border-fonasin-green hover:bg-emerald-50">
          <Upload size={20} />
          <span>{file ? file.name : 'Seleccionar PDF, JPG o PNG hasta 5MB'}</span>
          <input
            type="file"
            accept="application/pdf,image/jpeg,image/png"
            className="sr-only"
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
          />
        </span>
      </label>

      <button
        disabled={loading}
        className="w-full rounded-xl bg-fonasin-green px-6 py-3.5 font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? 'Enviando...' : 'Enviar solicitud'}
      </button>
    </form>
  );
}
