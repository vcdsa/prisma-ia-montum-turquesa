
import { GoogleGenAI, Type } from "@google/genai";
import { SignalType, AnalysisResult, ZoneType, MarketCondition } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    signal: { type: Type.STRING, description: "BUY, SELL ou WAIT" },
    confidence: { type: Type.NUMBER },
    reasoning: { type: Type.STRING, description: "Justificativa técnica detalhada em português" },
    momentumCrossing: { type: Type.BOOLEAN, description: "Cruzamento do Momentum(5) Turquesa na linha central" },
    williamsCrossing: { type: Type.BOOLEAN, description: "Cruzamento do Williams(7) Turquesa nos níveis -20 ou -80" },
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
          { text: `Aja como o Cérebro Analítico do PRISMA IA. Sua missão é prever o SINAL exatamente para a ABERTURA da vela M1 (00s).

ESTRATÉGIA TURQUESA (FOCO EM NASCIMENTO/ABERTURA):

1. SINAL DE COMPRA (BUY):
   - MOMENTUM (5): A linha TURQUESA deve cruzar a linha central de BAIXO PARA CIMA exatamente na abertura.
   - WILLIAMS %R (7): A linha TURQUESA deve romper o nível -20 de BAIXO PARA CIMA.

2. SINAL DE VENDA (SELL):
   - MOMENTUM (5): A linha TURQUESA deve cruzar a linha central de CIMA PARA BAIXO exatamente na abertura.
   - WILLIAMS %R (7): A linha TURQUESA deve romper o nível -80 de CIMA PARA BAIXO.

INSTRUÇÃO CRÍTICA DE SINCRONISMO:
- Analise a trajetória das linhas turquesas nos últimos segundos da vela anterior.
- Se as linhas já cruzaram há muito tempo, retorne WAIT e use EXATAMENTE esta justificativa: "A análise técnica indica que o momento de entrada já passou. Tanto o Momentum quanto o Williams %R já estão situados além de suas linhas de gatilho. A estratégia exige um cruzamento no momento da abertura, o que não está ocorrendo agora; as linhas mostram sinais de lateralização ou correção após o movimento recente."
- O sinal deve ser validado para a vela que nasce no 00s.
- Se não houver explosão direcional na abertura, retorne WAIT.` }
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
    console.error("Prisma Analysis Error:", error);
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
