import React from 'react';
import { RendererProps } from './types';
import ImageRenderer from './ImageRenderer';
import VideoRenderer from './VideoRenderer';
import PdfRenderer from './PdfRenderer';
import OnlineRenderer from './OnlineRenderer';

export const rendererRegistry: Record<string, React.FC<RendererProps>> = {
  image: ImageRenderer,
  video: VideoRenderer,
  pdf: PdfRenderer,
  website: OnlineRenderer,
  instagram: OnlineRenderer,
};
