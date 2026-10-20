import React, { useEffect, useState } from 'react';
import { formatStageWait } from '../utils/stageWait.ts';

/** Cronômetro da etapa Aguardando Avaliação: relógio e tempo em vermelho vivo, unidades em minúsculo. */
export const AwaitingEvalTimer: React.FC<{ since?: string | null }> = ({ since }) => {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="inline-flex shrink-0 items-center gap-2 text-[#ff1a1a]">
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-visible rounded-full border-2 border-current">
        <span className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 animate-clock-hand-slow">
          <span className="absolute bottom-0 left-1/2 h-[5px] w-[2px] -translate-x-1/2 origin-bottom rounded-full bg-current" />
        </span>
        <span className="absolute left-1/2 top-1/2 h-0 w-0 -translate-x-1/2 -translate-y-1/2 animate-clock-hand-fast">
          <span className="absolute bottom-0 left-1/2 h-[7px] w-[2px] -translate-x-1/2 origin-bottom rounded-full bg-current" />
        </span>
      </span>
      <span className="text-[1.65rem] font-black normal-case not-italic leading-none tracking-tight text-[#ff1a1a] tabular-nums drop-shadow-[0_0_12px_rgba(255,26,26,0.95)]">
        {formatStageWait(since, now)}
      </span>
    </span>
  );
};
