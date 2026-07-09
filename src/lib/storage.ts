import { Client, Device, Playlist, Media } from '../types';
import { clientesService } from '../services/supabase/clientes';
import { tvsService } from '../services/supabase/tvs';
import { playlistsService } from '../services/supabase/playlists';
import { midiasService } from '../services/supabase/midias';
import { checkSupabaseConnection } from './supabase';

export const storageService = {
  async ensureDatabaseSeeded(fallbackClients: Client[], fallbackPlaylists: Playlist[], fallbackMedia: Media[], fallbackDevices: Device[]) {
    if (await checkSupabaseConnection()) {
      try {
        const existingClients = await clientesService.getClients([]);
        if (existingClients.length === 0) {
          console.log('Seeding initial clients to Supabase...');
          for (const client of fallbackClients) {
            await clientesService.saveClient(client);
          }
        }
        
        const existingPlaylists = await playlistsService.getPlaylists([]);
        if (existingPlaylists.length === 0) {
          console.log('Seeding initial playlists to Supabase...');
          for (const pl of fallbackPlaylists) {
            await playlistsService.savePlaylist(pl);
          }
        }

        const existingMedia = await midiasService.getMedia([]);
        if (existingMedia.length === 0) {
          console.log('Seeding initial media to Supabase...');
          for (const m of fallbackMedia) {
            await midiasService.saveMedia(m);
          }
        }

        const existingDevices = await tvsService.getDevices([]);
        if (existingDevices.length === 0) {
          console.log('Seeding initial devices to Supabase...');
          for (const dev of fallbackDevices) {
            await tvsService.saveDevice(dev);
          }
        } else {
          // Verify that d-1 and d-2 are seeded specifically
          const hasD1 = existingDevices.some(d => d.id === 'd-1' || d.token === 'VC-A8F3-91');
          const hasD2 = existingDevices.some(d => d.id === 'd-2' || d.token === 'VC-B7L9-52');
          if (!hasD1) {
            const d1 = fallbackDevices.find(d => d.id === 'd-1');
            if (d1) await tvsService.saveDevice(d1);
          }
          if (!hasD2) {
            const d2 = fallbackDevices.find(d => d.id === 'd-2');
            if (d2) await tvsService.saveDevice(d2);
          }
        }
      } catch (err) {
        console.warn('Erro durante seed automático do Supabase:', err);
      }
    }
  },

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
