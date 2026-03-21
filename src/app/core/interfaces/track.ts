export type ProviderType = 'youtube' | 'spotify' | 'soundcloud';

export interface Track {
  id: string;
  title: string;
  artist?: string;
  thumbnailUrl: string;
  duration?: number;      // seconds
  provider: ProviderType;
  cueIn?: number;         // seconds — seek here on track start
  cueOut?: number;        // seconds — trigger crossfade here
  embeddable?: boolean;   // false = restricted by video owner or unavailable
  embedError?: string;    // human-readable reason shown in UI
}
