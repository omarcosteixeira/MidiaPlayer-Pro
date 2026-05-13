import { memo } from "react";
import ReactPlayer from "react-player";
import { MediaItem } from "../../types";

interface MediaRendererProps {
  item: MediaItem;
  onEnded: () => void;
}

export const MediaRenderer = memo(({ item, onEnded }: MediaRendererProps) => {
  const isYoutube = item.url.includes("youtube.com") || item.url.includes("youtu.be");
  const isCanva = item.url.includes("canva.com");

  if (isYoutube) {
    return (
      <div className="w-full h-full pointer-events-none">
        <ReactPlayer
          url={item.url}
          playing={true}
          muted={true}
          width="100%"
          height="100%"
          style={{ objectFit: 'cover' }}
          onEnded={onEnded}
          config={{
            youtube: {
              playerVars: { 
                showinfo: 0, 
                controls: 0, 
                autohide: 1,
                modestbranding: 1,
                rel: 0
              }
            }
          }}
        />
      </div>
    );
  }

  if (isCanva) {
    let embedUrl = item.url;
    if (!embedUrl.includes("embed") && embedUrl.includes("/watch")) {
       embedUrl += "?embed";
    } else if (!embedUrl.includes("embed") && embedUrl.includes("/view")) {
       embedUrl += "?embed";
    }

    return (
      <iframe
        src={embedUrl}
        className="w-full h-full border-none pointer-events-none"
        allowFullScreen
        allow="autoplay; fullscreen"
      />
    );
  }

  if (item.type === "image") {
    return (
      <img 
        src={item.url} 
        alt={item.title}
        className="w-full h-full object-cover"
      />
    );
  }

  // Standard video
  return (
    <video
      src={item.url}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover"
      onEnded={onEnded}
    />
  );
});

export default MediaRenderer;
