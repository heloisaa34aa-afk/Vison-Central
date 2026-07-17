import React from 'react';
import { RendererProps } from './types';

export default function InstagramRenderer({ media, aspectClass }: RendererProps) {
  let url = media.url;
  try {
    if (media.metadata?.url) {
      url = media.metadata.url;
    } else if (url.startsWith('{')) {
      const parsed = JSON.parse(url);
      if (parsed.url) url = parsed.url;
    }
  } catch(e){}
  
  const match = url.match(/\/p\/([^\/?#&]+)/) || url.match(/\/reel\/([^\/?#&]+)/) || url.match(/\/reels\/([^\/?#&]+)/) || url.match(/\/stories\/[^\/]+\/([^\/?#&]+)/);
  if (match && match[1]) {
    url = `https://www.instagram.com/p/${match[1]}/embed/captioned`;
  }

  return (
    <iframe 
      src={url} 
      className={`w-full h-full border-none bg-white animate-fade-in ${aspectClass}`}
      title={media.nome}
    />
  );
}
