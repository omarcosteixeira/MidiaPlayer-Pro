import { useState, useEffect } from "react";
import { Clock, CloudSun, Wind, Droplets } from "lucide-react";
import { motion } from "motion/react";

interface WeatherWidgetProps {
  location: string;
}

export default function WeatherWidget({ location }: WeatherWidgetProps) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' });
  };

  return (
    <div className="absolute top-12 right-12 flex gap-4 items-start z-50">
      {/* Time & Date Block */}
      <div className="text-right">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-white font-black text-7xl tracking-tighter tabular-nums drop-shadow-2xl"
        >
          {formatTime(time)}
        </motion.div>
        <div className="text-blue-400 font-bold uppercase text-sm tracking-[0.2em] mt-1 drop-shadow-lg opacity-80">
          {formatDate(time)}
        </div>
      </div>

      {/* Weather Info - Hardware Style Widget */}
      <div className="w-48 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/30">
            <CloudSun className="w-6 h-6 text-blue-400" />
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Localização</div>
            <div className="text-white text-xs font-bold truncate max-w-[100px]">{location}</div>
          </div>
        </div>

        <div className="flex items-end justify-between mb-3">
          <span className="text-white text-4xl font-black tracking-tighter">24°C</span>
          <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Ensolarado</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Droplets className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-mono text-gray-300">65% <span className="opacity-40">HUM</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Wind className="w-3 h-3 text-blue-400" />
            <span className="text-[10px] font-mono text-gray-300">12km/h <span className="opacity-40">WND</span></span>
          </div>
        </div>
        
        {/* Status indicator line */}
        <div className="mt-4 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-500 shadow-[0_0_10px_#3b82f6]"
            animate={{ width: ["0%", "100%", "0%"] }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          />
        </div>
      </div>
    </div>
  );
}
