import { Tv } from '../types';

/**
 * Uma TV é considerada Online somente quando:
 * 1. status === 'Online'
 * 2. ultimaConexao foi atualizada há menos de 7 minutos.
 * O APK envia presença a cada 2 minutos; a margem evita oscilações por rede lenta.
 */
export function isTvOnline(tv: Tv): boolean {
  if (!tv) return false;

  // Primeiro verifica o status vindo do Supabase
  if (tv.status !== 'Online') {
    return false;
  }

  // Depois verifica se existe data
  if (!tv.ultimaConexao) {
    return false;
  }

  try {
    const normalized = tv.ultimaConexao.trim()
      .replace(' ', 'T')
      .replace(/(\.\d{3})\d+/, '$1')
      .replace(/([+-]\d{2})$/, '$1:00');
    const ultima = Date.parse(normalized);

    if (isNaN(ultima)) {
      return false;
    }

    const agora = Date.now();
    const diff = (agora - ultima) / 1000;

    return diff <= 420;
  } catch (e) {
    console.error('Erro ao verificar status da TV:', e);
    return false;
  }
}
