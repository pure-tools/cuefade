import { ProviderType } from './track';

export interface Playlist {
  id: string;
  title: string;
  thumbnailUrl?: string;
  provider: ProviderType;
  trackIds: string[];     // ordered list of track IDs
}
