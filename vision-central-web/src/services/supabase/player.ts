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

  async getPlayerConfigById(id: string): Promise<{ tv: Tv; cliente: Cliente | null; playlist: Playlist | null; midias: Midia[] }> {
    if (!(await checkSupabaseConnection())) {
      throw new Error('Supabase não está configurado.');
    }
    const { data, error } = await supabase.from('tvs').select('*').eq('id', id).single();
    if (error || !data) {
      throw new Error('Dispositivo não encontrado');
    }
    return this.loadFullConfig(mapDbToTv(data));
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
        .map((id, idx) => {
          const original = allMidias.find(m => m.id === id);
          if (!original) return null;
          
          let dur = original.duracao;
          if (playlist?.midiasDurations && playlist.midiasDurations[idx] !== undefined) {
            dur = playlist.midiasDurations[idx];
          }
          return {
            ...original,
            duracao: dur
          };
        })
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

  async sendHeartbeat(tvId: string): Promise<void> {
    if (!(await checkSupabaseConnection())) {
      return;
    }

    const updatePayload = {
      status: 'Online',
      uptime: '24h 0m',
      ultima_conexao: new Date().toISOString(),
      ultima_sincronizacao: new Date().toISOString()
    };
    
    await supabase
      .from('tvs')
      .update(updatePayload)
      .eq('id', tvId);
  },

  async broadcastConfigUpdate(tvId: string, config: Partial<Tv>) {
    if (!supabase) return;
    const channel = supabase.channel(`player-changes-${tvId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'config_update',
          payload: config
        });
        setTimeout(() => { supabase.removeChannel(channel); }, 1000);
      }
    });
  },

  async broadcastPlaylistUpdate(tvId: string) {
    if (!supabase) return;
    const channel = supabase.channel(`player-changes-${tvId}`);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'playlist_update'
        });
        setTimeout(() => { supabase.removeChannel(channel); }, 1000);
      }
    });
  },

  subscribeToUpdates(
    tvId: string,
    getPlaylistId: () => string | undefined,
    callbacks: {
      onTvUpdate: (payload?: any) => void;
      onPlaylistUpdate: () => void;
      onConfigUpdate?: (config: Partial<Tv>) => void;
    }
  ): () => void {
    if (!supabase) return () => {};

    const channel = supabase.channel(`player-changes-${tvId}`);

    // Update na TV conectada
    channel.on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'tvs', filter: `id=eq.${tvId}` },
      (payload) => {
        callbacks.onTvUpdate(payload.new);
      }
    );

    // Broadcast channel for configs
    channel.on(
      'broadcast',
      { event: 'config_update' },
      (payload) => {
        if (callbacks.onConfigUpdate && payload.payload) {
          callbacks.onConfigUpdate(payload.payload as Partial<Tv>);
        }
      }
    );

    channel.on(
      'broadcast',
      { event: 'playlist_update' },
      () => {
        callbacks.onPlaylistUpdate();
      }
    );

    // Eventos na playlist
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'playlists' },
      (payload: any) => {
        callbacks.onPlaylistUpdate();
      }
    );

    // Eventos em playlist_midias
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'playlist_midias' },
      (payload: any) => {
        callbacks.onPlaylistUpdate();
      }
    );

    // Eventos em midias
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'midias' },
      (payload: any) => {
        callbacks.onPlaylistUpdate();
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};
