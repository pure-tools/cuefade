import {
  DestroyRef, Injectable, Injector, effect, inject, makeEnvironmentProviders,
  provideEnvironmentInitializer, type EnvironmentProviders,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HapticsService, ImpactStyle, KeyboardService } from '@pure-tools/mobilka/native';
import { filter } from 'rxjs';
import { CrossfadeService } from '../services/crossfade.service';

/**
 * Native touches for the iOS / Android apps (all no-ops in the browser):
 * - light haptic when a crossfade starts (manual or automatic)
 * - `keyboard-open` class on <body> so fixed bottom UI can get out of the way
 */
@Injectable({ providedIn: 'root' })
export class NativeFeedback {
  private readonly haptics = inject(HapticsService);
  private readonly keyboard = inject(KeyboardService);
  private readonly crossfade = inject(CrossfadeService);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);

  start(): void {
    const sub = this.crossfade.crossfadeEvents$
      .pipe(filter(e => e.type === 'started'))
      .subscribe(() => void this.haptics.impact(ImpactStyle.Light));
    this.destroyRef.onDestroy(() => sub.unsubscribe());

    effect(() => {
      this.document.body.classList.toggle('keyboard-open', this.keyboard.isOpen());
    }, { injector: this.injector });
  }
}

export function provideNativeFeedback(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => inject(NativeFeedback).start()),
  ]);
}
