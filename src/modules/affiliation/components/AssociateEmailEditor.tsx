import { useRef, useState, type FormEvent } from 'react';
import type { AdminAssociate } from '../../../services/adminAssociateService';

export default function AssociateEmailEditor({ associate, onSave }: {
  associate: AdminAssociate;
  onSave: (id: string, email: string, confirmation: string, expectedEmail: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [error, setError] = useState('');
  if (!associate.user) return null;
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (lock.current || !associate.user) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      await onSave(associate.id, email, confirmation, associate.user.email);
      setOpen(false);
      setEmail('');
      setConfirmation('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No fue posible guardar el correo.');
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return <div className="mt-2 text-left">
    {!open ? <button type="button" className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-black" onClick={() => setOpen(true)}>Editar correo</button> :
      <form onSubmit={submit} className="min-w-72 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
        <p className="text-xs">Actual: {associate.user.email}</p>
        <p className="text-xs">Al guardar, la cuenta queda inactiva y se invalidan su contraseña y accesos anteriores. Después debes activarla y enviar un nuevo acceso. Cancelar no modifica la cuenta.</p>
        <label className="block text-xs font-bold">Nuevo correo<input className="mt-1 block w-full rounded border p-2" type="email" maxLength={255} required value={email} disabled={busy} onChange={e => setEmail(e.target.value)} /></label>
        <label className="block text-xs font-bold">Confirmar nuevo correo<input className="mt-1 block w-full rounded border p-2" type="email" maxLength={255} required value={confirmation} disabled={busy} onChange={e => setConfirmation(e.target.value)} /></label>
        {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
        <div className="flex gap-2"><button disabled={busy} className="rounded bg-emerald-700 px-3 py-2 text-xs font-bold text-white">{busy ? 'Guardando…' : 'Guardar correo'}</button>
          <button type="button" disabled={busy} onClick={() => { setOpen(false); setError(''); setEmail(''); setConfirmation(''); }}>Cancelar</button></div>
      </form>}
  </div>;
}
