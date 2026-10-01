export const environment = {
  production: false,
  // Key at: https://console.cloud.google.com → YouTube Data API v3
  youtubeApiKey: 'AIzaSyBLL1eHrOIYh9F_73e5LHTEGBhi0F68X3I',
  // Key at: https://dashboard.stripe.com/apikeys
  stripePublicKey: 'pk_live_51Tzyx7EqvxHvnSpgvI9f1NZmWquzqDX1WMYG6nse6S68zh8mZib4c39pEN8xOD14Opo0XF1P8tNg479GkdMMNNhU00B76NBwd9',
  stripePriceId: 'price_1TzzSBEqvxHvnSpgYLOdgsQ0',
  // Keys at: https://supabase.com/dashboard → project → Settings → API
  supabaseUrl: 'https://wqbpbosvddevifaugkdy.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxYnBib3N2ZGRldmlmYXVna2R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNjUwNjksImV4cCI6MjEwMDg0MTA2OX0.HMtbhlnxSat-AqDEIdHJJFZjacg_EhEEkzX9qZxJHHY',
  // Umami website id — empty in dev (console adapter logs events instead)
  umamiWebsiteId: '',
  // RevenueCat public SDK keys (in-app purchases on iOS / Android)
  revenuecatAppleKey: '',
  revenuecatGoogleKey: '',
  // Non-consumable product id in App Store Connect + Play Console
  iapProductId: 'pro_lifetime',
};
