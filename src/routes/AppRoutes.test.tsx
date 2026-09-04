import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AppRoutes from './AppRoutes';
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
  fetchPortalCredits: vi.fn().mockResolvedValue([]),
  loginPortal: vi.fn(),
  logoutPortal: vi.fn(),
  portalDocumentPreviewUrl: vi.fn((path: string) => path),
  startPortalAffiliationUpdate: vi.fn(),
}));

vi.mock('../services/adminAffiliationService', () => ({
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
  fetchAdminCredits: vi.fn().mockResolvedValue([]),
  updateAdminCredit: vi.fn(),
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

    await user.click(within(estatutosCard as HTMLElement).getByRole('button', { name: /ver en la pagina/i }));

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

  it('falls back to the home page for an unknown route', () => {
    renderRoute('/ruta-inexistente');

    expect(screen.getByRole('heading', { name: /un fondo que te acompa/i })).toBeInTheDocument();
  });
});
