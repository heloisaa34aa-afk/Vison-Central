import { Cliente, Tv, Playlist, Midia } from '../types';
import { clientesService } from '../services/supabase/clientes';
import { tvsService } from '../services/supabase/tvs';
import { playlistsService } from '../services/supabase/playlists';
import { midiasService } from '../services/supabase/midias';

export const storageService = {
  async getClientes(): Promise<Cliente[]> {
    return clientesService.getClientes();
  },
  
  async saveCliente(cliente: Cliente): Promise<boolean> {
    return clientesService.saveCliente(cliente);
  },

  async deleteCliente(id: string): Promise<boolean> {
    return clientesService.deleteCliente(id);
  },

  async getTvs(): Promise<Tv[]> {
    return tvsService.getTvs();
  },

  async saveTv(tv: Tv): Promise<boolean> {
    return tvsService.saveTv(tv);
  },

  async deleteTv(id: string): Promise<boolean> {
    return tvsService.deleteTv(id);
  },

  async getPlaylists(): Promise<Playlist[]> {
    return playlistsService.getPlaylists();
  },

  async savePlaylist(playlist: Playlist): Promise<boolean> {
    return playlistsService.savePlaylist(playlist);
  },

  async deletePlaylist(id: string): Promise<boolean> {
    return playlistsService.deletePlaylist(id);
  },

  async getMidias(): Promise<Midia[]> {
    return midiasService.getMidias();
  },

  async saveMidia(midia: Midia): Promise<boolean> {
    return midiasService.saveMidia(midia);
  },

  async deleteMidia(id: string): Promise<boolean> {
    return midiasService.deleteMidia(id);
  }
};
