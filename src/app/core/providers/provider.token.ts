import { InjectionToken } from '@angular/core';
import { MusicProvider } from '../interfaces/music-provider';

export const MUSIC_PROVIDERS = new InjectionToken<MusicProvider[]>('MUSIC_PROVIDERS');
