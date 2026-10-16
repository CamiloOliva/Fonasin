import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { test } from 'node:test';
import { chromium } from 'playwright';

const baseURL = process.env.E2E_URL || 'http://127.0.0.1:5187';
const url = new URL(baseURL);
assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname), 'E2E only runs locally');
const artifacts = path.resolve('.e2e-artifacts');
const fixture = JSON.parse(await readFile(path.join(artifacts, 'fixture.json'), 'utf8'));

test('security: password recovery expires links and revokes both browser sessions', { timeout: 180000 }, async () => {
  const browser = await chromium.launch(process.env.E2E_BROWSER ? { executablePath: process.env.E2E_BROWSER } : {});
  const contexts = [];
  const newPassword = `Updated-${fixture.password}`;
  async function login(email, password) {
    const context = await browser.newContext({ baseURL }); contexts.push(context);
    const page = await context.newPage();
    await page.goto('/admin-fonasin', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByLabel('Correo electronico', { exact: true }).fill(email);
    await page.getByLabel('Contrasena', { exact: true }).fill(password);
    await page.getByRole('button', { name: /entrar al panel/i }).click();
    await page.getByRole('button', { name: /cerrar sesion/i }).waitFor();
    assert.equal((await context.request.get('/admin/import-batches', { headers: { Accept: 'application/json' } })).status(), 200);
    return context;
  }
  try {
    const devices = [await login(fixture.recovery.email, fixture.password), await login(fixture.recovery.email, fixture.password)];
    const unaffected = await login(fixture.admin, fixture.password);
    const recovery = await browser.newContext({ baseURL }); contexts.push(recovery);
    const page = await recovery.newPage();
    for (const [account, status] of [[fixture.expired_recovery, 422], [fixture.recovery, 200]]) {
      await page.goto(`/recuperar-contrasena?${new URLSearchParams(account)}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.getByLabel('Nueva contrasena', { exact: true }).fill(newPassword);
      await page.getByLabel('Confirmar contrasena', { exact: true }).fill(newPassword);
      const response = page.waitForResponse(response => response.url().endsWith('/password/reset') && response.request().method() === 'POST');
      await page.getByRole('button', { name: 'Guardar nueva contrasena', exact: true }).click();
      assert.equal((await response).status(), status);
      if (status === 200) await page.getByText('Contrasena actualizada correctamente.', { exact: true }).waitFor();
    }
    for (const device of devices) {
      for (const route of ['/auth/user', '/admin/import-batches']) {
        assert.equal((await device.request.get(route, { headers: { Accept: 'application/json' } })).status(), 401);
      }
    }
    assert.equal((await unaffected.request.get('/auth/user', { headers: { Accept: 'application/json' } })).status(), 200);
    await login(fixture.recovery.email, newPassword);
    // A new, unrelated recovery session does not get signed in automatically.
    assert.equal((await recovery.request.get('/auth/user', { headers: { Accept: 'application/json' } })).status(), 401);
  } finally {
    for (const context of contexts) await context.close();
    await browser.close();
  }
});

test('otrosi: real browser, sessions, XLSX, MariaDB, decisions and private PDF', { timeout: 240000 }, async () => {
  const browser = await chromium.launch(process.env.E2E_BROWSER ? { executablePath: process.env.E2E_BROWSER } : {});
  const contexts = [];
  const errors = [];
  async function actor(role, route) {
    const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
    contexts.push(context);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    // A cold Vite transform can exceed 30 seconds on Windows. Keep business
    // assertions at their normal timeout; only allow more time for navigation.
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.getByLabel('Correo electronico', { exact: true }).fill(fixture[role]);
    await page.getByLabel('Contrasena', { exact: true }).fill(fixture.password);
    await page.getByRole('button', { name: /entrar al panel|entrar al portal/i }).click();
    await page.getByRole('button', { name: /cerrar sesion/i }).waitFor();
    return { page, context };
  }
  async function json(context, route) {
    const response = await context.request.get(route, { headers: { Accept: 'application/json' } });
    assert.equal(response.status(), 200, `${route}: ${await response.text()}`);
    return response.json();
  }
  try {
    const admin = await actor('admin', '/admin-fonasin');
    const newsTitle = `Comunicado sintetico E2E ${fixture.run}-${Date.now()}`;
    await admin.page.getByRole('button', { name: /contenido del sitio/i }).click();
    await admin.page.getByLabel('Título').fill(newsTitle);
    await admin.page.getByLabel('Descripción').fill('Contenido institucional de prueba aislada.');
    await admin.page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await admin.page.getByText('Contenido guardado.', { exact: false }).waitFor();
    await admin.page.getByLabel('Publicar en el sitio').check();
    const published = admin.page.waitForResponse(response => response.url().includes('/admin/content/') && response.request().method() === 'PATCH');
    await admin.page.getByRole('button', { name: 'Guardar', exact: true }).click();
    assert.equal((await published).status(), 200);
    await admin.page.getByLabel('Documento (PDF)', { exact: true }).setInputFiles(path.join(artifacts, 'public-report.pdf'));
    await admin.page.getByText('Archivo cargado como borrador.', { exact: false }).waitFor();
    await admin.page.getByLabel('Publicar en el sitio').check();
    const republishedNews = admin.page.waitForResponse(response => response.url().includes('/admin/content/') && response.request().method() === 'PATCH');
    await admin.page.getByRole('button', { name: 'Guardar', exact: true }).click();
    assert.equal((await republishedNews).status(), 200);
    const publicPage = await admin.context.newPage();
    await publicPage.goto('/noticias');
    await publicPage.getByText(newsTitle).waitFor();
    const newsCard = publicPage.locator('article').filter({ has: publicPage.getByRole('heading', { name: newsTitle, exact: true }) });
    const publicPdf = await newsCard.getByRole('link', { name: 'Leer comunicado', exact: true }).getAttribute('href');
    const reportResponse = await admin.context.request.get(publicPdf);
    assert.equal(reportResponse.status(), 200);
    assert.ok((await reportResponse.body()).subarray(0, 5).equals(Buffer.from('%PDF-')));
    await admin.page.getByRole('button', { name: /^Sanitas\s/ }).click();
    await admin.page.getByLabel('Condiciones completas aprobadas por FONASIN').fill('Condiciones sinteticas conservadas despues de cambiar el logo.');
    await admin.page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await admin.page.getByText('Contenido guardado.', { exact: false }).waitFor();
    await admin.page.getByLabel('Imagen (JPG/PNG/WebP)', { exact: true }).setInputFiles(path.join(artifacts, 'logo.png'));
    await admin.page.getByText('Archivo cargado como borrador.', { exact: false }).waitFor();
    await admin.page.getByLabel('Publicar en el sitio').check();
    const republishedAgreement = admin.page.waitForResponse(response => response.url().includes('/admin/content/') && response.request().method() === 'PATCH');
    await admin.page.getByRole('button', { name: 'Guardar', exact: true }).click();
    assert.equal((await republishedAgreement).status(), 200);
    await publicPage.goto('/convenios/sanitas');
    await publicPage.getByText('Condiciones sinteticas conservadas despues de cambiar el logo.').waitFor();
    await publicPage.close();
    await admin.page.getByRole('button', { name: /^importaciones$/i }).click();
    for (const [type, title] of [['credits', 'Cartera'], ['contributions', 'Aporte Mensual'], ['permanent-savings', 'Ahorro permanente'], ['voluntary-savings', 'Ahorro voluntario']]) {
      await admin.page.getByLabel(`Archivo ${title}`, { exact: true }).setInputFiles(path.join(artifacts, `${type}.xlsx`));
      const completed = admin.page.waitForResponse(response => response.url().endsWith(`/admin/import-batches/${type}`) && response.request().method() === 'POST');
      await admin.page.getByRole('button', { name: `Importar ${title.toLowerCase()}`, exact: true }).click();
      const response = await completed;
      assert.equal(response.status(), 201, await response.text());
      assert.equal((await response.json()).data.rows_created, 1);
    }
    const owner = await actor('associate', '/portal-asociado');
    await owner.page.getByText('24 meses', { exact: true }).waitFor();
    await owner.page.getByText('18.0000%', { exact: true }).waitFor();
    await owner.page.getByText('1.5000%', { exact: true }).waitFor();
    const contributions = await json(owner.context, '/portal/contributions');
    assert.deepEqual([
      contributions.data.account.contribution_balance, contributions.data.account.permanent_savings_balance,
      contributions.data.account.voluntary_savings_balance, contributions.data.account.total_balance,
    ], ['400000.00', '300000.00', '150000.00', '850000.00']);
    for (const title of ['Aporte Mensual', 'Ahorro permanente', 'Ahorro voluntario']) await owner.page.getByRole('heading', { name: title, exact: true }).waitFor();
    const totalPanel = owner.page.getByLabel('Saldo total del estado de cuenta');
    await totalPanel.getByText(/850\.000/).waitFor();
    for (const title of ['Aporte Mensual', 'Ahorro permanente', 'Ahorro voluntario']) {
      const section = owner.page.locator('section').filter({ has: owner.page.getByRole('heading', { name: title, exact: true }) }).last();
      assert.equal(await section.getByText('septiembre de 2026', { exact: true }).count(), 1);
      assert.equal(await section.getByText('30/09/2026', { exact: true }).count(), 1);
    }
    await owner.page.screenshot({ path: path.join(artifacts, 'associate-statement.png'), fullPage: true });
    await owner.page.goto('/portal-asociado?intent=ahorro-voluntario');
    async function submit(amount) {
      await owner.page.getByLabel('Valor mensual', { exact: true }).fill(amount);
      await owner.page.getByRole('checkbox', { name: /confirmo que solicito y autorizo/i }).check();
      const submitted = owner.page.waitForResponse(response => response.url().endsWith('/portal/voluntary-savings-requests') && response.request().method() === 'POST');
      await owner.page.getByRole('button', { name: /^enviar solicitud$/i }).click();
      const response = await submitted;
      assert.equal(response.status(), 201, await response.text());
      return (await response.json()).data;
    }
    const first = await submit('150000');
    assert.equal(await owner.page.getByRole('button', { name: /^enviar solicitud$/i }).isDisabled(), true);
    const pdf = await owner.context.request.get(first.links.payroll_authorization_download);
    assert.equal(pdf.status(), 200);
    assert.ok((await pdf.body()).subarray(0, 5).equals(Buffer.from('%PDF-')));

    await admin.page.getByRole('button', { name: /^aportes y ahorros$/i }).click();
    await admin.page.locator('tr').filter({ hasText: first.id }).getByRole('button', { name: /^rechazar$/i }).click();
    await admin.page.getByText('Solicitud de ahorro voluntario rechazada.', { exact: true }).waitFor();
    await owner.page.reload();
    await owner.page.getByText(/envia una nueva solicitud/i).waitFor();
    const second = await submit('100000');
    assert.notEqual(second.id, first.id);
    await admin.page.reload();
    await admin.page.getByRole('button', { name: /^aportes y ahorros$/i }).click();
    await admin.page.locator('tr').filter({ hasText: second.id }).getByRole('button', { name: /^revision favorable$/i }).click();
    await admin.page.getByText(/aprobacion definitiva espera la libranza firmada por la empresa/i).waitFor();
    await owner.page.reload();
    const history = (await json(owner.context, '/portal/voluntary-savings-requests')).data;
    assert.equal(history.find(item => item.id === first.id).status, 'rejected');
    assert.equal(history.find(item => item.id === second.id).status, 'awaiting_employer_authorization');
    admin.page.once('dialog', dialog => dialog.accept());
    await admin.page.locator('tr').filter({ hasText: second.id }).getByLabel('Libranza firmada de Synthetic E2E associate').setInputFiles({ name: 'signed-fixture.pdf', mimeType: 'application/pdf', buffer: await pdf.body() });
    await admin.page.getByText('Libranza empresarial guardada y solicitud aprobada definitivamente.', { exact: true }).waitFor();
    await owner.page.reload();
    await owner.page.getByRole('link', { name: 'Ver libranza firmada', exact: true }).waitFor();
    const third = await submit('90000');
    assert.notEqual(third.id, second.id);
    const afterNewRequest = (await json(owner.context, '/portal/voluntary-savings-requests')).data;
    assert.equal(afterNewRequest.find(item => item.id === second.id).status, 'approved');
    assert.equal(afterNewRequest.find(item => item.id === third.id).status, 'submitted');
    const other = await actor('other', '/portal-asociado');
    assert.equal((await json(other.context, '/portal/contributions')).data.state, 'empty');
    const signed = (await json(owner.context, '/portal/voluntary-savings-requests')).data.find(item => item.id === second.id);
    for (const documentPath of Object.values(signed.links)) {
      assert.equal((await other.context.request.get(documentPath, { headers: { Accept: 'application/json' } })).status(), 403);
    }
    const reviewer = await actor('reviewer', '/admin-fonasin');
    await reviewer.page.getByRole('button', { name: /^aportes y ahorros$/i }).click();
    await reviewer.page.getByRole('heading', { name: /solicitudes de ahorro voluntario/i }).waitFor();
    assert.equal(await reviewer.page.getByRole('button', { name: /^revision favorable$|^rechazar$/i }).count(), 0);
    await owner.page.screenshot({ path: path.join(artifacts, 'associate.png'), fullPage: true });
    await admin.page.screenshot({ path: path.join(artifacts, 'admin.png'), fullPage: true });
    await owner.page.setViewportSize({ width: 390, height: 844 });
    const mobileHeading = await owner.page.locator('h1').first().boundingBox();
    assert.ok(mobileHeading && mobileHeading.x + mobileHeading.width <= 391, 'Associate greeting must fit the mobile viewport');
    assert.ok(await owner.page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), 'Mobile portal must not scroll horizontally');
    await owner.page.screenshot({ path: path.join(artifacts, 'associate-mobile.png'), fullPage: true });
    assert.deepEqual(errors, [], 'No unhandled browser errors');
  } finally {
    for (const context of contexts) await context.close();
    await browser.close();
  }
});

test('affiliation: returned applicant follows private email link, corrects and resubmits the same request', { timeout: 180000 }, async () => {
  const browser = await chromium.launch(process.env.E2E_BROWSER ? { executablePath: process.env.E2E_BROWSER } : {});
  const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(fixture.correction_url);
    await page.getByText(/Correccion solicitada por FONASIN: Revisa la direccion/).waitFor();
    assert.equal(new URL(page.url()).hash, '');
    await page.getByLabel('Direccion de residencia', { exact: false }).fill('Direccion sintetica corregida en navegador');
    for (const section of ['personal', 'employment', 'financial', 'beneficiaries', 'sarlaft']) {
      const saved = page.waitForResponse(response => response.url().includes(`/sections/${section}?`) && response.request().method() === 'POST');
      await page.getByRole('button', { name: 'Guardar y continuar', exact: true }).click();
      const response = await saved;
      assert.equal(response.status(), 200, await response.text());
    }
    await page.getByLabel('Ciudad', { exact: false }).fill('Bucaramanga');
    for (const checkbox of await page.getByRole('checkbox').all()) await checkbox.check();
    await page.getByRole('button', { name: 'Ver documento.', exact: true }).first().click();
    await page.waitForFunction(() => {
      const frame = document.querySelector('iframe');
      return frame && frame.getBoundingClientRect().top >= 0 && frame.getBoundingClientRect().top < window.innerHeight;
    });
    await page.getByRole('button', { name: 'Ir a revision', exact: true }).click();
    const submitted = page.waitForResponse(response => response.url().includes('/submit?') && response.request().method() === 'POST');
    await page.getByRole('button', { name: 'Enviar solicitud', exact: true }).click();
    const response = await submitted;
    assert.equal(response.status(), 200, await response.text());
    const result = (await response.json()).data;
    assert.equal(result.id, fixture.correction_application);
    assert.equal(result.status, 'submitted');
    await page.waitForFunction(() => {
      const pages = [...document.querySelectorAll('img[alt="Pagina 1"]')];
      return pages.length === 2 && pages.every(image => image.complete && image.naturalWidth > 0);
    }, null, { timeout: 60000 });
    assert.deepEqual(errors, []);
    await page.screenshot({ path: path.join(artifacts, 'affiliation-corrected.png'), fullPage: true });
  } finally {
    await context.close();
    await browser.close();
  }
});
