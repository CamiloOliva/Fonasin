import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppRoutes from './AppRoutes';
import * as adminAffiliationService from '../services/adminAffiliationService';
import * as adminContributionService from '../services/adminContributionService';
import * as adminCreditService from '../services/adminCreditService';
import * as portalService from '../services/portalService';
import * as publicContentService from '../services/publicContentService';

vi.mock('../services/publicContentService', () => ({
  fetchPublicContent: vi.fn().mockResolvedValue({ data: [], settings: { contact_email: 'fonasin.bucaramanga@fonasin.com', facebook_url: null, instagram_url: null, youtube_url: null } }),
  fetchAdminPublicContent: vi.fn().mockResolvedValue({ data: [], settings: { contact_email: 'fonasin.bucaramanga@fonasin.com', facebook_url: null, instagram_url: null, youtube_url: null } }),
  publicContentMediaUrl: vi.fn((path: string) => path),
}));

vi.mock('../components/sections/StatutesBookViewer', () => ({
  default: () => (
    <div role="region" aria-label="visor de lectura">
      <button type="button">Siguiente</button>
    </div>
  ),
}));

vi.mock('../services/portalService', async (importOriginal) => ({
  PortalServiceError: (await importOriginal<typeof import('../services/portalService')>()).PortalServiceError,
  changeOwnPassword: vi.fn(),
  currentPortalUser: vi.fn().mockRejectedValue(new Error('guest')),
  fetchPortalAffiliation: vi.fn().mockResolvedValue(null),
  fetchPortalContributions: vi.fn().mockResolvedValue({ state: 'module_disabled', account: null, movements: [] }),
  fetchPortalCredits: vi.fn().mockResolvedValue([]),
  fetchPortalVoluntarySavingsRequests: vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, has_more: false } }),
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
    vi.mocked(portalService.fetchPortalVoluntarySavingsRequests).mockResolvedValue({ data: [], pagination: { page: 1, has_more: false } });
    const agreements = [
      ['manejar', 'Manejar', '/images/convenios/manejar.png'],
      ['uma-ips', 'UMA IPS', '/images/convenios/uma-ips.png'],
      ['sanitas', 'Sanitas', '/images/convenios/sanitas.png'],
      ['coorserpark', 'Coorserpark', '/images/convenios/coorserpark.png'],
      ['caribbean-sol-y-mar', 'Caribbean Sol y Mar', '/images/convenios/caribbean-sol-mar-logo.jpg'],
      ['luz-marina-vargas', 'Luz Marina Vargas', '/images/convenios/luz-marina-vargas-logo.jpg'],
    ].map(([slug, title, image_url]) => ({
      id: slug, kind: 'agreement' as const, title, summary: 'Descripción vigente', category: 'Turismo',
      link_url: null, sort_order: 0, published: true, published_at: null, image_url,
      document_url: null, legacy_detail_slug: slug, legacy_detail_modified: false,
    }));
    vi.mocked(publicContentService.fetchPublicContent).mockResolvedValue({
      data: agreements,
      settings: { contact_email: 'fonasin.bucaramanga@fonasin.com', facebook_url: null, instagram_url: null, youtube_url: null },
    });
  });

  it('offers the contracted public news and social balance routes without inventing publications', async () => {
    const news = renderRoute('/noticias');
    expect(screen.getByRole('heading', { name: /noticias y comunicados/i })).toBeInTheDocument();
    expect(await screen.findByText(/no ha suministrado publicaciones aprobadas/i)).toBeInTheDocument();
    news.unmount();

    renderRoute('/balance-social');
    expect(screen.getByRole('heading', { name: /balance social/i })).toBeInTheDocument();
    expect(await screen.findByText(/no ha suministrado un informe de balance social aprobado/i)).toBeInTheDocument();
    expect(publicContentService.fetchPublicContent).toHaveBeenCalled();
  });

  it('abre la administración limitada de contenido para admin', async () => {
    const user = userEvent.setup();
    vi.mocked(adminAffiliationService.currentAdminUser).mockResolvedValueOnce({ id: 'admin', email: 'admin@fonasin.test', roles: ['admin'], must_change_password: false });
    renderRoute('/admin-fonasin');
    await user.click(await screen.findByRole('button', { name: /contenido del sitio/i }));
    expect(await screen.findByRole('heading', { name: 'Publicaciones' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Nueva' })).toBeInTheDocument();
    expect(screen.getByDisplayValue('fonasin.bucaramanga@fonasin.com')).toBeInTheDocument();
  });

  it('keeps the savings form unavailable until its history is loaded and after a failed refresh', async () => {
    let resolveHistory!: (value: portalService.PortalVoluntarySavingsPage) => void;
    const user = userEvent.setup();
    vi.mocked(portalService.currentPortalUser).mockResolvedValueOnce({ id: 'associate', email: 'associate@fonasin.test', roles: ['associate'], must_change_password: false });
    vi.mocked(portalService.fetchPortalVoluntarySavingsRequests).mockImplementationOnce(() => new Promise(resolve => { resolveHistory = resolve; }));
    renderRoute('/portal-asociado?intent=ahorro-voluntario');
    expect(await screen.findByText('Cargando solicitudes')).toBeInTheDocument();
    expect(screen.getByLabelText('Valor mensual')).toBeDisabled();
    expect(screen.getByRole('button', { name: /^enviar solicitud$/i })).toBeDisabled();
    await act(async () => resolveHistory({ data: [], pagination: { page: 1, has_more: false } }));
    expect(screen.getByLabelText('Valor mensual')).toBeEnabled();
    vi.mocked(portalService.fetchPortalVoluntarySavingsRequests).mockRejectedValueOnce(new Error('History unavailable.'));
    await user.click(screen.getByRole('button', { name: /^actualizar$/i }));
    await waitFor(() => expect(screen.getByLabelText('Valor mensual')).toBeDisabled());
    expect(portalService.submitPortalVoluntarySavingsRequest).not.toHaveBeenCalled();
  });

  it('keeps voluntary savings unavailable while the associate profile awaits enablement', async () => {
    vi.mocked(portalService.currentPortalUser).mockResolvedValueOnce({
      id: 'associate', email: 'associate@fonasin.test', roles: ['associate'], must_change_password: false,
      requires_profile_completion: true, profile_completion_status: 'submitted',
    });
    renderRoute('/portal-asociado?intent=ahorro-voluntario');

    expect(await screen.findByText(/perfil personal y laboral debe estar completo y habilitado/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Valor mensual')).toBeDisabled();
    expect(screen.getByRole('button', { name: /^enviar solicitud$/i })).toBeDisabled();
    expect(portalService.submitPortalVoluntarySavingsRequest).not.toHaveBeenCalled();
  });

  it('blocks both review decisions and the signed upload while the selected request is being processed', async () => {
    const user = userEvent.setup();
    let resolveReview!: (value: adminContributionService.AdminVoluntarySavingsRequest) => void;
    let resolveUpload!: (value: adminContributionService.AdminVoluntarySavingsRequest) => void;
    const request: adminContributionService.AdminVoluntarySavingsRequest = {
      id: 'request-busy', monthly_amount: '100000.00', status: 'submitted', submitted_at: '2026-09-30T12:00:00Z', reviewed_at: null, review_notes: null,
      associate: { id: 'associate', full_name: 'Synthetic associate', document_type: 'CC', status: 'active' }, reviewed_by: null,
      links: { payroll_authorization_preview: '/preview', payroll_authorization_download: '/download' },
    };
    vi.mocked(adminAffiliationService.currentAdminUser).mockResolvedValueOnce({ id: 'admin', email: 'admin@fonasin.test', roles: ['admin'], must_change_password: false });
    vi.mocked(adminContributionService.fetchAdminVoluntarySavingsRequests).mockResolvedValueOnce({ data: [request], meta: { current_page: 1, last_page: 1, per_page: 25, total: 1 } });
    vi.mocked(adminContributionService.reviewAdminVoluntarySavingsRequest).mockImplementationOnce(() => new Promise(resolve => { resolveReview = resolve; }));
    renderRoute('/admin-fonasin');
    await user.click(await screen.findByRole('button', { name: /^aportes y ahorros$/i }));
    const approve = await screen.findByRole('button', { name: /^revision favorable$/i });
    await user.dblClick(approve);
    expect(approve).toBeDisabled();
    expect(screen.getByRole('button', { name: /^rechazar$/i })).toBeDisabled();
    expect(adminContributionService.reviewAdminVoluntarySavingsRequest).toHaveBeenCalledTimes(1);
    const approved = { ...request, status: 'awaiting_employer_authorization' as const };
    await act(async () => resolveReview(approved));
    const fileInput = screen.getByLabelText('Libranza firmada de Synthetic associate');
    vi.mocked(adminContributionService.uploadSignedVoluntarySavingsAuthorization).mockImplementationOnce(() => new Promise(resolve => { resolveUpload = resolve; }));
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    await user.upload(fileInput, new File(['%PDF-fixture'], 'signed.pdf', { type: 'application/pdf' }));
    expect(fileInput).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent('Procesando solicitud');
    await act(async () => resolveUpload({ ...approved, status: 'approved', links: { ...request.links, signed_authorization_preview: '/signed-preview' } }));
    expect(screen.queryByLabelText('Libranza firmada de Synthetic associate')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver firmada/i })).toHaveAttribute('href', '/signed-preview');
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

  it('keeps a rejected request visible and submits a new one with an owned authorization', async () => {
    const user = userEvent.setup();
    vi.mocked(portalService.currentPortalUser).mockResolvedValue({
      id: 'associate-user', email: 'associate@fonasin.test', roles: ['associate'], must_change_password: false,
    });
    const rejected: portalService.PortalVoluntarySavingsRequest = {
      id: 'rejected-request', monthly_amount: '150000.00', status: 'rejected',
      submitted_at: '2026-09-23T20:00:00Z', reviewed_at: '2026-09-24T20:00:00Z',
      review_notes: 'Revisar el valor solicitado.',
      links: {
        payroll_authorization_preview: '/portal/voluntary-savings-requests/rejected-request/payroll-authorization/preview',
        payroll_authorization_download: '/portal/voluntary-savings-requests/rejected-request/payroll-authorization/download',
      },
    };
    const submitted = { ...rejected, id: 'new-request', status: 'submitted' as const, reviewed_at: null, review_notes: null };
    vi.mocked(portalService.fetchPortalVoluntarySavingsRequests).mockResolvedValue({ data: [rejected], pagination: { page: 1, has_more: false } });
    vi.mocked(portalService.submitPortalVoluntarySavingsRequest).mockResolvedValueOnce(submitted);
    renderRoute('/portal-asociado?intent=ahorro-voluntario');
    expect(await screen.findByText('Revisar el valor solicitado.')).toBeInTheDocument();
    expect(screen.getByText(/envia una nueva solicitud/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^ver libranza$/i })).toHaveAttribute('href', rejected.links?.payroll_authorization_preview);
    await user.type(screen.getByLabelText(/valor mensual/i), '100000');
    await user.click(screen.getByRole('checkbox', { name: /confirmo que deseo/i }));
    await user.click(screen.getByRole('button', { name: /^enviar solicitud$/i }));
    await waitFor(() => expect(portalService.submitPortalVoluntarySavingsRequest).toHaveBeenCalledWith('100000'));
    expect(screen.getByText('Revisar el valor solicitado.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^enviar solicitud$/i })).toBeDisabled();
  });

  it('uses the signed authorization when it is available without enabling another pending request', async () => {
    vi.mocked(portalService.currentPortalUser).mockResolvedValue({
      id: 'associate-user', email: 'associate@fonasin.test', roles: ['associate'], must_change_password: false,
    });
    vi.mocked(portalService.fetchPortalVoluntarySavingsRequests).mockResolvedValue({ data: [{
      id: 'pending-request', monthly_amount: '150000.00', status: 'submitted',
      submitted_at: '2026-09-23T20:00:00Z', reviewed_at: null, review_notes: null,
      links: {
        payroll_authorization_preview: '/generated-preview', payroll_authorization_download: '/generated-download',
        signed_authorization_preview: '/signed-preview', signed_authorization_download: '/signed-download',
      },
    }], pagination: { page: 1, has_more: false } });
    renderRoute('/portal-asociado?intent=ahorro-voluntario');
    expect(await screen.findByRole('link', { name: /ver libranza firmada/i })).toHaveAttribute('href', '/signed-preview');
    expect(screen.getByRole('link', { name: /descargar libranza/i })).toHaveAttribute('href', '/signed-download');
    expect(screen.getByLabelText(/valor mensual/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /^enviar solicitud$/i })).toBeDisabled();
  });

  it('lets an associate inspect older voluntary savings requests', async () => {
    const user = userEvent.setup();
    vi.mocked(portalService.currentPortalUser).mockResolvedValue({
      id: 'associate-user', email: 'associate@fonasin.test', roles: ['associate'], must_change_password: false,
    });
    const request = (id: string): portalService.PortalVoluntarySavingsRequest => ({
      id, monthly_amount: '100000.00', status: 'approved', submitted_at: '2026-09-23T20:00:00Z',
      reviewed_at: null, review_notes: null,
    });
    vi.mocked(portalService.fetchPortalVoluntarySavingsRequests).mockImplementation(async (page = 1) =>
      page === 1
        ? { data: [request('recent')], pagination: { page: 1, has_more: true } }
        : { data: [request('older')], pagination: { page: 2, has_more: false } });
    renderRoute('/portal-asociado?intent=ahorro-voluntario');
    expect(await screen.findByText('Referencia: recent')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Ver solicitudes anteriores' }));
    expect(await screen.findByText('Referencia: older')).toBeInTheDocument();
    expect(portalService.fetchPortalVoluntarySavingsRequests).toHaveBeenCalledWith(2);
    expect(screen.queryByRole('button', { name: 'Ver solicitudes anteriores' })).not.toBeInTheDocument();
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
    vi.mocked(portalService.fetchPortalVoluntarySavingsRequests).mockResolvedValue({ data: [{
      id: 'savings-request-1',
      monthly_amount: '100000.00',
      status: 'approved',
      submitted_at: '2026-09-23T20:06:40Z',
      reviewed_at: '2026-09-24T01:28:41Z',
      review_notes: null,
    }], pagination: { page: 1, has_more: false } });
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
    expect(screen.getByRole('heading', { level: 2, name: /^aporte mensual$/i })).toBeInTheDocument();
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

  it('renders the Manejar detail route', async () => {
    renderRoute('/convenios/manejar');

    expect(await screen.findByRole('heading', { name: /protección vial, seguros y/i })).toBeInTheDocument();
  });

  it('renders the UMA IPS detail route', async () => {
    renderRoute('/convenios/uma-ips');

    expect(await screen.findByRole('heading', { name: /medicina integral/i })).toBeInTheDocument();
  });

  it('muestra las condiciones actualizadas del convenio Sanitas', async () => {
    renderRoute('/convenios/sanitas');

    expect(await screen.findByRole('heading', { name: /12 especialidades y citas en máximo 5 días/i })).toBeInTheDocument();
    expect(screen.getByText(/no tenemos en cuenta preexistencias médicas/i)).toBeInTheDocument();
    expect(screen.getByText(/régimen contributivo de EPS Sanitas/i)).toBeInTheDocument();
  });

  it('muestra la tarifa actualizada del convenio Coorserpark', async () => {
    renderRoute('/convenios/coorserpark');

    expect(await screen.findByText(/\$14\.050/)).toBeInTheDocument();
  });

  it('muestra los contactos confirmados de Caribbean Sol y Mar', async () => {
    renderRoute('/convenios/caribbean-sol-y-mar');

    expect(await screen.findByRole('heading', { level: 1, name: /caribbean sol y mar/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /logo de caribbean sol y mar/i })).toHaveAttribute('src', '/images/convenios/caribbean-sol-mar-logo.jpg');
    expect(screen.getByRole('heading', { level: 2, name: /punta cana/i })).toBeInTheDocument();
    expect(screen.getByText(/salida desde bucaramanga/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /324 558 0932/i })).toHaveAttribute('href', 'https://wa.me/573245580932');
    expect(screen.getByRole('link', { name: /instagram/i })).toHaveAttribute('href', 'https://www.instagram.com/caribbeansolymar110');
  });

  it('muestra los contactos confirmados de Luz Marina Vargas', async () => {
    renderRoute('/convenios/luz-marina-vargas');

    expect(await screen.findByRole('heading', { level: 1, name: /luz marina vargas/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /logo de luz marina vargas/i })).toHaveAttribute('src', '/images/convenios/luz-marina-vargas-logo.jpg');
    expect(screen.getByRole('link', { name: /lumavapa@hotmail.com/i })).toHaveAttribute('href', 'mailto:lumavapa@hotmail.com');
    expect(screen.getByRole('link', { name: /facebook/i })).toHaveAttribute('href', expect.stringContaining('61569011393925'));
  });

  it('keeps the agreement route stable after an edit and never shows stale static terms', async () => {
    const edited: publicContentService.PublicContentItem = {
      id: 'sanitas', kind: 'agreement', title: 'Salud Renovada', summary: 'Condiciones actualizadas por FONASIN',
      category: 'Salud y bienestar', link_url: null, sort_order: 0, published: true, published_at: null,
      image_url: '/images/convenios/sanitas.png', document_url: null,
      legacy_detail_slug: 'sanitas', legacy_detail_modified: true,
    };
    vi.mocked(publicContentService.fetchPublicContent).mockResolvedValue({
      data: [edited], settings: { contact_email: 'fonasin.bucaramanga@fonasin.com', facebook_url: null, instagram_url: null, youtube_url: null },
    });
    const listing = renderRoute('/convenios');
    expect(await screen.findByRole('link', { name: /salud renovada/i })).toHaveAttribute('href', '/convenios/sanitas');
    listing.unmount();
    renderRoute('/convenios/sanitas');
    expect(await screen.findByRole('heading', { name: 'Salud Renovada' })).toBeInTheDocument();
    expect(screen.getByText('Condiciones actualizadas por FONASIN')).toBeInTheDocument();
    expect(screen.queryByText(/12 especialidades y citas en máximo 5 días/i)).not.toBeInTheDocument();
  });

  it('does not expose a withdrawn agreement through its old direct route', async () => {
    vi.mocked(publicContentService.fetchPublicContent).mockResolvedValue({
      data: [], settings: { contact_email: 'fonasin.bucaramanga@fonasin.com', facebook_url: null, instagram_url: null, youtube_url: null },
    });
    renderRoute('/convenios/sanitas');
    expect(await screen.findByRole('heading', { name: 'Convenio no disponible' })).toBeInTheDocument();
    expect(screen.queryByText(/12 especialidades y citas en máximo 5 días/i)).not.toBeInTheDocument();
  });

  it('provides a stable internal detail route for a new agreement without an external link', async () => {
    const newAgreement: publicContentService.PublicContentItem = {
      id: 'new-agreement-id', kind: 'agreement', title: 'Nuevo aliado', summary: 'Beneficio confirmado',
      category: 'Bienestar', link_url: null, sort_order: 0, published: true, published_at: null,
      image_url: null, document_url: null, legacy_detail_slug: null, legacy_detail_modified: true,
    };
    vi.mocked(publicContentService.fetchPublicContent).mockResolvedValue({
      data: [newAgreement], settings: { contact_email: 'fonasin.bucaramanga@fonasin.com', facebook_url: null, instagram_url: null, youtube_url: null },
    });
    const listing = renderRoute('/convenios');
    expect(await screen.findByRole('link', { name: /nuevo aliado/i })).toHaveAttribute('href', '/convenios/new-agreement-id');
    listing.unmount();
    renderRoute('/convenios/new-agreement-id');
    expect(await screen.findByRole('heading', { name: 'Nuevo aliado' })).toBeInTheDocument();
    expect(screen.getByText('Beneficio confirmado')).toBeInTheDocument();
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
