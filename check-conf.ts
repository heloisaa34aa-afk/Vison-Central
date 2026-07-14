import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
  const { data, error } = await supabase.from('configuracoes').select('*').limit(1);
  console.log(data && data.length > 0 ? Object.keys(data[0]) : "No data, can't infer schema.");
}
check();
