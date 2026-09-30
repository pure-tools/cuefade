import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { AUTH_PROVIDER, SECURKA_DEFAULTS, SECURKA_CONFIG } from '@pure-tools/babetka';
import { LicenseService } from '@pure-tools/monetka';
import { AuthService } from './core/services/auth.service';

const mockAuth = {
  isLoggedIn: signal(false),
  isPro: signal(false),
  loading: signal(false),
  signOut: async () => {},
  refreshProfile: async () => {},
};
const mockLicense = { setLicensed: () => {}, revoke: () => {}, isLicensed: signal(false) };

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: AUTH_PROVIDER, useValue: mockAuth },
        { provide: SECURKA_CONFIG, useValue: SECURKA_DEFAULTS },
        { provide: LicenseService, useValue: mockLicense },
        { provide: AuthService, useValue: mockAuth },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render router-outlet', () => {
    const fixture = TestBed.createComponent(App);
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });
});
