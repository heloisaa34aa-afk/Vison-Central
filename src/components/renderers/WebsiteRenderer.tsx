import React from 'react';
import IframeRenderer from './IframeRenderer';
import { RendererProps } from './types';

export default function WebsiteRenderer(props: RendererProps) {
  return <IframeRenderer {...props} />;
}
