import React, { useEffect, useRef } from 'react';
import { Tv, Midia } from '../types';

interface MediaRendererProps {
  tv: Tv;
  media?: Midia;
  onlineContent?: { id: string, nome: string, url: string, active: boolean };
  onMediaError?: () => void;
  onVideoEnded?: () => void;
  isWebPlayer?: boolean; // If true, it means it's running as Player.tsx (fullscreen). If false, it's inside the Simulator bezel.
}

export default function MediaRenderer({ 
  tv, 
  media, 
  onlineContent, 
  onMediaError, 
  onVideoEnded,
  isWebPlayer = false
}: MediaRendererProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && tv.volume !== undefined) {
      videoRef.current.volume = tv.volume / 100;
    }
  }, [tv.volume, media]);

  const proporcao = tv.proporcao || 'contain';
  const brilho = tv.brilho !== undefined ? tv.brilho : 100;
  const contraste = tv.contraste !== undefined ? tv.contraste : 100;
  const saturacao = tv.saturacao !== undefined ? tv.saturacao : 100;
  const zoom = tv.zoom !== undefined ? tv.zoom : 100;
  const rotacao = tv.rotacao !== undefined ? tv.rotacao : 0;
  const isVertical = tv.orientacao === 'vertical';

  const isRotated = rotacao === 90 || rotacao === 270;

  let fitClass = 'object-contain';
  let aspectClass = '';
  
  if (proporcao === 'cover') {
    fitClass = 'object-cover';
  } else if (proporcao === 'contain') {
    fitClass = 'object-contain';
  } else if (proporcao === '16:9') {
    fitClass = 'object-contain';
    aspectClass = 'aspect-video';
  } else if (proporcao === '4:3') {
    fitClass = 'object-contain';
    aspectClass = 'aspect-[4/3]';
  } else if (proporcao === 'fill' || proporcao === 'stretch') {
    fitClass = 'object-fill';
  }

  // To simulate Android rotation perfectly:
  // We use container queries. The parent must have `container-type: size`.
  const containerStyle: React.CSSProperties = {
    width: isRotated ? '100cqh' : '100cqw',
    height: isRotated ? '100cqw' : '100cqh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(-50%, -50%) rotate(${rotacao}deg) scale(${zoom / 100})`,
    transition: 'transform 0.3s ease',
  };

  const mediaStyle: React.CSSProperties = {
    filter: `brightness(${brilho}%) contrast(${contraste}%) saturate(${saturacao}%)`,
    width: '100%',
    height: '100%',
  };

  // If we are in the web fullscreen player and the OS didn't rotate the screen,
  // we might want to force a vertical aspect ratio. 
  // In the simulator, the bezel itself changes size, so we just fill the bezel.
  let wrapperClass = "w-full h-full flex items-center justify-center";
  if (isWebPlayer && isVertical) {
    const verticalMaxWidth = isRotated ? 'max-w-[100vw]' : 'max-w-[100vh]';
    wrapperClass = `${wrapperClass} ${verticalMaxWidth} aspect-[9/16]`;
  }

  if (onlineContent) {
    let embedUrl = onlineContent.url;
    if (embedUrl.includes('instagram.com')) {
      const match = embedUrl.match(/\/p\/([^\/?#&]+)/) || embedUrl.match(/\/reel\/([^\/?#&]+)/) || embedUrl.match(/\/reels\/([^\/?#&]+)/) || embedUrl.match(/\/stories\/[^\/]+\/([^\/?#&]+)/);
      if (match && match[1]) embedUrl = `https://www.instagram.com/p/${match[1]}/embed/captioned`;
    } else if (embedUrl.includes('youtube.com/watch')) {
      const match = embedUrl.match(/v=([^&]+)/);
      if (match && match[1]) embedUrl = `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1`;
    } else if (embedUrl.includes('youtu.be/')) {
      const match = embedUrl.match(/youtu\.be\/([^?]+)/);
      if (match && match[1]) embedUrl = `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1`;
    }
    
    return (
      <div style={containerStyle}>
        <div className={wrapperClass} style={mediaStyle}>
           <iframe 
            src={embedUrl} 
            className={`w-full h-full border-none bg-white ${aspectClass}`} 
            title={onlineContent.nome} 
          />
        </div>
      </div>
    );
  }

  if (!media) return null;

  return (
    <div style={containerStyle}>
       <div className={wrapperClass} style={mediaStyle}>
          {media.tipo === 'image' ? (
            <img 
              src={media.url} 
              alt={media.nome} 
              onError={onMediaError}
              className={`w-full h-full bg-black animate-fade-in ${fitClass} ${aspectClass}`}
              referrerPolicy="no-referrer"
            />
          ) : (
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
          )}
       </div>
    </div>
  );
}
