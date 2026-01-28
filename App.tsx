
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useScreenCapture } from './hooks/useScreenCapture';
import { analyzeChartFrame } from './services/geminiService';
import { SignalType, AnalysisResult, AnalysisLogEntry } from './types';
import { 
  Cpu, Play, Square, AlertCircle, TrendingUp, 
  BarChart3, ShieldCheck, RefreshCw, Zap, Timer, BellRing, MousePointer2, Volume2
} from 'lucide-react';

const App: React.FC = () => {
  const { 
    stream, error, startCapture, stopCapture, isSelecting, 
    captureSource, videoRef, captureFrameBase64, isCapturing 
  } = useScreenCapture();

  const [lastAnalysis, setLastAnalysis] = useState<AnalysisResult | null>(null);
  const [logs, setLogs] = useState<AnalysisLogEntry[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [nextCandleIn, setNextCandleIn] = useState(60);
  const [isTradeActive, setIsTradeActive] = useState(false);
  
  const analysisPerformedThisMinute = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializa som e voz
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playAlert = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => console.log('Áudio requer interação prévia.'));
    }
    // Notificação por voz
    speak("Sinal de compra identificado! Prepare a entrada.");
  };

  const runPrismaAnalysis = useCallback(async () => {
    if (!isCapturing || isAnalyzing || isTradeActive) return;

    setIsAnalyzing(true);
    const frame = captureFrameBase64();
    
    if (frame) {
      const result = await analyzeChartFrame(frame);
      setLastAnalysis(result);

      if (result.signal === SignalType.BUY) {
        setIsTradeActive(true);
        playAlert();
        
        // Bloqueia nova análise por 60 segundos exatos para o tempo da vela
        setTimeout(() => {
          setIsTradeActive(false);
          setLastAnalysis(null);
        }, 60000);
      }

      setLogs(prev => [
        { ...result, id: Math.random().toString(36).substr(2, 9) },
        ...prev.slice(0, 24)
      ]);
    }
    setIsAnalyzing(false);
  }, [isCapturing, isAnalyzing, isTradeActive, captureFrameBase64]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const seconds = now.getSeconds();
      setNextCandleIn(60 - seconds);

      // Gatilho aos 58s para sincronismo perfeito no 00s
      if (seconds === 58 && !analysisPerformedThisMinute.current && isCapturing && !isTradeActive) {
        analysisPerformedThisMinute.current = true;
        runPrismaAnalysis();
      }

      if (seconds === 0) {
        analysisPerformedThisMinute.current = false;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isCapturing, isTradeActive, runPrismaAnalysis]);

  return (
    <div className="min-h-screen bg-[#020202] text-white flex flex-col font-sans selection:bg-cyan-500/30 overflow-x-hidden">
      {/* Header */}
      <header className="h-20 border-b border-white/5 bg-black/40 backdrop-blur-2xl flex items-center justify-between px-8 sticky top-0 z-[100]">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-12 h-12 bg-cyan-600 rounded-2xl rotate-3 flex items-center justify-center shadow-[0_0_30px_rgba(8,145,178,0.5)]">
              <Cpu className="text-black w-6 h-6 -rotate-3" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#020202] animate-pulse" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase">PRISMA<span className="text-cyan-400 italic">IA</span></h1>
            <p className="text-[10px] text-gray-500 font-bold tracking-[0.3em] uppercase">M1 Voice Sync v5.8</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {isTradeActive && (
            <div className="flex items-center gap-3 px-6 py-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full animate-pulse shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Volume2 className="w-4 h-4 text-emerald-400" />
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">ALERTA DE VOZ ATIVO</span>
            </div>
          )}
          <button
            onClick={isCapturing ? stopCapture : startCapture}
            className={`px-8 py-3 rounded-2xl font-black text-sm transition-all transform active:scale-95 shadow-2xl flex items-center gap-3 ${
              isCapturing 
              ? 'bg-rose-500/20 border border-rose-500/40 text-rose-500 hover:bg-rose-500 hover:text-white' 
              : 'bg-cyan-500 text-black shadow-cyan-500/40 hover:bg-cyan-400'
            }`}
          >
            {isCapturing ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            {isCapturing ? 'PARAR SCANNER' : 'CONECTAR M1'}
          </button>
        </div>
      </header>

      <main className="container mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow">
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Monitor */}
          <div className="relative aspect-video bg-[#050505] rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl ring-1 ring-white/10">
            {!isCapturing ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center bg-grid opacity-80">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/5 animate-pulse">
                  <BarChart3 className="text-gray-700 w-10 h-10" />
                </div>
                <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter text-white">Scanner Vocabular</h2>
                <p className="text-gray-500 text-sm max-w-sm">O robô emitirá um aviso sonoro e falado ao identificar o sinal de Momentum.</p>
              </div>
            ) : (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-60" />
                
                {/* Status Sensores */}
                <div className="absolute top-10 right-10 flex flex-col gap-3">
                  <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] min-w-[240px] shadow-2xl">
                    <p className="text-[10px] text-gray-500 font-black uppercase mb-4 tracking-widest flex items-center gap-2">
                      <ShieldCheck className="w-3 h-3 text-cyan-400" />
                      Análise Turquesa
                    </p>
                    <div className="space-y-4">
                      <IndicatorRow label="Momentum(5) ↑" active={!!lastAnalysis?.momentumCrossing} />
                      <IndicatorRow label="Williams(7) ↑" active={!!lastAnalysis?.williamsCrossing} />
                    </div>
                  </div>
                </div>

                {/* Sincronismo */}
                <div className="absolute bottom-10 left-10">
                  <div className="bg-black/95 p-6 rounded-3xl border border-white/10 flex items-center gap-6 shadow-2xl">
                    <div className="relative w-16 h-16">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/5" />
                        <circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" strokeWidth="4" 
                          strokeDasharray="175.9" strokeDashoffset={175.9 - (nextCandleIn / 60) * 175.9}
                          className="text-cyan-500 transition-all duration-1000" />
                      </svg>
                      <span className="absolute inset-0 flex items-center justify-center text-lg font-black mono text-white">{nextCandleIn}s</span>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-600 font-black uppercase mb-0.5 tracking-widest">Tempo de Vela</p>
                      <p className="text-xs font-bold text-white uppercase tracking-tighter">Sync de Voz M1</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SINAL DE COMPRA FLASH */}
            {lastAnalysis?.signal === SignalType.BUY && isTradeActive && (
              <div className="absolute inset-0 bg-cyan-500/30 backdrop-blur-[20px] flex items-center justify-center animate-in fade-in zoom-in duration-500">
                <div className="bg-black/95 p-20 rounded-[8rem] border-[6px] border-cyan-400 shadow-[0_0_300px_rgba(34,211,238,1)] text-center scale-110">
                  <div className="flex justify-center mb-8">
                    <div className="p-12 bg-cyan-500 rounded-full animate-bounce shadow-[0_0_100px_rgba(6,182,212,1)]">
                      <TrendingUp className="text-black w-24 h-24" />
                    </div>
                  </div>
                  <h2 className="text-[10rem] font-black italic tracking-tighter text-cyan-400 leading-none">COMPRA</h2>
                  <div className="mt-10 space-y-4">
                    <p className="font-black tracking-[0.6em] text-[18px] uppercase text-white animate-pulse italic">SINAL CONFIRMADO POR VOZ</p>
                    <p className="text-[12px] text-gray-500 font-bold uppercase tracking-widest">Aguardando fechamento do candle...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard label="Processamento" value={isTradeActive ? 'SINAL ATIVO' : (isAnalyzing ? 'SINCRONIZANDO' : 'SCANNER ON')} active={isAnalyzing || isTradeActive} />
            <MetricCard label="Fluxo" value={lastAnalysis?.candleStrength || 'SCANNER...'} active={lastAnalysis?.candleStrength === 'Strong'} />
            <MetricCard label="Precisão" value={lastAnalysis ? `${lastAnalysis.confidence}%` : '0%'} active={!!lastAnalysis && lastAnalysis.confidence > 85} />
            <MetricCard label="Voz" value={isTradeActive ? 'NOTIFICANDO' : 'READY'} active={isTradeActive} />
          </div>
        </div>

        {/* Sidebar Histórico */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-[#080808] rounded-[3rem] border border-white/5 p-8 flex flex-col h-full shadow-2xl">
            <div className="flex items-center justify-between mb-10">
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-400 flex items-center gap-3">
                <Zap className="w-4 h-4 fill-current" />
                Live Analysis Feed
              </h3>
            </div>

            <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {logs.length === 0 ? (
                <div className="opacity-10 flex flex-col items-center justify-center h-full text-center">
                  <BarChart3 className="w-16 h-16 mb-4 text-gray-600" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">Scanner Sincronizado</p>
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className={`p-6 rounded-3xl border transition-all ${log.signal === SignalType.BUY ? 'bg-cyan-500/10 border-cyan-400/40 shadow-lg' : 'bg-white/5 border-white/5'}`}>
                    <div className="flex justify-between items-center mb-3">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${log.signal === SignalType.BUY ? 'bg-cyan-500 text-black' : 'bg-neutral-800 text-gray-500'}`}>
                        {log.signal}
                      </span>
                      <span className="text-[10px] text-gray-600 font-mono">{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed italic">"{log.reasoning}"</p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 p-6 bg-cyan-500/5 rounded-[2rem] border border-cyan-500/10">
              <div className="flex items-center gap-3 mb-3 text-cyan-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-widest font-bold">Voice Alert System</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                As notificações verbais garantem que você não perca o momento exato do nascimento da vela.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 px-8 border-t border-white/5 bg-black/60 flex justify-between items-center text-white">
        <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-gray-600">
          <span>Same Birth Logic</span>
          <span>Buy Only Protocol</span>
          <span>Prisma Voice Engine</span>
        </div>
        <div className="text-[10px] font-mono text-gray-700 tracking-widest uppercase">Prisma IA v5.8.0</div>
      </footer>
    </div>
  );
};

const IndicatorRow = ({ label, active }: { label: string, active: boolean }) => (
  <div className="flex items-center justify-between">
    <span className={`text-[11px] font-black uppercase ${active ? 'text-cyan-400' : 'text-gray-500'}`}>{label}</span>
    <div className={`w-3 h-3 rounded-full transition-all duration-300 ${active ? 'bg-cyan-400 shadow-[0_0_12px_#22d3ee]' : 'bg-gray-800'}`} />
  </div>
);

const MetricCard = ({ label, value, active }: { label: string, value: string, active?: boolean }) => (
  <div className={`p-6 rounded-[2rem] border transition-all duration-500 ${active ? 'bg-cyan-500/10 border-cyan-400/40 shadow-lg' : 'bg-white/5 border-white/5'}`}>
    <p className="text-[9px] text-gray-600 font-black uppercase mb-2 tracking-widest">{label}</p>
    <p className={`text-sm font-black uppercase tracking-tighter text-white ${active ? 'text-cyan-400' : 'text-gray-400'}`}>{value}</p>
  </div>
);

export default App;
