import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { HomeComponent } from './home';
import { AuthService } from '../../core/services/auth.service';

const mockRefreshProfile = vi.fn().mockResolvedValue(undefined);
const mockAuth = {
  isLoggedIn: signal(false),
  isPro: signal(false),
  loading: signal(false),
  user: signal(null),
  profile: signal(null),
  refreshProfile: mockRefreshProfile,
};

describe('HomeComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls refreshProfile when ?upgraded=1 in URL', () => {
    vi.stubGlobal('location', {
      search: '?upgraded=1',
      pathname: '/',
      href: 'http://localhost/?upgraded=1',
    });
    vi.stubGlobal('history', { replaceState: vi.fn() });

    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(HomeComponent, {
      set: { template: '<div></div>', imports: [] },
    });

    TestBed.createComponent(HomeComponent);
    expect(mockRefreshProfile).toHaveBeenCalledOnce();
  });

  it('does not call refreshProfile without upgraded param', () => {
    vi.stubGlobal('location', {
      search: '',
      pathname: '/',
      href: 'http://localhost/',
    });

    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(HomeComponent, {
      set: { template: '<div></div>', imports: [] },
    });

    TestBed.createComponent(HomeComponent);
    expect(mockRefreshProfile).not.toHaveBeenCalled();
  });

  it('does not call refreshProfile when upgraded param is not 1', () => {
    vi.stubGlobal('location', {
      search: '?upgraded=0',
      pathname: '/',
      href: 'http://localhost/?upgraded=0',
    });

    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuth },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    });
    TestBed.overrideComponent(HomeComponent, {
      set: { template: '<div></div>', imports: [] },
    });

    TestBed.createComponent(HomeComponent);
    expect(mockRefreshProfile).not.toHaveBeenCalled();
  });
});
