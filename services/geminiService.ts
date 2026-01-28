
import { GoogleGenAI, Type } from "@google/genai";
import { SignalType, AnalysisResult, ZoneType, MarketCondition } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    signal: { type: Type.STRING, description: "BUY ou WAIT" },
    confidence: { type: Type.NUMBER },
    reasoning: { type: Type.STRING, description: "Justificativa técnica focada no cruzamento de abertura" },
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
          { text: `Aja como o Cérebro Analítico do PRISMA IA. Sua missão é prever o SINAL DE COMPRA exatamente para a ABERTURA da vela M1 (00s).

ESTRATÉGIA TURQUESA (FOCO EM ABERTURA):
1. MOMENTUM (5): A linha TURQUESA deve estar apontando para cima e cruzando a linha central EXATAMENTE no nascimento da vela.
2. WILLIAMS MOMENTUM (7): A linha TURQUESA deve estar rompendo o nível -20 de baixo para cima.

INSTRUÇÃO CRÍTICA:
- Analise a trajetória das linhas turquesas nos últimos segundos da vela anterior.
- Se a trajetória indica que a abertura da próxima vela será um "tiro" de alta com cruzamento, emita BUY.
- O sinal deve ser validado para a vela que está abrindo AGORA (00s).
- NUNCA sugira venda (Sell). Se não houver explosão de alta na abertura, retorne WAIT.` }
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
    console.error("Prisma Opening Sync Error:", error);
    return fallbackResult();
  }
};

const fallbackResult = (): AnalysisResult => ({
  signal: SignalType.WAIT,
  confidence: 0,
  reasoning: "Sincronizando com abertura 00s...",
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
