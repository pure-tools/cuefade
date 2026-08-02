import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { MobileService } from '@pure-tools/mobilka';
import { QueueService } from '../../core/services/queue.service';
import { AuthService } from '../../core/services/auth.service';
import { PlayerStageComponent } from './components/player-stage/player-stage';
import { QueuePanelComponent } from './components/queue-panel/queue-panel';
import { TransportComponent } from './components/transport/transport';
import { PricingModalComponent } from '../home/components/pricing-modal/pricing-modal';
import { AuthModalComponent } from '../auth/auth-modal/auth-modal';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, PlayerStageComponent, QueuePanelComponent, TransportComponent, PricingModalComponent, AuthModalComponent],
  templateUrl: './player.html',
  styleUrl: './player.css',
})
export class PlayerComponent {
  readonly queue = inject(QueueService);
  readonly mobile = inject(MobileService);
  readonly auth = inject(AuthService);
  private router = inject(Router);
  private titleService = inject(Title);

  playing = false;
  showQueue = signal(false);
  showPricing = signal(false);
  showAuth = signal(false);

  constructor() {
    effect(() => {
      const track = this.queue.currentTrack();
      const playlist = this.queue.playlistTitle();
      if (track) {
        this.titleService.setTitle(`${track.title} — CueFade`);
      } else if (playlist) {
        this.titleService.setTitle(`${playlist} — CueFade`);
      }
    });
  }

  onPlayPause(): void {
    this.playing = !this.playing;
  }

  goHome(): void {
    this.router.navigate(['/'], { queryParams: { new: '1' } });
  }

  toggleQueue(): void {
    this.showQueue.update(v => !v);
  }

  onShowUpgrade(): void {
    this.showPricing.set(true);
  }

  onRequireAuth(): void {
    this.showPricing.set(false);
    this.showAuth.set(true);
  }
}
