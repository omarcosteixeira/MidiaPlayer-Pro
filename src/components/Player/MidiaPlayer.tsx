import { useState, useEffect, useRef } from "react";
import { AppConfig, MediaItem } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import NewsTicker from "./NewsTicker";
import WeatherWidget from "./WeatherWidget";
import { Maximize, Layout } from "lucide-react";
import { db } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface MidiaPlayerProps {
  onNavigate: () => void;
}

export default function MidiaPlayer({ onNavigate }: MidiaPlayerProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Real-time listener from Firestore
    const docRef = doc(db, "config", "main");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const newConfig = docSnap.data() as AppConfig;
        console.log("Config updated from Firestore", newConfig);
        // Only update if changes are detected, to avoid resetting index if not needed
        setConfig(prev => {
          // Simplistic change detection (if different length or something major)
          if (JSON.stringify(prev) !== JSON.stringify(newConfig)) {
            setCurrentIndex(0); 
            return newConfig;
          }
          return prev;
        });
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!config || config.playlist.length === 0) return;

    const currentItem = config.playlist[currentIndex];
    const duration = (currentItem?.duration || config.settings.displayTime) * 1000;

    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % config.playlist.length);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, config]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  if (!config) return (
    <div className="h-screen flex items-center justify-center bg-black">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-500 font-medium">Iniciando Sistema...</p>
      </div>
    </div>
  );

  const playlist = config.playlist;
  const currentItem = playlist[currentIndex];

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden select-none cursor-none">
      {/* Media Layer */}
      <div className="absolute inset-0">
        <AnimatePresence mode="wait">
          {currentItem && (
            <motion.div
              key={currentItem.id}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              {currentItem.type === "image" ? (
                <img 
                  src={currentItem.url} 
                  alt={currentItem.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <video
                  src={currentItem.url}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                  onEnded={() => setCurrentIndex((prev) => (prev + 1) % playlist.length)}
                />
              )}
              
              {/* Subtle Gradient Overlay for Ticker Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none h-40" />

              {/* Title Overlay */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1, duration: 1 }}
                className="absolute top-12 left-12 max-w-2xl"
              >
                <div className="text-blue-500 text-xs font-bold uppercase tracking-[0.3em] mb-2 drop-shadow-lg">Agora Exibindo</div>
                <h2 className="text-5xl font-black text-white drop-shadow-2xl leading-tight italic uppercase tracking-tighter">
                  {currentItem.title}
                </h2>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Widgets Layer */}
      <WeatherWidget location={config.settings.weatherLocation} />
      <NewsTicker newsUrl={config.settings.newsUrl} />

      {/* Bottom Right Brand */}
      <div className="absolute bottom-24 right-12 flex items-center gap-3">
        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20">
          <Layout className="w-5 h-5 text-white/50" />
        </div>
        <div className="text-right">
          <div className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Powered by</div>
          <div className="text-white text-sm font-black tracking-tight">MidiaPlayer PRO</div>
        </div>
      </div>

      {/* Hidden Controls (Visible on hover at top) */}
      <div className="absolute top-0 left-0 right-0 h-2 px-4 flex justify-center opacity-0 hover:opacity-100 transition-opacity cursor-default group">
        <div className="bg-black/60 backdrop-blur-xl px-6 py-4 rounded-b-2xl border border-white/10 flex items-center gap-6">
          <button onClick={onNavigate} className="text-xs font-bold uppercase tracking-widest hover:text-blue-400 transition-colors">Admin Panel</button>
          <div className="w-[1px] h-4 bg-white/20" />
          <button onClick={toggleFullscreen} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-blue-400 transition-colors">
            <Maximize className="w-4 h-4" /> Fullscreen
          </button>
        </div>
      </div>

      {/* Playlist Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 flex gap-1 z-50">
        {playlist.map((item, idx) => (
          <div key={item.id} className="flex-1 bg-white/10 h-full overflow-hidden">
            <motion.div 
              className="h-full bg-blue-500"
              initial={{ x: "-100%" }}
              animate={idx === currentIndex ? { x: "0%" } : idx < currentIndex ? { x: "0%" } : { x: "-100%" }}
              transition={idx === currentIndex ? { duration: (item.duration || config.settings.displayTime), ease: "linear" } : { duration: 0 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
