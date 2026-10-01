import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { NativeService } from '@pure-tools/mobilka/native';
import { ThemeService, type Theme } from '@pure-tools/paletka';

const { setStyle } = vi.hoisted(() => ({ setStyle: vi.fn() }));
vi.mock('@capacitor/core', async importOriginal => ({
  ...(await importOriginal<typeof import('@capacitor/core')>()),
  SystemBars: { setStyle },
}));

import { SystemBarsStyle } from '@capacitor/core';
import { SystemBarsSync, isLight } from './system-bars';

describe('isLight', () => {
  it('splits paletka backgrounds into light and dark', () => {
    expect(isLight('#fff5f7')).toBe(true);
    expect(isLight('#f0f6ff')).toBe(true);
    expect(isLight('#0d1117')).toBe(false);
    expect(isLight('#130505')).toBe(false);
  });

  it('handles shorthand hex and rejects non-hex values', () => {
    expect(isLight('#fff')).toBe(true);
    expect(isLight('#000')).toBe(false);
    expect(isLight('rgb(255,255,255)')).toBe(false);
  });
});

describe('SystemBarsSync', () => {
  const theme = signal<Theme | null>(null);
  const isNative = signal(false);
  const themeColor = () =>
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.content;

  function start() {
    TestBed.configureTestingModule({
      providers: [
        { provide: ThemeService, useValue: { theme } },
        { provide: NativeService, useValue: { isNative } },
      ],
    });
    TestBed.inject(SystemBarsSync).start();
    TestBed.tick();
  }

  beforeEach(() => {
    setStyle.mockReset().mockResolvedValue(undefined);
    theme.set(null);
    isNative.set(false);
  });

  afterEach(() => document.querySelector('meta[name="theme-color"]')?.remove());

  it('sets theme-color to the default background before a theme is applied', () => {
    start();
    expect(themeColor()).toBe('#0d1117');
  });

  it('follows the theme background on the web without touching native bars', () => {
    start();
    theme.set({ name: 'rose', vars: { '--pt-bg': '#fff5f7' } });
    TestBed.tick();
    expect(themeColor()).toBe('#fff5f7');
    expect(setStyle).not.toHaveBeenCalled();
  });

  it('uses dark bar icons on light themes and light icons on dark themes in the native app', () => {
    isNative.set(true);
    start();
    expect(setStyle).toHaveBeenLastCalledWith({ style: SystemBarsStyle.Dark });

    theme.set({ name: 'sky', vars: { '--pt-bg': '#f0f6ff' } });
    TestBed.tick();
    expect(setStyle).toHaveBeenLastCalledWith({ style: SystemBarsStyle.Light });
  });
});
