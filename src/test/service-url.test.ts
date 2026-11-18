import {describe, expect, it} from 'vitest';
import {normalizeServiceUrl} from '@/components/luffy/service-url';

describe('Service address', () => {
  it('normalizes HTTPS addresses before saving and requesting', () => {
    expect(normalizeServiceUrl('  https://bot.example.org/api///  ')).toBe('https://bot.example.org/api');
  });
  it('rejects insecure remote services', () => {
    expect(() => normalizeServiceUrl('http://bot.example.org')).toThrow();
  });
  it('allows HTTP only for local development', () => {
    expect(normalizeServiceUrl('http://localhost:3001/')).toBe('http://localhost:3001');
    expect(normalizeServiceUrl('http://127.0.0.1:3001/')).toBe('http://127.0.0.1:3001');
    expect(() => normalizeServiceUrl('ftp://localhost:3001')).toThrow();
  });
  it('rejects credentials and URL suffixes that would change the request destination', () => {
    for (const url of ['https://user:pass@bot.example.org', 'https://bot.example.org?next=x', 'https://bot.example.org#fragment']) {
      expect(() => normalizeServiceUrl(url)).toThrow();
    }
  });
});