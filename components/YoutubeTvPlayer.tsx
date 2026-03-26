import React, { useCallback, useEffect, useRef, useState } from 'react';

/** Origem do iframe do embed padrão (deve bater com o domínio do embed). */
const YT_EMBED_ORIGIN = 'https://www.youtube.com';

/**
 * Parâmetros que o YouTube costuma respeitar para kiosk/TV:
 * - playlist = mesmo videoId: em muitos casos destrava autoplay em vídeo único.
 * - mute=1: política de autoplay do navegador (som tentamos depois via postMessage).
 * - enablejsapi=1: permite comandos por postMessage.
 */
function buildYoutubeEmbedSrc(videoId: string): string {
  const q = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    modestbranding: '1',
    rel: '0',
    playsinline: '1',
    disablekb: '1',
    fs: '0',
    iv_load_policy: '3',
    cc_load_policy: '0',
    enablejsapi: '1',
    playlist: videoId,
  });
  return `https://www.youtube.com/embed/${videoId}?${q.toString()}`;
}

function postYtCommand(contentWindow: Window, func: string, args: unknown[] = []) {
  try {
    contentWindow.postMessage(JSON.stringify({ event: 'command', func, args }), YT_EMBED_ORIGIN);
  } catch {
    /* ignore */
  }
}

interface YoutubeTvPlayerProps {
  videoId: string;
  title?: string;
}

/**
 * Embed direto + retentativas de play/unMute via API de iframe (postMessage).
 * Evita depender só da IFrame API (script), que pode falhar em timing ou layout.
 */
const YoutubeTvPlayer: React.FC<YoutubeTvPlayerProps> = ({ videoId, title }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  /** Atrasa o primeiro src para o layout já ter altura (flex) antes do load do iframe. */
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    setSrc(null);
    const t = window.setTimeout(() => {
      setSrc(buildYoutubeEmbedSrc(videoId));
    }, 50);
    return () => clearTimeout(t);
  }, [videoId]);

  const kickPlayback = useCallback(() => {
    const w = iframeRef.current?.contentWindow;
    if (!w) return;
    const delays = [0, 120, 400, 900, 2000, 4000];
    delays.forEach((delay) => {
      window.setTimeout(() => {
        postYtCommand(w, 'playVideo');
        postYtCommand(w, 'unMute');
      }, delay);
    });
  }, []);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== YT_EMBED_ORIGIN) return;
      if (typeof e.data !== 'string') return;
      let parsed: { event?: string };
      try {
        parsed = JSON.parse(e.data) as { event?: string };
      } catch {
        return;
      }
      if (parsed.event !== 'onReady') return;
      const w = iframeRef.current?.contentWindow;
      if (!w) return;
      postYtCommand(w, 'playVideo');
      postYtCommand(w, 'unMute');
    };
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, [videoId]);

  if (!src) {
    return <div className="absolute inset-0 bg-black" aria-hidden />;
  }

  return (
    <iframe
      ref={iframeRef}
      key={videoId}
      title={title || 'Vídeo'}
      src={src}
      className="absolute inset-0 h-full w-full border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      onLoad={kickPlayback}
    />
  );
};

export default YoutubeTvPlayer;
