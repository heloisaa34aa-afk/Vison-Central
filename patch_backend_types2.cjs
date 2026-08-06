const fs = require('fs');
const file = 'vision-central-backend/src/types.ts';
let data = `export interface FeedSource {
  id: string;
  playlist_id: string;
  tipo: string;
  perfil: string;
  intervalo_horas: number;
  ativo: boolean;
  ultima_execucao?: string | null;
  ultimo_item_id?: string | null;
  quantidade_importada?: number;
  status?: string;
  ultimo_erro?: string | null;
  proxima_execucao?: string | null;
}
`;
fs.writeFileSync(file, data);
