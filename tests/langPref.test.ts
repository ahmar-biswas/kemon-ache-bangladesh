import { afterEach, describe, expect, it } from 'vitest';
import { initialLang, saveLangChoice, switchLangPath } from '../src/lib/langPref.ts';

afterEach(() => window.localStorage.clear());

describe('switchLangPath', () => {
  it('swaps the prefix and keeps the rest of the page path', () => {
    expect(switchLangPath('/en/', 'bn')).toBe('/bn/');
    expect(switchLangPath('/en', 'bn')).toBe('/bn/');
    expect(switchLangPath('/bn/economy/inflation', 'en')).toBe('/en/economy/inflation');
  });
  it('does not touch words that only start with en/bn', () => {
    expect(switchLangPath('/english/x', 'bn')).toBe('/bn/english/x');
  });
});

describe('initialLang', () => {
  it('uses Bangla when the browser language starts with bn', () => {
    expect(initialLang(['bn-BD', 'en'])).toBe('bn');
    expect(initialLang(['bn'])).toBe('bn');
  });
  it('uses English otherwise', () => {
    expect(initialLang(['en-GB'])).toBe('en');
    expect(initialLang([])).toBe('en');
  });
  it('prefers the saved choice', () => {
    saveLangChoice('en');
    expect(initialLang(['bn-BD'])).toBe('en');
  });
});
