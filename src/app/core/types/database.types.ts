export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          is_pro: boolean;
          stripe_customer_id: string | null;
          pro_activated_at: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          is_pro?: boolean;
          stripe_customer_id?: string | null;
          pro_activated_at?: string | null;
          created_at?: string;
        };
        Update: {
          is_pro?: boolean;
          stripe_customer_id?: string | null;
          pro_activated_at?: string | null;
        };
      };
    };
  };
}
