import React, { useEffect, useState } from 'react';
import { formatStageWait } from '../utils/stageWait.ts';

const RED = '#ff1a1a';

/**
 * Tempo em vermelho vivo na coluna Mecânico (14%).
 * A cor fica no style: o card de Aguardando Avaliação é quase preto com texto cinza,
 * e uma classe do Tailwind CDN que não gera herda esse cinza.
 */
export const AwaitingEvalTimer: React.FC<{ since?: string | null }> = ({ since }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="inline-flex min-w-0 max-w-full items-center gap-1.5" style={{ color: RED }}>
      <span
        className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
        style={{
          border: `2px solid ${RED}`,
          boxShadow: '0 0 10px rgba(255, 26, 26, 0.95)',
        }}
        aria-hidden
      >
        <span className="absolute left-1/2 top-1/2 h-0 w-0 animate-clock-hand-slow">
          <span
            className="absolute bottom-0 left-1/2 h-[5px] w-[2px] -translate-x-1/2 origin-bottom rounded-full"
            style={{ backgroundColor: RED }}
          />
        </span>
        <span className="absolute left-1/2 top-1/2 h-0 w-0 animate-clock-hand-fast">
          <span
            className="absolute bottom-0 left-1/2 h-[7px] w-[2px] -translate-x-1/2 origin-bottom rounded-full"
            style={{ backgroundColor: RED }}
          />
        </span>
      </span>
      <span
        style={{
          color: RED,
          fontSize: '1.35rem',
          fontWeight: 900,
          fontStyle: 'normal',
          textTransform: 'none',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          whiteSpace: 'nowrap',
          textShadow: '0 0 12px rgba(255, 26, 26, 0.95)',
        }}
      >
        {formatStageWait(since, now)}
      </span>
    </span>
  );
};
