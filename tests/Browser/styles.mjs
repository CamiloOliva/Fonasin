// Local-only visual/computed-style comparison for compiler migrations.
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseURL = process.env.E2E_URL || 'http://127.0.0.1:5187';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(baseURL).hostname));
const record = process.argv.includes('--record');
const artifacts = path.resolve('.e2e-artifacts/styles');
await mkdir(artifacts, { recursive: true });
const fixture = JSON.parse(await readFile('.e2e-artifacts/fixture.json', 'utf8'));
const browser = await chromium.launch(process.env.E2E_BROWSER ? { executablePath: process.env.E2E_BROWSER } : {});
const results = {};
function splitTopLevel(value) {
  const parts = []; let depth = 0, start = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++;
    else if (value[i] === ')') depth--;
    else if (value[i] === ',' && depth === 0) { parts.push(value.slice(start, i).trim()); start = i + 1; }
  }
  parts.push(value.slice(start).trim()); return parts;
}
function canonicalStyle(prop, value) {
  // Tailwind 4 composes extra invisible shadow layers. They do not paint pixels.
  if (prop === 'boxShadow') return splitTopLevel(value).filter(v => !/^rgba8\([^)]*\) 0px 0px 0px 0px(?: inset)?$/.test(v)).join(', ') || 'none';
  if (prop !== 'backgroundImage') return value;
  // Make implicit gradient stop positions explicit before comparing; never
  // discard an actual color, interpolation mode or explicitly positioned stop.
  return splitTopLevel(value).map(image => {
    if (!image.startsWith('linear-gradient(') || !image.endsWith(')')) return image;
    const pieces = splitTopLevel(image.slice(16, -1));
    const direction = pieces[0].startsWith('rgba8(') ? 'to bottom' : pieces.shift();
    const stops = pieces.map(piece => piece.match(/^(rgba8\([^)]*\))(?: (-?[\d.]+)%)?$/));
    if (stops.some(stop => !stop)) return image;
    const positions = stops.map(stop => stop[2] === undefined ? null : Number(stop[2]));
    positions[0] ??= 0; positions[positions.length - 1] ??= 100;
    for (let i = 1; i < positions.length - 1; i++) if (positions[i] === null) {
      let end = i + 1; while (positions[end] === null) end++;
      const begin = i - 1;
      for (let j = i; j < end; j++) positions[j] = positions[begin] + (positions[end] - positions[begin]) * (j - begin) / (end - begin);
      i = end;
    }
    return `linear-gradient(${direction}, ${stops.map((stop, i) => `${stop[1]} ${positions[i]}%`).join(', ')})`;
  }).join(', ');
}
function equivalentStyle(prop, before, after) {
  before = canonicalStyle(prop, before); after = canonicalStyle(prop, after);
  if (before === after) return true;
  const pattern = /rgba8\((\d+),(\d+),(\d+),(\d+)\)/g;
  const colors = value => [...value.matchAll(pattern)].map(match => match.slice(1).map(Number));
  const a = colors(before), b = colors(after);
  if (!a.length || a.length !== b.length || before.replace(pattern, 'COLOR') !== after.replace(pattern, 'COLOR')) return false;
  // color-mix serialization can round alpha at the opposite side of an 8-bit
  // boundary. Allow at most one displayed step, not arbitrary color changes.
  return a.every((color, i) => Math.abs(color[3] - b[i][3]) <= 1
    && color.slice(0, 3).every((channel, j) => Math.abs(channel * color[3] / 255 - b[i][j] * b[i][3] / 255) <= 1));
}
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({ baseURL, viewport: { width, height: 1000 }, reducedMotion: 'reduce' });
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      return (url.origin === new URL(baseURL).origin && route.request().resourceType() !== 'media') || ['data:', 'blob:'].includes(url.protocol)
        ? route.continue() : route.abort();
    });
    const page = await context.newPage();
    try {
      for (const [name, route, role] of [
        ['home', '/'], ['products', '/productos-y-servicios'], ['credits', '/creditos'],
        ['agreement', '/convenios/emi'], ['affiliation', '/afiliacion'],
        ['associate', '/portal-asociado', 'associate'], ['admin', '/admin-fonasin', 'admin'],
      ]) {
        if (role) await context.clearCookies();
        await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}' });
        if (role) {
          await page.getByLabel('Correo electronico', { exact: true }).fill(fixture[role]);
          await page.getByLabel('Contrasena', { exact: true }).fill(fixture.password);
          await page.getByRole('button', { name: /entrar al panel|entrar al portal/i }).click();
          await page.getByRole('button', { name: /cerrar sesion/i }).waitFor();
        }
        await page.waitForLoadState('networkidle');
        if (role === 'associate') {
          for (const text of ['Cargando creditos', 'Cargando aportes', 'Cargando solicitudes', 'Cargando documentos']) {
            await page.getByText(text, { exact: true }).waitFor({ state: 'hidden', timeout: 60000 });
          }
        }
        await page.evaluate(() => document.fonts.ready);
        if (!process.argv.includes('--no-screenshots')) await page.screenshot({ path: path.join(artifacts, `${record ? 'before' : 'after'}-${name}-${width}.png`), fullPage: true, timeout: 60000 });
        results[`${name}-${width}`] = await page.evaluate(() => {
          const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const normalize = value => value.replace(/(?:rgba?|oklab|oklch|lab|lch|color)\([^)]*\)/g, color => {
            ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = color; ctx.fillRect(0, 0, 1, 1);
            return `rgba8(${[...ctx.getImageData(0, 0, 1, 1).data].join(',')})`;
          });
          const props = ['display', 'position', 'color', 'backgroundColor', 'backgroundImage', 'fontFamily', 'fontSize', 'fontWeight', 'lineHeight', 'letterSpacing',
            'borderRadius', 'borderTopWidth', 'borderTopColor', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
            'marginTop', 'marginRight', 'marginBottom', 'marginLeft', 'columnGap', 'rowGap', 'boxShadow', 'filter', 'opacity'];
          return [...document.body.querySelectorAll('*')].filter(el => el instanceof HTMLElement && !['SCRIPT','STYLE'].includes(el.tagName))
            .filter(el => { const r = el.getBoundingClientRect(); return r.width && r.height && getComputedStyle(el).visibility !== 'hidden'; })
            .map(el => {
              const style = getComputedStyle(el), rect = el.getBoundingClientRect();
              return { tag: el.tagName, classes: el.className, styles: Object.fromEntries(props.map(prop => [prop, normalize(style[prop])])),
                bounds: [rect.x, rect.y + window.scrollY, rect.width, rect.height].map(n => Math.round(n * 100) / 100) };
            });
        });
      }
    } finally { await context.close(); }
  }
} finally { await browser.close(); }
await writeFile(path.join(artifacts, record ? 'baseline.json' : 'current.json'), JSON.stringify(results, null, 2));
if (record) console.log(`Recorded ${Object.keys(results).length} local style snapshots.`);
else {
  const baseline = JSON.parse(await readFile(path.join(artifacts, 'baseline.json'), 'utf8'));
  const changes = [];
  for (const [page, nodes] of Object.entries(baseline)) {
    const current = results[page];
    if (nodes.length !== current?.length) { changes.push({ page, nodes: [nodes.length, current?.length] }); continue; }
    for (let i = 0; i < nodes.length; i++) {
      const before = nodes[i], after = current[i];
      const styles = Object.keys(before.styles).filter(prop => !equivalentStyle(prop, before.styles[prop], after.styles[prop]));
      const bounds = before.bounds.some((n, index) => Math.abs(n - after.bounds[index]) > 0.5);
      if (styles.length || bounds) changes.push({ page, node: i, tag: before.tag, classes: before.classes,
        styles: Object.fromEntries(styles.map(prop => [prop, [before.styles[prop], after.styles[prop]]])),
        ...(bounds ? { bounds: [before.bounds, after.bounds] } : {}) });
    }
  }
  await writeFile(path.join(artifacts, 'differences.json'), JSON.stringify(changes, null, 2));
  console.log(`Compared ${Object.keys(results).length} snapshots: ${changes.length} changed element(s). Details stay in ignored artifacts.`);
  assert.equal(changes.length, 0, 'Compiler migration must preserve the recorded styles and layout.');
}
