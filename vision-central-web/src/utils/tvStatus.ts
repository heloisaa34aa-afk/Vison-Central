import { Tv } from '../types';

/**
 * Uma TV é considerada Online somente quando:
 * 1. status === 'Online'
 * 2. ultimaConexao foi atualizada há menos de 30 segundos.
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
    const ultima = new Date(tv.ultimaConexao).getTime();

    if (isNaN(ultima)) {
      return false;
    }

    const agora = Date.now();
    const diff = (agora - ultima) / 1000;

    return diff <= 30;
  } catch (e) {
    console.error('Erro ao verificar status da TV:', e);
    return false;
  }
}