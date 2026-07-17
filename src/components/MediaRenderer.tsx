import React from 'react';
import { Tv, Midia } from '../types';
import { rendererRegistry } from './renderers/RendererRegistry';
import OnlineRenderer from './renderers/OnlineRenderer';

interface MediaRendererProps {
  tv: Tv;
  media?: Midia;
  onlineContent?: { id: string, nome: string, url: string, active: boolean };
  onMediaError?: () => void;
  onVideoEnded?: () => void;
  isWebPlayer?: boolean;
}

export default function MediaRenderer({ 
  tv, 
  media, 
  onlineContent, 
  onMediaError, 
  onVideoEnded,
  isWebPlayer = false
}: MediaRendererProps) {
  
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

  let wrapperClass = "w-full h-full flex items-center justify-center";
  if (isWebPlayer && isVertical) {
    const verticalMaxWidth = isRotated ? 'max-w-[100vw]' : 'max-w-[100vh]';
    wrapperClass = `${wrapperClass} ${verticalMaxWidth} aspect-[9/16]`;
  }

  const renderContent = () => {
    if (onlineContent) {
       const dummyMedia: Midia = {
         id: onlineContent.id,
         nome: onlineContent.nome,
         url: onlineContent.url,
         tipo: 'website',
         duracao: 10
       };
       return <OnlineRenderer media={dummyMedia} tv={tv} aspectClass={aspectClass} fitClass={fitClass} onMediaError={onMediaError} onVideoEnded={onVideoEnded} isWebPlayer={isWebPlayer} />;
    }

    if (!media) return null;

    const Renderer = rendererRegistry[media.tipo] || OnlineRenderer;
    
    return <Renderer 
      media={media} 
      tv={tv} 
      aspectClass={aspectClass} 
      fitClass={fitClass} 
      onMediaError={onMediaError} 
      onVideoEnded={onVideoEnded} 
      isWebPlayer={isWebPlayer} 
    />;
  };

  return (
    <div style={containerStyle}>
       <div className={wrapperClass} style={mediaStyle}>
          {renderContent()}
       </div>
    </div>
  );
}
