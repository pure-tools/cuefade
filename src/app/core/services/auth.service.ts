import { Injectable, signal, computed, OnDestroy } from '@angular/core';
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from './supabase.client';
import type { Database } from '../types/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface UserProfile {
  id: string;
  email: string;
  isPro: boolean;
  stripeCustomerId?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private _user = signal<User | null>(null);
  private _profile = signal<UserProfile | null>(null);
  private _loading = signal(true);

  readonly user = this._user.asReadonly();
  readonly profile = this._profile.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly isLoggedIn = computed(() => this._user() !== null);
  readonly isPro = computed(() => this._profile()?.isPro ?? false);

  private subscription: { unsubscribe(): void } | null = null;

  constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    await this.handleSession(session);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: AuthChangeEvent, session: Session | null) => {
        this._user.set(session?.user ?? null);
        if (session?.user) {
          await this.loadProfile(session.user.id);
        } else {
          this._profile.set(null);
        }
      }
    );
    this.subscription = subscription;
  }

  private async handleSession(session: Session | null): Promise<void> {
    this._user.set(session?.user ?? null);
    if (session?.user) {
      await this.loadProfile(session.user.id);
    }
    this._loading.set(false);
  }

  private async loadProfile(userId: string): Promise<void> {
    const { data } = await supabase
      .from('profiles')
      .select('id, email, is_pro, stripe_customer_id')
      .eq('id', userId)
      .single() as { data: ProfileRow | null; error: unknown };

    if (data) {
      this._profile.set({
        id: data.id,
        email: data.email,
        isPro: data.is_pro,
        stripeCustomerId: data.stripe_customer_id ?? undefined,
      });
    }
  }

  async signUp(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  async refreshProfile(): Promise<void> {
    const userId = this._user()?.id;
    if (userId) await this.loadProfile(userId);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
