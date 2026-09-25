import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppRoutes from './AppRoutes';
import * as adminAffiliationService from '../services/adminAffiliationService';
import * as adminContributionService from '../services/adminContributionService';
import * as adminCreditService from '../services/adminCreditService';
import * as portalService from '../services/portalService';

vi.mock('../components/sections/StatutesBookViewer', () => ({
  default: () => (
    <div role="region" aria-label="visor de lectura">
      <button type="button">Siguiente</button>
    </div>
  ),
}));

vi.mock('../services/portalService', () => ({
  changeOwnPassword: vi.fn(),
  currentPortalUser: vi.fn().mockRejectedValue(new Error('guest')),
  fetchPortalAffiliation: vi.fn().mockResolvedValue(null),
  fetchPortalContributions: vi.fn().mockResolvedValue({ state: 'module_disabled', account: null, movements: [] }),
  fetchPortalCredits: vi.fn().mockResolvedValue([]),
  fetchPortalVoluntarySavingsRequests: vi.fn().mockResolvedValue([]),
  loginPortal: vi.fn(),
  logoutPortal: vi.fn(),
  portalDocumentPreviewUrl: vi.fn((path: string) => path),
  startPortalAffiliationUpdate: vi.fn(),
  submitPortalVoluntarySavingsRequest: vi.fn(),
}));

vi.mock('../services/adminAffiliationService', () => ({
  adminAffiliationDocumentUrl: vi.fn((path: string) => path),
  currentAdminUser: vi.fn().mockRejectedValue(new Error('guest')),
  fetchAdminAffiliationApplications: vi.fn().mockResolvedValue([]),
  fetchAdminAffiliationApplication: vi.fn(),
  loginAdmin: vi.fn(),
  logoutAdmin: vi.fn(),
  startAdminAffiliationReview: vi.fn(),
  requestAdminAffiliationCorrection: vi.fn(),
  rejectAdminAffiliationApplication: vi.fn(),
  approveAdminAffiliationApplication: vi.fn(),
  enableAdminAffiliationApplication: vi.fn(),
  uploadSignedPayrollAuthorization: vi.fn(),
}));

vi.mock('../services/adminAssociateService', () => ({
  activateAdminAssociate: vi.fn(),
  createAdminAssociate: vi.fn(),
  deactivateAdminAssociate: vi.fn(),
  fetchAdminAssociates: vi.fn().mockResolvedValue([]),
}));

vi.mock('../services/adminCreditService', () => ({
  archiveAdminCredit: vi.fn(),
  createAdminCredit: vi.fn(),
  downloadAdminImportErrorReport: vi.fn(),
  downloadAdminImportTemplate: vi.fn(),
  fetchAdminCredits: vi.fn().mockResolvedValue([]),
  fetchAdminImportBatches: vi.fn().mockResolvedValue({
    data: [],
    meta: { current_page: 1, last_page: 1, per_page: 50, total: 0 },
  }),
  importAdminSpreadsheet: vi.fn(),
  updateAdminCredit: vi.fn(),
}));

vi.mock('../services/adminContributionService', () => ({
  adminContributionDocumentUrl: vi.fn((path: string) => path),
  fetchAdminContributionAccounts: vi.fn().mockResolvedValue({
    data: [],
    meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
  }),
  fetchAdminContributionMovements: vi.fn(),
  fetchAdminVoluntarySavingsRequests: vi.fn().mockResolvedValue({
    data: [],
    meta: { current_page: 1, last_page: 1, per_page: 25, total: 0 },
  }),
  reviewAdminVoluntarySavingsRequest: vi.fn(),
  uploadSignedVoluntarySavingsAuthorization: vi.fn(),
}));

vi.mock('../services/passwordRecoveryService', () => ({
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
}));

function renderRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );
}

