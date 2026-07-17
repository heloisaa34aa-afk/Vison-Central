import React from 'react';
import { RendererProps } from './types';

export default function WeatherRenderer({ media }: RendererProps) {
  let city = 'São Paulo';
  try {
    if (media.metadata?.city) {
      city = media.metadata.city;
    } else if (media.url.startsWith('{')) {
      const parsed = JSON.parse(media.url);
      if (parsed.city) city = parsed.city;
    }
  } catch(e){}

  // Using a free embeddable widget or a simple custom UI
  // The simplest is to use an iframe to a weather service, e.g. wttr.in or similar.
  // Actually, we can just render a nice UI if we wanted, but an iframe is easiest without an API key.
  const url = `https://wttr.in/${encodeURIComponent(city)}?0&m&T`;
  
  return (
    <div className="w-full h-full bg-[#0d0d12] flex items-center justify-center p-8">
      <iframe 
        src={url} 
        className="w-full h-full border-none animate-fade-in invert hue-rotate-180" // Invert colors to match dark mode somewhat
        title={media.nome}
      />
    </div>
  );
}
