/**
 * Alerta sonoro moderno para slides da TV (Web Audio API).
 * Arpejo curto tipo “glass ping” (tom claro, ataque suave, sem agressividade).
 */

let audioContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  }
  return audioContext;
}

function playSoftPing(
  ctx: AudioContext,
  startTime: number,
  freq: number,
  peakGain: number,
  duration: number
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, startTime);

  gain.connect(ctx.destination);
  osc.connect(gain);

  const t0 = startTime;
  const attack = 0.012;
  const tEnd = t0 + duration;

  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(peakGain, t0 + attack);
  gain.gain.exponentialRampToValueAtTime(0.0008, tEnd);

  osc.start(t0);
  osc.stop(tEnd + 0.02);
}

/** Toca quando um slide com “som” entra na rotação da TV. */
export async function playSlideAlertSound(): Promise<void> {
  try {
    const ctx = getContext();
    if (ctx.state === 'suspended') await ctx.resume();

    const now = ctx.currentTime;
    // Arpejo ascendente leve (lá maior): sol5 → si5 → ré6 — lembra alertas de sistema atuais
    const f1 = 783.99; // G5
    const f2 = 987.77; // B5
    const f3 = 1174.66; // D6

    playSoftPing(ctx, now, f1, 0.1, 0.14);
    playSoftPing(ctx, now + 0.055, f2, 0.085, 0.12);
    playSoftPing(ctx, now + 0.11, f3, 0.065, 0.1);

    // Harmônico agudo muito baixo para “brilho” (opcional)
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(2349.32, now + 0.08); // D7
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    const ts = now + 0.08;
    shimmerGain.gain.setValueAtTime(0, ts);
    shimmerGain.gain.linearRampToValueAtTime(0.028, ts + 0.008);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0005, ts + 0.09);
    shimmer.start(ts);
    shimmer.stop(ts + 0.12);
  } catch {
    /* autoplay / permissões */
  }
}
