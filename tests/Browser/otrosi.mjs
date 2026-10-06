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

test('otrosi: real browser, sessions, XLSX, MariaDB, decisions and private PDF', { timeout: 180000 }, async () => {
  const browser = await chromium.launch(process.env.E2E_BROWSER ? { executablePath: process.env.E2E_BROWSER } : {});
  const contexts = [];
  const errors = [];
  async function actor(role, route) {
    const context = await browser.newContext({ baseURL, viewport: { width: 1440, height: 1000 } });
    contexts.push(context);
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route, { waitUntil: 'domcontentloaded' });
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
    const publicPage = await admin.context.newPage();
    await publicPage.goto('/noticias');
    await publicPage.getByText(newsTitle).waitFor();
    await publicPage.close();
    await admin.page.getByRole('button', { name: /^importaciones$/i }).click();
    for (const [type, title] of [['contributions', 'Aporte Mensual'], ['permanent-savings', 'Ahorro permanente'], ['voluntary-savings', 'Ahorro voluntario']]) {
      await admin.page.getByLabel(`Archivo ${title}`, { exact: true }).setInputFiles(path.join(artifacts, `${type}.xlsx`));
      const completed = admin.page.waitForResponse(response => response.url().endsWith(`/admin/import-batches/${type}`) && response.request().method() === 'POST');
      await admin.page.getByRole('button', { name: `Importar ${title.toLowerCase()}`, exact: true }).click();
      const response = await completed;
      assert.equal(response.status(), 201, await response.text());
      assert.equal((await response.json()).data.rows_created, 1);
    }
    const owner = await actor('associate', '/portal-asociado');
    const contributions = await json(owner.context, '/portal/contributions');
    assert.deepEqual([
      contributions.data.account.contribution_balance, contributions.data.account.permanent_savings_balance,
      contributions.data.account.voluntary_savings_balance, contributions.data.account.total_balance,
    ], ['400000.00', '300000.00', '150000.00', '850000.00']);
    for (const title of ['Aporte Mensual', 'Ahorro permanente', 'Ahorro voluntario']) await owner.page.getByRole('heading', { name: title, exact: true }).waitFor();
    assert.equal(await owner.page.getByText('septiembre de 2026', { exact: true }).count(), 3);
    assert.equal(await owner.page.getByText('30/09/2026', { exact: true }).count(), 3);
    await owner.page.screenshot({ path: path.join(artifacts, 'associate-statement.png'), fullPage: true });
    await owner.page.goto('/portal-asociado?intent=ahorro-voluntario');
    async function submit(amount) {
      await owner.page.getByLabel('Valor mensual', { exact: true }).fill(amount);
      await owner.page.getByRole('checkbox', { name: /confirmo que deseo/i }).check();
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
    await admin.page.getByRole('button', { name: /^rechazar$/i }).click();
    await admin.page.getByText('Solicitud de ahorro voluntario rechazada.', { exact: true }).waitFor();
    await owner.page.reload();
    await owner.page.getByText(/envia una nueva solicitud/i).waitFor();
    const second = await submit('100000');
    assert.notEqual(second.id, first.id);
    await admin.page.reload();
    await admin.page.getByRole('button', { name: /^aportes y ahorros$/i }).click();
    await admin.page.getByRole('button', { name: /^revision favorable$/i }).click();
    await admin.page.getByText(/aprobacion definitiva espera la libranza firmada por la empresa/i).waitFor();
    await owner.page.reload();
    const history = (await json(owner.context, '/portal/voluntary-savings-requests')).data;
    assert.equal(history.find(item => item.id === first.id).status, 'rejected');
    assert.equal(history.find(item => item.id === second.id).status, 'awaiting_employer_authorization');
    admin.page.once('dialog', dialog => dialog.accept());
    await admin.page.getByLabel('Libranza firmada de Synthetic E2E associate').setInputFiles({ name: 'signed-fixture.pdf', mimeType: 'application/pdf', buffer: await pdf.body() });
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
