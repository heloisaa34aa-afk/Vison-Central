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
  orientacao?: 'Horizontal' | 'Vertical';
  modo_exibicao?: string;
  proporcao?: string;
  brilho?: number;
  contraste?: number;
  saturacao?: number;
  zoom?: number;
  volume?: number;
  tempo_transicao?: number;
  rotacao?: number;

  // Novos recursos
  conteudos_online?: { id: string, nome: string, url: string, active: boolean }[];
  
  texto_superior?: string;
  texto_superior_cor?: string;
  texto_superior_tamanho?: string;
  texto_superior_alinhamento?: 'left' | 'center' | 'right';
  texto_superior_visivel?: boolean;

  texto_inferior?: string;
  texto_inferior_cor?: string;
  texto_inferior_tamanho?: string;
  texto_inferior_alinhamento?: 'left' | 'center' | 'right';
  texto_inferior_visivel?: boolean;
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
