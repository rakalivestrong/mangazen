import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lzvfirfuncfjqlfbmlzn.supabase.co';
const supabaseKey = 'sb_publishable_hA3KDtmHBpl6cfE4N5m3vw_yNjQ6sEg';

export const supabase = createClient(supabaseUrl, supabaseKey);
