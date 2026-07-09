import { supabase } from '../../lib/supabase';
import { Device } from '../../types';

export function mapDbToDevice(db: any): Device {
  return {
    id: db.id,
    clientId: db.cliente_id || db.clientId || '',
    name: db.nome || db.name || '',
    status: (db.status as any) || 'Offline',
    uptime: db.uptime || '0h 0m',
    token: db.token || '',
    lastSync: db.ultima_sincronizacao || db.lastSync || '',
    playlistId: db.playlist_id || db.playlistId || undefined,
    lastConnected: db.ultima_conexao || db.lastConnected || undefined
  };
}

export function mapDeviceToDb(device: Device): any {
  return {
    id: device.id,
    cliente_id: device.clientId,
    nome: device.name,
    token: device.token,
    status: device.status,
    uptime: device.uptime,
    ultima_sincronizacao: device.lastSync || new Date().toISOString(),
    playlist_id: device.playlistId || null,
    ultima_conexao: device.lastConnected || new Date().toISOString()
  };
}

export const tvsService = {
  async getDevices(fallback: Device[]): Promise<Device[]> {
    try {
      const { data, error } = await supabase.from('tvs').select('*');
      if (error) {
        // Fallback to alternate table name 'devices'
        const { data: altData, error: altError } = await supabase.from('devices').select('*');
        if (!altError && altData) {
          return altData.map(mapDbToDevice);
        }
        console.warn('Erro ao buscar TVs:', error);
        return fallback;
      }
      return data ? data.map(mapDbToDevice) : fallback;
    } catch (e) {
      console.error(e);
      return fallback;
    }
  },

  async saveDevice(device: Device): Promise<boolean> {
    try {
      const dbData = mapDeviceToDb(device);
      const { error } = await supabase.from('tvs').upsert(dbData);
      if (error) {
        // Fallback to alternate table 'devices'
        const { error: altError } = await supabase.from('devices').upsert({
          id: device.id,
          clientId: device.clientId,
          name: device.name,
          status: device.status,
          uptime: device.uptime,
          token: device.token,
          lastSync: device.lastSync
        });
        if (altError) {
          console.warn('Erro ao salvar TV:', altError);
          return false;
        }
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  },

  async deleteDevice(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('tvs').delete().eq('id', id);
      if (error) {
        await supabase.from('devices').delete().eq('id', id);
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
};
