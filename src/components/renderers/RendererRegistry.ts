import React from 'react';
import { RendererProps } from './types';
import ImageRenderer from './ImageRenderer';
import VideoRenderer from './VideoRenderer';
import WebsiteRenderer from './WebsiteRenderer';
import InstagramRenderer from './InstagramRenderer';
import YoutubeRenderer from './YoutubeRenderer';
import MapsRenderer from './MapsRenderer';
import CanvaRenderer from './CanvaRenderer';
import PdfRenderer from './PdfRenderer';
import PowerBiRenderer from './PowerBiRenderer';
import LookerStudioRenderer from './LookerStudioRenderer';
import RssRenderer from './RssRenderer';
import WeatherRenderer from './WeatherRenderer';

export const rendererRegistry: Record<string, React.FC<RendererProps>> = {
  image: ImageRenderer,
  video: VideoRenderer,
  website: WebsiteRenderer,
  instagram: InstagramRenderer,
  youtube: YoutubeRenderer,
  google_maps: MapsRenderer,
  canva: CanvaRenderer,
  pdf: PdfRenderer,
  powerbi: PowerBiRenderer,
  looker: LookerStudioRenderer,
  rss: RssRenderer,
  weather: WeatherRenderer,
};
