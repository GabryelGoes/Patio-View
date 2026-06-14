/**
 * Biblioteca de toques da TV (Web Audio API).
 *
 * Cada "toque" é um preset com estilo próprio. O usuário escolhe, nas
 * Configurações da TV, qual toque toca em cada evento (orçamento aprovado,
 * garantia, peças, mudança de etapa, alerta de avaliação, avisos/slides).
 * Todos respeitam o volume geral (config/tvSettings → getMasterVolume).
 */

import { getMasterVolume, getTvSettings, type TvSoundEvent } from '../config/tvSettings';

function createCtx(): AudioContext | null {
  try {
    const Ctor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    return new Ctor();
  } catch {
    return null;
  }
}

function note(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  start: number,
  duration: number,
  peak: number
): void {
  if (peak <= 0.0002) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peak, start + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
}

/** Notas (Hz) usadas pelos presets. */
const C4 = 261.63,
  E4 = 329.63,
  G4 = 392.0,
  C5 = 523.25,
  D5 = 587.33,
  E5 = 659.25,
  G5 = 783.99,
  A5 = 880.0,
  B5 = 987.77,
  C6 = 1046.5,
  D6 = 1174.66,
  E6 = 1318.51,
  G6 = 1567.98;

export interface SoundPreset {
  id: string;
  label: string;
  render: (ctx: AudioContext, now: number, v: number) => void;
}

export const SOUND_PRESETS: SoundPreset[] = [
  {
    id: 'classic',
    label: 'Fanfarra clássica',
    render: (ctx, n, v) => {
      const s = 0.06;
      note(ctx, 'triangle', C4, n, 0.3, 0.2 * v);
      note(ctx, 'triangle', E4, n + s, 0.3, 0.2 * v);
      note(ctx, 'triangle', G4, n + s * 2, 0.3, 0.2 * v);
      note(ctx, 'square', C5, n + s * 3, 1.0, 0.3 * v);
    },
  },
  {
    id: 'bell',
    label: 'Sino',
    render: (ctx, n, v) => {
      note(ctx, 'sine', C6, n, 1.6, 0.18 * v);
      note(ctx, 'sine', G6, n, 1.4, 0.06 * v);
      note(ctx, 'sine', G5, n + 0.25, 1.5, 0.1 * v);
    },
  },
  {
    id: 'marimba',
    label: 'Marimba',
    render: (ctx, n, v) => {
      const seq = [C5, E5, G5, C6];
      seq.forEach((f, i) => note(ctx, 'triangle', f, n + i * 0.11, 0.28, 0.22 * v));
    },
  },
  {
    id: 'arp',
    label: 'Arpejo suave',
    render: (ctx, n, v) => {
      note(ctx, 'sine', C5, n, 0.95, 0.12 * v);
      note(ctx, 'sine', E5, n + 0.14, 0.9, 0.1 * v);
      note(ctx, 'sine', G5, n + 0.28, 0.85, 0.085 * v);
      note(ctx, 'sine', C6, n + 0.44, 1.0, 0.07 * v);
    },
  },
  {
    id: 'ping',
    label: 'Cristal (ping)',
    render: (ctx, n, v) => {
      note(ctx, 'sine', G5, n, 0.14, 0.12 * v);
      note(ctx, 'sine', B5, n + 0.055, 0.12, 0.1 * v);
      note(ctx, 'sine', D6, n + 0.11, 0.1, 0.08 * v);
    },
  },
  {
    id: 'game',
    label: 'Game retrô',
    render: (ctx, n, v) => {
      const seq = [C5, E5, G5, C6];
      seq.forEach((f, i) => note(ctx, 'square', f, n + i * 0.08, 0.12, 0.14 * v));
    },
  },
  {
    id: 'fanfare',
    label: 'Triunfal',
    render: (ctx, n, v) => {
      note(ctx, 'sawtooth', G4, n, 0.5, 0.1 * v);
      note(ctx, 'sawtooth', C5, n + 0.12, 0.5, 0.1 * v);
      note(ctx, 'sawtooth', E5, n + 0.24, 0.9, 0.12 * v);
      note(ctx, 'sawtooth', G5, n + 0.4, 1.0, 0.12 * v);
    },
  },
  {
    id: 'alert',
    label: 'Alerta duplo',
    render: (ctx, n, v) => {
      note(ctx, 'square', A5, n, 0.15, 0.16 * v);
      note(ctx, 'square', C6, n + 0.18, 0.22, 0.16 * v);
    },
  },
  {
    id: 'doorbell',
    label: 'Campainha',
    render: (ctx, n, v) => {
      note(ctx, 'sine', E5, n, 0.6, 0.2 * v);
      note(ctx, 'sine', C5, n + 0.45, 1.1, 0.2 * v);
    },
  },
  {
    id: 'magic',
    label: 'Mágico',
    render: (ctx, n, v) => {
      const seq = [C5, D5, E5, G5, A5, C6];
      seq.forEach((f, i) => note(ctx, 'sine', f, n + i * 0.05, 0.4, 0.1 * v));
      note(ctx, 'sine', E6, n + 0.32, 0.6, 0.07 * v);
    },
  },
  {
    id: 'trumpet',
    label: 'Corneta',
    render: (ctx, n, v) => {
      note(ctx, 'sawtooth', G4, n, 0.2, 0.13 * v);
      note(ctx, 'sawtooth', G4, n + 0.22, 0.2, 0.13 * v);
      note(ctx, 'sawtooth', C5, n + 0.44, 0.55, 0.15 * v);
    },
  },
  {
    id: 'soft',
    label: 'Suave',
    render: (ctx, n, v) => {
      note(ctx, 'sine', A5, n, 0.3, 0.12 * v);
      note(ctx, 'sine', E6, n + 0.16, 0.5, 0.1 * v);
    },
  },
  {
    id: 'digital',
    label: 'Digital',
    render: (ctx, n, v) => {
      note(ctx, 'triangle', G6, n, 0.1, 0.12 * v);
      note(ctx, 'triangle', 2093.0, n + 0.12, 0.14, 0.1 * v);
    },
  },
];

const PRESET_MAP: Record<string, SoundPreset> = Object.fromEntries(SOUND_PRESETS.map((p) => [p.id, p]));

export const DEFAULT_PRESET_ID = 'classic';

/** Toca um toque específico pelo id (respeita o volume geral). */
export async function playPreset(id: string): Promise<void> {
  const v = getMasterVolume();
  if (v <= 0.0005) return;
  const preset = PRESET_MAP[id] ?? PRESET_MAP[DEFAULT_PRESET_ID];
  const ctx = createCtx();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    preset.render(ctx, ctx.currentTime, v);
  } catch (e) {
    console.warn(e);
  }
}

/** Toca o toque escolhido nas configurações para um evento da TV. */
export async function playEventSound(event: TvSoundEvent): Promise<void> {
  const choices = getTvSettings().soundChoices;
  await playPreset(choices?.[event] ?? DEFAULT_PRESET_ID);
}
