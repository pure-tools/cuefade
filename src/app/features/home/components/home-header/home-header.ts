import { Component, output } from '@angular/core';

@Component({
  selector: 'app-home-header',
  standalone: true,
  templateUrl: './home-header.html',
})
export class HomeHeaderComponent {
  pricingClick = output();
}
