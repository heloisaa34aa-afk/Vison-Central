import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function test() {
  const { data, error } = await supabase.from('configuracoes').select('*').limit(1);
  console.log(error || (data && data[0] ? Object.keys(data[0]) : "Empty table"));
}
test();
