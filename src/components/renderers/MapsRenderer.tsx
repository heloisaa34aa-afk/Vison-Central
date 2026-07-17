import React from 'react';
import IframeRenderer from './IframeRenderer';
import { RendererProps } from './types';

export default function MapsRenderer(props: RendererProps) {
  return <IframeRenderer {...props} />;
}
