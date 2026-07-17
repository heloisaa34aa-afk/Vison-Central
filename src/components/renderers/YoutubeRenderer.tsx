import React from 'react';
import { RendererProps } from './types';

export default function YoutubeRenderer({ media, aspectClass }: RendererProps) {
  let url = media.url;
  try {
    if (media.metadata?.url) {
      url = media.metadata.url;
    } else if (url.startsWith('{')) {
      const parsed = JSON.parse(url);
      if (parsed.url) url = parsed.url;
    }
  } catch(e){}
  
  const vMatch = url.match(/v=([^&]+)/);
  const youtuMatch = url.match(/youtu\.be\/([^?]+)/);
  
  if (vMatch && vMatch[1]) {
    url = `https://www.youtube.com/embed/${vMatch[1]}?autoplay=1&mute=1`;
  } else if (youtuMatch && youtuMatch[1]) {
    url = `https://www.youtube.com/embed/${youtuMatch[1]}?autoplay=1&mute=1`;
  } else if (!url.includes('embed')) {
     // fallback if it's already some youtube url
     url += url.includes('?') ? '&autoplay=1&mute=1' : '?autoplay=1&mute=1';
  }

  return (
    <iframe 
      src={url} 
      className={`w-full h-full border-none bg-white animate-fade-in ${aspectClass}`}
      title={media.nome}
      allow="autoplay; encrypted-media"
    />
  );
}
