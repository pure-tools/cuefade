import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FaviconService } from './core/services/favicon.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
  styles: [':host { display: block; height: 100vh; }'],
})
export class App {
  constructor() {
    inject(FaviconService);
  }
}
