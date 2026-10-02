import { describe, expect, it } from 'vitest';
import { officialSocialUrl } from './siteConfig';

describe('officialSocialUrl', () => {
  it('only publishes HTTPS links for the declared official platform', () => {
    expect(officialSocialUrl('https://www.instagram.com/fonasin/', ['instagram.com']))
      .toBe('https://www.instagram.com/fonasin/');
    expect(officialSocialUrl('https://instagram.com.evil.test/fonasin', ['instagram.com']))
      .toBeNull();
    expect(officialSocialUrl('http://instagram.com/fonasin', ['instagram.com']))
      .toBeNull();
    expect(officialSocialUrl('https://user:pass@instagram.com/fonasin', ['instagram.com']))
      .toBeNull();
    expect(officialSocialUrl(undefined, ['instagram.com'])).toBeNull();
  });
});
