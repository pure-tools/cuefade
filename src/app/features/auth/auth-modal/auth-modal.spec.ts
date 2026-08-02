import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthModalComponent } from './auth-modal';
import { AuthService } from '../../../core/services/auth.service';

const mockSignIn = vi.fn();
const mockSignUp = vi.fn();
const mockAuth = { signIn: mockSignIn, signUp: mockSignUp };

describe('AuthModalComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignIn.mockResolvedValue(undefined);
    mockSignUp.mockResolvedValue(undefined);

    TestBed.configureTestingModule({
      imports: [AuthModalComponent],
      providers: [{ provide: AuthService, useValue: mockAuth }],
    });
  });

  it('shows error when email is empty', async () => {
    const fixture = TestBed.createComponent(AuthModalComponent);
    fixture.componentInstance.email = '';
    fixture.componentInstance.password = 'pass123';
    await fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).toBe('Email and password required');
    expect(mockSignIn).not.toHaveBeenCalled();
  });

  it('shows error when password is empty', async () => {
    const fixture = TestBed.createComponent(AuthModalComponent);
    fixture.componentInstance.email = 'test@cuefade.app';
    fixture.componentInstance.password = '';
    await fixture.componentInstance.submit();
    expect(fixture.componentInstance.error()).toBe('Email and password required');
  });

  it('calls signIn in login mode', async () => {
    const fixture = TestBed.createComponent(AuthModalComponent);
    const comp = fixture.componentInstance;
    comp.email = 'test@cuefade.app';
    comp.password = 'pass123';
    expect(comp.mode()).toBe('login');

    const successSpy = vi.fn();
    comp.success.subscribe(successSpy);
    await comp.submit();

    expect(mockSignIn).toHaveBeenCalledWith('test@cuefade.app', 'pass123');
    expect(successSpy).toHaveBeenCalled();
  });

  it('calls signUp in signup mode', async () => {
    const fixture = TestBed.createComponent(AuthModalComponent);
    const comp = fixture.componentInstance;
    comp.toggleMode();
    comp.email = 'new@cuefade.app';
    comp.password = 'pass123';
    await comp.submit();

    expect(mockSignUp).toHaveBeenCalledWith('new@cuefade.app', 'pass123');
  });

  it('shows confirmation message after signup', async () => {
    const fixture = TestBed.createComponent(AuthModalComponent);
    const comp = fixture.componentInstance;
    comp.toggleMode();
    comp.email = 'new@cuefade.app';
    comp.password = 'pass123';
    await comp.submit();
    expect(comp.error()).toContain('Check your email');
  });

  it('sets error on signIn failure', async () => {
    mockSignIn.mockRejectedValue(new Error('Invalid credentials'));
    const fixture = TestBed.createComponent(AuthModalComponent);
    const comp = fixture.componentInstance;
    comp.email = 'bad@test.com';
    comp.password = 'wrong';
    await comp.submit();
    expect(comp.error()).toBe('Invalid credentials');
    expect(comp.loading()).toBe(false);
  });

  it('sets error on signUp failure', async () => {
    mockSignUp.mockRejectedValue(new Error('Email already registered'));
    const fixture = TestBed.createComponent(AuthModalComponent);
    const comp = fixture.componentInstance;
    comp.toggleMode();
    comp.email = 'existing@test.com';
    comp.password = 'pass';
    await comp.submit();
    expect(comp.error()).toBe('Email already registered');
  });

  it('toggleMode switches between login and signup', () => {
    const fixture = TestBed.createComponent(AuthModalComponent);
    const comp = fixture.componentInstance;
    expect(comp.mode()).toBe('login');
    comp.toggleMode();
    expect(comp.mode()).toBe('signup');
    comp.toggleMode();
    expect(comp.mode()).toBe('login');
  });

  it('toggleMode clears error', () => {
    const fixture = TestBed.createComponent(AuthModalComponent);
    const comp = fixture.componentInstance;
    comp['error'].set('some error');
    comp.toggleMode();
    expect(comp.error()).toBe('');
  });

  it('sets loading true during submit', async () => {
    let resolveSignIn!: (v?: unknown) => void;
    mockSignIn.mockReturnValue(new Promise(r => { resolveSignIn = r; }));
    const fixture = TestBed.createComponent(AuthModalComponent);
    const comp = fixture.componentInstance;
    comp.email = 'test@cuefade.app';
    comp.password = 'pass123';

    const submitPromise = comp.submit();
    expect(comp.loading()).toBe(true);
    resolveSignIn(undefined);
    await submitPromise;
    expect(comp.loading()).toBe(false);
  });
});
