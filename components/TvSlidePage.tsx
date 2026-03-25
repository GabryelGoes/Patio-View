import React from 'react';
import type { TvSlide } from '../types.ts';

interface TvSlidePageProps {
  slide: TvSlide;
}

function formatMoney(n: number): string {
  try {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
  } catch {
    return String(n);
  }
}

const TvSlidePage: React.FC<TvSlidePageProps> = ({ slide }) => {
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
      let embed = slide.mediaUrl;
      const m = slide.mediaUrl.match(/(?:youtu\.be\/|v=)([\w-]{11})/);
      if (m) embed = `https://www.youtube.com/embed/${m[1]}?autoplay=1&mute=1`;
      return (
        <div className="flex-1 flex items-center justify-center min-h-0 px-6 py-4">
          <iframe
            title={slide.title || 'Vídeo'}
            src={embed}
            className="w-full max-w-5xl aspect-video rounded-2xl border border-white/10"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    return (
      <div className="flex-1 flex items-center justify-center min-h-0 px-6 py-4">
        <video
          src={slide.mediaUrl}
          className="max-w-full max-h-full rounded-2xl"
          controls
          autoPlay
          muted
          playsInline
        />
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
          <div className="flex justify-between text-yellow-400 font-black text-2xl md:text-4xl">
            <span>{formatMoney(cur)}</span>
            <span className="text-white/40">/</span>
            <span>{formatMoney(tgt)}</span>
          </div>
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
