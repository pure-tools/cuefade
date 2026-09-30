import { Component, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { SessionTimeoutService } from '@pure-tools/babetka';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: [':host { display: block; height: 100vh; }'],
})
export class App {
  private auth = inject(AuthService);
  private sessionTimeout = inject(SessionTimeoutService);

  constructor() {
    effect(() => {
      if (this.auth.isLoggedIn()) {
        this.sessionTimeout.start();
      } else {
        this.sessionTimeout.stop();
      }
    });
  }
}
