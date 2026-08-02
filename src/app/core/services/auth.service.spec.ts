import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

const mocks = vi.hoisted(() => ({
  unsubscribe: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  single: vi.fn(),
  eq: vi.fn(),
  select: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: function createClient() {
    return {
      auth: {
        getSession: mocks.getSession,
        onAuthStateChange: mocks.onAuthStateChange,
        signInWithPassword: mocks.signIn,
        signUp: mocks.signUp,
        signOut: mocks.signOut,
      },
      from: mocks.from,
    };
  },
}));

const nullSession = { data: { session: null } };
const mockUser = { id: 'user-123', email: 'test@cuefade.app' };
const withSession = { data: { session: { user: mockUser } } };
const freeProfile = { data: { id: 'user-123', email: 'test@cuefade.app', is_pro: false, stripe_customer_id: null } };
const proProfile = { data: { id: 'user-123', email: 'test@cuefade.app', is_pro: true, stripe_customer_id: 'cus_abc' } };

const flushAsync = () => new Promise<void>(r => setTimeout(r, 0));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSession.mockResolvedValue(nullSession);
    mocks.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: mocks.unsubscribe } } });
    mocks.signIn.mockResolvedValue({ error: null });
    mocks.signUp.mockResolvedValue({ error: null });
    mocks.signOut.mockResolvedValue({});
    mocks.single.mockResolvedValue({ data: null });
    mocks.eq.mockReturnValue({ single: mocks.single });
    mocks.select.mockReturnValue({ eq: mocks.eq });
    mocks.from.mockReturnValue({ select: mocks.select });

    TestBed.configureTestingModule({});
  });

  it('starts not logged in with loading true', () => {
    const service = TestBed.inject(AuthService);
    expect(service.isLoggedIn()).toBe(false);
    expect(service.isPro()).toBe(false);
    expect(service.loading()).toBe(true);
  });

  it('loading becomes false after session check resolves', async () => {
    const service = TestBed.inject(AuthService);
    await flushAsync();
    expect(service.loading()).toBe(false);
  });

  it('sets user when valid session exists', async () => {
    mocks.getSession.mockResolvedValue(withSession);
    mocks.single.mockResolvedValue(freeProfile);
    const service = TestBed.inject(AuthService);
    await flushAsync();
    expect(service.isLoggedIn()).toBe(true);
    expect(service.user()?.id).toBe('user-123');
  });

  it('isPro true when profile has is_pro flag', async () => {
    mocks.getSession.mockResolvedValue(withSession);
    mocks.single.mockResolvedValue(proProfile);
    const service = TestBed.inject(AuthService);
    await flushAsync();
    expect(service.isPro()).toBe(true);
    expect(service.profile()?.stripeCustomerId).toBe('cus_abc');
  });

  it('signIn calls supabase with email and password', async () => {
    const service = TestBed.inject(AuthService);
    await service.signIn('test@cuefade.app', 'pass123');
    expect(mocks.signIn).toHaveBeenCalledWith({ email: 'test@cuefade.app', password: 'pass123' });
  });

  it('signIn throws when supabase returns error', async () => {
    const authError = new Error('Invalid login credentials');
    mocks.signIn.mockResolvedValue({ error: authError });
    const service = TestBed.inject(AuthService);
    await expect(service.signIn('bad@test.com', 'wrong')).rejects.toThrow('Invalid login credentials');
  });

  it('signUp calls supabase with email and password', async () => {
    const service = TestBed.inject(AuthService);
    await service.signUp('new@cuefade.app', 'pass123');
    expect(mocks.signUp).toHaveBeenCalledWith({ email: 'new@cuefade.app', password: 'pass123' });
  });

  it('signUp throws when supabase returns error', async () => {
    const authError = new Error('Email already registered');
    mocks.signUp.mockResolvedValue({ error: authError });
    const service = TestBed.inject(AuthService);
    await expect(service.signUp('existing@test.com', 'pass')).rejects.toThrow('Email already registered');
  });

  it('signOut calls supabase signOut', async () => {
    const service = TestBed.inject(AuthService);
    await service.signOut();
    expect(mocks.signOut).toHaveBeenCalled();
  });

  it('refreshProfile reloads and updates isPro', async () => {
    mocks.getSession.mockResolvedValue(withSession);
    mocks.single.mockResolvedValue(freeProfile);
    const service = TestBed.inject(AuthService);
    await flushAsync();
    expect(service.isPro()).toBe(false);

    mocks.single.mockResolvedValue(proProfile);
    await service.refreshProfile();
    expect(service.isPro()).toBe(true);
  });

  it('refreshProfile does nothing when not logged in', async () => {
    const service = TestBed.inject(AuthService);
    await flushAsync();
    mocks.single.mockClear();
    await service.refreshProfile();
    expect(mocks.single).not.toHaveBeenCalled();
  });

  it('subscribes to auth state changes on init', async () => {
    TestBed.inject(AuthService);
    await flushAsync();
    expect(mocks.onAuthStateChange).toHaveBeenCalled();
  });

  it('unsubscribes on destroy', async () => {
    TestBed.inject(AuthService);
    await flushAsync();
    TestBed.resetTestingModule();
    expect(mocks.unsubscribe).toHaveBeenCalled();
  });
});
