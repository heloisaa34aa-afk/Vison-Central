import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client on the server side
// Check if GEMINI_API_KEY is available. If not, we will output warnings
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("Aviso: GEMINI_API_KEY não foi encontrada nas variáveis de ambiente. Usando simulador local.");
}

// API Routes FIRST
app.post("/api/gemini/generate", async (req, res) => {
  const { establishmentType, targetAudience, toneGoal } = req.body;

  if (!establishmentType || !targetAudience || !toneGoal) {
    return res.status(400).json({ error: "Missing prompt parameters" });
  }

  // If AI client is not configured, send structured mock directly
  if (!ai) {
    return res.json({
      tickers: [
        `Novidades na rede ${establishmentType}! Promoção exclusiva para nosso público de hoje.`,
        `Fique por dentro! Conheça nossas soluções digitais e melhore seu dia.`,
        `Dica: Dedique 5 minutos do seu dia para respirar fundo e focar no que importa.`
      ],
      campaigns: [
        { name: "Campanha Institucional", duration: 15, idea: "Exibir vídeo conceitual mostrando o cuidado com os detalhes de atendimento." },
        { name: "Campanha Conexão", duration: 10, idea: "Slide colorido instigando o público a interagir com os perfis de mídias sociais." }
      ],
      ctaText: `Marque nosso perfil nas redes sociais usando a nossa hashtag especial!`
    });
  }

  try {
    const prompt = `Crie conteúdo em Português para uma TV Corporativa / Sinalização Digital.
    Tipo do Negócio: ${establishmentType}
    Público-alvo das telas: ${targetAudience}
    Objetivo ou tom do conteúdo: ${toneGoal}
    
    Por favor, retorne os dados estritamente em formato JSON contendo os seguintes campos:
    1. tickers: uma array de 3 frases curtas e cativantes (máximo de 120 caracteres cada) ideais para rodar no letreiro scrolling marquee da TV.
    2. campaigns: uma array com 2 ideias de campanhas/slides de programação, cada uma contendo "name" (string), "duration" (número de segundos recomendados, ex: 10, 15) e "idea" (uma breve descrição de como deve ser o slide visual).
    3. ctaText: uma frase convincente e dinâmica de chamada para ação para colocar no rodapé estimulando o público a seguir o instagram ou baixar o aplicativo do estabelecimento.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é um especialista em Marketing de Sinalização Digital (Digital Signage) e TV Corporativa no Brasil. Escreva textos profissionais, polidos e sem erros gramaticais.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tickers: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "3 frases curtas e chamativas para o letreiro digital rotativo de rodapé."
            },
            campaigns: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nome comercial da campanha sugerida." },
                  duration: { type: Type.INTEGER, description: "Duração recomendada em segundos." },
                  idea: { type: Type.STRING, description: "Breve explicação do conteúdo visual do slide." }
                },
                required: ["name", "duration", "idea"]
              }
            },
            ctaText: {
              type: Type.STRING,
              description: "Uma frase marcante estimulando ação física ou digital do público."
            }
          },
          required: ["tickers", "campaigns", "ctaText"]
        }
      }
    });

    if (response.text) {
      const parsedData = JSON.parse(response.text.trim());
      res.json(parsedData);
    } else {
      throw new Error("Empty text returned from Gemini API");
    }
  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    res.status(500).json({ error: "Erro ao gerar ideias com Gemini", details: error.message });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", geminiConfigured: !!ai });
});

// Vite middleware setup or production static server
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite dev middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Serving static assets from dist/ folder.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Failed to start Vite middleware server:", err);
});

// APK Android API Integration
app.post("/api/apk/heartbeat", async (req, res) => {
  const { deviceId, token } = req.body;
  if (!deviceId) return res.status(400).json({ error: "Missing deviceId" });
  
  try {
    // In a real scenario we'd use the Supabase admin client here
    // or the client would update directly via Supabase SDK.
    // For now we just acknowledge to document the API contract.
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
