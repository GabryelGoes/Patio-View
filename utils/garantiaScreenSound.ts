/**
 * Som da tela de garantia na TV — tom institucional, moderno e discreto.
 * Arpejo em dó maior (fundamental + terça + quinta) com ataque suave e cauda longa;
 * subgrave muito baixo dá peso sem agressividade (sem dente-de-serra).
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

function playSineNote(
  ctx: AudioContext,
  startTime: number,
  freq: number,
  peakGain: number,
  attackSec: number,
  durationSec: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);
  osc.connect(gain);
  gain.connect(ctx.destination);

  const tEnd = startTime + durationSec;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + attackSec);
  gain.gain.exponentialRampToValueAtTime(0.0006, tEnd);

  osc.start(startTime);
  osc.stop(tEnd + 0.03);
}

/** Toca ao exibir o overlay de garantia na TV (respeita soundEnabled no chamador). */
export async function playGarantiaScreenSound(): Promise<void> {
  try {
    const ctx = getContext();
    if (ctx.state === "suspended") await ctx.resume();

    const now = ctx.currentTime;
    // C maior: C5 → E5 → G5 → C6 — sensação de clareza, confiança e serviço premium
    const c5 = 523.25;
    const e5 = 659.25;
    const g5 = 783.99;
    const c6 = 1046.5;

    // Fundo grave (C3) — presença institucional, volume mínimo
    playSineNote(ctx, now, 130.81, 0.022, 0.08, 1.35);

    playSineNote(ctx, now + 0.0, c5, 0.1, 0.045, 0.95);
    playSineNote(ctx, now + 0.14, e5, 0.085, 0.04, 0.88);
    playSineNote(ctx, now + 0.28, g5, 0.07, 0.038, 0.82);
    playSineNote(ctx, now + 0.44, c6, 0.055, 0.035, 1.05);

    // Brilho final muito suave (harmônico alto, estilo sino digital)
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = "sine";
    shimmer.frequency.setValueAtTime(2093.0, now + 0.52);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    const ts = now + 0.52;
    shimmerGain.gain.setValueAtTime(0, ts);
    shimmerGain.gain.linearRampToValueAtTime(0.02, ts + 0.02);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0005, ts + 0.55);
    shimmer.start(ts);
    shimmer.stop(ts + 0.58);
  } catch {
    /* autoplay / permissões */
  }
}
