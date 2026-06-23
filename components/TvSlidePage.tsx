import React, { useEffect, useMemo, useState } from 'react';
import YoutubeTvPlayer from './YoutubeTvPlayer.tsx';
import UploadedVideoTvPlayer from './UploadedVideoTvPlayer.tsx';
import LocalVideoTvPlayer from './LocalVideoTvPlayer.tsx';
import { isLocalVideoRef, localVideoName } from '../utils/localVideoFolder.ts';
import { getVideoSources, resolveActiveVideoIndex } from '../utils/tvSlideVideo.ts';
import type { TvSlide } from '../types.ts';

interface TvSlidePageProps {
  slide: TvSlide;
  /** Mídia ocupa a tela toda (sem cabeçalho/bordas). */
  fullscreen?: boolean;
}

function imgFitClass(fit: TvSlide['mediaObjectFit']): string {
  switch (fit) {
    case 'cover':
      return 'object-cover';
    case 'fill':
      return 'object-fill';
    default:
      return 'object-contain';
  }
}

function formatMoney(n: number): string {
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  } catch {
    return String(n);
  }
}

/** Extrai o ID de qualquer URL comum do YouTube. */
function extractYoutubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/|live\/)([a-zA-Z0-9_-]{11})/);
  if (m) return m[1];
  try {
    const u = new URL(url);
    const v = u.searchParams.get('v');
    if (v && /^[\w-]{11}$/.test(v)) return v;
  } catch {
    /* ignore */
  }
  return null;
}

/** Reproduz a playlist do slide: respeita rotação do App e avança ao terminar cada vídeo. */
const TvVideoSlideContent: React.FC<{ slide: TvSlide; fullscreen: boolean }> = ({ slide, fullscreen }) => {
  const sources = useMemo(() => getVideoSources(slide), [slide]);
  const startIndex = useMemo(() => resolveActiveVideoIndex(slide), [slide]);
  const [index, setIndex] = useState(startIndex);
  const hasPlaylist = sources.length > 1;

  useEffect(() => {
    setIndex(startIndex);
  }, [slide.id, startIndex, sources.join('|')]);

  const mediaUrl = sources[index] ?? sources[0] ?? slide.mediaUrl?.trim() ?? null;

  if (!mediaUrl) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-8 text-center">
        <p className="text-xl font-black text-amber-300">Vídeo não configurado</p>
        <p className="max-w-lg text-sm font-semibold text-zinc-400">
          No painel de gestão, abra o slide de vídeo e adicione pelo menos um arquivo na rotação.
        </p>
      </div>
    );
  }

  const advancePlaylist = () => {
    if (!hasPlaylist) return;
    setIndex((i) => (i + 1) % sources.length);
  };

  const isYoutube = /youtube\.com|youtu\.be/.test(mediaUrl);
  if (isYoutube) {
    const id = extractYoutubeId(mediaUrl);
    if (!id) {
      return (
        <div className="flex-1 flex items-center justify-center text-red-400/90 font-bold px-6">
          Link do YouTube inválido
        </div>
      );
    }
    if (fullscreen) {
      return (
        <div className="absolute inset-0 bg-black">
          <YoutubeTvPlayer videoId={id} title={slide.title || 'Vídeo'} />
        </div>
      );
    }
    return (
      <div className="relative flex-1 min-h-0 w-full flex flex-col">
        <div className="relative flex-1 min-h-[50vh] w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
          <YoutubeTvPlayer videoId={id} title={slide.title || 'Vídeo'} />
        </div>
      </div>
    );
  }

  const videoFit = slide.mediaObjectFit ?? 'contain';
  const player = isLocalVideoRef(mediaUrl) ? (
    <LocalVideoTvPlayer
      key={mediaUrl}
      name={localVideoName(mediaUrl)}
      objectFit={videoFit}
      loop={!hasPlaylist}
      onEnded={hasPlaylist ? advancePlaylist : undefined}
    />
  ) : (
    <UploadedVideoTvPlayer
      key={mediaUrl}
      src={mediaUrl}
      objectFit={videoFit}
      loop={!hasPlaylist}
      onEnded={hasPlaylist ? advancePlaylist : undefined}
    />
  );

  if (fullscreen) {
    return <div className="absolute inset-0 bg-black">{player}</div>;
  }
  return (
    <div className="relative flex-1 min-h-0 w-full flex flex-col">
      <div className="relative flex-1 min-h-[50vh] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
        {player}
      </div>
    </div>
  );
};

const TvSlidePage: React.FC<TvSlidePageProps> = ({ slide, fullscreen = false }) => {
  const t = slide.slideType;

  if (t === 'image' && slide.mediaUrl) {
    const fit = imgFitClass(slide.mediaObjectFit);
    if (fullscreen) {
      return (
        <div className="absolute inset-0 bg-black">
          <img src={slide.mediaUrl} alt={slide.title || 'Imagem'} className={`h-full w-full ${fit}`} />
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center min-h-0 px-6 py-4">
        <img
          src={slide.mediaUrl}
          alt={slide.title || 'Imagem'}
          className={`max-w-full max-h-full ${fit} rounded-2xl border border-white/10 shadow-2xl`}
        />
      </div>
    );
  }

  if (t === 'video') {
    return <TvVideoSlideContent slide={slide} fullscreen={fullscreen} />;
  }

  if (t === 'goal') {
    const cur = slide.goalCurrent ?? 0;
    const tgt = slide.goalTarget ?? 1;
    const pct = tgt > 0 ? Math.min(100, Math.max(0, (cur / tgt) * 100)) : 0;
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-10 gap-8">
        <h2 className="text-4xl md:text-6xl font-black text-white text-center uppercase tracking-tight">
          {slide.goalLabel || slide.title || 'Meta'}
        </h2>
        <div className="w-full max-w-3xl space-y-4">
          {slide.goalShowValues === true ? (
            <div className="flex justify-between text-yellow-400 font-black text-2xl md:text-4xl gap-4">
              <span className="min-w-0 truncate">{formatMoney(cur)}</span>
              <span className="text-white/40 shrink-0">/</span>
              <span className="min-w-0 truncate text-right">{formatMoney(tgt)}</span>
            </div>
          ) : (
            <p className="text-center text-5xl md:text-7xl font-black tabular-nums text-yellow-400">{Math.round(pct)}%</p>
          )}
          <div className="h-6 rounded-full bg-white/10 overflow-hidden border border-white/20">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-yellow-400 to-orange-500 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        {slide.body ? <p className="text-zinc-400 text-center text-lg max-w-2xl">{slide.body}</p> : null}
      </div>
    );
  }

  const isAlert = t === 'alert';
  return (
    <div
      className={`flex-1 flex flex-col items-center justify-center min-h-0 px-10 gap-6 ${
        isAlert ? 'animate-pulse' : ''
      }`}
    >
      <h2
        className={`text-4xl md:text-7xl font-black text-center uppercase leading-tight ${
          isAlert ? 'text-red-400' : 'text-yellow-400'
        }`}
      >
        {slide.title || (isAlert ? 'Alerta' : 'Aviso')}
      </h2>
      {slide.body ? (
        <p className="text-xl md:text-3xl text-zinc-200 text-center max-w-4xl leading-relaxed font-medium">
          {slide.body}
        </p>
      ) : null}
    </div>
  );
};

export default TvSlidePage;
