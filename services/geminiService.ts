
import { GoogleGenAI, Type } from "@google/genai";
import { SignalType, AnalysisResult, ZoneType, MarketCondition } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    signal: { type: Type.STRING, description: "BUY ou WAIT" },
    confidence: { type: Type.NUMBER },
    reasoning: { type: Type.STRING, description: "Explicação técnica detalhada" },
    momentumCrossing: { type: Type.BOOLEAN, description: "Momentum(5) Turquesa cruzando centro para cima" },
    williamsCrossing: { type: Type.BOOLEAN, description: "Williams(7) Turquesa cruzando -20 para cima" },
    rsiValue: { type: Type.NUMBER },
    zoneDetected: { type: Type.STRING },
    condition: { type: Type.STRING },
    trend: { type: Type.STRING },
    multiTimeframeConfirmation: { type: Type.BOOLEAN },
    candleStrength: { type: Type.STRING }
  },
  required: ["signal", "confidence", "reasoning", "momentumCrossing", "williamsCrossing", "rsiValue", "zoneDetected", "condition", "trend", "multiTimeframeConfirmation", "candleStrength"]
};

export const analyzeChartFrame = async (base64Image: string): Promise<AnalysisResult> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
          { text: `Aja como o Cérebro Analítico do PRISMA IA. Identifique sinais de COMPRA (CALL) para o nascimento da vela M1.

ESTRATÉGIA TURQUESA (FOCO TOTAL):
1. MOMENTUM (Período 5): Procure a linha TURQUESA. Ela deve estar cruzando a linha central cinza de baixo para cima EXATAMENTE AGORA (nascimento da vela).
2. WILLIAMS MOMENTUM (Período 7): Procure a linha TURQUESA. Ela deve estar cruzando o nível -20 de baixo para cima simultaneamente.

CONDIÇÕES DE SINAL (BUY):
- Emita BUY somente se as duas linhas TURQUESAS estiverem confirmando força de alta.
- A vela anterior deve ser verde e ter corpo (fluxo de alta).
- Não deve haver resistências ou pavios superiores gigantes bloqueando o movimento.
- NUNCA sugira venda (Sell). Se o gráfico estiver caindo, retorne WAIT.

Sua missão é dar o sinal no exato momento que a nova vela nasce.` }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: ANALYSIS_SCHEMA,
        temperature: 0.1,
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      ...result,
      timestamp: Date.now(),
      signal: result.signal as SignalType
    };
  } catch (error) {
    console.error("Prisma Brain Error:", error);
    return fallbackResult();
  }
};

const fallbackResult = (): AnalysisResult => ({
  signal: SignalType.WAIT,
  confidence: 0,
  reasoning: "Aguardando nascimento da vela M1 e cruzamento turquesa...",
  momentumCrossing: false,
  williamsCrossing: false,
  rsiValue: 0,
  zoneDetected: 'None',
  condition: 'Normal',
  trend: 'Neutral',
  multiTimeframeConfirmation: false,
  candleStrength: 'Weak',
  timestamp: Date.now()
});
