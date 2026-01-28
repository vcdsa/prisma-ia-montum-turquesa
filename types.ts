
export enum SignalType {
  BUY = 'BUY',
  WAIT = 'WAIT',
  IDLE = 'IDLE'
}

export type ZoneType = 'X' | 'N' | 'M' | 'W' | 'Z' | 'None';
export type MarketCondition = 'Zona Zero' | 'Normal' | 'Manipulação';

export interface AnalysisResult {
  signal: SignalType;
  confidence: number;
  reasoning: string;
  momentumCrossing: boolean;
  williamsCrossing: boolean;
  rsiValue: number;
  zoneDetected: ZoneType;
  condition: MarketCondition;
  trend: 'LTA' | 'LTB' | 'Neutral';
  multiTimeframeConfirmation: boolean;
  candleStrength: 'Weak' | 'Medium' | 'Strong';
  timestamp: number;
}

export interface CaptureStats {
  resolution: string;
  frameRate: number;
  isHD: boolean;
  source: string;
}

export interface AnalysisLogEntry extends AnalysisResult {
  id: string;
}
