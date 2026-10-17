import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FPQRSForm from './FPQRSForm';

afterEach(() => vi.unstubAllGlobals());

async function fillForm(file?: File) {
  const user = userEvent.setup({ applyAccept: false });
  render(<FPQRSForm />);
  await user.type(screen.getByRole('textbox', { name: /nombre completo/i }), 'Synthetic Citizen');
  await user.type(screen.getByRole('textbox', { name: /correo electronico/i }), 'citizen@example.test');
  await user.selectOptions(screen.getByRole('combobox'), 'petition');
  await user.type(screen.getByRole('textbox', { name: /^mensaje/i }), 'Synthetic message.');
  if (file) await user.upload(screen.getByLabelText(/archivo adjunto/i), file);
  return user;
}

function response(status: number, deliveryStatus?: string) {
  return {
    ok: status < 400,
    status,
    json: async () => ({ data: { id: 'synthetic-id', delivery_status: deliveryStatus } }),
  };
}

describe('FPQRS delivery confirmation', () => {
  it.each([
    ['without attachment', undefined],
    ['PDF', new File(['%PDF-1.4'], 'support.pdf', { type: 'application/pdf' })],
    ['PNG', new File(['synthetic image'], 'support.png', { type: 'image/png' })],
    ['JPEG', new File(['synthetic image'], 'support.jpg', { type: 'image/jpeg' })],
  ])('confirms a successful submission %s and sends its optional file', async (_label, file) => {
    const fetchMock = vi.fn().mockResolvedValue(response(201, 'sent'));
    vi.stubGlobal('fetch', fetchMock);
    const user = await fillForm(file);
    await user.click(screen.getByRole('button', { name: /^enviar solicitud$/i }));
    expect(await screen.findByRole('heading', { name: 'Solicitud enviada' })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0][1];
    expect(request.body).toBeInstanceOf(FormData);
    expect(request.body.get('email')).toBe('citizen@example.test');
    expect(request.body.get('attachment')).toEqual(file ?? null);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    [502, 'failed'], [200, 'failed'], [200, 'pending'],
  ])('never shows success for HTTP %s with delivery status %s', async (status, deliveryStatus) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(status, deliveryStatus)));
    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: /^enviar solicitud$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/no se confirmo el envio/i);
    expect(screen.queryByRole('heading', { name: 'Solicitud enviada' })).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^mensaje/i })).toHaveValue('Synthetic message.');
    expect(screen.getByRole('button', { name: /^enviar solicitud$/i })).toBeEnabled();
  });

  it.each([422, 500])('handles an HTTP %s response without a JSON message', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status, json: async () => { throw new SyntaxError('Not JSON'); },
    }));
    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: /^enviar solicitud$/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).not.toHaveTextContent(/includes|TypeError|SyntaxError/);
    expect(screen.queryByRole('heading', { name: 'Solicitud enviada' })).not.toBeInTheDocument();
  });

  it('handles a network failure without confirming delivery', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: /^enviar solicitud$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/no fue posible conectar/i);
    expect(screen.queryByRole('heading', { name: 'Solicitud enviada' })).not.toBeInTheDocument();
  });

  it.each([undefined, 'unexpected'])('does not claim registration for an unknown delivery result %s', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response(200, status)));
    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: /^enviar solicitud$/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/no pudimos confirmar el registro ni el envio/i);
    expect(alert).not.toHaveTextContent(/fue registrada/i);
  });

  it.each([200, 502])('does not claim registration for an unreadable HTTP %s response', async (status) => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: status < 400, status, json: async () => { throw new SyntaxError('Not JSON'); },
    }));
    const user = await fillForm();
    await user.click(screen.getByRole('button', { name: /^enviar solicitud$/i }));
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/no pudimos confirmar el registro ni el envio/i);
    expect(alert).not.toHaveTextContent(/fue registrada/i);
    expect(screen.queryByRole('heading', { name: 'Solicitud enviada' })).not.toBeInTheDocument();
  });

  it.each([
    ['oversized', new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.pdf', { type: 'application/pdf' })],
    ['invalid type', new File(['synthetic'], 'script.svg', { type: 'image/svg+xml' })],
  ])('blocks sending after a rejected %s attachment, until it is explicitly removed', async (_label, file) => {
    const fetchMock = vi.fn().mockResolvedValue(response(201, 'sent'));
    vi.stubGlobal('fetch', fetchMock);
    const user = await fillForm(file);
    expect(screen.getByRole('alert')).toHaveTextContent(/adjunto/i);
    expect(screen.getByRole('button', { name: /^enviar solicitud$/i })).toBeDisabled();
    // Enter/programmatic submit must not bypass the disabled button.
    fireEvent.submit(screen.getByRole('button', { name: /^enviar solicitud$/i }).closest('form')!);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /retirar archivo/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^enviar solicitud$/i }));
    expect(await screen.findByRole('heading', { name: 'Solicitud enviada' })).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][1].body.has('attachment')).toBe(false);
  });

  it('allows replacing a rejected file with a valid attachment', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response(201, 'sent'));
    vi.stubGlobal('fetch', fetchMock);
    const user = await fillForm(new File(['synthetic'], 'script.svg', { type: 'image/svg+xml' }));
    const file = new File(['%PDF-1.4'], 'support.pdf', { type: 'application/pdf' });
    await user.upload(screen.getByLabelText(/archivo adjunto/i), file);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^enviar solicitud$/i }));
    expect(await screen.findByRole('heading', { name: 'Solicitud enviada' })).toBeInTheDocument();
    expect(fetchMock.mock.calls[0][1].body.get('attachment')).toEqual(file);
  });
});
