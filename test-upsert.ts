import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);
import { mapTvToDb } from './src/services/supabase/tvs';

async function test() {
  const { data: tvs } = await supabase.from('tvs').select('*').limit(1);
  if (!tvs || tvs.length === 0) return;
  const dbData = tvs[0];
  dbData.rotacao = 90;
  
  const { error } = await supabase.from('tvs').upsert(dbData);
  if (error) {
    console.error("UPSERT ERROR:", error.message);
  } else {
    console.log("SUCCESS");
  }
}
test();
