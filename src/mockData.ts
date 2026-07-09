import { Media, Playlist, Client, Device, AlertLog } from './types';

export const initialMedia: Media[] = [
  {
    id: 'm-1',
    name: 'Comunicado Alpha - Bem-Vindo',
    url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    duration: 10,
  },
  {
    id: 'm-2',
    name: 'Ofertas Alpha - Varejo',
    url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    duration: 15,
  },
  {
    id: 'm-3',
    name: 'Menu Especial Beta - Prato do Dia',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    duration: 12,
  },
  {
    id: 'm-4',
    name: 'Sobremesas Beta - Promoção',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    type: 'image',
    duration: 8,
  }
];

export const initialPlaylists: Playlist[] = [
  {
    id: 'p-alpha',
    name: 'Playlist Empresa Alpha',
    mediaIds: ['m-1', 'm-2'],
  },
  {
    id: 'p-beta',
    name: 'Playlist Empresa Beta',
    mediaIds: ['m-3', 'm-4'],
  }
];

export const initialClients: Client[] = [
  {
    id: 'c-1',
    name: 'Empresa Alpha',
    category: 'Varejo',
    status: 'Ativo',
    screensCount: 1,
    city: 'São Paulo',
    neighborhood: 'Bela Vista',
    iconType: 'store',
    orientation: 'Horizontal',
    timezone: 'America/Sao_Paulo',
    playlistId: 'p-alpha',
    tickerText: 'Bem-vindo à Empresa Alpha! Confira nossas ofertas exclusivas do dia.',
  },
  {
    id: 'c-2',
    name: 'Empresa Beta',
    category: 'Restaurante',
    status: 'Ativo',
    screensCount: 1,
    city: 'Campinas',
    neighborhood: 'Cambuí',
    iconType: 'store',
    orientation: 'Horizontal',
    timezone: 'America/Sao_Paulo',
    playlistId: 'p-beta',
    tickerText: 'Bem-vindo à Empresa Beta! Bom apetite e aproveite nossas promoções.',
  }
];

export const initialDevices: Device[] = [
  {
    id: 'd-1',
    clientId: 'c-1',
    name: 'TV Recepção',
    status: 'Online',
    uptime: '24h 0m',
    token: 'VC-A8F3-91',
    lastSync: '09/07/2026 11:15',
  },
  {
    id: 'd-2',
    clientId: 'c-2',
    name: 'TV Caixa',
    status: 'Online',
    uptime: '24h 0m',
    token: 'VC-B7L9-52',
    lastSync: '09/07/2026 11:15',
  }
];

export const initialAlerts: AlertLog[] = [];
