export interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  title: string;
  duration: number; // in seconds
}

export interface Settings {
  weatherLocation: string;
  newsUrl: string;
  displayTime: number;
  theme: string;
}

export interface AppConfig {
  settings: Settings;
  playlist: MediaItem[];
}
