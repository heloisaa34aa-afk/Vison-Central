const fs = require('fs');
let code = fs.readFileSync('src/components/MediaRenderer.tsx', 'utf8');

// I need to add handling for online media types in the `if (media) return (...)` section.
// But first, let's look at `MediaRenderer.tsx`.
const targetRender = `          {media.tipo === 'image' ? (
            <img 
              src={media.url} 
              alt={media.nome} 
              onError={onMediaError}
              className={\`w-full h-full bg-black animate-fade-in \${fitClass} \${aspectClass}\`}
              referrerPolicy="no-referrer"
            />
          ) : (
            <video 
              ref={videoRef}
              src={media.url} 
              autoPlay 
              muted={tv.volume === 0}
              loop={!onVideoEnded}
              onEnded={onVideoEnded}
              onError={onMediaError}
              playsInline
              className={\`w-full h-full bg-black animate-fade-in \${fitClass} \${aspectClass}\`}
            />
          )}`;

const embedUrlLogic = `
          {(() => {
            if (media.tipo === 'image') {
              return (
                <img 
                  src={media.url} 
                  alt={media.nome} 
                  onError={onMediaError}
                  className={\`w-full h-full bg-black animate-fade-in \${fitClass} \${aspectClass}\`}
                  referrerPolicy="no-referrer"
                />
              );
            }
            if (media.tipo === 'video') {
              return (
                <video 
                  ref={videoRef}
                  src={media.url} 
                  autoPlay 
                  muted={tv.volume === 0}
                  loop={!onVideoEnded}
                  onEnded={onVideoEnded}
                  onError={onMediaError}
                  playsInline
                  className={\`w-full h-full bg-black animate-fade-in \${fitClass} \${aspectClass}\`}
                />
              );
            }
            // Online types
            let embedUrl = media.url;
            if (media.tipo === 'instagram' || embedUrl.includes('instagram.com')) {
              const match = embedUrl.match(/\\/p\\/([^\\/?#&]+)/) || embedUrl.match(/\\/reel\\/([^\\/?#&]+)/) || embedUrl.match(/\\/reels\\/([^\\/?#&]+)/) || embedUrl.match(/\\/stories\\/[^\\/]+\\/([^\\/?#&]+)/);
              if (match && match[1]) embedUrl = \`https://www.instagram.com/p/\${match[1]}/embed/captioned\`;
            } else if (media.tipo === 'youtube' || embedUrl.includes('youtube.com/watch')) {
              const match = embedUrl.match(/v=([^&]+)/);
              if (match && match[1]) embedUrl = \`https://www.youtube.com/embed/\${match[1]}?autoplay=1&mute=1\`;
            } else if (media.tipo === 'youtube' || embedUrl.includes('youtu.be/')) {
              const match = embedUrl.match(/youtu\\.be\\/([^?]+)/);
              if (match && match[1]) embedUrl = \`https://www.youtube.com/embed/\${match[1]}?autoplay=1&mute=1\`;
            }
            
            // To emulate video ended behavior for iframes, we will just rely on the Player timeout since it uses duracao.
            // But we should invoke onVideoEnded if there's any need. Wait, Player handles duration for both images and videos if it's set.
            // No, wait, for videos, it waits for the video to end. Player uses \`onVideoEnded\`.
            // For images and online content, Player should use a timeout.
            // Let's ensure Player sets a timeout for 'website', 'youtube', 'instagram', 'google_maps', 'canva'.
            
            return (
              <iframe 
                src={embedUrl} 
                className={\`w-full h-full border-none bg-white animate-fade-in \${aspectClass}\`} 
                title={media.nome}
              />
            );
          })()}
`;

code = code.replace(targetRender, embedUrlLogic);
fs.writeFileSync('src/components/MediaRenderer.tsx', code);
