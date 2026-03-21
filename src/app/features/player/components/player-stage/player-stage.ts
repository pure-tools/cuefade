import { Component, inject, computed } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { QueueService } from '../../../../core/services/queue.service';
import { ProviderRegistryService } from '../../../../core/services/provider-registry.service';

@Component({
  selector: 'app-player-stage',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  templateUrl: './player-stage.html',
  styleUrl: './player-stage.css',
})
export class PlayerStageComponent {
  private queue = inject(QueueService);
  private registry = inject(ProviderRegistryService);

  readonly stageComponent = computed(() => {
    const track = this.queue.currentTrack();
    if (!track) return null;
    const provider = this.registry.getByType(track.provider);
    return provider?.getStageComponent() ?? null;
  });
}
