import React from 'react';
import YoutubeTvPlayer from './YoutubeTvPlayer.tsx';
import type { TvSlide } from '../types.ts';

interface TvSlidePageProps {
  slide: TvSlide;
  /** Slide tipo meta: true = atual/meta em R$, false = só %. */
  goalSlideShowValues?: boolean;
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

const TvSlidePage: React.FC<TvSlidePageProps> = ({ slide, goalSlideShowValues = false }) => {
  const t = slide.slideType;

  if (t === 'image' && slide.mediaUrl) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-0 px-6 py-4">
        <img
          src={slide.mediaUrl}
          alt={slide.title || 'Imagem'}
          className="max-w-full max-h-full object-contain rounded-2xl border border-white/10 shadow-2xl"
        />
      </div>
    );
  }

  if (t === 'video' && slide.mediaUrl) {
    const isYoutube = /youtube\.com|youtu\.be/.test(slide.mediaUrl);
    if (isYoutube) {
      const id = extractYoutubeId(slide.mediaUrl);
      if (!id) {
        return (
          <div className="flex-1 flex items-center justify-center text-red-400/90 font-bold px-6">
            Link do YouTube inválido
          </div>
        );
      }
      return (
        <div className="relative flex-1 min-h-0 w-full flex flex-col">
          {/* Altura mínima em vh: com 100% do pai ainda não calculado, min(100%,70vh) virava 0 e o iframe não carregava direito. */}
          <div className="relative flex-1 min-h-[50vh] w-full overflow-hidden rounded-2xl border border-white/10 bg-black shadow-2xl">
            <YoutubeTvPlayer videoId={id} title={slide.title || 'Vídeo'} />
          </div>
        </div>
      );
    }
    return (
      <div className="relative flex-1 min-h-0 w-full flex flex-col">
        <div className="relative flex-1 min-h-[50vh] w-full overflow-hidden rounded-2xl border border-white/10 bg-black">
          <video
            src={slide.mediaUrl}
            className="absolute inset-0 h-full w-full object-contain"
            playsInline
            autoPlay
            controls={false}
            muted={false}
          />
        </div>
      </div>
    );
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
          {goalSlideShowValues ? (
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
