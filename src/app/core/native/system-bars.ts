import {
  Injectable, Injector, effect, inject, makeEnvironmentProviders,
  provideEnvironmentInitializer, type EnvironmentProviders,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { SystemBars, SystemBarsStyle } from '@capacitor/core';
import { NativeService } from '@pure-tools/mobilka/native';
import { ThemeService } from '@pure-tools/paletka';

/** Fallback when no theme is applied yet — matches the default `--pt-bg` in styles.css. */
const DEFAULT_BG = '#0d1117';

/**
 * Keeps the system chrome in step with the active paletka theme:
 * - `<meta name="theme-color">` (mobile browsers, installed PWAs)
 * - status / navigation bar icon colour in the native apps (Capacitor core SystemBars,
 *   so the native shell needs no extra plugin). The bars are edge-to-edge, so the
 *   page background — the theme's `--pt-bg` — shows through behind them.
 */
@Injectable({ providedIn: 'root' })
export class SystemBarsSync {
  private readonly theme = inject(ThemeService);
  private readonly native = inject(NativeService);
  private readonly document = inject(DOCUMENT);
  private readonly injector = inject(Injector);

  start(): void {
    effect(() => {
      const bg = this.theme.theme()?.vars['--pt-bg'] ?? DEFAULT_BG;
      this.setThemeColor(bg);
      if (this.native.isNative()) {
        const style = isLight(bg) ? SystemBarsStyle.Light : SystemBarsStyle.Dark;
        SystemBars.setStyle({ style }).catch(() => undefined);
      }
    }, { injector: this.injector });
  }

  private setThemeColor(color: string): void {
    let meta = this.document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = this.document.createElement('meta');
      meta.name = 'theme-color';
      this.document.head.appendChild(meta);
    }
    meta.content = color;
  }
}

/** True for light backgrounds (needs dark bar icons). Accepts `#rgb` / `#rrggbb`. */
export function isLight(hex: string): boolean {
  let h = hex.trim().replace('#', '');
  if (h.length === 3) h = [...h].map(c => c + c).join('');
  if (!/^[0-9a-f]{6}$/i.test(h)) return false;
  const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) / 255);
  // Rec. 709 relative luminance (gamma ignored — enough for a light/dark split)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.5;
}

export function provideSystemBarsSync(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => inject(SystemBarsSync).start()),
  ]);
}
