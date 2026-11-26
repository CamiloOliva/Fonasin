import { createElement } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AssociateFormPdfButton from './AssociateFormPdfButton';
import { fetchAdminAffiliationApplication, type AdminAffiliationDetail, type AdminAffiliationDocument } from '../../../services/adminAffiliationService';

vi.mock('../../../services/adminAffiliationService', () => ({ fetchAdminAffiliationApplication: vi.fn() }));
const document: AdminAffiliationDocument = {
  id: 'document-1', application_id: 'form-1', document_type: 'affiliation_summary', original_filename: 'formulario.pdf',
  mime_type: 'application/pdf', byte_size: 100, status: 'uploaded', uploaded_at: '2026-11-26T10:00:00Z',
  links: { preview: '/private/preview?signed=temporary', download: '/private/download?signed=temporary' },
};
function response(documents: AdminAffiliationDocument[], id = 'form-1') {
  return { id, documents } as AdminAffiliationDetail;
}
beforeEach(() => vi.mocked(fetchAdminAffiliationApplication).mockReset());

describe('PDF guardado de la ficha', () => {
  it('requests private links for the selected application only when clicked', async () => {
    vi.mocked(fetchAdminAffiliationApplication).mockResolvedValue(response([document]));
    const preview = vi.fn();
    render(createElement(AssociateFormPdfButton, { applicationId: 'form-1', onPreview: preview }));
    expect(fetchAdminAffiliationApplication).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText('Ver formulario PDF'));
    await waitFor(() => expect(preview).toHaveBeenLastCalledWith(document));
    expect(fetchAdminAffiliationApplication).toHaveBeenCalledWith('form-1');
  });

  it('selects the latest uploaded form PDF rather than a libranza, an archived version or another application', async () => {
    const latest = { ...document, id: 'document-latest', uploaded_at: '2026-11-26T12:00:00Z' };
    vi.mocked(fetchAdminAffiliationApplication).mockResolvedValue(response([
      document, latest, { ...latest, id: 'archived', status: 'archived' },
      { ...latest, id: 'libranza', document_type: 'payroll_authorization' },
      { ...latest, id: 'other', application_id: 'form-2' },
    ]));
    const preview = vi.fn();
    render(createElement(AssociateFormPdfButton, { applicationId: 'form-1', onPreview: preview }));
    fireEvent.click(screen.getByText('Ver formulario PDF'));
    await waitFor(() => expect(preview).toHaveBeenLastCalledWith(latest));
  });

  it('explains when no saved PDF exists without generating or opening a replacement', async () => {
    vi.mocked(fetchAdminAffiliationApplication).mockResolvedValue(response([]));
    const preview = vi.fn();
    render(createElement(AssociateFormPdfButton, { applicationId: 'form-1', onPreview: preview }));
    fireEvent.click(screen.getByText('Ver formulario PDF'));
    expect(await screen.findByRole('status')).toHaveTextContent('Este formulario no tiene un PDF guardado disponible.');
    expect(preview).toHaveBeenCalledTimes(1);
    expect(preview).toHaveBeenCalledWith(null);
  });

  it('blocks repeated clicks while consulting and allows retry after an error', async () => {
    let reject!: (error: Error) => void;
    vi.mocked(fetchAdminAffiliationApplication).mockImplementationOnce(() => new Promise((_resolve, fail) => { reject = fail; }));
    render(createElement(AssociateFormPdfButton, { applicationId: 'form-1', onPreview: vi.fn() }));
    const button = screen.getByText('Ver formulario PDF');
    fireEvent.click(button);
    fireEvent.click(button);
    expect(fetchAdminAffiliationApplication).toHaveBeenCalledTimes(1);
    expect(screen.getByText('Consultando PDF…')).toBeDisabled();
    reject(new Error('No fue posible consultar el documento protegido.'));
    expect(await screen.findByRole('status')).toHaveTextContent('No fue posible consultar el documento protegido.');
    vi.mocked(fetchAdminAffiliationApplication).mockResolvedValue(response([document]));
    fireEvent.click(screen.getByText('Ver formulario PDF'));
    await waitFor(() => expect(fetchAdminAffiliationApplication).toHaveBeenCalledTimes(2));
  });

  it('fetches new temporary links on each attempt instead of retaining an expired link', async () => {
    const renewed = { ...document, links: { ...document.links, preview: '/private/preview?signed=renewed' } };
    vi.mocked(fetchAdminAffiliationApplication).mockResolvedValueOnce(response([document])).mockResolvedValueOnce(response([renewed]));
    const preview = vi.fn();
    render(createElement(AssociateFormPdfButton, { applicationId: 'form-1', onPreview: preview }));
    fireEvent.click(screen.getByText('Ver formulario PDF'));
    await waitFor(() => expect(preview).toHaveBeenLastCalledWith(document));
    fireEvent.click(screen.getByText('Ver formulario PDF'));
    await waitFor(() => expect(preview).toHaveBeenLastCalledWith(renewed));
  });

  it('does not preview a response for a different application', async () => {
    vi.mocked(fetchAdminAffiliationApplication).mockResolvedValue(response([document], 'form-2'));
    const preview = vi.fn();
    render(createElement(AssociateFormPdfButton, { applicationId: 'form-1', onPreview: preview }));
    fireEvent.click(screen.getByText('Ver formulario PDF'));
    expect(await screen.findByRole('status')).toHaveTextContent('No fue posible identificar el PDF de este formulario.');
    expect(preview).toHaveBeenCalledTimes(1);
  });
});
