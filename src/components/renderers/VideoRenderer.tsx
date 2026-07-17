import React, { useEffect, useRef } from 'react';
import { RendererProps } from './types';

export default function VideoRenderer({ media, tv, onMediaError, onVideoEnded, fitClass, aspectClass }: RendererProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && tv.volume !== undefined) {
      videoRef.current.volume = tv.volume / 100;
    }
  }, [tv.volume, media]);

  return (
    <video 
      ref={videoRef}
      src={media.url} 
      autoPlay 
      muted={tv.volume === 0}
      loop={!onVideoEnded}
      onEnded={onVideoEnded}
      onError={onMediaError}
      playsInline
      className={`w-full h-full bg-black animate-fade-in ${fitClass} ${aspectClass}`}
    />
  );
}
