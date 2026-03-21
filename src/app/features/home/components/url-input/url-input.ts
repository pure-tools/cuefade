import { Component, OnInit, inject, signal, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ProviderRegistryService } from '../../../../core/services/provider-registry.service';
import { Track } from '../../../../core/interfaces/track';

export interface PlaylistLoadedEvent {
  url: string;
  title: string;
  tracks: Track[];
}

@Component({
  selector: 'app-url-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './url-input.html',
})
export class UrlInputComponent implements OnInit {
  private registry = inject(ProviderRegistryService);

  initialUrl = input('');
  loaded = output<PlaylistLoadedEvent>();
  cleared = output();

  url = '';
  loading = signal(false);
  error = signal('');

  ngOnInit(): void {
    this.url = this.initialUrl();
  }

  loadPlaylist(): void {
    if (!this.url.trim()) return;
    const provider = this.registry.resolve(this.url);
    if (!provider) {
      this.error.set('No provider found for this URL. Supported: YouTube');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    provider.fetchPlaylist(this.url).subscribe({
      next: (playlist: { title: string; tracks?: Track[]; trackIds: string[] }) => {
        this.loaded.emit({
          url: this.url,
          title: playlist.title,
          tracks: (playlist as unknown as { tracks?: Track[] }).tracks ?? [],
        });
        this.loading.set(false);
      },
      error: (e: unknown) => {
        if (e instanceof HttpErrorResponse) {
          const ytMsg = (e.error as { error?: { message?: string } })?.error?.message;
          this.error.set(ytMsg ?? `API error ${e.status} — check the API key and playlist visibility.`);
        } else {
          this.error.set((e as Error).message ?? 'Failed to load playlist');
        }
        this.loading.set(false);
      },
    });
  }
}
