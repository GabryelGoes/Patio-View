import type { TvChimeSoundPreset } from './tvChimeSchedule';
import { acquireTvAudioContext } from './tvSounds';

function beep(
  ctx: AudioContext,
  freq: number,
  start: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine'
): void {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume * 0.35), start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** Toca o aviso sonoro (Web Audio). Respeita gesto do utilizador em alguns browsers. */
export async function playTvChimeSound(
  preset: TvChimeSoundPreset,
  volume: number
): Promise<void> {
  const vol = Math.min(1, Math.max(0.05, volume));
  const ctx = await acquireTvAudioContext();
  if (!ctx) return;
  const t0 = ctx.currentTime;

  if (preset === 'digital') {
    for (let i = 0; i < 3; i++) {
      beep(ctx, 880, t0 + i * 0.14, 0.08, vol, 'square');
    }
  } else if (preset === 'bell') {
    beep(ctx, 784, t0, 0.22, vol, 'sine');
    beep(ctx, 659, t0 + 0.24, 0.35, vol * 0.95, 'sine');
  } else {
    // chime — suave, dois tons
    beep(ctx, 523.25, t0, 0.28, vol, 'sine');
    beep(ctx, 659.25, t0 + 0.22, 0.32, vol * 0.9, 'sine');
    beep(ctx, 783.99, t0 + 0.48, 0.4, vol * 0.85, 'sine');
  }
}

/** Bip curto para antecipação (mais discreto). */
export async function playTvChimePreSound(volume: number): Promise<void> {
  const vol = Math.min(1, Math.max(0.05, volume)) * 0.45;
  const ctx = await acquireTvAudioContext();
  if (!ctx) return;
  beep(ctx, 660, ctx.currentTime, 0.12, vol, 'sine');
}
