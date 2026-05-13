import { useState, useEffect, useRef } from "react";
import { AppConfig, MediaItem } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import NewsTicker from "./NewsTicker";
import WeatherWidget from "./WeatherWidget";
import { Maximize, Layout } from "lucide-react";
import { db } from "../../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import SidePlayer from "./SidePlayer";
import MediaRenderer from "./MediaRenderer";

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
        setConfig(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(newConfig)) {
            setCurrentIndex(0); 
            return newConfig;
          }
          return prev;
        });
      } else {
        setConfig({
          settings: {
            weatherLocation: "São Paulo, BR",
            newsUrl: "https://g1.globo.com/rss/g1/",
            displayTime: 10,
            theme: "modern",
          },
          playlist: [],
          side1: [],
          side2: [],
          side3: []
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

  const hasAnySideMedia = (config.side1?.length || 0) > 0 || (config.side2?.length || 0) > 0 || (config.side3?.length || 0) > 0;

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden select-none cursor-none flex flex-col">
      {/* Hidden Controls (Visible on hover at top) */}
      <div className="absolute top-0 left-0 right-0 h-4 px-4 flex justify-center opacity-0 hover:opacity-100 transition-opacity cursor-default group z-50">
        <div className="bg-black/80 backdrop-blur-xl px-6 py-4 rounded-b-2xl border border-white/10 flex items-center gap-6 mt-[-10px] group-hover:mt-0 transition-all">
          <button onClick={onNavigate} className="text-xs font-bold uppercase tracking-widest text-white hover:text-blue-400 transition-colors">Admin Panel</button>
          <div className="w-[1px] h-4 bg-white/20" />
          <button onClick={toggleFullscreen} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white hover:text-blue-400 transition-colors">
            <Maximize className="w-4 h-4" /> Fullscreen
          </button>
        </div>
      </div>

      {playlist.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center relative">
          <div className="text-center space-y-6 z-10 p-12 bg-[#1a1a1a] border border-gray-800 rounded-3xl shadow-2xl">
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto border border-blue-500/30">
              <Layout className="w-10 h-10 text-blue-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tight">Grade de Programação Vazia</h2>
              <p className="text-gray-400 max-w-md mx-auto">Sua TV não tem nenhuma propaganda configurada no momento. Cadastre as imagens ou vídeos para iniciar a transmissão.</p>
            </div>
            <button 
              onClick={onNavigate} 
              className="mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-4 rounded-xl transition-all cursor-pointer shadow-[0_0_40px_rgba(37,99,235,0.3)]"
            >
              Acessar Painel de Administrador
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex w-full h-[calc(100vh-64px)]">
          {/* MAIN PLAYER ZONE */}
          <div className="flex-1 relative bg-black shrink-0 grow">
            <AnimatePresence mode="wait">
              {currentItem && (
                <motion.div
                  key={currentItem.id}
                  initial={{ opacity: 0, scale: 1.02 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <MediaRenderer 
                    item={currentItem} 
                    onEnded={() => setCurrentIndex((prev) => (prev + 1) % playlist.length)} 
                  />
                  
                  {/* Overlay for Ticker Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none h-40" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Playlist Progress Bar overlayed on top edge of main video */}
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
            
            {/* Weather Widget */}
            <WeatherWidget location={config.settings.weatherLocation} />
          </div>

          {/* SIDE/LATERAL PLAYER ZONE */}
          {hasAnySideMedia && (
            <div className="w-[380px] bg-[#0a0a0a] flex flex-col p-4 gap-4 border-l border-gray-900 border-opacity-50 shadow-[-10px_0_30px_rgba(0,0,0,0.8)] relative z-20">
              <div className="flex-1 w-full h-[30%] relative">
                <SidePlayer playlist={config.side1 || []} defaultDuration={config.settings.displayTime} />
              </div>
              <div className="flex-1 w-full h-[30%] relative">
                <SidePlayer playlist={config.side2 || []} defaultDuration={config.settings.displayTime} />
              </div>
              <div className="flex-1 w-full h-[30%] relative">
                <SidePlayer playlist={config.side3 || []} defaultDuration={config.settings.displayTime} />
              </div>
              
              <div className="absolute bottom-4 right-4 text-right pr-2">
                <div className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Powered by</div>
                <div className="text-white/50 text-xs font-black tracking-tight">MidiaPlayer PRO</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* News Ticker Area (Bottom edge) */}
      <div className="h-16 w-full shrink-0 relative bg-black z-40 border-t border-white/10 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        <NewsTicker newsUrl={config.settings.newsUrl} />
      </div>
    </div>
  );
}
