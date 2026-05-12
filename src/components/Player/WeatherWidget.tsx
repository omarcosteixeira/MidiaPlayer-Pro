import { useState, useEffect } from "react";
import { CloudSun } from "lucide-react";
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
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }).replace('.', '');
  };

  return (
    <div className="absolute bottom-6 left-6 z-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-5 bg-black/60 backdrop-blur-xl border border-white/10 rounded-3xl pl-5 pr-6 py-2.5 shadow-2xl"
      >
        {/* Time & Date Block */}
        <div className="flex items-center gap-3">
          <div className="text-white font-black text-4xl tracking-tighter tabular-nums drop-shadow-xl">
            {formatTime(time)}
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-blue-400 font-bold uppercase text-[10px] tracking-widest">
              {formatDate(time)}
            </span>
            <span className="text-white/50 text-[10px] uppercase font-bold tracking-widest mt-0.5">
              {time.getSeconds().toString().padStart(2, '0')} SEG
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="w-[1px] h-8 bg-white/10" />

        {/* Weather Info Block */}
        <div className="flex items-center gap-3">
          <CloudSun className="w-7 h-7 text-blue-400" />
          <div className="flex flex-col">
            <div className="flex items-end gap-1">
              <span className="text-white text-2xl font-black tracking-tighter leading-none">24°C</span>
            </div>
            <span className="text-gray-400 text-[10px] uppercase font-bold tracking-widest truncate max-w-[120px] mt-1">
              {location}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
