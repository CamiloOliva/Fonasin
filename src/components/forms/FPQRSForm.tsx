import { useState } from 'react';
import { AlertCircle, CheckCircle2, ListFilter, Mail, MessageCircle, Paperclip, Send, UploadCloud, UserRound } from 'lucide-react';
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
const fieldClassName = 'mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-fonasin-deep outline-none transition placeholder:text-slate-400 focus:border-fonasin-green focus:ring-4 focus:ring-fonasin-lime/20';

export default function FPQRSForm() {
  const [state, setState] = useState({ fullName: '', email: '', type: '', message: '' });
  const [file, setFile] = useState<File | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [deliveryStatus, setDeliveryStatus] = useState<string | null>(null);

  function handleFileChange(selectedFile: File | null) {
    setErrorMessage(null);
    if (!selectedFile) { setFile(null); return; }
    if (!allowedAttachmentTypes.includes(selectedFile.type)) { setFile(null); setErrorMessage('El adjunto debe ser PDF, JPG o PNG.'); return; }
    if (selectedFile.size > maxAttachmentSize) { setFile(null); setErrorMessage('El adjunto no puede superar 5MB.'); return; }
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
      <section className="w-full rounded-[2rem] bg-white p-8 text-center shadow-[0_20px_60px_rgba(13,71,56,0.14)] sm:p-12">
        <CheckCircle2 className="mx-auto text-fonasin-green" size={58} />
        <h2 className="mt-5 font-heading text-2xl font-black text-fonasin-deep">Solicitud enviada</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">Recibimos tu solicitud FPQRS. El equipo de FONASIN la revisara por el canal institucional.</p>
        {deliveryStatus ? <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-fonasin-green">Estado de correo: {deliveryStatus}</p> : null}
        <button type="button" onClick={() => { setSent(false); setFile(null); setState({ fullName: '', email: '', type: '', message: '' }); }} className="mt-7 rounded-xl bg-fonasin-green px-6 py-3 font-bold text-white transition hover:bg-fonasin-deep focus-ring">Enviar otra solicitud</button>
      </section>
    );
  }

  return (
    <form onSubmit={onSubmit} className="w-full rounded-[2rem] bg-white p-6 shadow-[0_20px_60px_rgba(13,71,56,0.14)] sm:p-8 lg:p-9">
      {errorMessage ? <div className="mb-5 flex gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="mt-0.5 shrink-0" size={18} /><span>{errorMessage}</span></div> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="text-sm font-bold text-fonasin-deep"><span className="flex items-center gap-2"><UserRound size={20} className="text-fonasin-green" />Nombre completo</span><input required maxLength={120} value={state.fullName} onChange={(event) => setState({ ...state, fullName: event.target.value })} placeholder="Ingresa tu nombre completo" className={fieldClassName} /></label>
        <label className="text-sm font-bold text-fonasin-deep"><span className="flex items-center gap-2"><Mail size={20} className="text-fonasin-green" />Correo electronico</span><input required type="email" maxLength={120} value={state.email} onChange={(event) => setState({ ...state, email: event.target.value })} placeholder="Ingresa tu correo electronico" className={fieldClassName} /></label>
      </div>
      <label className="mt-6 block text-sm font-bold text-fonasin-deep"><span className="flex items-center gap-2"><ListFilter size={20} className="text-fonasin-green" />Tipo de solicitud</span><select required value={state.type} onChange={(event) => setState({ ...state, type: event.target.value })} className={fieldClassName}><option value="">Selecciona una opcion</option>{submissionTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
      <label className="mt-6 block text-sm font-bold text-fonasin-deep"><span className="flex items-center gap-2"><MessageCircle size={20} className="text-fonasin-green" />Mensaje</span><textarea required rows={5} maxLength={5000} value={state.message} onChange={(event) => setState({ ...state, message: event.target.value })} placeholder="Cuentanos los detalles de tu solicitud..." className={fieldClassName + ' resize-y'} /><span className="mt-1 block text-right text-xs font-medium text-slate-400">{state.message.length}/5000</span></label>
      <label className="mt-6 block text-sm font-bold text-fonasin-deep"><span className="flex items-center gap-2"><Paperclip size={20} className="text-fonasin-green" />Archivo adjunto</span><span className="mt-2 flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 px-4 py-4 text-center transition hover:border-fonasin-green hover:bg-fonasin-surface"><UploadCloud size={27} className="text-fonasin-green" /><span className="mt-1 text-sm font-bold text-fonasin-deep">{file ? file.name : 'Seleccionar archivo'}</span><span className="mt-1 text-xs font-normal text-slate-500">Formatos permitidos: PDF, JPG, PNG. Max. 5MB</span><input type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)} /></span></label>
      <button type="submit" disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fonasin-green to-lime-500 px-6 py-3.5 text-lg font-black text-white shadow-lg shadow-fonasin-green/20 transition hover:from-fonasin-deep hover:to-fonasin-green disabled:cursor-wait disabled:opacity-60 focus-ring"><Send size={21} />{loading ? 'Enviando...' : 'Enviar solicitud'}</button>
      <p className="mt-4 text-center text-xs leading-5 text-slate-500">La solicitud se envia por el canal institucional configurado por FONASIN.</p>
    </form>
  );
}
