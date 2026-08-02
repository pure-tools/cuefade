import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { signal, Component } from '@angular/core';
import { By } from '@angular/platform-browser';
import { PricingModalComponent } from './pricing-modal';
import { PaymentService } from '@pure-tools/monetka';
import { AuthService } from '../../../../core/services/auth.service';

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
});
