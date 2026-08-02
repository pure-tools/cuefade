import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MobileService } from '@pure-tools/mobilka';
import { QueueService } from '../../core/services/queue.service';
import { PlayerStageComponent } from './components/player-stage/player-stage';
import { QueuePanelComponent } from './components/queue-panel/queue-panel';
import { TransportComponent } from './components/transport/transport';

@Component({
  selector: 'app-player',
  standalone: true,
  imports: [CommonModule, PlayerStageComponent, QueuePanelComponent, TransportComponent],
  templateUrl: './player.html',
  styleUrl: './player.css',
})
export class PlayerComponent {
  readonly queue = inject(QueueService);
  readonly mobile = inject(MobileService);
  private router = inject(Router);

  playing = false;
  showQueue = signal(false);

  onPlayPause(): void {
    this.playing = !this.playing;
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  toggleQueue(): void {
    this.showQueue.update(v => !v);
  }
}
