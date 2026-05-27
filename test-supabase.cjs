const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://lzvfirfuncfjqlfbmlzn.supabase.co';
const supabaseKey = 'sb_publishable_hA3KDtmHBpl6cfE4N5m3vw_yNjQ6sEg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing Supabase connection...");
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("Success:", data);
  }
}

test();
