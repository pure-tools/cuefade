import { Component, inject } from '@angular/core';
import { NetworkService } from '@pure-tools/mobilka/native';

/** Shown app-wide when the device loses connectivity — playback streams from YouTube. */
@Component({
  selector: 'app-offline-banner',
  template: `
    @if (!network.isOnline()) {
      <div
        role="status"
        class="fixed top-0 inset-x-0 z-[60] bg-zinc-800 text-zinc-200 text-xs text-center py-2
               pt-[max(0.5rem,var(--safe-area-inset-top,env(safe-area-inset-top,0px)))]"
      >
        You're offline — playback needs an internet connection
      </div>
    }
  `,
})
export class OfflineBanner {
  protected readonly network = inject(NetworkService);
}
