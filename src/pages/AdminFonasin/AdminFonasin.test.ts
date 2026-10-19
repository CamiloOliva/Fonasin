import { createElement } from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AdminAffiliationDetail } from '../../services/adminAffiliationService';
import {
  ApplicationDetail,
  AssociatesPanel,
  CreditsPanel,
  canManageAdminData,
  isAcceptedSpreadsheet,
} from './AdminFonasin';

const application: AdminAffiliationDetail = {
  id: 'application-1',
  purpose: 'initial_affiliation',
  applicant_name: null,
  source_application_id: null,
  status: 'under_review',
  current_step: 'summary',
  submitted_at: null,
  reviewed_at: null,
  reviewer: null,
  sections_count: 0,
  documents_count: 0,
  consents_count: 0,
  updated_at: null,
  created_at: null,
  rejection_reason: null,
  sections: [],
  documents: [],
  consents: [],
};

const applicationWithSections: AdminAffiliationDetail = {
  ...application,
  sections_count: 1,
  sections: [{
    id: 'section-1',
    application_id: application.id,
    section: 'personal',
    schema_version: 1,
    completed_at: '2026-09-23T10:00:00Z',
    data: {
      firstName: 'Persona',
      lastName: 'Prueba',
      residenceAddress: 'Direccion sintetica',
    },
  }],
};

function renderApplicationDetail(canManage: boolean) {
  const callback = vi.fn();

  return render(createElement(ApplicationDetail, {
    application,
    canManage,
    reason: '',
    signedPayrollFile: null,
    enableResult: null,
    onReasonChange: callback,
    onSignedPayrollFileChange: callback,
    onStartReview: callback,
    onRequestCorrection: callback,
    onApprove: callback,
    onReject: callback,
    onUploadSignedPayrollAuthorization: callback,
    onEnable: callback,
  }));
}

