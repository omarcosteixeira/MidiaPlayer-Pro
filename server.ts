import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Parser from "rss-parser";
import cors from "cors";

const parser = new Parser();

async function startServer() {
  const app = express();

  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.get("/api/news", async (req, res) => {
    // We only need the URL being passed from the frontend if we want it fully dynamic,
    // but right now it can expect a query param or default to G1
    const rssUrl = (req.query.url as string) || "https://g1.globo.com/rss/g1/";
    
    try {
      const feed = await parser.parseURL(rssUrl);
      res.json(feed.items.slice(0, 10).map(item => ({
        title: item.title,
        content: item.contentSnippet || item.content,
      })));
    } catch (error) {
      console.error("RSS Error:", error);
      res.status(500).json({ error: "Failed to fetch news" });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
