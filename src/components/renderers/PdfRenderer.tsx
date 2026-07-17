import React from 'react';
import { RendererProps } from './types';
import OnlineRenderer from './OnlineRenderer';

export default function PdfRenderer(props: RendererProps) {
  return <OnlineRenderer {...props} />;
}
