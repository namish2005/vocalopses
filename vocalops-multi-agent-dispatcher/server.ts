import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Proxy Route to bypass CORS
  app.post("/api/proxy", async (req, res) => {
    const { webhook_url, ...payload } = req.body;
    
    // Use provided webhook_url or fallback to environment variable
    const finalWebhookUrl = webhook_url || process.env.VITE_N8N_WEBHOOK_URL;

    if (!finalWebhookUrl) {
      return res.status(400).json({ error: "No webhook URL configured." });
    }

    try {
      console.log(`[Proxy] Forwarding request to: ${finalWebhookUrl}`);
      const response = await fetch(finalWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = `n8n error! status: ${response.status}`;
        if (response.status === 404) {
          errorMessage = `n8n endpoint not found (404). This usually means the workflow is not "Active" in n8n or you need to use the /webhook-test/ path.`;
        }
        return res.status(response.status).json({ 
          error: "Communication failure with n8n.",
          details: errorMessage,
          status: response.status
        });
      }

      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("[Proxy] Error:", error);
      res.status(500).json({ 
        error: "Internal server error during proxy request.",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
