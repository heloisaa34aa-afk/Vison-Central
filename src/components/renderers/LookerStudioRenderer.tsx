import React from 'react';
import IframeRenderer from './IframeRenderer';
import { RendererProps } from './types';

export default function LookerStudioRenderer(props: RendererProps) {
  return <IframeRenderer {...props} />;
}
