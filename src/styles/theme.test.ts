import { describe, expect, it } from 'vitest';
import compatibility from './tailwind-compat.css?raw';

const templates = import.meta.glob<string>('../**/*.{tsx,jsx}', { query: '?raw', import: 'default', eager: true });

describe('legacy visual compatibility', () => {
  it('defines every compatibility utility used by an application template', () => {
    const declared = new Set([...compatibility.matchAll(/@utility\s+(legacy-[\w.-]+)\s*\{/g)].map(match => match[1]));
    const used = new Set(Object.values(templates).flatMap(source => [...source.matchAll(/\blegacy-(?:space-[xy]-\d+(?:\.\d+)?|bg-gradient-to-(?:br|bl|tr|tl|r|l|b|t))\b/g)].map(match => match[0])));
    expect(used.size).toBeGreaterThan(0);
    for (const utility of used) expect(declared.has(utility), `${utility} must compile to CSS`).toBe(true);
  });
});