describe('AppRoutes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(portalService.currentPortalUser).mockRejectedValue(new Error('guest'));
  });

  it('renders the public credits route', () => {
    renderRoute('/creditos');

    expect(screen.getByRole('heading', { name: /un impulso para cada uno de tus proyectos/i })).toBeInTheDocument();
  });

  it('renders the estatutos route', () => {
    renderRoute('/estatutos');

    expect(screen.getByRole('heading', { level: 1, name: /estatutos/i })).toBeInTheDocument();
  });

  it('opens the estatutos viewer with a download action', async () => {
    const user = userEvent.setup();

    renderRoute('/estatutos');

    const estatutosHeading = screen.getByRole('heading', { level: 3, name: /^estatutos$/i });
    const estatutosCard = estatutosHeading.closest('article');

    expect(estatutosCard).not.toBeNull();

    await user.click(within(estatutosCard as HTMLElement).getByRole('button', { name: /ver estatutos definitivos 2024/i }));

    const dialog = screen.getByRole('dialog', { name: /estatutos/i });

    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByRole('link', { name: /descargar/i })).toHaveAttribute(
      'href',
      expect.stringContaining('ESTATUTOS%20DEFINITIVOS%202024.pdf'),
    );
    expect(within(dialog).getByRole('button', { name: /siguiente/i })).toBeInTheDocument();
  });

  it('renders the FONALIBRE detail route', () => {
    renderRoute('/creditos/fonalibre');

    expect(screen.getByRole('heading', { name: /fonalibre/i })).toBeInTheDocument();
  });

  it('renders the FONAPEN detail route', () => {
    renderRoute('/creditos/fonapen');

    expect(screen.getByRole('heading', { level: 1, name: /fonapen/i })).toBeInTheDocument();
  });

  it('renders the FONAPRIMA detail route', () => {
    renderRoute('/creditos/fonaprima');

    expect(screen.getByRole('heading', { level: 1, name: /fonaprima/i })).toBeInTheDocument();
  });

  it('renders the FONAPORTES detail route', () => {
    renderRoute('/creditos/fonaportes');

    expect(screen.getByRole('heading', { level: 1, name: /fonaportes/i })).toBeInTheDocument();
  });

  it('renders the associate portal login route', async () => {
    renderRoute('/portal-asociado');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /iniciar sesion/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /consulta tus creditos/i })).toBeInTheDocument();
  });

  it('redirects anonymous visitors away from profile completion', async () => {
    renderRoute('/portal-asociado/completar-perfil');

    expect(await screen.findByRole('heading', { name: /iniciar sesion/i })).toBeInTheDocument();
    expect(portalService.startPortalAffiliationUpdate).not.toHaveBeenCalled();
    expect(screen.queryByRole('heading', { level: 1, name: /^formulario de afiliacion$/i })).not.toBeInTheDocument();
  });

  it('renders profile completion only for an authenticated associate', async () => {
    vi.mocked(portalService.currentPortalUser).mockResolvedValue({
      id: 'associate-user',
      email: 'associate@fonasin.test',
      roles: ['associate'],
      must_change_password: false,
    });
    vi.mocked(portalService.startPortalAffiliationUpdate).mockRejectedValueOnce(new Error('draft unavailable'));

    renderRoute('/portal-asociado/completar-perfil');

    expect(await screen.findByRole('heading', { level: 1, name: /completar perfil/i })).toBeInTheDocument();
  });

  it('opens profile completion after the mandatory first password change', async () => {
    const user = userEvent.setup();
    vi.mocked(portalService.currentPortalUser)
      .mockResolvedValueOnce({
      id: 'new-associate-user',
      email: 'new.associate@fonasin.test',
      roles: ['associate'],
      must_change_password: true,
      requires_profile_completion: true,
      profile_completion_status: null,
      })
      .mockResolvedValueOnce({
        id: 'new-associate-user',
        email: 'new.associate@fonasin.test',
        roles: ['associate'],
        must_change_password: false,
        requires_profile_completion: true,
        profile_completion_status: null,
      });
    vi.mocked(portalService.changeOwnPassword).mockResolvedValueOnce({
      id: 'new-associate-user',
      email: 'new.associate@fonasin.test',
      roles: ['associate'],
      must_change_password: false,
      requires_profile_completion: true,
      profile_completion_status: null,
    });
    vi.mocked(portalService.startPortalAffiliationUpdate).mockResolvedValue({
      id: 'profile-draft-id',
      status: 'draft',
      purpose: 'profile_completion',
      source_application_id: null,
      draft_access_token: 'draft-token',
      links: { read: '/affiliation-applications/profile-draft-id?signature=test' },
    });

    renderRoute('/portal-asociado');

    await user.type(await screen.findByLabelText(/contrasena temporal/i), 'Temporal123');
    await user.type(screen.getByLabelText(/^nueva contrasena$/i), 'NuevaClave123');
    await user.type(screen.getByLabelText(/confirmar nueva contrasena/i), 'NuevaClave123');
    await user.click(screen.getByRole('button', { name: /guardar contrasena/i }));

    expect(await screen.findByRole('heading', { level: 1, name: /completar perfil/i })).toBeInTheDocument();
    expect(portalService.startPortalAffiliationUpdate).toHaveBeenCalled();
  });

  it('redirects anonymous visitors away from data updates', async () => {
    renderRoute('/portal-asociado/actualizar-datos');

    expect(await screen.findByRole('heading', { name: /iniciar sesion/i })).toBeInTheDocument();
    expect(portalService.startPortalAffiliationUpdate).not.toHaveBeenCalled();
  });

  it('opens the data update flow after portal authentication intent', async () => {
    vi.mocked(portalService.currentPortalUser).mockResolvedValue({
      id: 'associate-user',
      email: 'associate@fonasin.test',
      roles: ['associate'],
      must_change_password: false,
      requires_profile_completion: false,
      profile_completion_status: null,
    });
    vi.mocked(portalService.startPortalAffiliationUpdate).mockResolvedValue({
      id: 'update-draft-id',
      status: 'draft',
      purpose: 'data_update',
      source_application_id: 'enabled-application-id',
      draft_access_token: 'draft-token',
      links: { read: '/affiliation-applications/update-draft-id?signature=test' },
    });

    renderRoute('/portal-asociado?intent=actualizar-datos');

    expect(await screen.findByRole('heading', { level: 1, name: /actualizar datos/i })).toBeInTheDocument();
    expect(portalService.startPortalAffiliationUpdate).toHaveBeenCalled();
  });

  it('opens voluntary savings outside the affiliation flow', async () => {
    vi.mocked(portalService.currentPortalUser).mockResolvedValue({
      id: 'associate-user',
      email: 'associate@fonasin.test',
      roles: ['associate'],
      must_change_password: false,
    });

    renderRoute('/portal-asociado?intent=ahorro-voluntario');

    expect(await screen.findByRole('heading', { level: 2, name: /ahorro voluntario/i })).toBeInTheDocument();
    expect(portalService.fetchPortalVoluntarySavingsRequests).toHaveBeenCalled();
    expect(portalService.startPortalAffiliationUpdate).not.toHaveBeenCalled();
  });

  it('separates credits, contributions and both savings in the account statement', async () => {
    vi.mocked(portalService.currentPortalUser).mockResolvedValue({
      id: 'associate-user',
      email: 'associate@fonasin.test',
      roles: ['associate'],
      must_change_password: false,
      requires_profile_completion: false,
    });
    vi.mocked(portalService.fetchPortalCredits).mockResolvedValue([]);
    vi.mocked(portalService.fetchPortalVoluntarySavingsRequests).mockResolvedValue([{
      id: 'savings-request-1',
      monthly_amount: '100000.00',
      status: 'approved',
      submitted_at: '2026-09-23T20:06:40Z',
      reviewed_at: '2026-09-24T01:28:41Z',
      review_notes: null,
    }]);
    vi.mocked(portalService.fetchPortalContributions).mockResolvedValue({
      state: 'available',
      account: {
        id: 'account-1',
        contribution_balance: '100000.00',
        permanent_savings_balance: '150000.00',
        voluntary_savings_balance: '50000.00',
        total_balance: '300000.00',
        status: 'active',
        last_period: '2026-09-01',
        last_cut_off_date: '2026-09-30',
        last_movement_at: '2026-09-30T12:00:00Z',
      },
      movements: [],
    });

    renderRoute('/portal-asociado');

    expect(await screen.findByRole('heading', { level: 2, name: /creditos vigentes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /^aportes$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /^ahorro permanente$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /^ahorro voluntario$/i })).toBeInTheDocument();
    expect(screen.getByText(/solicitud: aprobada/i)).toBeInTheDocument();
    expect(screen.getByText(/100\.000.*mensuales/i)).toBeInTheDocument();
  });

  it('rejects admin users from the associate portal', async () => {
    const user = userEvent.setup();
    vi.mocked(portalService.loginPortal).mockResolvedValueOnce({
      id: 'admin-user',
      email: 'admin@fonasin.test',
      roles: ['admin'],
      must_change_password: false,
    });
    vi.mocked(portalService.logoutPortal).mockResolvedValueOnce();

    renderRoute('/portal-asociado');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /iniciar sesion/i })).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/correo electronico/i), 'admin@fonasin.test');
    await user.type(screen.getByLabelText(/contrasena/i), 'Admin12345');
    await user.click(screen.getByRole('button', { name: /entrar al portal/i }));

    await waitFor(() => {
      expect(screen.getByText(/no tiene acceso al portal asociado/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/resumen de creditos registrados/i)).not.toBeInTheDocument();
    expect(portalService.logoutPortal).toHaveBeenCalled();
  });

  it('renders the administrative affiliation login route', async () => {
    renderRoute('/admin-fonasin');

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /iniciar sesion administrativa/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /revision interna de afiliaciones/i })).toBeInTheDocument();
  });

  it('loads contribution accounts and movements from the administrative panel', async () => {
    const user = userEvent.setup();
    vi.mocked(adminAffiliationService.currentAdminUser).mockResolvedValueOnce({
      id: 'admin-user',
      email: 'admin@fonasin.test',
      roles: ['admin'],
      must_change_password: false,
    });
    vi.mocked(adminContributionService.fetchAdminContributionAccounts).mockResolvedValueOnce({
      data: [{
        id: 'account-1',
        associate_id: 'associate-1',
        contribution_balance: '100000.00',
        permanent_savings_balance: '150000.00',
        voluntary_savings_balance: '50000.00',
        total_balance: '200000.00',
        status: 'active',
        last_period: '2026-09-01',
        last_cut_off_date: '2026-09-30',
        last_movement_at: '2026-09-30T12:00:00Z',
        movements_count: 1,
        associate: { id: 'associate-1', full_name: 'Asociado Demo', document_type: 'CC', status: 'active' },
      }],
      meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
    });
    vi.mocked(adminContributionService.fetchAdminContributionMovements).mockResolvedValueOnce({
      data: [{
        id: 'movement-1',
        movement_type: 'permanent_savings',
        period: '2026-09-01',
        cut_off_date: '2026-09-30',
        amount: '150000.00',
        balance_after: '150000.00',
        status: 'registered',
        source: 'xlsx',
        reference: 'AP-001',
        recorded_at: '2026-09-30T12:00:00Z',
        recorded_by: { id: 'admin-user', email: 'admin@fonasin.test' },
      }],
      account: {
        id: 'account-1',
        associate_id: 'associate-1',
        contribution_balance: '100000.00',
        permanent_savings_balance: '150000.00',
        voluntary_savings_balance: '50000.00',
        total_balance: '200000.00',
        status: 'active',
        last_period: '2026-09-01',
        last_cut_off_date: '2026-09-30',
        last_movement_at: '2026-09-30T12:00:00Z',
        movements_count: 1,
        associate: { id: 'associate-1', full_name: 'Asociado Demo', document_type: 'CC', status: 'active' },
      },
      meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 },
    });

    renderRoute('/admin-fonasin');

    await user.click(await screen.findByRole('button', { name: /^aportes y ahorros$/i }));

    expect(await screen.findByRole('heading', { name: /administracion de aportes y ahorros/i })).toBeInTheDocument();
    expect(await screen.findByText('AP-001')).toBeInTheDocument();
    expect(adminContributionService.fetchAdminContributionAccounts).toHaveBeenCalled();
    expect(adminContributionService.fetchAdminContributionMovements).toHaveBeenCalledWith(
      'account-1',
      expect.any(Object),
    );
  });

  it('shows the final reviewed request and its signed authorization to administrators', async () => {
    const user = userEvent.setup();
    vi.mocked(adminAffiliationService.currentAdminUser).mockResolvedValueOnce({
      id: 'admin-user',
      email: 'admin@fonasin.test',
      roles: ['admin'],
      must_change_password: false,
    });
    vi.mocked(adminContributionService.fetchAdminVoluntarySavingsRequests).mockResolvedValueOnce({
      data: [{
        id: 'savings-request-1',
        monthly_amount: '250000.00',
        status: 'approved',
        submitted_at: '2026-09-23T20:06:40Z',
        reviewed_at: '2026-09-24T01:28:41Z',
        signed_authorization_uploaded_at: '2026-09-24T01:30:00Z',
        review_notes: 'Validada para tramite.',
        associate: {
          id: 'associate-1',
          full_name: 'Asociado Demo',
          document_type: 'CC',
          status: 'active',
        },
        reviewed_by: { id: 'admin-user', email: 'admin@fonasin.test' },
        links: {
          payroll_authorization_preview: '/generated/preview',
          payroll_authorization_download: '/generated/download',
          signed_authorization_preview: '/signed/preview',
          signed_authorization_download: '/signed/download',
        },
      }],
      meta: { current_page: 1, last_page: 2, per_page: 25, total: 26 },
    });

    renderRoute('/admin-fonasin');

    await user.click(await screen.findByRole('button', { name: /^aportes y ahorros$/i }));

    expect(await screen.findByText('Asociado Demo')).toBeInTheDocument();
    expect(screen.getByText(/aprobada/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver firmada/i })).toHaveAttribute('href', '/signed/preview');
    expect(screen.getByRole('link', { name: /descargar/i })).toHaveAttribute('href', '/signed/download');
    expect(screen.queryByRole('button', { name: /aprobar/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/libranza firmada de asociado demo/i)).not.toBeInTheDocument();
    const requestsSection = screen.getByRole('heading', { name: /solicitudes de ahorro voluntario/i }).closest('section');
    expect(requestsSection).not.toBeNull();
    await user.click(within(requestsSection as HTMLElement).getByRole('button', { name: /siguiente/i }));
    expect(adminContributionService.fetchAdminVoluntarySavingsRequests).toHaveBeenLastCalledWith(2);
  });

  it('shows operational upload forms inside the imports view', async () => {
    const user = userEvent.setup();
    vi.mocked(adminAffiliationService.currentAdminUser).mockResolvedValueOnce({
      id: 'admin-user',
      email: 'admin@fonasin.test',
      roles: ['admin'],
      must_change_password: false,
    });

    renderRoute('/admin-fonasin');

    await user.click(await screen.findByRole('button', { name: /^importaciones$/i }));

    expect(await screen.findByRole('heading', { name: /subir archivos operativos/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/archivo ahorro voluntario/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /importar ahorro voluntario/i })).toBeInTheDocument();
    expect(adminCreditService.fetchAdminImportBatches).toHaveBeenCalled();
  });

  it('renders the password recovery route', () => {
    renderRoute('/recuperar-contrasena');

    expect(screen.getByRole('heading', { name: /recupera tu contrasena/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enviar enlace temporal/i })).toBeInTheDocument();
  });

  it('renders the Manejar detail route', () => {
    renderRoute('/convenios/manejar');

    expect(screen.getByRole('heading', { name: /protección vial, seguros y/i })).toBeInTheDocument();
  });

  it('renders the UMA IPS detail route', () => {
    renderRoute('/convenios/uma-ips');

    expect(screen.getByRole('heading', { name: /medicina integral/i })).toBeInTheDocument();
  });

  it('muestra las condiciones actualizadas del convenio Sanitas', () => {
    renderRoute('/convenios/sanitas');

    expect(screen.getByRole('heading', { name: /12 especialidades y citas en máximo 5 días/i })).toBeInTheDocument();
    expect(screen.getByText(/no tenemos en cuenta preexistencias médicas/i)).toBeInTheDocument();
    expect(screen.getByText(/régimen contributivo de EPS Sanitas/i)).toBeInTheDocument();
  });

  it('muestra la tarifa actualizada del convenio Coorserpark', () => {
    renderRoute('/convenios/coorserpark');

    expect(screen.getByText(/\$14\.050/)).toBeInTheDocument();
  });

  it('muestra los contactos confirmados de Caribbean Sol y Mar', () => {
    renderRoute('/convenios/caribbean-sol-y-mar');

    expect(screen.getByRole('heading', { level: 1, name: /caribbean sol y mar/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /324 558 0932/i })).toHaveAttribute('href', 'https://wa.me/573245580932');
    expect(screen.getByRole('link', { name: /instagram/i })).toHaveAttribute('href', 'https://www.instagram.com/caribbeansolymar110');
  });

  it('muestra los contactos confirmados de Luz Marina Vargas', () => {
    renderRoute('/convenios/luz-marina-vargas');

    expect(screen.getByRole('heading', { level: 1, name: /luz marina vargas/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /lumavapa@hotmail.com/i })).toHaveAttribute('href', 'mailto:lumavapa@hotmail.com');
    expect(screen.getByRole('link', { name: /facebook/i })).toHaveAttribute('href', expect.stringContaining('61569011393925'));
  });

  it('falls back to the home page for an unknown route', () => {
    renderRoute('/ruta-inexistente');

    expect(screen.getByRole('heading', { name: /un fondo que te acompa/i })).toBeInTheDocument();
  });

  it('limpia el borrador temporal al cerrar sesion', async () => {
    const user = userEvent.setup();
    window.sessionStorage.setItem('fonasin.portal.affiliation.draft.v1', JSON.stringify({
      savedAt: Date.now(),
      id: 'draft-1',
      readUrl: '/signed-read-url',
      status: 'draft',
      purpose: 'data_update',
    }));
    vi.mocked(portalService.currentPortalUser).mockResolvedValueOnce({
      id: 'associate-user',
      email: 'associate@fonasin.test',
      roles: ['associate'],
      must_change_password: false,
    });
    vi.mocked(portalService.fetchPortalCredits).mockResolvedValueOnce([]);
    vi.mocked(portalService.logoutPortal).mockResolvedValueOnce();

    renderRoute('/portal-asociado');

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /cerrar sesion/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('button', { name: /cerrar sesion/i }));

    expect(window.sessionStorage.getItem('fonasin.portal.affiliation.draft.v1')).toBeNull();
  });});
