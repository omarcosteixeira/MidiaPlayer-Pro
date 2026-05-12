import { useState, useEffect } from "react";
import Dashboard from "./components/Admin/Dashboard";
import MidiaPlayer from "./components/Player/MidiaPlayer";

export default function App() {
  const [route, setRoute] = useState<"admin" | "player">(
    window.location.pathname === "/admin" ? "admin" : "player"
  );

  // Simple listener for manual URL changes
  useEffect(() => {
    const handlePopState = () => {
      setRoute(window.location.pathname === "/admin" ? "admin" : "player");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const navigate = (to: "admin" | "player") => {
    window.history.pushState({}, "", to === "admin" ? "/admin" : "/");
    setRoute(to);
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden">
      {route === "admin" ? (
        <Dashboard onNavigate={navigate} />
      ) : (
        <MidiaPlayer onNavigate={() => navigate("admin")} />
      )}
    </div>
  );
}
