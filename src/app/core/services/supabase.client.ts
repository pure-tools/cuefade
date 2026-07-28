import { createClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';
import type { Database } from '../types/database.types';

export const supabase = createClient<Database>(environment.supabaseUrl, environment.supabaseAnonKey);
