import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tqzvimygperetxmhowtm.supabase.co';
const supabaseAnonKey = 'sb_publishable_O-YJdYGVWcbuKAUxen3kUw_sPca58tZ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
