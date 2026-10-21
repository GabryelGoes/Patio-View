import React, { useEffect, useState } from 'react';
import { formatStageWait } from '../utils/stageWait.ts';

const RED = '#ff1a1a';

/**
 * Cronômetro da etapa Aguardando Avaliação.
 * A cor vai em style (não em classe arbitrária do Tailwind CDN): o card dessa
 * etapa é quase preto com texto cinza, e uma classe que o CDN não gera deixa
 * o relógio invisível.
 */
export const AwaitingEvalTimer: React.FC<{ since?: string | null }> = ({ since }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="inline-flex max-w-full shrink-0 items-center gap-2.5" style={{ color: RED }}>
      <span
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{
          border: `3px solid ${RED}`,
          boxShadow: '0 0 14px rgba(255, 26, 26, 0.95)',
        }}
        aria-hidden
      >
        <span className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 animate-clock-hand-slow">
          <span
            className="absolute bottom-0 left-1/2 h-[8px] w-[3px] -translate-x-1/2 origin-bottom rounded-full"
            style={{ backgroundColor: RED }}
          />
        </span>
        <span className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 animate-clock-hand-fast">
          <span
            className="absolute bottom-0 left-1/2 h-[11px] w-[3px] -translate-x-1/2 origin-bottom rounded-full"
            style={{ backgroundColor: RED }}
          />
        </span>
      </span>
      <span
        className="truncate tabular-nums"
        style={{
          color: RED,
          fontSize: '2rem',
          fontWeight: 900,
          fontStyle: 'normal',
          textTransform: 'none',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          textShadow: '0 0 16px rgba(255, 26, 26, 0.95)',
        }}
      >
        {formatStageWait(since, now)}
      </span>
    </span>
  );
};
