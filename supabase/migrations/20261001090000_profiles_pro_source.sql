-- Where Pro was purchased: web (Stripe) or in-app (App Store / Google Play via RevenueCat)
alter table public.profiles
  add column pro_source text
    check (pro_source in ('stripe', 'app_store', 'play_store'));

-- Existing Pro users all bought through Stripe
update public.profiles set pro_source = 'stripe' where is_pro and pro_source is null;
