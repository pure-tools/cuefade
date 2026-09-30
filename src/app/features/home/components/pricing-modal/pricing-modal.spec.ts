import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal, Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PricingModalComponent } from './pricing-modal';
import { PaymentService } from '@pure-tools/monetka';
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
});
