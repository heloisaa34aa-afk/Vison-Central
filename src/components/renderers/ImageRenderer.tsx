import React from 'react';
import { RendererProps } from './types';

export default function ImageRenderer({ media, onMediaError, fitClass, aspectClass }: RendererProps) {
  return (
    <img 
      src={media.url} 
      alt={media.nome} 
      onError={onMediaError}
      className={`w-full h-full bg-black animate-fade-in ${fitClass} ${aspectClass}`}
      referrerPolicy="no-referrer"
    />
  );
}
