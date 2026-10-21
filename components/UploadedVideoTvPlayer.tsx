import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isTvAudioUnlocked, onTvAudioUnlock } from '../utils/tvSounds.ts';

type UploadedVideoTvPlayerProps = {
  src: string;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill';
  /** Padrão true; desligue quando houver playlist para avançar no onEnded. */
  loop?: boolean;
  onEnded?: () => void;
};

function objectFitClass(fit: UploadedVideoTvPlayerProps['objectFit']): string {
  switch (fit) {
    case 'cover':
      return 'object-cover';
    case 'fill':
      return 'object-fill';
    default:
      return 'object-contain';
  }
}

/**
 * Vídeo na TV: começa mudo para o Chrome permitir o autoplay.
 * Depois do primeiro toque, o som permanece ligado também na troca de slide.
 * Se o navegador recusar o áudio, o vídeo continua mudo em vez de congelar.
 */
const UploadedVideoTvPlayer: React.FC<UploadedVideoTvPlayerProps> = ({
  src,
  className = 'absolute inset-0 h-full w-full',
  objectFit = 'contain',
  loop = true,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [audible, setAudible] = useState(isTvAudioUnlocked);

  useEffect(() => onTvAudioUnlock(() => setAudible(true)), []);

  /** Garante que o vídeo está tocando; se preciso, volta a mutar (mudo sempre toca). */
  const ensurePlaying = useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;
    if (!el.paused && !el.ended) return;
    el.muted = !audible;
    try {
      await el.play();
    } catch {
      if (!el.muted) {
        el.muted = true;
        try {
          await el.play();
        } catch {
          /* o watchdog tenta de novo */
        }
      }
    }
  }, [audible]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !audible;

    const onReady = () => void ensurePlaying();
    const onPause = () => void ensurePlaying();
    el.addEventListener('canplay', onReady);
    el.addEventListener('loadeddata', onReady);
    el.addEventListener('pause', onPause);

    const timers = [0, 150, 500, 1500, 4000].map((ms) =>
      window.setTimeout(() => void ensurePlaying(), ms)
    );
    const watchdog = window.setInterval(() => void ensurePlaying(), 3000);

    return () => {
      el.removeEventListener('canplay', onReady);
      el.removeEventListener('loadeddata', onReady);
      el.removeEventListener('pause', onPause);
      timers.forEach(clearTimeout);
      window.clearInterval(watchdog);
    };
  }, [src, audible, ensurePlaying]);

  return (
    <video
      ref={videoRef}
      key={src}
      src={src}
      className={`${objectFitClass(objectFit)} ${className}`}
      playsInline
      autoPlay
      muted={!audible}
      loop={loop}
      preload="auto"
      controls={false}
      onEnded={onEnded}
    />
  );
};

export default UploadedVideoTvPlayer;
