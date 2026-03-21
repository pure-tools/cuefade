import { Injectable, Inject } from '@angular/core';
import { MusicProvider } from '../interfaces/music-provider';
import { MUSIC_PROVIDERS } from '../providers/provider.token';

@Injectable({ providedIn: 'root' })
export class ProviderRegistryService {
  constructor(@Inject(MUSIC_PROVIDERS) private providers: MusicProvider[]) {}

  resolve(url: string): MusicProvider | null {
    return this.providers.find(p => p.canHandleUrl(url)) ?? null;
  }

  getAll(): MusicProvider[] {
    return this.providers;
  }

  getByType(type: string): MusicProvider | null {
    return this.providers.find(p => p.type === type) ?? null;
  }
}
