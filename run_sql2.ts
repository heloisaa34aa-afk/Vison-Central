import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function run() {
  const sql = `
ALTER TABLE feed_sources ADD COLUMN IF NOT EXISTS proxima_execucao TIMESTAMPTZ;
ALTER TABLE feed_sources ADD COLUMN IF NOT EXISTS quantidade_importada INTEGER DEFAULT 0;
ALTER TABLE feed_sources ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'idle';
ALTER TABLE feed_sources ADD COLUMN IF NOT EXISTS ultimo_erro TEXT;
  `;
}
run();
