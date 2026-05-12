import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "motion/react";
import { Newspaper } from "lucide-react";

interface NewsItem {
  title: string;
  content: string;
}

interface NewsTickerProps {
  newsUrl: string;
}

export default function NewsTicker({ newsUrl }: NewsTickerProps) {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await axios.get("/api/news", { params: { url: newsUrl } });
        setNews(res.data);
      } catch (e) {
        console.error("Failed to fetch news");
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 600000); // Update every 10 mins
    return () => clearInterval(interval);
  }, [newsUrl]);

  if (news.length === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-16 bg-black/40 backdrop-blur-3xl border-t border-white/5 flex items-center overflow-hidden z-40">
      <div className="flex items-center gap-4 px-8 bg-blue-600 h-full relative z-10 shadow-[20px_0_40px_rgba(37,99,235,0.4)]">
        <Newspaper className="w-5 h-5 text-white" />
        <span className="text-white font-black uppercase text-xs tracking-widest whitespace-nowrap">Últimas Notícias</span>
      </div>
      
      <div className="flex-1 relative overflow-hidden h-full flex items-center">
        <motion.div 
          className="flex whitespace-nowrap gap-16 pr-16"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ 
            duration: 60, 
            repeat: Infinity, 
            ease: "linear" 
          }}
        >
          {/* Double news list for seamless loop */}
          {[...news, ...news].map((item, idx) => (
            <div key={idx} className="flex items-center gap-4">
              <span className="text-gray-400 font-mono text-[10px]">●</span>
              <span className="text-white font-medium text-lg tracking-tight">{item.title}</span>
            </div>
          ))}
        </motion.div>
      </div>
      
      <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black to-transparent pointer-events-none z-20" />
    </div>
  );
}
