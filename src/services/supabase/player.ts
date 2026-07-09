import { supabase, checkSupabaseConnection } from '../../lib/supabase';
import { Tv, Playlist, Midia, Cliente } from '../../types';
import { mapDbToTv } from './tvs';
import { mapDbToCliente } from './clientes';
import { playlistsService } from './playlists';
import { midiasService } from './midias';
import { tokensService } from './tokens';

export const playerService = {
  async getPlayerConfig(token: string): Promise<{ tv: Tv; cliente: Cliente | null; playlist: Playlist | null; midias: Midia[] }> {
    const normalized = tokensService.normalizeToken(token);
    
    if (!(await checkSupabaseConnection())) {
      throw new Error('Supabase não está configurado.');
    }
    
    // 1. Buscar TV pelo token
    const { data: tvData, error: tvError } = await supabase
      .from('tvs')
      .select('*');

    if (tvError || !tvData || tvData.length === 0) {
      throw new Error('Token inválido');
    }

    const matchedTv = tvData.find((d: any) => tokensService.normalizeToken(d.token) === normalized);
    if (!matchedTv) {
      throw new Error('Token inválido');
    }
    
    return this.loadFullConfig(mapDbToTv(matchedTv));
  },

  async loadFullConfig(tv: Tv): Promise<{ tv: Tv; cliente: Cliente | null; playlist: Playlist | null; midias: Midia[] }> {
    if (!(await checkSupabaseConnection())) {
      throw new Error('Supabase não está configurado.');
    }

    // 2. Buscar Cliente
    let cliente: Cliente | null = null;
    if (tv.clienteId) {
      const { data: clienteData, error: clError } = await supabase
        .from('clientes')
        .select('*')
        .eq('id', tv.clienteId)
        .single();
      if (!clError && clienteData) {
        cliente = mapDbToCliente(clienteData);
      }
    }

    // 3. Buscar Playlist
    let playlist: Playlist | null = null;
    const playlistId = tv.playlistId || cliente?.playlistId || null;
    if (playlistId) {
      const playlists = await playlistsService.getPlaylists();
      playlist = playlists.find(p => p.id === playlistId) || null;
    }

    // 4. Buscar Mídias da Playlist
    let midias: Midia[] = [];
    if (playlist && playlist.midiasIds && playlist.midiasIds.length > 0) {
      const allMidias = await midiasService.getMidias();
      midias = playlist.midiasIds
        .map(id => allMidias.find(m => m.id === id))
        .filter(Boolean) as Midia[];
    }

    return { tv, cliente, playlist, midias };
  },

  async updateTvStatus(tvId: string, status: 'Online' | 'Offline'): Promise<void> {
    if (!(await checkSupabaseConnection())) {
      return;
    }

    const updatePayload = {
      status,
      uptime: status === 'Online' ? '24h 0m' : '0h 0m',
      ultima_conexao: new Date().toISOString(),
      ultima_sincronizacao: new Date().toISOString()
    };
    
    await supabase
      .from('tvs')
      .update(updatePayload)
      .eq('id', tvId);
  },

  subscribeToUpdates(token: string, onUpdate: () => void): () => void {
    if (!supabase) return () => {};

    // Inscrever-se para mudanças nas tabelas tvs, playlists ou clientes
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
