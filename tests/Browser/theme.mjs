import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from 'playwright';

const baseURL = process.env.E2E_URL || 'http://127.0.0.1:5187';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(baseURL).hostname), 'Theme checks only run locally');

for (const width of [1440, 390]) test(`existing FONASIN theme at ${width}px`, { timeout: 120000 }, async () => {
  const browser = await chromium.launch(process.env.E2E_BROWSER ? { executablePath: process.env.E2E_BROWSER } : {});
  const page = await browser.newPage({ viewport: { width, height: 1000 } });
  try {
    // Tokens and geometry must not depend on a third-party font/CDN response.
    await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin
      ? route.continue() : route.abort());
    await page.goto(baseURL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.locator('header').waitFor();
    const actual = await page.evaluate(() => {
      const root = document.createElement('section'); root.id = 'theme-contract'; root.className = 'container-page';
      root.innerHTML = `
        <div id="brand" class="bg-fonasin-green text-fonasin-deep border border-fonasin-lime rounded-xl p-6 shadow-sm">Theme</div>
        <div class="legacy-space-y-3"><div>First</div><div id="vertical">Second</div></div>
        <div class="flex legacy-space-x-2.5"><span>First</span><span id="horizontal">Second</span></div>
        <div id="type" class="text-xs min-[1280px]:text-[15px] font-semibold">Type</div>
        <summary id="summary" class="font-black text-sm">Summary</summary>
        <input id="field" class="rounded-xl border border-slate-200 px-4 py-3" placeholder="Synthetic">
        <input id="date" type="date" class="rounded-xl border px-4 py-3.5">
        <select id="disabled" disabled><option>Synthetic</option></select>
        <div class="flex"><span id="shrink" class="flex-shrink-0">Preserved</span></div>
        <div id="sans" class="font-sans">Sans</div>`;
      document.body.append(root);
      const style = id => getComputedStyle(root.querySelector(`#${id}`));
      return { container: root.getBoundingClientRect().width,
        brand: { background: style('brand').backgroundColor, color: style('brand').color, border: style('brand').borderTopColor,
          radius: style('brand').borderRadius, padding: style('brand').paddingTop, shadow: style('brand').boxShadow },
        vertical: [style('vertical').marginTop, style('vertical').marginBottom],
        horizontal: [style('horizontal').marginLeft, style('horizontal').marginRight],
        type: [style('type').fontSize, style('type').lineHeight],
        summary: [style('summary').fontWeight, style('summary').fontSize],
        placeholder: getComputedStyle(root.querySelector('#field'), '::placeholder').color,
        dateHeight: root.querySelector('#date').getBoundingClientRect().height,
        disabledOpacity: style('disabled').opacity,
        shrink: style('shrink').flexShrink, sans: style('sans').fontFamily };
    });
    assert.equal(actual.container, Math.min(1180, width - 32));
    assert.deepEqual([actual.brand.background, actual.brand.color, actual.brand.border], ['rgb(8, 120, 63)', 'rgb(0, 61, 34)', 'rgb(195, 201, 27)']);
    assert.deepEqual([actual.brand.radius, actual.brand.padding], ['12px', '24px']);
    assert.match(actual.brand.shadow, /0px 1px 2px 0px/);
    assert.deepEqual(actual.vertical, ['12px', '0px']);
    assert.deepEqual(actual.horizontal, ['10px', '0px']);
    assert.deepEqual(actual.type, [width >= 1280 ? '15px' : '12px', '16px']);
    assert.deepEqual(actual.summary, ['900', '14px']);
    assert.equal(actual.placeholder, 'rgb(156, 163, 175)');
    assert.equal(actual.dateHeight, 56);
    assert.equal(actual.disabledOpacity, '0.7');
    assert.equal(actual.shrink, '0');
    assert.match(actual.sans, /^ui-sans-serif, system-ui/);
  } finally { await browser.close(); }
});
