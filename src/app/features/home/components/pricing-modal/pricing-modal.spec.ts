import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal, Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PricingModalComponent } from './pricing-modal';
import { LicenseService, PaymentService } from '@pure-tools/monetka';
import { HapticsService, NativeService } from '@pure-tools/mobilka/native';
import { AuthService } from '../../../../core/services/auth.service';
import { AnalyticsService } from '@pure-tools/slushalka';

const mockAnalytics = { track: vi.fn(), page: vi.fn(), identify: vi.fn(), reset: vi.fn(), setSuperProps: vi.fn() };

const isLoggedIn = signal(false);
const user = signal<{ id: string; email: string } | null>(null);
const mockOpenCheckout = vi.fn();

const mockAuth = { isLoggedIn, user };
const mockPayment = { openCheckout: mockOpenCheckout };

describe('PricingModalComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isLoggedIn.set(false);
    user.set(null);
    mockOpenCheckout.mockResolvedValue({ url: 'https://checkout.stripe.com/test' });

    TestBed.configureTestingModule({
      imports: [PricingModalComponent],
      providers: [
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: AuthService, useValue: mockAuth },
        { provide: PaymentService, useValue: mockPayment },
      ],
    });
  });

  it('emits close and requireAuth when not logged in', async () => {
    const fixture = TestBed.createComponent(PricingModalComponent);
    fixture.componentRef.setInput('visible', true);
    const closeSpy = vi.fn();
    const requireAuthSpy = vi.fn();
    fixture.componentInstance.close.subscribe(closeSpy);
    fixture.componentInstance.requireAuth.subscribe(requireAuthSpy);

    await fixture.componentInstance.unlock();

    expect(closeSpy).toHaveBeenCalled();
    expect(requireAuthSpy).toHaveBeenCalled();
    expect(mockOpenCheckout).not.toHaveBeenCalled();
  });

  it('does not track checkout_started when not logged in', async () => {
    const fixture = TestBed.createComponent(PricingModalComponent);
    await fixture.componentInstance.unlock();
    expect(mockAnalytics.track).not.toHaveBeenCalled();
  });

  it('calls openCheckout with user details when logged in', async () => {
    isLoggedIn.set(true);
    user.set({ id: 'user-123', email: 'test@cuefade.app' });

    const fixture = TestBed.createComponent(PricingModalComponent);
    fixture.componentRef.setInput('visible', true);

    await fixture.componentInstance.unlock();

    expect(mockOpenCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-123',
        email: 'test@cuefade.app',
        successUrl: expect.stringContaining('upgraded=1'),
      })
    );
    expect(mockAnalytics.track).toHaveBeenCalledWith('checkout_started');
  });

  it('sets error signal when openCheckout throws', async () => {
    isLoggedIn.set(true);
    user.set({ id: 'user-123', email: 'test@cuefade.app' });
    mockOpenCheckout.mockRejectedValue(new Error('Network error'));

    const fixture = TestBed.createComponent(PricingModalComponent);
    fixture.componentRef.setInput('visible', true);

    await fixture.componentInstance.unlock();

    expect(fixture.componentInstance.error()).toBe('Network error');
    expect(fixture.componentInstance.loading()).toBe(false);
    expect(mockAnalytics.track).toHaveBeenCalledWith('checkout_failed');
  });

  it('sets loading true during checkout and false after', async () => {
    isLoggedIn.set(true);
    user.set({ id: 'user-123', email: 'test@cuefade.app' });
    let resolveCheckout!: (v?: unknown) => void;
    mockOpenCheckout.mockReturnValue(new Promise(r => { resolveCheckout = r; }));

    const fixture = TestBed.createComponent(PricingModalComponent);
    fixture.componentRef.setInput('visible', true);

    const unlockPromise = fixture.componentInstance.unlock();
    expect(fixture.componentInstance.loading()).toBe(true);

    resolveCheckout(undefined);
    await unlockPromise;
  });

  it('renders pro features list', () => {
    const fixture = TestBed.createComponent(PricingModalComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    const items = fixture.debugElement.queryAll(By.css('li'));
    expect(items.length).toBe(fixture.componentInstance.proFeatures.length);
  });

  it('displays $10 price', () => {
    const fixture = TestBed.createComponent(PricingModalComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('$10');
  });

  it('CTA button shows "Unlock for $10" when not loading', () => {
    const fixture = TestBed.createComponent(PricingModalComponent);
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    const btns: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button');
    const cta = Array.from(btns).find(b => b.textContent?.includes('Unlock'));
    expect(cta?.textContent?.trim()).toBe('Unlock for $10');
  });

  it('does not render when visible is false', () => {
    const fixture = TestBed.createComponent(PricingModalComponent);
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('.fixed');
    expect(modal).toBeNull();
  });

  describe('native app (in-app purchase)', () => {
    const nativePayment = {
      openCheckout: vi.fn(),
      restorePurchases: vi.fn(),
      canRestorePurchases: true,
    };
    const nativeAuth = { isLoggedIn, user, waitForPro: vi.fn().mockResolvedValue(true) };
    const license = { setLicensed: vi.fn() };
    const haptics = { notification: vi.fn().mockResolvedValue(undefined) };

    function createNative() {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [PricingModalComponent],
        providers: [
          { provide: AnalyticsService, useValue: mockAnalytics },
          { provide: AuthService, useValue: nativeAuth },
          { provide: PaymentService, useValue: nativePayment },
          { provide: LicenseService, useValue: license },
          { provide: HapticsService, useValue: haptics },
          { provide: NativeService, useValue: { isNative: signal(true) } },
        ],
      });
      const fixture = TestBed.createComponent(PricingModalComponent);
      fixture.componentRef.setInput('visible', true);
      fixture.detectChanges();
      return fixture;
    }

    beforeEach(() => {
      isLoggedIn.set(true);
      user.set({ id: 'user-123', email: 'test@cuefade.app' });
      nativePayment.openCheckout.mockResolvedValue({ sessionId: 'tx_1', entitlements: ['pro'] });
      nativePayment.restorePurchases.mockResolvedValue({ valid: true, features: ['pro'] });
    });

    it('hides the web price and Ko-fi link, shows Restore', () => {
      const el = createNative().nativeElement as HTMLElement;
      expect(el.textContent).not.toContain('$10');
      expect(el.textContent).not.toContain('Ko-fi');
      expect(el.textContent).toContain('Unlock Pro');
      expect(el.textContent).toContain('Restore purchases');
    });

    it('buys in-app with only the user id, unlocks and waits for the webhook', async () => {
      const fixture = createNative();
      const closeSpy = vi.fn();
      fixture.componentInstance.close.subscribe(closeSpy);

      await fixture.componentInstance.unlock();

      expect(nativePayment.openCheckout).toHaveBeenCalledWith({ userId: 'user-123' });
      expect(license.setLicensed).toHaveBeenCalledWith(expect.arrayContaining(['cue-points']));
      expect(haptics.notification).toHaveBeenCalled();
      expect(nativeAuth.waitForPro).toHaveBeenCalled();
      expect(mockAnalytics.track).toHaveBeenCalledWith('checkout_completed', { store: 'in-app' });
      expect(closeSpy).toHaveBeenCalled();
    });

    it('treats a dismissed purchase sheet as cancel, not error', async () => {
      nativePayment.openCheckout.mockRejectedValue({ userCancelled: true, message: 'Purchase was cancelled.' });
      const fixture = createNative();
      await fixture.componentInstance.unlock();

      expect(fixture.componentInstance.error()).toBe('');
      expect(fixture.componentInstance.loading()).toBe(false);
      expect(mockAnalytics.track).toHaveBeenCalledWith('checkout_cancelled');
      expect(license.setLicensed).not.toHaveBeenCalled();
    });

    it('does not unlock when the store reports no pro entitlement', async () => {
      nativePayment.openCheckout.mockResolvedValue({ sessionId: 'tx_1', entitlements: [] });
      const fixture = createNative();
      await fixture.componentInstance.unlock();

      expect(license.setLicensed).not.toHaveBeenCalled();
      expect(fixture.componentInstance.error()).toContain('Restore');
    });

    it('restore unlocks when a previous purchase exists', async () => {
      const fixture = createNative();
      await fixture.componentInstance.restore();

      expect(nativePayment.restorePurchases).toHaveBeenCalledWith('user-123');
      expect(license.setLicensed).toHaveBeenCalled();
      expect(mockAnalytics.track).toHaveBeenCalledWith('purchases_restored', { found: true });
    });

    it('restore explains when nothing was bought', async () => {
      nativePayment.restorePurchases.mockResolvedValue({ valid: false, features: [] });
      const fixture = createNative();
      await fixture.componentInstance.restore();

      expect(license.setLicensed).not.toHaveBeenCalled();
      expect(fixture.componentInstance.info()).toContain('No previous purchase');
      expect(fixture.componentInstance.restoring()).toBe(false);
    });

    it('restore asks logged-out users to sign in first', async () => {
      isLoggedIn.set(false);
      const fixture = createNative();
      const requireAuthSpy = vi.fn();
      fixture.componentInstance.requireAuth.subscribe(requireAuthSpy);

      await fixture.componentInstance.restore();

      expect(requireAuthSpy).toHaveBeenCalled();
      expect(nativePayment.restorePurchases).not.toHaveBeenCalled();
    });
  });
});
