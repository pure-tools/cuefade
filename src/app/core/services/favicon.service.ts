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
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 210 210">
  <defs>
    <clipPath id="sc">
      <path d="M 48,59 Q 48,52 53,55 L 135,103 Q 139,105 135,107 L 53,155 Q 48,158 48,151 Z"/>
    </clipPath>
    <mask id="m">
      <rect width="210" height="210" fill="white"/>
      <g clip-path="url(#sc)">
        <rect x="43" y="52"  width="101" height="9" fill="black"/>
        <rect x="43" y="67"  width="101" height="9" fill="black"/>
        <rect x="43" y="83"  width="101" height="9" fill="black"/>
        <rect x="43" y="98"  width="101" height="9" fill="black"/>
        <rect x="43" y="114" width="101" height="9" fill="black"/>
        <rect x="43" y="129" width="101" height="9" fill="black"/>
        <rect x="43" y="145" width="101" height="9" fill="black"/>
      </g>
      <path d="M 94,59 Q 94,52 100,55 L 181,103 Q 186,105 181,107 L 100,155 Q 94,158 94,151 Z" fill="black"/>
    </mask>
  </defs>
  <circle cx="105" cy="105" r="105" fill="${color}" mask="url(#m)"/>
</svg>`;
  }
}
