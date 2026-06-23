import React, { useCallback, useEffect, useRef } from 'react';

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
 * Vídeo na TV: autoplay mutado (sempre permitido pelo Chrome) e à prova de congelamento.
 * O som só é liberado após um toque/clique na tela (gesto do usuário), sem nunca pausar o vídeo.
 */
const UploadedVideoTvPlayer: React.FC<UploadedVideoTvPlayerProps> = ({
  src,
  className = 'absolute inset-0 h-full w-full',
  objectFit = 'contain',
  loop = true,
  onEnded,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  /** Garante que o vídeo está tocando; se preciso, volta a mutar (mudo sempre toca). */
  const ensurePlaying = useCallback(async () => {
    const el = videoRef.current;
    if (!el) return;
    if (!el.paused && !el.ended) return;
    try {
      await el.play();
    } catch {
      el.muted = true;
      try {
        await el.play();
      } catch {
        /* o watchdog tenta de novo */
      }
    }
  }, []);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;

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
  }, [src, ensurePlaying]);

  /** Som ao primeiro toque/clique na TV, sem risco de travar a reprodução. */
  useEffect(() => {
    const enableSound = () => {
      const el = videoRef.current;
      if (!el) return;
      el.muted = false;
      el.play().catch(() => {
        el.muted = true;
        el.play().catch(() => {});
      });
    };
    window.addEventListener('pointerdown', enableSound);
    return () => window.removeEventListener('pointerdown', enableSound);
  }, []);

  return (
    <video
      ref={videoRef}
      key={src}
      src={src}
      className={`${objectFitClass(objectFit)} ${className}`}
      playsInline
      autoPlay
      muted
      loop={loop}
      preload="auto"
      controls={false}
      onEnded={onEnded}
    />
  );
};

export default UploadedVideoTvPlayer;
