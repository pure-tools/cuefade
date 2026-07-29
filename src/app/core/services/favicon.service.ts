import { Injectable, effect, inject } from '@angular/core';
import { ThemeService } from '@pure-tools/paletka';

@Injectable({ providedIn: 'root' })
export class FaviconService {
  private readonly themeService = inject(ThemeService);

  constructor() {
    effect(() => {
      const theme = this.themeService.theme();
      const color = theme?.vars['--pt-text'] ?? '#ffffff';
      this.update(color);
    });
  }

  private update(color: string): void {
    const svg = this.buildSvg(color);
    const url = `data:image/svg+xml,${encodeURIComponent(svg)}`;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      document.head.appendChild(link);
    }
    link.href = url;
  }

  private buildSvg(color: string): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <defs>
    <clipPath id="sc">
      <path d="M 48,58 Q 48,52 53,55 L 127,98 Q 131,100 127,102 L 53,145 Q 48,148 48,142 Z"/>
    </clipPath>
    <mask id="m">
      <rect width="200" height="200" fill="white"/>
      <g clip-path="url(#sc)">
        <rect x="44" y="52"  width="91" height="8" fill="black"/>
        <rect x="44" y="66"  width="91" height="8" fill="black"/>
        <rect x="44" y="80"  width="91" height="8" fill="black"/>
        <rect x="44" y="94"  width="91" height="8" fill="black"/>
        <rect x="44" y="108" width="91" height="8" fill="black"/>
        <rect x="44" y="122" width="91" height="8" fill="black"/>
        <rect x="44" y="136" width="91" height="8" fill="black"/>
      </g>
      <path d="M 90,58 Q 90,52 95,55 L 169,98 Q 173,100 169,102 L 95,145 Q 90,148 90,142 Z" fill="black"/>
    </mask>
  </defs>
  <circle cx="100" cy="100" r="95" fill="${color}" mask="url(#m)"/>
</svg>`;
  }
}
