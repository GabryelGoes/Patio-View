import React, { useEffect, useRef } from 'react';

/** Tipos mínimos da IFrame API (evita dependência @types/youtube). */
interface YtPlayerLike {
  destroy(): void;
  unMute(): void;
  playVideo(): void;
  mute(): void;
}

interface YtPlayerEvent {
  target: YtPlayerLike;
  data: number;
}

type YtPlayerConstructor = new (
  el: HTMLElement,
  opts: {
    videoId: string;
    width: string;
    height: string;
    playerVars: Record<string, string | number>;
    events?: {
      onReady?: (e: YtPlayerEvent) => void;
      onStateChange?: (e: YtPlayerEvent) => void;
    };
  }
) => YtPlayerLike;

declare global {
  interface Window {
    YT?: { Player: YtPlayerConstructor; PlayerState?: { PLAYING: number } };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiReadyPromise: Promise<void> | null = null;

function ensureYoutubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.YT?.Player) return Promise.resolve();

  if (!apiReadyPromise) {
    apiReadyPromise = new Promise<void>((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const s = document.createElement('script');
        s.src = 'https://www.youtube.com/iframe_api';
        s.async = true;
        document.head.appendChild(s);
      }
    });
  }
  return apiReadyPromise;
}

interface YoutubeTvPlayerProps {
  videoId: string;
  title?: string;
}

/**
 * Player via IFrame API: autoplay confiável (começa mudo por política do navegador)
 * e tentativa de ativar som logo após o ready / ao entrar em PLAYING.
 */
const YoutubeTvPlayer: React.FC<YoutubeTvPlayerProps> = ({ videoId, title }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayerLike | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cancelled = false;

    const tryUnmuteAndPlay = (p: YtPlayerLike) => {
      try {
        p.playVideo();
      } catch {
        /* ignore */
      }
      try {
        p.unMute();
      } catch {
        /* ignore */
      }
    };

    const run = async () => {
      await ensureYoutubeIframeApi();
      if (cancelled || !containerRef.current || !window.YT?.Player) return;

      const YT = window.YT;
      const PLAYING = YT.PlayerState?.PLAYING ?? 1;

      const playerVars: Record<string, string | number> = {
        autoplay: 1,
        mute: 1,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        fs: 0,
        disablekb: 1,
        playsinline: 1,
        iv_load_policy: 3,
        cc_load_policy: 0,
      };
      if (typeof window !== 'undefined' && window.location.origin) {
        playerVars.origin = window.location.origin;
      }

      playerRef.current = new YT.Player(container, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars,
        events: {
          onReady: (e) => {
            tryUnmuteAndPlay(e.target);
          },
          onStateChange: (e) => {
            if (e.data === PLAYING) {
              tryUnmuteAndPlay(e.target);
            }
          },
        },
      });
    };

    void run();

    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, [videoId]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full [&_iframe]:absolute [&_iframe]:inset-0 [&_iframe]:h-full [&_iframe]:w-full [&_iframe]:border-0"
      aria-label={title || 'Vídeo'}
    />
  );
};

export default YoutubeTvPlayer;
