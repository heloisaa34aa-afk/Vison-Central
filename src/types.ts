export interface Media {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video';
  duration: number; // seconds
  size?: string;
}

export interface Playlist {
  id: string;
  name: string;
  mediaIds: string[];
}

export interface Device {
  id: string;
  clientId: string;
  name: string;
  status: 'Online' | 'Offline' | 'Warning';
  uptime: string;
  token: string;
  lastSync: string;
  playlistId?: string;
  lastConnected?: string;
}

export interface Client {
  id: string;
  name: string;
  category: string;
  status: 'Ativo' | 'Inativo' | 'Sincronizando';
  screensCount: number;
  city: string;
  neighborhood: string;
  iconType: 'store' | 'dumbbell' | 'hospital' | 'shopping' | 'briefcase';
  orientation: 'Vertical' | 'Horizontal';
  timezone: string;
  playlistId?: string;
  tickerText?: string;
}

export interface AlertLog {
  id: string;
  clientId: string;
  clientName: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  timestamp: string;
}
