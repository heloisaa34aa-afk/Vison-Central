import { Tv, Midia } from '../../types';

export interface RendererProps {
  media: Midia;
  tv: Tv;
  onMediaError?: () => void;
  onVideoEnded?: () => void;
  isWebPlayer?: boolean;
  fitClass?: string;
  aspectClass?: string;
}
