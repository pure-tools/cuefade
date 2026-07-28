import { Component, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-home-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home-header.html',
})
export class HomeHeaderComponent {
  readonly auth = inject(AuthService);
  pricingClick = output();
  authClick = output();
}
