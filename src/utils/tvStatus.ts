import { Tv } from '../types';

/**
 * Determines if a TV/Device is currently online.
 * A TV is considered Online if and only if:
 * 1. Its status in the database is explicitly 'Online'
 * 2. Its last heartbeat (ultimaConexao) was received within the last 30 seconds.
 */
export function isTvOnline(tv: Tv): boolean {
  if (!tv.ultimaConexao) return false;
  
  try {
    const lastConn = new Date(tv.ultimaConexao);
    const now = new Date();
    const diffSeconds = (now.getTime() - lastConn.getTime()) / 1000;
    return diffSeconds <= 30;
  } catch (err) {
    console.error('Error parsing ultimaConexao date:', err);
    return false;
  }
}
