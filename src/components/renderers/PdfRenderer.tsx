import React from 'react';
import IframeRenderer from './IframeRenderer';
import { RendererProps } from './types';

export default function PdfRenderer(props: RendererProps) {
  return <IframeRenderer {...props} />;
}
