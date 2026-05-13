import { memo } from "react";
import ReactPlayer from "react-player";
import { MediaItem } from "../../types";

const Player = ReactPlayer as any;

interface MediaRendererProps {
  item: MediaItem;
  onEnded: () => void;
}

export const MediaRenderer = memo(({ item, onEnded }: MediaRendererProps) => {
  const urlString = (item.url || "").trim();
  const lowerUrlString = urlString.toLowerCase();
  const isYoutube = lowerUrlString.includes("youtube.com") || lowerUrlString.includes("youtu.be");
  const isCanva = lowerUrlString.includes("canva.com");
  const isGoogleDrive = lowerUrlString.includes("drive.google.com");

  if (isYoutube) {
    return (
      <div className="w-full h-full relative bg-black" style={{ zIndex: 0 }}>
        <Player
          url={item.url}
          playing={true}
          muted={true}
          width="100%"
          height="100%"
          style={{ position: "absolute", top: 0, left: 0 }}
          onEnded={onEnded}
          onError={(e) => {
            console.error("Youtube Playback Error:", e);
            setTimeout(onEnded, 5000);
          }}
          config={{
            youtube: {
              playerVars: { 
                controls: 0 as any, 
                modestbranding: 1,
                rel: 0,
                autoplay: 1,
                mute: 1,
                origin: window.location.origin
              }
            } as any
          }}
        />
        {/* Transparent overlay to disable interaction without pointer-events-none which might break iframe APIs */}
        <div className="absolute inset-0 z-10" />
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
    
    // Make sure autoplay is included for canva
    if (!embedUrl.includes("autoplay")) {
      embedUrl += embedUrl.includes("?") ? "&autoplay=1" : "?autoplay=1";
    }

    return (
      <div className="w-full h-full relative" style={{ zIndex: 0 }}>
        <iframe
          src={embedUrl}
          className="w-full h-full border-none"
          allowFullScreen
          allow="autoplay; fullscreen"
        />
        <div className="absolute inset-0 z-10" />
      </div>
    );
  }

  if (isGoogleDrive) {
    let driveId = null;
    const match = item.url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      driveId = match[1];
    } else {
      const idMatch = item.url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch && idMatch[1]) {
        driveId = idMatch[1];
      }
    }

    if (driveId) {
      if (item.type === "image") {
        return (
          <img 
            src={`https://drive.google.com/uc?export=view&id=${driveId}`} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
        );
      } else {
        return (
          <div className="w-full h-full relative" style={{ zIndex: 0 }}>
            <iframe
              src={`https://drive.google.com/file/d/${driveId}/preview?autoplay=1`}
              className="w-full h-full border-none"
              allowFullScreen
              allow="autoplay; fullscreen"
            />
            {/* Transparent overlay to disable interaction */}
            <div className="absolute inset-0 z-10" />
          </div>
        );
      }
    }
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
      src={item.url.trim()}
      autoPlay
      muted
      playsInline
      className="w-full h-full object-cover"
      onEnded={onEnded}
      onError={(e) => {
        console.error("Native Video Playback Error:", e);
        setTimeout(onEnded, 5000);
      }}
    />
  );
});

export default MediaRenderer;
