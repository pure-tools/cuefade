import { Component, output, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

type AuthMode = 'login' | 'signup';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.html',
})
export class AuthModalComponent {
  private auth = inject(AuthService);

  close = output();
  success = output();

  mode = signal<AuthMode>('login');
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');

  toggleMode(): void {
    this.mode.set(this.mode() === 'login' ? 'signup' : 'login');
    this.error.set('');
  }

  async submit(): Promise<void> {
    if (!this.email || !this.password) {
      this.error.set('Email and password required');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      if (this.mode() === 'signup') {
        await this.auth.signUp(this.email, this.password);
        this.error.set('Check your email to confirm your account.');
      } else {
        await this.auth.signIn(this.email, this.password);
        this.success.emit();
        this.close.emit();
      }
    } catch (e) {
      this.error.set((e as Error).message ?? 'Something went wrong');
    } finally {
      this.loading.set(false);
    }
  }
}
