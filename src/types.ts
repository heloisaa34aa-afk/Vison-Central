export interface Midia {
  id: string;
  nome: string;
  url: string;
  tipo: 'image' | 'video';
  duracao: number; // segundos
  tamanho?: string;
  clienteId?: string;
}

export interface Playlist {
  id: string;
  nome: string;
  midiasIds: string[];
  midiasDurations?: number[];
  clienteId?: string;
}

export interface Tv {
  id: string;
  clienteId: string;
  nome: string;
  status: 'Online' | 'Offline' | 'Warning';
  uptime: string;
  token: string;
  ultimaSincronizacao: string;
  playlistId?: string;
  ultimaConexao?: string;
  resolucao?: string;
  orientacao?: 'Horizontal' | 'Vertical';
  modoReproducao?: string;
  proporcao?: string;
  brilho?: number;
  contraste?: number;
  zoom?: number;
  volume?: number;
  tempoTransicao?: number;
  versaoConfiguracao?: number;
  ultimaAtualizacao?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  categoria: string;
  status: 'Ativo' | 'Inativo' | 'Sincronizando';
  quantidadeTelas: number;
  cidade: string;
  bairro: string;
  tipoIcone: 'store' | 'dumbbell' | 'hospital' | 'shopping' | 'briefcase';
  orientacao: 'Vertical' | 'Horizontal';
  fusoHorario: string;
  playlistId?: string;
  textoTicker?: string;
}

export interface LogAlerta {
  id: string;
  tvId: string;
  mensagem: string;
  tipo: 'info' | 'warning' | 'error';
  criadoEm: string;
}
