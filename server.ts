import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini API client proxy
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API router
  app.post("/api/gemini/coach", async (req, res) => {
    try {
      if (!apiKey) {
        return res.json({ 
          advice: "### ✨ Your Digital Coach is Warming Up!\n\nTo unlock customized AI Guidance, please make sure your **GEMINI_API_KEY** is configured in AI Studio's **Settings > Secrets** panel.\n\nOnce configured, I will analyze your streak, habit completion ratios, and weight logs to deliver personalized action steps." 
        });
      }

      const { habits, weightLogs, currentStreak, dreamSelf, goal, name } = req.body;
      
      const habitsSummary = habits && habits.length > 0 
        ? habits.map((h: any) => `- **${h.title}**: Completed ${h.completedCount} times over the last 7 monitored days. Habit record streak: ${h.streak} days.`).join("\n")
        : "No habits initialized yet.";
        
      const weightsSummary = weightLogs && weightLogs.length > 0 
        ? weightLogs.map((w: any) => `- **${w.date}**: ${w.weight} kg`).join("\n")
        : "No weights recorded yet.";

      const systemPrompt = `You are an elite, highly professional wellness and habit coach for "GlowUp Diary" - a premium tracker help users step into their best shelf.
YOUR STYLE:
- Empathetic and mindful (reminiscent of Headspace and Finch).
- Specific, analytical, and metric-aware (reminiscent of Apple Health log stats).
- No standard motivational clichés (e.g. "You got this!").
- Address the user respectfully by name: ${name || "Glower"}.

User Overview:
- Name: ${name || "Glower"}
- Main Goal: ${goal || "General Life GlowUp"}
- Dream Self Vision: "${dreamSelf || "A more mindful, consistent, and confident version of myself."}"

Weekly Progress Snapshot:
- Streak: ${currentStreak || 0} days active.
- Habit Tracking logs (Past 7 Days ratio count):
${habitsSummary}
- Logged Weight Progression:
${weightsSummary}

Formulate an elegant, actionable wellness consultation report with:
1. **Core Reflection**: A warm, brief reflection on their dream self. Be extremely specific to what they wrote in their dreamSelf.
2. **Weekly Momentum**: Highlight their major habit win. Specifically compare completion rates (e.g. "Your Pilates habit shows 5/7 loggings...").
3. **Gentle Refinement**: Identify the weakest habit point or variance. Note what habit had the lowest ratio (e.g. "But water intake fell back to 2/7..."). Offer a micro-step optimization (e.g., "Keep a physical tumbler at your bedside").
4. **Action Agenda**: Provide exactly 2 bullet points for their ritual tomorrow.

Format beautifully in Markdown. Keep it concise, professional, premium, and focused on self-compassion and realistic incremental lifestyle changes.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: "Analyze my metrics and produce my custom GlowUp diary advice.",
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.65,
        },
      });

      res.json({ advice: response.text });
    } catch (err: any) {
      console.error("AI coaching generation failed:", err);
      res.status(500).json({ error: "Failed to generate coaching recommendation" });
    }
  });

  // Serve static UI assets via Vite (development) vs Express Static (production fallback)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[GlowUp Diary Server] full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Server boot crash:", err);
});
