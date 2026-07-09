import { Client, Device, Playlist, Media } from '../types';
import { clientesService } from '../services/supabase/clientes';
import { tvsService } from '../services/supabase/tvs';
import { playlistsService } from '../services/supabase/playlists';
import { midiasService } from '../services/supabase/midias';
import { checkSupabaseConnection } from './supabase';

export const storageService = {
  async getClients(fallback: Client[]): Promise<Client[]> {
    if (await checkSupabaseConnection()) {
      return clientesService.getClients(fallback);
    }
    return fallback;
  },
  
  async saveClients(clients: Client[]) {
    if (await checkSupabaseConnection() && clients.length > 0) {
      for (const client of clients) {
        await clientesService.saveClient(client);
      }
    }
  },

  async getDevices(fallback: Device[]): Promise<Device[]> {
    if (await checkSupabaseConnection()) {
      return tvsService.getDevices(fallback);
    }
    return fallback;
  },

  async saveDevices(devices: Device[]) {
    if (await checkSupabaseConnection() && devices.length > 0) {
      for (const dev of devices) {
        await tvsService.saveDevice(dev);
      }
    }
  },

  async getPlaylists(fallback: Playlist[]): Promise<Playlist[]> {
    if (await checkSupabaseConnection()) {
      return playlistsService.getPlaylists(fallback);
    }
    return fallback;
  },

  async savePlaylists(playlists: Playlist[]) {
    if (await checkSupabaseConnection() && playlists.length > 0) {
      for (const pl of playlists) {
        await playlistsService.savePlaylist(pl);
      }
    }
  },

  async getMedia(fallback: Media[]): Promise<Media[]> {
    if (await checkSupabaseConnection()) {
      return midiasService.getMedia(fallback);
    }
    return fallback;
  },

  async saveMedia(media: Media[]) {
    if (await checkSupabaseConnection() && media.length > 0) {
      for (const m of media) {
        await midiasService.saveMedia(m);
      }
    }
  }
};
