
import { useState, useCallback, useRef, useEffect } from 'react';
import { CaptureStats } from '../types';

export function useScreenCapture() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [captureSource, setCaptureSource] = useState<string>('none');
  
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const stopCapture = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`Track ${track.kind} parada.`);
      });
      streamRef.current = null;
      setStream(null);
      setCaptureSource('none');
    }
  }, []);

  const startCapture = useCallback(async () => {
    try {
      setIsSelecting(true);
      setError(null);

      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Seu navegador não suporta a captura de tela. Tente usar Chrome ou Edge atualizados.");
      }

      console.log("Solicitando permissão de captura de tela...");
      
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          displaySurface: "window",
          cursor: "always"
        } as any,
        audio: false,
      });

      const videoTrack = mediaStream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error("Nenhuma trilha de vídeo encontrada no stream.");
      }

      console.log("Captura autorizada com sucesso.");
      
      const label = videoTrack.label || "Gráfico Selecionado";
      
      streamRef.current = mediaStream;
      setStream(mediaStream);
      setCaptureSource(label);
      setIsSelecting(false);

      videoTrack.onended = () => {
        console.log("Captura encerrada pelo usuário ou sistema.");
        stopCapture();
      };

      return mediaStream;
    } catch (err: any) {
      console.error("Falha detalhada na Captura:", err);
      setIsSelecting(false);
      
      let userMessage = "Erro ao iniciar captura.";
      
      if (err.name === 'NotAllowedError') {
        userMessage = "Permissão negada ou política de segurança bloqueando. Certifique-se de clicar em 'Permitir' e que o site tem autorização para 'display-capture'.";
      } else if (err.message.includes('permissions policy')) {
        userMessage = "A política de permissões do navegador bloqueou a captura. Verifique as configurações de segurança do site.";
      } else {
        userMessage = err.message || "Não foi possível acessar a tela.";
      }
      
      setError(userMessage);
      return null;
    }
  }, [stopCapture]);

  const captureFrameBase64 = useCallback((): string | null => {
    if (!videoRef.current || !stream || !stream.active) return null;
    
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // 1280x720 é o 'sweet spot' para os modelos de visão detectarem linhas finas
    const width = 1280;
    const height = video.videoHeight ? (video.videoHeight / video.videoWidth) * width : 720;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return null;
    
    try {
      ctx.drawImage(video, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
      return dataUrl.split(',')[1];
    } catch (e) {
      console.error("Erro ao desenhar frame no canvas:", e);
      return null;
    }
  }, [stream]);

  const getStats = (): CaptureStats | null => {
    if (!streamRef.current) return null;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return null;
    const s = track.getSettings();
    return {
      resolution: `${s.width || 0}x${s.height || 0}`,
      frameRate: s.frameRate || 0,
      isHD: (s.width || 0) >= 1280,
      source: track.label
    };
  };

  return { 
    stream, 
    error, 
    startCapture, 
    stopCapture,
    isSelecting,
    captureSource,
    videoRef,
    captureFrameBase64,
    getStats,
    isCapturing: !!stream && stream.active,
  };
}
