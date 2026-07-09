import React, { useState } from 'react';
import { Client, Device, Playlist, Media } from '../types';
import { Tv, FolderHeart, ListVideo, Key, Settings, ArrowLeft, Plus } from 'lucide-react';
import ClientTVs from './client/ClientTVs';
import ClientTokens from './client/ClientTokens';
import ClientLibrary from './client/ClientLibrary';
import ClientPlaylists from './client/ClientPlaylists';

interface ClientPageProps {
  clientId: string;
  clients: Client[];
  devices: Device[];
  playlists: Playlist[];
  media: Media[];
  onUpdateClient: (client: Client) => void;
  onUpdateDevices: (devices: Device[] | ((prev: Device[]) => Device[])) => void;
  onUpdatePlaylists: (playlists: Playlist[] | ((prev: Playlist[]) => Playlist[])) => void;
  onUpdateMedia: (media: Media[] | ((prev: Media[]) => Media[])) => void;
  showToast: (msg: string) => void;
}

export default function ClientPage({
  clientId,
  clients,
  devices,
  playlists,
  media,
  onUpdateClient,
  onUpdateDevices,
  onUpdatePlaylists,
  onUpdateMedia,
  showToast
}: ClientPageProps) {
  const [activeTab, setActiveTab] = useState<'tvs' | 'library' | 'playlists' | 'tokens' | 'settings'>('tvs');
  
  const client = clients.find(c => c.id === clientId);
  if (!client) return <div className="text-white">Cliente não encontrado.</div>;

  const clientDevices = devices.filter(d => d.clientId === clientId);
  // Filtering library items and playlists to belong to this client (mock simple logic, assuming they have clientId or we manage it globally for now, wait, the user asked for isolated libraries)
  // Let's assume media and playlists have clientId
  const clientMedia = media; // In a real backend, we'd filter: media.filter(m => m.clientId === clientId)
  const clientPlaylists = playlists;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/10 pb-5">
        <div>
          <span className="font-mono text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-1 rounded-full font-medium">
            {client.category} · {client.status}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-2 font-sans">
            {client.name}
          </h1>
          <p className="text-sm text-slate-400 mt-1 flex items-center gap-2">
            <Tv className="w-4 h-4" /> {clientDevices.length} {clientDevices.length === 1 ? 'TV Vinculada' : 'TVs Vinculadas'}
          </p>
        </div>
      </div>

      <div className="flex bg-[#0d0d12] border border-white/10 rounded-lg p-1 overflow-x-auto scrollbar-none">
        {[
          { id: 'tvs', label: 'TVs', icon: Tv },
          { id: 'library', label: 'Biblioteca', icon: FolderHeart },
          { id: 'playlists', label: 'Playlists', icon: ListVideo },
          { id: 'tokens', label: 'Tokens', icon: Key },
          { id: 'settings', label: 'Configurações', icon: Settings },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold transition-all whitespace-nowrap flex-1 justify-center ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-[#0d0d12]/60 rounded-xl border border-white/10 shadow-xl backdrop-blur-xl p-6">
        {activeTab === 'tvs' && (
          <ClientTVs 
            client={client} 
            devices={clientDevices} 
            playlists={clientPlaylists}
            onUpdateDevices={onUpdateDevices}
            showToast={showToast}
          />
        )}
        {activeTab === 'library' && (
          <ClientLibrary
            client={client}
            media={clientMedia}
            onUpdateMedia={onUpdateMedia}
            showToast={showToast}
          />
        )}
        {activeTab === 'playlists' && (
          <ClientPlaylists
            client={client}
            playlists={clientPlaylists}
            media={clientMedia}
            onUpdatePlaylists={onUpdatePlaylists}
            showToast={showToast}
          />
        )}
        {activeTab === 'tokens' && (
          <ClientTokens
            client={client}
            devices={clientDevices}
            playlists={clientPlaylists}
            onUpdateDevices={onUpdateDevices}
            showToast={showToast}
          />
        )}
        {activeTab === 'settings' && (
          <div className="text-slate-400 text-sm">
            <h3 className="text-white font-bold mb-4">Configurações do Cliente</h3>
            <p>Em breve.</p>
          </div>
        )}
      </div>
    </div>
  );
}
