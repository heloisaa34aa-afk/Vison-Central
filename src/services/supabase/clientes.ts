import { supabase } from '../../lib/supabase';
import { Client } from '../../types';

export function mapDbToClient(db: any): Client {
  return {
    id: db.id,
    name: db.nome || db.name || '',
    category: db.categoria || db.category || '',
    status: (db.status as any) || 'Ativo',
    screensCount: db.screens_count !== undefined ? Number(db.screens_count) : Number(db.screensCount || 1),
    city: db.cidade || db.city || '',
    neighborhood: db.bairro || db.neighborhood || '',
    iconType: (db.icon_type || db.iconType || 'store') as any,
    orientation: (db.orientation || 'Horizontal') as any,
    timezone: db.timezone || 'America/Sao_Paulo',
    playlistId: db.playlist_id || db.playlistId || undefined,
    tickerText: db.ticker_text || db.tickerText || undefined
  };
}

export function mapClientToDb(client: Client): any {
  return {
    id: client.id,
    nome: client.name,
    categoria: client.category,
    status: client.status,
    screens_count: client.screensCount,
    cidade: client.city,
    bairro: client.neighborhood,
    icon_type: client.iconType,
    orientation: client.orientation,
    timezone: client.timezone,
    playlist_id: client.playlistId || null,
    ticker_text: client.tickerText || null
  };
}

export const clientesService = {
  async getClients(fallback: Client[]): Promise<Client[]> {
    try {
      const { data, error } = await supabase.from('clientes').select('*');
      if (error) {
        // Fallback to searching standard camelCase table if snakeCase fails
        const { data: altData, error: altError } = await supabase.from('clients').select('*');
        if (!altError && altData) {
          return altData.map(mapDbToClient);
        }
        console.warn('Erro ao buscar clientes:', error);
        return fallback;
      }
      return data ? data.map(mapDbToClient) : fallback;
    } catch (e) {
      console.error(e);
      return fallback;
    }
  },

  async saveClient(client: Client): Promise<boolean> {
    try {
      const dbData = mapClientToDb(client);
      const { error } = await supabase.from('clientes').upsert(dbData);
      if (error) {
        // Fallback to alternate table
        const { error: altError } = await supabase.from('clients').upsert({
          id: client.id,
          name: client.name,
          category: client.category,
          status: client.status,
          screensCount: client.screensCount,
          city: client.city,
          neighborhood: client.neighborhood,
          iconType: client.iconType,
          orientation: client.orientation,
          timezone: client.timezone,
          playlistId: client.playlistId || null,
          tickerText: client.tickerText || null
        });
        if (altError) {
          console.warn('Erro ao salvar cliente:', altError);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  async deleteClient(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (error) {
        await supabase.from('clients').delete().eq('id', id);
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
