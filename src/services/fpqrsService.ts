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

function translateFpqrsError(message: string, status: number): string {
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

    if (!response.ok) {
      throw new Error(translateFpqrsError(payload?.message, response.status));
    }

    return payload.data as FPQRSSubmission;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';

    throw new Error(translateFpqrsError(message, 0));
  }
}
