import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QueueService } from '../../../../core/services/queue.service';
import { CrossfadeService } from '../../../../core/services/crossfade.service';
import { YouTubePlayerService } from '../../../../core/providers/youtube/youtube-player.service';
import { FeatureGateService } from '../../../../core/services/feature-gate.service';
import { UpgradePromptService } from '../../../../core/services/upgrade-prompt.service';

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
  private upgradePrompt = inject(UpgradePromptService);

  playPause = output();
  manualCrossfade = output();

  readonly isPlaying = this.ytPlayer.isPlaying;

  togglePlay(): void {
    this.ytPlayer.togglePlayPause();
    this.playPause.emit();
  }

  triggerCrossfade(): void {
    if (!this.gates.canUseFade()) {
      this.upgradePrompt.open();
      return;
    }
    this.crossfade.startCrossfade();
    this.manualCrossfade.emit();
  }

  setFadeDuration(seconds: number): void {
    if (!this.gates.canUseExtendedFadeDurations() && seconds > 8) {
      this.upgradePrompt.open();
      return;
    }
    this.crossfade.setTransitionDuration(seconds);
  }

  readonly fadeDurations = [4, 8, 12, 20];
}
