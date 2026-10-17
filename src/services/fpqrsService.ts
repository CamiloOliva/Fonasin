export type FPQRSForm = {
  fullName: string;
  email: string;
  type: string;
  message: string;
  file?: File | null;
};

export type FPQRSSubmission = {
  id: string;
  submission_type: string;
  delivery_status: string;
  submitted_at: string | null;
  has_attachment: boolean;
};

const backendBaseUrl = import.meta.env.VITE_BACKEND_BASE_URL?.trim().replace(/\/$/, '') ?? '';

function buildUrl(path: string): string {
  return `${backendBaseUrl}${path}`;
}

const deliveryFailureMessage = 'La solicitud fue registrada, pero no se confirmo el envio del correo a FONASIN. Contacta a FONASIN antes de reenviar para evitar duplicados.';
const unconfirmedSubmissionMessage = 'No pudimos confirmar el registro ni el envio de la solicitud. Contacta a FONASIN antes de reenviar para evitar duplicados.';

function translateFpqrsError(value: unknown, status: number): string {
  const message = typeof value === 'string' ? value : '';
  if (status >= 500) return 'No fue posible completar el envio. Contacta a FONASIN antes de reenviar.';
  if (status === 413) return 'El archivo adjunto supera el tamano permitido.';
  if (status === 422) return 'Revisa los campos del formulario y el archivo adjunto.';
  if (message.includes('Failed to fetch')) return 'No fue posible conectar con Laravel en este momento.';

  return message || 'No fue posible enviar la solicitud.';
}

export async function submitFPQRS(data: FPQRSForm): Promise<FPQRSSubmission> {
  const formData = new FormData();
  formData.append('full_name', data.fullName.trim());
  formData.append('email', data.email.trim());
  formData.append('submission_type', data.type);
  formData.append('message', data.message.trim());

  if (data.file) {
    formData.append('attachment', data.file);
  }

  try {
    const response = await fetch(buildUrl('/fpqrs-submissions'), {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
      body: formData,
    });

    const payload = await response.json().catch(() => null);
    const submission = payload?.data;
    const registrationConfirmed = typeof submission?.id === 'string' && submission.id.trim() !== ''
      && ['sent', 'failed', 'pending'].includes(submission.delivery_status);

    if (!response.ok) {
      if (response.status === 502) {
        throw new Error(registrationConfirmed ? deliveryFailureMessage : unconfirmedSubmissionMessage);
      }
      throw new Error(translateFpqrsError(payload?.message, response.status));
    }

    if (!registrationConfirmed) {
      throw new Error(unconfirmedSubmissionMessage);
    }
    if (submission.delivery_status !== 'sent') {
      throw new Error(deliveryFailureMessage);
    }

    return submission as FPQRSSubmission;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    throw new Error(translateFpqrsError(message, 0));
  }
}
