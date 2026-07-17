import React, { useEffect, useState } from 'react';
import { RendererProps } from './types';

export default function RssRenderer({ media }: RendererProps) {
  const [news, setNews] = useState<any[]>([]);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    let feedUrl = media.url;
    let maxNews = 5;
    try {
      if (media.metadata?.feed) {
        feedUrl = media.metadata.feed;
        if (media.metadata.maxNews) maxNews = media.metadata.maxNews;
      } else if (media.url.startsWith('{')) {
        const parsed = JSON.parse(media.url);
        if (parsed.feed) feedUrl = parsed.feed;
        if (parsed.maxNews) maxNews = parsed.maxNews;
      }
    } catch(e){}

    const fetchRss = async () => {
      try {
        const response = await fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`);
        const data = await response.json();
        if (data.status === 'ok') {
          setNews(data.items.slice(0, maxNews));
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      }
    };
    
    fetchRss();
    
    // Optionally auto-rotate news
  }, [media]);

  if (error) {
    return <div className="w-full h-full flex items-center justify-center text-white bg-black">Erro ao carregar RSS.</div>;
  }

  if (news.length === 0) {
    return <div className="w-full h-full flex items-center justify-center text-white bg-black">Carregando RSS...</div>;
  }

  return (
    <div className="w-full h-full bg-[#0d0d12] flex flex-col items-center justify-center p-12 text-white overflow-hidden animate-fade-in relative">
      <div className="absolute top-8 left-8 right-8">
        <h2 className="text-xl text-blue-400 font-bold uppercase tracking-widest border-b border-white/10 pb-4">Últimas Notícias</h2>
      </div>
      <div className="space-y-6 w-full max-w-4xl mt-12">
        {news.map((item, idx) => (
          <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-6 shadow-xl flex flex-col gap-2">
            <h3 className="text-2xl font-bold line-clamp-2">{item.title}</h3>
            {item.description && <p className="text-slate-400 text-lg line-clamp-3" dangerouslySetInnerHTML={{ __html: item.description }}></p>}
            <span className="text-sm text-cyan-500 font-mono">{new Date(item.pubDate).toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
