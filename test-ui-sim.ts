import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function test() {
  const { data: tvs } = await supabase.from('tvs').select('*').limit(1);
  if (!tvs || tvs.length === 0) return;
  const tvId = tvs[0].id;
  
  // Simulated UI update for proporcao, orientacao, brilho
  const updateData = {
    proporcao: 'cover',
    orientacao: 'Vertical',
    brilho: 77
  };

  const { error } = await supabase.from('tvs').update(updateData).eq('id', tvId);
  console.log("UPDATE result:", error || "Success");

  const { data: updatedTvs } = await supabase.from('tvs').select('proporcao, orientacao, brilho').eq('id', tvId);
  console.log("DB Data:", updatedTvs);
}
test();
