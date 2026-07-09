import { supabase, checkSupabaseConnection } from '../../lib/supabase';
import { Device, Playlist, Media, Client } from '../../types';
import { mapDbToDevice } from './tvs';
import { mapDbToClient } from './clientes';
import { playlistsService } from './playlists';
import { midiasService } from './midias';
import { tokensService } from './tokens';
import { initialDevices, initialClients, initialPlaylists, initialMedia } from '../../mockData';

export const playerService = {
  async getPlayerConfig(token: string): Promise<{ device: Device; client: Client | null; playlist: Playlist | null; media: Media[] }> {
    const normalized = tokensService.normalizeToken(token);
    
    if (!(await checkSupabaseConnection())) {
      const matched = initialDevices.find(d => tokensService.normalizeToken(d.token) === normalized);
      if (!matched) throw new Error('Token inválido');
      
      const client = initialClients.find(c => c.id === matched.clientId) || null;
      const playlistId = client?.playlistId || null;
      const playlist = initialPlaylists.find(p => p.id === playlistId) || null;
      const media = playlist ? playlist.mediaIds.map(id => initialMedia.find(m => m.id === id)).filter(Boolean) as Media[] : [];
      
      return { device: matched, client, playlist, media };
    }
    
    // 1. Fetch TV
    const { data: tvData, error: tvError } = await supabase
      .from('tvs')
      .select('*');

    if (tvError || !tvData || tvData.length === 0) {
      // try alternate table
      const { data: altTvData, error: altTvError } = await supabase.from('devices').select('*');
      if (altTvError || !altTvData || altTvData.length === 0) {
        throw new Error('Token inválido');
      }
      const matched = altTvData.find((d: any) => tokensService.normalizeToken(d.token) === normalized);
      if (!matched) throw new Error('Token inválido');
      return this.loadFullConfig(mapDbToDevice(matched));
    }

    const matchedTv = tvData.find((d: any) => tokensService.normalizeToken(d.token) === normalized);
    if (!matchedTv) {
      // try alt table anyways just in case
      const { data: altTvData } = await supabase.from('devices').select('*');
      const altMatched = altTvData?.find((d: any) => tokensService.normalizeToken(d.token) === normalized);
      if (!altMatched) throw new Error('Token inválido');
      return this.loadFullConfig(mapDbToDevice(altMatched));
    }
    
    return this.loadFullConfig(mapDbToDevice(matchedTv));
  },

  async loadFullConfig(device: Device): Promise<{ device: Device; client: Client | null; playlist: Playlist | null; media: Media[] }> {
    if (!(await checkSupabaseConnection())) {
      const client = initialClients.find(c => c.id === device.clientId) || null;
      const playlistId = client?.playlistId || null;
      const playlist = initialPlaylists.find(p => p.id === playlistId) || null;
      const media = playlist ? playlist.mediaIds.map(id => initialMedia.find(m => m.id === id)).filter(Boolean) as Media[] : [];
      return { device, client, playlist, media };
    }

    // 2. Fetch Client
    let client: Client | null = null;
    const { data: clientData, error: clError } = await supabase.from('clientes').select('*').eq('id', device.clientId).single();
    if (!clError && clientData) {
      client = mapDbToClient(clientData);
    } else {
      // try alternate table
      const { data: altClientData } = await supabase.from('clients').select('*').eq('id', device.clientId).single();
      if (altClientData) {
        client = mapDbToClient(altClientData);
      }
    }

    // 3. Fetch Playlist
    let playlist: Playlist | null = null;
    const playlistId = client?.playlistId || null;
    if (playlistId) {
      const playlists = await playlistsService.getPlaylists([]);
      playlist = playlists.find(p => p.id === playlistId) || null;
    }

    // 4. Fetch Medias
    let media: Media[] = [];
    if (playlist && playlist.mediaIds && playlist.mediaIds.length > 0) {
      const allMedia = await midiasService.getMedia([]);
      media = playlist.mediaIds.map(id => allMedia.find(m => m.id === id)).filter(Boolean) as Media[];
    }

    return { device, client, playlist, media };
  },

  async updateTvStatus(deviceId: string, status: 'Online' | 'Offline'): Promise<void> {
    if (!(await checkSupabaseConnection())) {
      const matched = initialDevices.find(d => d.id === deviceId);
      if (matched) {
        matched.status = status;
      }
      return;
    }

    const updatePayload = {
      status,
      uptime: status === 'Online' ? '24h 0m' : '0h 0m',
      ultima_conexao: new Date().toISOString(),
      ultima_sincronizacao: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('tvs')
      .update(updatePayload)
      .eq('id', deviceId);

    if (error) {
      await supabase
        .from('devices')
        .update({
          status,
          uptime: status === 'Online' ? '24h 0m' : '0h 0m',
          lastSync: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        })
        .eq('id', deviceId);
    }
  },

  subscribeToUpdates(token: string, onUpdate: () => void): () => void {
    const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;
    if (!supabase || !anonKey || anonKey === 'sb_publishable_lCyfBoX5m8JzQ7mldxloQA_6YN3MTqg' || anonKey.startsWith('sb_publishable_')) {
      return () => {};
    }

    const normalized = tokensService.normalizeToken(token);
    
    // Subscribe to changes in tvs, playlists, or clientes and trigger refresh!
    const channel = supabase
      .channel('player-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tvs' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'playlists' }, () => {
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, () => {
        onUpdate();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
