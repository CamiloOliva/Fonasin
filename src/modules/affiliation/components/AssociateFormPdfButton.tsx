import { useRef, useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { fetchAdminAffiliationApplication, type AdminAffiliationDocument } from '../../../services/adminAffiliationService';

export default function AssociateFormPdfButton({ applicationId, onPreview }: {
  applicationId: string;
  onPreview: (document: AdminAffiliationDocument | null) => void;
}) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function openPdf() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage('');
    onPreview(null);
    try {
      // Fetch fresh, short-lived private links for this exact enabled form.
      const application = await fetchAdminAffiliationApplication(applicationId);
      if (application.id !== applicationId) throw new Error('No fue posible identificar el PDF de este formulario.');
      const document = application.documents
        .filter(item => item.application_id === applicationId && item.document_type === 'affiliation_summary' && item.status === 'uploaded' && item.mime_type === 'application/pdf')
        .sort((a, b) => (b.uploaded_at ?? '').localeCompare(a.uploaded_at ?? '') || b.id.localeCompare(a.id))[0];
      if (!document) {
        setMessage('Este formulario no tiene un PDF guardado disponible.');
        return;
      }
      onPreview(document);
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'No fue posible consultar el PDF. Intenta nuevamente.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  return <div className="mb-5">
    <button type="button" disabled={busy} onClick={openPdf}
      className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-wait disabled:opacity-50">
      {busy ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
      {busy ? 'Consultando PDF…' : 'Ver formulario PDF'}
    </button>
    {message && <p role="status" className="mt-3 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-700">{message}</p>}
  </div>;
}
