import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eefnfdwmidtnycesyapr.supabase.co';
const supabaseAnonKey = 'sb_publishable_lCyfBoX5m8JzQ7mldxloQA_6YN3MTqg';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
  console.log('Testing anonymous login...');
  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.log('Anonymous login failed:', error.message);
    } else {
      console.log('Anonymous login SUCCESS:', data.user?.id);
      
      // Let's try inserting client with this session
      const newClient = {
        id: `c-auth-${Date.now()}`,
        nome: 'Cliente Logado',
        categoria: 'Academia',
        cidade: 'SP',
        bairro: 'Jardins'
      };
      const { data: insertData, error: insertError } = await supabase.from('clientes').insert(newClient).select();
      if (insertError) {
        console.log('Insert failed after auth:', insertError.message);
      } else {
        console.log('Insert SUCCESS after auth:', insertData);
      }
    }
  } catch (err: any) {
    console.log('Error:', err.message);
  }
}

test();
