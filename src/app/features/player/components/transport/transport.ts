import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueService } from '../../../../core/services/queue.service';
import { CrossfadeService } from '../../../../core/services/crossfade.service';
import { YouTubePlayerService } from '../../../../core/providers/youtube/youtube-player.service';
import { FeatureGateService } from '../../../../core/services/feature-gate.service';

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './transport.html',
  host: { class: 'block' },
})
export class TransportComponent {
  readonly queue = inject(QueueService);
  readonly crossfade = inject(CrossfadeService);
  readonly gates = inject(FeatureGateService);
  private ytPlayer = inject(YouTubePlayerService);

  playPause = output();
  manualCrossfade = output();
  showUpgrade = output();

  readonly isPlaying = this.ytPlayer.isPlaying;

  togglePlay(): void {
    this.ytPlayer.togglePlayPause();
    this.playPause.emit();
  }

  triggerCrossfade(): void {
    if (!this.gates.canUseFade()) {
      this.showUpgrade.emit();
      return;
    }
    this.crossfade.startCrossfade();
    this.manualCrossfade.emit();
  }

  setFadeDuration(seconds: number): void {
    this.crossfade.setTransitionDuration(seconds);
  }

  readonly fadeDurations = [4, 8, 12, 20];
}
