import React, { useState, useEffect, useRef } from "react";
import { MediaItem, AppConfig, Settings } from "../../types";
import { 
  Tv, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Save, 
  Play, 
  Image as ImageIcon, 
  Video,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  CloudRain,
  Newspaper,
  Upload
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, storage } from "../../lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";

interface DashboardProps {
  onNavigate: (to: "admin" | "player") => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"playlist" | "side1" | "side2" | "side3">("playlist");

  useEffect(() => {
    const docRef = doc(db, "config", "main");
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as AppConfig;
        setConfig({
          ...data,
          side1: data.side1 || [],
          side2: data.side2 || [],
          side3: data.side3 || []
        });
        setLoading(false);
      } else {
        const defaultConfig: AppConfig = {
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
        };
        setConfig(defaultConfig);
        // Do not auto-save here to avoid redundant writes if the user just created the DB
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      const docRef = doc(db, "config", "main");
      await setDoc(docRef, config);
      alert("Configuração salva com sucesso no Banco de Dados!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar configuração. Verifique as permissões do Firebase.");
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (updates: Partial<Settings>) => {
    if (!config) return;
    setConfig({
      ...config,
      settings: { ...config.settings, ...updates }
    });
  };

  const addMedia = () => {
    setConfig(prev => {
      if (!prev) return prev;
      const newItem: MediaItem = {
        id: Date.now().toString(),
        type: "image",
        url: "",
        title: "Novo Item",
        duration: 10
      };
      return {
        ...prev,
        [activeTab]: [...(prev[activeTab] || []), newItem]
      };
    });
  };

  const updateMedia = (id: string, updates: Partial<MediaItem>) => {
    setConfig(prev => {
      if (!prev) return prev;
      const list = prev[activeTab] || [];
      return {
        ...prev,
        [activeTab]: list.map(item => item.id === id ? { ...item, ...updates } : item)
      };
    });
  };

  const removeMedia = (id: string) => {
    setConfig(prev => {
      if (!prev) return prev;
      const list = prev[activeTab] || [];
      return {
        ...prev,
        [activeTab]: list.filter(item => item.id !== id)
      };
    });
  };

  const moveMedia = (index: number, direction: 'up' | 'down') => {
    setConfig(prev => {
      if (!prev) return prev;
      const list = prev[activeTab] || [];
      const newPlaylist = [...list];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newPlaylist.length) return prev;
      
      [newPlaylist[index], newPlaylist[targetIndex]] = [newPlaylist[targetIndex], newPlaylist[index]];
      return { ...prev, [activeTab]: newPlaylist };
    });
  };

  const updateMediaGlobal = (id: string, updates: Partial<MediaItem>) => {
    setConfig(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        playlist: prev.playlist.map(item => item.id === id ? { ...item, ...updates } : item),
        side1: (prev.side1 || []).map(item => item.id === id ? { ...item, ...updates } : item),
        side2: (prev.side2 || []).map(item => item.id === id ? { ...item, ...updates } : item),
        side3: (prev.side3 || []).map(item => item.id === id ? { ...item, ...updates } : item),
      };
    });
  };

  const triggerUpload = (id: string) => {
    setUploadTargetId(id);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadTargetId) return;

    // Reset input
    event.target.value = '';

    const storageRef = ref(storage, `media/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(prev => ({ ...prev, [uploadTargetId]: progress }));
      },
      (error: any) => {
        console.error("Upload failed", error);
        alert(`Erro no upload: ${error.message || "Erro desconhecido"}\n\nSe for erro de permissão (unauthorized), altere as Regras do Storage no Firebase para: allow read, write: if true;`);
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[uploadTargetId];
          return newProgress;
        });
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        // Auto-detect type
        const type = file.type.startsWith("video/") ? "video" : "image";
        
        updateMediaGlobal(uploadTargetId, { url: downloadURL, type });
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[uploadTargetId];
          return newProgress;
        });
        setUploadTargetId(null);
      }
    );
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-[#121212]">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
  </div>;
  if (!config) return <div className="p-8 text-white">Erro ao carregar dados do Firebase.</div>;

  return (
    <div className="bg-[#121212] min-h-screen text-gray-200">
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*,video/*"
        onChange={handleFileUpload} 
      />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-[#1a1a1a] border-b border-gray-800 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <Tv className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-bold tracking-tight text-white">MidiaPlayer <span className="text-blue-500 text-sm font-normal">PRO</span></h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onNavigate("player")}
            className="flex items-center gap-2 px-4 py-2 hover:bg-gray-800 rounded-lg transition-colors text-sm"
          >
            <Play className="w-4 h-4" /> Visualizar TV
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-all shadow-lg text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? "Salvando..." : "Salvar Alterações"}
          </button>
        </div>
      </header>

      <main className="pt-24 pb-12 max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Playlist Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex items-center gap-4 mb-4 border-b border-gray-800 pb-2">
            {[
              { id: "playlist", label: "Principal (Meio)" },
              { id: "side1", label: "Lateral 1" },
              { id: "side2", label: "Lateral 2" },
              { id: "side3", label: "Lateral 3" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-2 text-sm font-medium transition-colors relative ${activeTab === tab.id ? "text-blue-500" : "text-gray-400 hover:text-gray-200"}`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div layoutId="activeTab" className="absolute bottom-[-9px] left-0 right-0 h-0.5 bg-blue-500" />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <Play className="w-5 h-5 text-green-500" /> Grade: {activeTab === "playlist" ? "Principal" : `Lateral ${activeTab.replace("side", "")}`}
            </h2>
            <button 
              onClick={addMedia}
              className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" /> Adicionar Mídia
            </button>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {(config[activeTab] || []).map((item, index) => (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="bg-[#1a1a1a] rounded-xl border border-gray-800 p-4 flex gap-4 items-start group relative"
                >
                  <div className="flex flex-col gap-2 pt-1">
                    <button onClick={() => moveMedia(index, 'up')} className="p-1 hover:text-white disabled:opacity-30" disabled={index === 0}><ChevronUp className="w-4 h-4" /></button>
                    <button onClick={() => moveMedia(index, 'down')} className="p-1 hover:text-white disabled:opacity-30" disabled={index === (config[activeTab] || []).length - 1}><ChevronDown className="w-4 h-4" /></button>
                  </div>

                  <div className="w-32 h-20 bg-gray-900 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative group-hover:ring-2 ring-blue-500 transition-all">
                    {item.url ? (
                      item.type === "image" ? (
                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="bg-gray-800 w-full h-full flex items-center justify-center"><Video className="w-6 h-6" /></div>
                      )
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-700" />
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Título da Mídia</label>
                        <input 
                          type="text" 
                          value={item.title}
                          onChange={(e) => updateMedia(item.id, { title: e.target.value })}
                          className="w-full bg-transparent border-b border-gray-800 focus:border-blue-500 outline-none py-1 text-sm transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">URL do conteúdo (Imagem/Vídeo)</label>
                        <div className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            value={item.url}
                            onChange={(e) => updateMedia(item.id, { url: e.target.value })}
                            placeholder="https://exemplo.com/imagem.jpg"
                            className="w-full bg-transparent border-b border-gray-800 focus:border-blue-500 outline-none py-1 text-sm transition-colors font-mono"
                          />
                          <button
                            onClick={() => triggerUpload(item.id)}
                            className="bg-gray-800 hover:bg-gray-700 p-1.5 rounded-md transition-colors relative"
                            title="Fazer Upload de Arquivo"
                          >
                            <Upload className="w-4 h-4" />
                            {uploadProgress[item.id] !== undefined && (
                              <div className="absolute inset-0 bg-blue-500/20 rounded-md overflow-hidden flex items-end">
                                <div 
                                  className="w-full bg-blue-500 transition-all duration-300" 
                                  style={{ height: `${uploadProgress[item.id]}%` }}
                                />
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Tipo</label>
                        <select 
                          value={item.type}
                          onChange={(e) => updateMedia(item.id, { type: e.target.value as any })}
                          className="w-full bg-transparent border-b border-gray-800 focus:border-blue-500 outline-none py-1 text-sm"
                        >
                          <option value="image">Imagem</option>
                          <option value="video">Vídeo</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Duração (Segundos)</label>
                        <input 
                          type="number" 
                          value={item.duration}
                          onChange={(e) => updateMedia(item.id, { duration: parseInt(e.target.value) || 0 })}
                          className="w-full bg-transparent border-b border-gray-800 focus:border-blue-500 outline-none py-1 text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={() => removeMedia(item.id)}
                    className="p-2 text-gray-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>

            {(config[activeTab] || []).length === 0 && (
              <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-2xl">
                <p className="text-gray-500">Sua grade está vazia. Comece adicionando uma mídia.</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Settings */}
        <aside className="space-y-6">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-gray-800 space-y-6">
            <h2 className="text-lg font-medium text-white flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-blue-500" /> Configurações Gerais
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium flex items-center gap-2">
                  <CloudRain className="w-4 h-4" /> Localização do Clima (Ex: São Paulo, BR)
                </label>
                <input 
                  type="text" 
                  value={config.settings.weatherLocation}
                  onChange={(e) => updateSettings({ weatherLocation: e.target.value })}
                  className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:ring-1 ring-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium flex items-center gap-2">
                  <Newspaper className="w-4 h-4" /> Feed de Notícias (RSS URL)
                </label>
                <input 
                  type="text" 
                  value={config.settings.newsUrl}
                  onChange={(e) => updateSettings({ newsUrl: e.target.value })}
                  className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:ring-1 ring-blue-500 outline-none transition-all font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1.5 block font-medium">Tempo Padrão de Exibição (Segundos)</label>
                <input 
                  type="number" 
                  value={config.settings.displayTime}
                  onChange={(e) => updateSettings({ displayTime: parseInt(e.target.value) || 0 })}
                  className="w-full bg-[#121212] border border-gray-800 rounded-lg px-4 py-2.5 text-sm focus:ring-1 ring-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Versão do Software</span>
                <span>v1.0.4 - Premium</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/20 to-transparent rounded-2xl p-6 border border-blue-900/30">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" /> Link para TV
            </h3>
            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Copie o link abaixo e abra no navegador da sua Smart TV para iniciar a transmissão.
            </p>
            <div className="relative group">
               <input 
                 readOnly
                 value={window.location.origin}
                 className="w-full bg-black/40 border border-blue-900/50 rounded-lg px-4 py-2 text-xs font-mono text-blue-200"
               />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
