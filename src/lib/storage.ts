import { supabase, checkSupabaseConnection } from './supabase';
import { Client, Device, Playlist, Media } from '../types';
import type { Database } from './database.types';

export const storageService = {
  async getClients(fallback: Client[]): Promise<Client[]> {
    if (await checkSupabaseConnection()) {
      const { data, error } = await supabase.from('clients').select('*');
      if (!error && data) return data as unknown as Client[];
    }
    return fallback;
  },
  
  async saveClients(clients: Client[]) {
    if (await checkSupabaseConnection() && clients.length > 0) {
      await supabase.from('clients').upsert(clients as any);
    }
  },

  async getDevices(fallback: Device[]): Promise<Device[]> {
    if (await checkSupabaseConnection()) {
      const { data, error } = await supabase.from('devices').select('*');
      if (!error && data) return data as unknown as Device[];
    }
    return fallback;
  },

  async saveDevices(devices: Device[]) {
    if (await checkSupabaseConnection() && devices.length > 0) {
      await supabase.from('devices').upsert(devices as any);
    }
  },

  async getPlaylists(fallback: Playlist[]): Promise<Playlist[]> {
    if (await checkSupabaseConnection()) {
      const { data, error } = await supabase.from('playlists').select('*');
      if (!error && data) return data as unknown as Playlist[];
    }
    return fallback;
  },

  async savePlaylists(playlists: Playlist[]) {
    if (await checkSupabaseConnection() && playlists.length > 0) {
      await supabase.from('playlists').upsert(playlists as any);
    }
  },

  async getMedia(fallback: Media[]): Promise<Media[]> {
    if (await checkSupabaseConnection()) {
      const { data, error } = await supabase.from('media').select('*');
      if (!error && data) return data as unknown as Media[];
    }
    return fallback;
  },

  async saveMedia(media: Media[]) {
    if (await checkSupabaseConnection() && media.length > 0) {
      await supabase.from('media').upsert(media as any);
    }
  }
};