describe('AdminFonasin permissions and imports', () => {
  it('allows administrative data actions only to admin users', () => {
    expect(canManageAdminData({ id: '1', email: 'admin@test', roles: ['admin'], must_change_password: false })).toBe(true);
    expect(canManageAdminData({ id: '2', email: 'reviewer@test', roles: ['reviewer'], must_change_password: false })).toBe(false);
    expect(canManageAdminData(null)).toBe(false);
  });

  it('accepts only XLSX files before sending them to the backend', () => {
    expect(isAcceptedSpreadsheet(new File(['content'], 'aportes.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }))).toBe(true);
    expect(isAcceptedSpreadsheet(new File(['content'], 'aportes.csv', { type: 'text/csv' }))).toBe(false);
    expect(isAcceptedSpreadsheet(new File(['content'], 'aportes.xlsx', { type: 'text/plain' }))).toBe(false);
  });

  it('shows reviewers only the affiliation review actions', () => {
    renderApplicationDetail(false);

    expect(screen.getByRole('button', { name: 'Tomar revision' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitar correccion' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Aprobar formulario' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Rechazar' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Cargar libranza' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Habilitar asociado' })).not.toBeInTheDocument();
  });

  it('shows final affiliation actions to administrators', () => {
    renderApplicationDetail(true);

    expect(screen.getByRole('button', { name: 'Aprobar formulario' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Rechazar' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cargar libranza' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Habilitar asociado' })).toBeInTheDocument();
  });

  it('offers only PDF for the signed payroll authorization', () => {
    renderApplicationDetail(true);
    expect(screen.getByLabelText(/Archivo firmado/)).toHaveAttribute('accept', 'application/pdf,.pdf');
    expect(screen.getByText('PDF hasta 5MB.')).toBeInTheDocument();
    expect(screen.queryByText(/PDF, JPG o PNG/)).not.toBeInTheDocument();
  });

  it('never offers reactivation of settled credits and keeps valid actions', () => {
    const callback = vi.fn();
    render(createElement(CreditsPanel, {
      credits: ['active', 'settled', 'archived'].map((status) => ({
        id: `credit-${status}`, associate_id: 'associate-1', credit_line: 'FONALIBRE',
        initial_balance: '100.00', current_balance: '0.00', installment_amount: '10.00',
        term_months: 12, interest_rate: '1.0000', interest_rate_nominal_annual: null,
        status, registered_by_user_id: 'admin-1',
        associate: { id: 'associate-1', full_name: `Asociado ${status}`, document_type: 'CC', status: 'active' },
      })),
      associates: [], dataState: 'ready',
      form: { associate_id: '', credit_line: 'FONALIBRE', initial_balance: '', current_balance: '',
        term_months: '24', interest_rate: '1.2500', interest_rate_nominal_annual: '', installment_amount: '', status: 'active' },
      onFormChange: vi.fn(), onCreate: vi.fn(), onStatusChange: callback, canManage: true,
    }));
    expect(screen.queryByRole('button', { name: 'Reactivar' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar pagado' }));
    expect(callback).toHaveBeenCalledWith('credit-active', 'settled');
    const settled = within(screen.getByRole('row', { name: /Asociado settled/ }));
    expect(settled.queryByRole('button', { name: 'Marcar pagado' })).not.toBeInTheDocument();
    fireEvent.click(settled.getByRole('button', { name: 'Archivar' }));
    expect(callback).toHaveBeenCalledWith('credit-settled', 'archived');
    expect(within(screen.getByRole('row', { name: /Asociado archived/ })).getByRole('button', { name: 'Archivar' })).toBeDisabled();
    expect(callback).toHaveBeenCalledTimes(2);
  });

  it('shows decrypted application fields to administrators', () => {
    const callback = vi.fn();

    render(createElement(ApplicationDetail, {
      application: applicationWithSections,
      canManage: true,
      reason: '',
      signedPayrollFile: null,
      enableResult: null,
      onReasonChange: callback,
      onSignedPayrollFileChange: callback,
      onStartReview: callback,
      onRequestCorrection: callback,
      onApprove: callback,
      onReject: callback,
      onUploadSignedPayrollAuthorization: callback,
      onEnable: callback,
    }));

    expect(screen.getByText('Informacion completa del formulario')).toBeInTheDocument();
    expect(screen.getByText('Persona')).toBeInTheDocument();
    expect(screen.getByText('Direccion sintetica')).toBeInTheDocument();
  });

  it('shows both rates in credit rows without insignificant zeros or guessing a historic unit', () => {
    const credits = [
      { id: 'known', interest_rate: '1.5000', interest_rate_basis: 'monthly' as const, interest_rate_nominal_annual: '18.0000' },
      { id: 'historic', interest_rate: '18.0000', interest_rate_basis: null, interest_rate_nominal_annual: null },
    ].map((rate) => ({ ...rate, associate_id: 'associate-1', credit_line: rate.id,
      initial_balance: '100.00', current_balance: '50.00', installment_amount: '10.00', term_months: 12,
      status: 'active', registered_by_user_id: 'admin-1', associate: null }));
    render(createElement(CreditsPanel, {
      credits, associates: [], dataState: 'ready',
      form: { associate_id: '', credit_line: 'FONALIBRE', initial_balance: '', current_balance: '',
        term_months: '24', interest_rate: '1.2500', interest_rate_nominal_annual: '', installment_amount: '', status: 'active' },
      onFormChange: vi.fn(), onCreate: vi.fn(), onStatusChange: vi.fn(), canManage: false,
    }));
    expect(screen.getByRole('columnheader', { name: 'Tasa Int NA' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Tasa Int mv' })).toBeInTheDocument();
    const known = within(screen.getByRole('row', { name: /known/ }));
    expect(known.getByText('18%')).toBeInTheDocument();
    expect(known.getByText('1,5%')).toBeInTheDocument();
    expect(within(screen.getByRole('row', { name: /historic/ })).getAllByText('No informada')).toHaveLength(2);
  });

  it('renders associate and credit lists without mutation controls in read-only mode', () => {
    const callback = vi.fn();
    const associatesView = render(createElement(AssociatesPanel, {
      associates: [],
      dataState: 'ready',
      profile: null,
      profileState: 'idle',
      search: '',
      form: {
        document_type: 'CC',
        document_number: '',
        full_name: '',
        email: '',
      },
      createdAccess: null,
      onSearchChange: callback,
      onSearch: callback,
      onSelectProfile: callback,
      onDownloadProfile: callback,
      importState: 'idle',
      onImport: callback,
      onDownloadTemplate: callback,
      onSendActivation: callback,
      onFormChange: callback,
      onCreate: callback,
      onStatusChange: callback,
      onUploadIdentitySupport: callback,
      onDownloadIdentitySupport: callback,
      canManage: false,
    }));

    expect(screen.getByText('0 registros')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Crear asociado' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Consultar ficha' })).not.toBeInTheDocument();
    associatesView.unmount();

    render(createElement(CreditsPanel, {
      credits: [],
      associates: [],
      dataState: 'ready',
      form: {
        associate_id: '',
        credit_line: 'FONALIBRE',
        initial_balance: '',
        current_balance: '',
        term_months: '24',
        interest_rate: '1.2500',
        interest_rate_nominal_annual: '',
        installment_amount: '',
        status: 'active',
      },
      onFormChange: callback,
      onCreate: callback,
      onStatusChange: callback,
      canManage: false,
    }));

    expect(screen.getByText('0 registros')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Registrar credito' })).not.toBeInTheDocument();
    expect(screen.queryByText('Importar XLSX')).not.toBeInTheDocument();
  });
});
