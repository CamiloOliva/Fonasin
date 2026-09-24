import { createElement } from 'react';
import { render, screen } from '@testing-library/react';
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
        status: 'active',
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
