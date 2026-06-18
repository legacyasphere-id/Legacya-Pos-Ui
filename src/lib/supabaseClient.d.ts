import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../types/database.generated';

export declare const isSupabaseConfigured: boolean;
export declare const supabase: SupabaseClient<Database>;
