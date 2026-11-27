import { createElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AssociateEmailEditor from './AssociateEmailEditor';
import AssociateTableScroll from './AssociateTableScroll';
import { AssociatesPanel } from '../../../pages/AdminFonasin/AdminFonasin';
import type { AdminAssociate } from '../../../services/adminAssociateService';

const associate: AdminAssociate = {
  id: 'synthetic-id', user_id: 'synthetic-user', document_type: 'CC', document_number_masked: '***1234',
  full_name: 'Persona Sintetica', status: 'active', user: { id: 'synthetic-user', email: 'original@example.test', status: 'active' },
  activation_required: false, legacy_validation_required: false, has_identity_support: false,
  legacy_validated_at: null, legacy_validated_by_user_id: null, affiliation_applications_count: 0,
  credit_accounts_count: 0, created_at: null, updated_at: null,
};

describe('Correcciones administrativas de asociados', () => {
  it('opening and cancelling email editing does not mutate the account', () => {
    const save = vi.fn();
    render(createElement(AssociateEmailEditor, { associate, onSave: save }));
    fireEvent.click(screen.getByText('Editar correo'));
    expect(screen.getByText(/Al guardar, la cuenta queda inactiva/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Cancelar'));
    expect(save).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('Nuevo correo')).not.toBeInTheDocument();
  });

  it('sends confirmation and expected email once and disables controls while saving', async () => {
    let finish!: () => void;
    const save = vi.fn(() => new Promise<void>(resolve => { finish = resolve; }));
    render(createElement(AssociateEmailEditor, { associate, onSave: save }));
    fireEvent.click(screen.getByText('Editar correo'));
    fireEvent.change(screen.getByLabelText('Nuevo correo'), { target: { value: 'nuevo@example.test' } });
    fireEvent.change(screen.getByLabelText('Confirmar nuevo correo'), { target: { value: 'nuevo@example.test' } });
    const button = screen.getByText('Guardar correo');
    fireEvent.click(button);
    fireEvent.submit(button.closest('form')!);
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith(associate.id, 'nuevo@example.test', 'nuevo@example.test', 'original@example.test');
    expect(screen.getByText('Guardando…')).toBeDisabled();
    finish();
    await waitFor(() => expect(screen.getByText('Editar correo')).toBeInTheDocument());
  });

  it('keeps the entered email visible when saving fails', async () => {
    render(createElement(AssociateEmailEditor, { associate, onSave: vi.fn().mockRejectedValue(new Error('Correo ocupado')) }));
    fireEvent.click(screen.getByText('Editar correo'));
    fireEvent.change(screen.getByLabelText('Nuevo correo'), { target: { value: 'nuevo@example.test' } });
    fireEvent.change(screen.getByLabelText('Confirmar nuevo correo'), { target: { value: 'nuevo@example.test' } });
    fireEvent.click(screen.getByText('Guardar correo'));
    expect(await screen.findByRole('alert')).toHaveTextContent('Correo ocupado');
    expect(screen.getByLabelText('Nuevo correo')).toHaveValue('nuevo@example.test');
  });

  it('synchronizes the upper and lower horizontal scrollbars', () => {
    render(createElement(AssociateTableScroll, null, 'Tabla de prueba'));
    const top = screen.getByRole('region', { name: 'Desplazamiento horizontal superior de asociados' });
    const bottom = screen.getByRole('region', { name: 'Tabla de asociados' });
    top.scrollLeft = 120;
    fireEvent.scroll(top);
    expect(bottom.scrollLeft).toBe(120);
    bottom.scrollLeft = 35;
    fireEvent.scroll(bottom);
    expect(top.scrollLeft).toBe(35);
  });

  it('shows the real total, navigates beyond fifty and permits adding a missing identity support to an active exempt record', () => {
    const pageChange = vi.fn();
    const noop = vi.fn();
    const view = render(createElement(AssociatesPanel, {
      associates: [associate], meta: { current_page: 1, last_page: 2, per_page: 50, total: 51 }, onPageChange: pageChange,
      dataState: 'ready', profile: null, profileState: 'idle', search: '',
      form: { document_type: 'CC', document_number: '', full_name: '', email: '' }, createdAccess: null,
      onSearchChange: noop, onSearch: noop, onSelectProfile: noop, onDownloadProfile: noop,
      importState: 'idle', onImport: noop, onDownloadTemplate: noop, onSendActivation: noop,
      onFormChange: noop, onCreate: noop, onStatusChange: noop, onUploadIdentitySupport: noop,
      onDownloadIdentitySupport: noop, onCorrectEmail: vi.fn(), canManage: true,
    }));
    expect(screen.getByText('51 registros en total')).toBeInTheDocument();
    expect(screen.getByText('Cargar cedula')).toBeInTheDocument();
    expect(screen.getByText('Editar correo')).toBeInTheDocument();
    expect(screen.getByText('Anterior')).toBeDisabled();
    fireEvent.click(screen.getByText('Siguiente'));
    expect(pageChange).toHaveBeenCalledWith(2);
    view.unmount();
  });

  it('offers Ver todos and explains an empty search without claiming the directory is empty', () => {
    const clear = vi.fn();
    const noop = vi.fn();
    render(createElement(AssociatesPanel, {
      associates: [], meta: { current_page: 1, last_page: 1, per_page: 50, total: 0 },
      isFiltered: true, onClearSearch: clear, dataState: 'ready', profile: null, profileState: 'error', search: '1234567890',
      form: { document_type: 'CC', document_number: '', full_name: '', email: '' }, createdAccess: null,
      onSearchChange: noop, onSearch: noop, onSelectProfile: noop, onDownloadProfile: noop,
      importState: 'idle', onImport: noop, onDownloadTemplate: noop, onSendActivation: noop,
      onFormChange: noop, onCreate: noop, onStatusChange: noop, onUploadIdentitySupport: noop,
      onDownloadIdentitySupport: noop, canManage: true,
    }));
    expect(screen.getByText('No hay asociados para esta consulta.')).toBeInTheDocument();
    expect(screen.queryByText('No hay asociados registrados.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Ver todos'));
    expect(clear).toHaveBeenCalledOnce();
  });
});
