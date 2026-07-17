import React from 'react';
import IframeRenderer from './IframeRenderer';
import { RendererProps } from './types';

export default function PowerBiRenderer(props: RendererProps) {
  return <IframeRenderer {...props} />;
}
