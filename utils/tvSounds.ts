/**
 * Sons da TV centralizados (Web Audio API), todos respeitando o volume geral
 * definido nas Configurações da TV (config/tvSettings → getMasterVolume).
 *
 * Reunir aqui permite: 1) controlar o volume num só lugar; 2) o painel de
 * configurações tocar uma prévia de cada som ("Testar").
 */

import { getMasterVolume } from '../config/tvSettings';

function createCtx(): AudioContext | null {
  try {
    const Ctor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    return new Ctor();
  } catch {
    return null;
  }
}

/** Volume efetivo (peak * volume geral). Abaixo de ~0 não toca. */
function vol(peak: number): number {
  return Math.max(0, peak * getMasterVolume());
}

/** Bip curto de "mudança de etapa" / alerta. */
export async function playStageChangeBeep(repeat = 1): Promise<void> {
  const v = vol(0.2);
  if (v <= 0.0005) return;
  const ctx = createCtx();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(v, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };
    let now = ctx.currentTime;
    for (let i = 0; i < repeat; i++) {
      playNote(880, now, 0.15);
      playNote(1046.5, now + 0.1, 0.2);
      now += 0.4;
    }
  } catch (e) {
    console.warn(e);
  }
}

/** Fanfarra de vitória — usada em "Orçamento aprovado" e "Peças disponíveis". */
export async function playVictorySound(): Promise<void> {
  const master = getMasterVolume();
  if (master <= 0.0005) return;
  const ctx = createCtx();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    const playTone = (
      freq: number,
      startTime: number,
      duration: number,
      volume: number,
      type: OscillatorType = 'triangle'
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume * master, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };
    const now = ctx.currentTime;
    const step = 0.06;
    playTone(261.63, now, 0.3, 0.2);
    playTone(329.63, now + step, 0.3, 0.2);
    playTone(392.0, now + step * 2, 0.3, 0.2);
    playTone(523.25, now + step * 3, 1.0, 0.3, 'square');
  } catch (e) {
    console.warn(e);
  }
}

/** Som institucional da tela de Garantia. */
export async function playGarantiaSound(): Promise<void> {
  const master = getMasterVolume();
  if (master <= 0.0005) return;
  const ctx = createCtx();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    const playSineNote = (
      startTime: number,
      freq: number,
      peakGain: number,
      attackSec: number,
      durationSec: number
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      const tEnd = startTime + durationSec;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(peakGain * master, startTime + attackSec);
      gain.gain.exponentialRampToValueAtTime(0.0006, tEnd);
      osc.start(startTime);
      osc.stop(tEnd + 0.03);
    };
    const now = ctx.currentTime;
    playSineNote(now, 130.81, 0.022, 0.08, 1.35);
    playSineNote(now + 0.0, 523.25, 0.1, 0.045, 0.95);
    playSineNote(now + 0.14, 659.25, 0.085, 0.04, 0.88);
    playSineNote(now + 0.28, 783.99, 0.07, 0.038, 0.82);
    playSineNote(now + 0.44, 1046.5, 0.055, 0.035, 1.05);
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(2093.0, now + 0.52);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    const ts = now + 0.52;
    shimmerGain.gain.setValueAtTime(0, ts);
    shimmerGain.gain.linearRampToValueAtTime(0.02 * master, ts + 0.02);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0005, ts + 0.55);
    shimmer.start(ts);
    shimmer.stop(ts + 0.58);
  } catch {
    /* autoplay / permissões */
  }
}

/** "Glass ping" curto dos slides/avisos. */
export async function playSlideSound(): Promise<void> {
  const master = getMasterVolume();
  if (master <= 0.0005) return;
  const ctx = createCtx();
  if (!ctx) return;
  try {
    if (ctx.state === 'suspended') await ctx.resume();
    const playSoftPing = (startTime: number, freq: number, peakGain: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.connect(ctx.destination);
      osc.connect(gain);
      const tEnd = startTime + duration;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(peakGain * master, startTime + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0008, tEnd);
      osc.start(startTime);
      osc.stop(tEnd + 0.02);
    };
    const now = ctx.currentTime;
    playSoftPing(now, 783.99, 0.1, 0.14);
    playSoftPing(now + 0.055, 987.77, 0.085, 0.12);
    playSoftPing(now + 0.11, 1174.66, 0.065, 0.1);
    const shimmer = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmer.type = 'sine';
    shimmer.frequency.setValueAtTime(2349.32, now + 0.08);
    shimmer.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    const ts = now + 0.08;
    shimmerGain.gain.setValueAtTime(0, ts);
    shimmerGain.gain.linearRampToValueAtTime(0.028 * master, ts + 0.008);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0005, ts + 0.09);
    shimmer.start(ts);
    shimmer.stop(ts + 0.12);
  } catch {
    /* autoplay / permissões */
  }
}
