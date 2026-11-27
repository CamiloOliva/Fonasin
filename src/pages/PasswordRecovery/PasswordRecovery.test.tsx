import { createElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PasswordRecovery from './PasswordRecovery';
import { resetPassword } from '../../services/passwordRecoveryService';

vi.mock('../../services/passwordRecoveryService', () => ({ resetPassword: vi.fn(), requestPasswordReset: vi.fn() }));
beforeEach(() => vi.mocked(resetPassword).mockReset());

function openForm() {
  render(createElement(MemoryRouter, { initialEntries: ['/recuperar-contrasena?email=synthetic@example.test&token=synthetic-token'] }, createElement(PasswordRecovery)));
}
describe('Establecer contrasena desde enlace', () => {
  it('shows the requirements and lets the user reveal both passwords without submitting', () => {
    openForm();
    expect(screen.getByText(/Elige una contrasena propia de 8 a 128 caracteres/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nueva contrasena', { exact: true }), { target: { value: 'SyntheticPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar nueva contrasena' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar confirmar contrasena' }));
    expect(screen.getByLabelText('Nueva contrasena', { exact: true })).toHaveAttribute('type', 'text');
    expect(screen.getByLabelText('Confirmar contrasena', { exact: true })).toHaveAttribute('type', 'text');
    expect(resetPassword).not.toHaveBeenCalled();
  });
  it('preserves the password payload and clears and hides fields after success', async () => {
    vi.mocked(resetPassword).mockResolvedValue({ message: 'Contrasena actualizada.' });
    openForm();
    for (const label of ['Nueva contrasena', 'Confirmar contrasena']) fireEvent.change(screen.getByLabelText(label, { exact: true }), { target: { value: 'SyntheticPass123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar nueva contrasena' }));
    fireEvent.click(screen.getByRole('button', { name: /Guardar nueva contrasena/ }));
    await waitFor(() => expect(resetPassword).toHaveBeenCalledWith({ email: 'synthetic@example.test', token: 'synthetic-token', password: 'SyntheticPass123!', passwordConfirmation: 'SyntheticPass123!' }));
    expect(await screen.findByText('Contrasena actualizada.')).toBeInTheDocument();
    expect(screen.getByLabelText('Nueva contrasena', { exact: true })).toHaveValue('');
    expect(screen.getByLabelText('Nueva contrasena', { exact: true })).toHaveAttribute('type', 'password');
  });
});
