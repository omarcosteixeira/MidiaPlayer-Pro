import { useState, useEffect, useRef } from "react";
import { MediaItem } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import MediaRenderer from "./MediaRenderer";

interface SidePlayerProps {
  playlist: MediaItem[];
  defaultDuration: number;
}

export default function SidePlayer({ playlist, defaultDuration }: SidePlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setCurrentIndex(0);
  }, [playlist.length]);

  useEffect(() => {
    if (playlist.length === 0) return;

    const currentItem = playlist[currentIndex];
    const duration = (currentItem?.duration || defaultDuration) * 1000;

    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentIndex, playlist, defaultDuration]);

  if (playlist.length === 0) {
    return (
      <div className="w-full h-full bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
        <span className="text-white/20 text-xs font-bold uppercase tracking-widest">Vazio</span>
      </div>
    );
  }

  const currentItem = playlist[currentIndex];

  return (
    <div className="w-full h-full bg-black rounded-2xl overflow-hidden relative shadow-2xl border border-white/5">
      <AnimatePresence mode="wait">
        {currentItem && (
          <motion.div
            key={currentItem.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0"
          >
            <MediaRenderer 
              item={currentItem} 
              onEnded={() => setCurrentIndex((prev) => (prev + 1) % playlist.length)} 
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
