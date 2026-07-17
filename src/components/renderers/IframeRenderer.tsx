import React from 'react';
import { RendererProps } from './types';

export default function IframeRenderer({ media, aspectClass }: RendererProps) {
  let url = media.url;
  
  // Try to parse metadata if it exists and is a JSON string
  try {
    if (media.metadata?.url) {
      url = media.metadata.url;
    } else if (media.url.startsWith('{')) {
      const parsed = JSON.parse(media.url);
      if (parsed.url) url = parsed.url;
    }
  } catch (e) {}

  return (
    <iframe 
      src={url} 
      className={`w-full h-full border-none bg-white animate-fade-in ${aspectClass}`}
      title={media.nome}
      allow="autoplay; encrypted-media"
    />
  );
}
