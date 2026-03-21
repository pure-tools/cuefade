import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-spotify-stage',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center justify-center h-full bg-zinc-900 rounded-lg">
      <div class="text-center">
        <div class="text-5xl mb-4">🎵</div>
        <p class="text-zinc-400 text-sm">Spotify playback coming in v2</p>
      </div>
    </div>
  `,
})
export class SpotifyStageComponent {}
