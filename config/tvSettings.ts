/**
 * Configurações da TV salvas por dispositivo (localStorage).
 *
 * Tudo o que o usuário pode ajustar pela tela de Configurações da TV mora aqui:
 * sons (liga/desliga por evento + volume + quando tocar), tempos de exibição e
 * o alerta de "aguardando avaliação". Os valores padrão reproduzem o comportamento
 * original do painel.
 */

import { useSyncExternalStore } from 'react';

export type SoundMode = 'always' | 'schedule' | 'off';

export interface TvSoundToggles {
  /** Bip ao um carro mudar de etapa. */
  stageChange: boolean;
  /** Alerta sonoro de "aguardando avaliação" pendente. */
  evaluationAlert: boolean;
  /** Tela de "Orçamento Aprovado" (celebração). */
  budgetApproved: boolean;
  /** Tela de "Garantia". */
  garantia: boolean;
  /** Tela de "Peças Disponíveis" (somente Pátio). */
  pecasDisponiveis: boolean;
  /** Avisos programados / slides com som. */
  slide: boolean;
}

export interface TvSettings {
  /** Volume geral de todos os sons gerados pela TV (0..1). */
  masterVolume: number;
  /** Quando os sons podem tocar. */
  soundMode: SoundMode;
  sounds: TvSoundToggles;
  evaluationAlert: {
    enabled: boolean;
    /** A cada quantos minutos relembrar carros aguardando avaliação. */
    intervalMinutes: number;
    /** Quanto tempo o alerta fica destacado na tela (segundos). */
    onScreenSeconds: number;
  };
  /** Intervalo de atualização do quadro (segundos). */
  refreshSeconds: number;
  /** Tempo de cada página do quadro de carros (segundos). */
  pageSeconds: number;
  /** Duração do destaque quando um carro muda de etapa (segundos). */
  highlightSeconds: number;
  /** Duração das telas de destaque (orçamento/garantia/peças) em segundos. */
  overlaySeconds: number;
}

export const DEFAULT_TV_SETTINGS: TvSettings = {
  masterVolume: 1,
  soundMode: 'schedule',
  sounds: {
    stageChange: true,
    evaluationAlert: true,
    budgetApproved: true,
    garantia: true,
    pecasDisponiveis: true,
    slide: true,
  },
  evaluationAlert: {
    enabled: true,
    intervalMinutes: 30,
    onScreenSeconds: 12,
  },
  refreshSeconds: 15,
  pageSeconds: 7,
  highlightSeconds: 8,
  overlaySeconds: 7,
};

const STORAGE_KEY = 'tv_settings';

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function mergeWithDefaults(raw: any): TvSettings {
  const d = DEFAULT_TV_SETTINGS;
  if (!raw || typeof raw !== 'object') return { ...d, sounds: { ...d.sounds }, evaluationAlert: { ...d.evaluationAlert } };
  const soundMode: SoundMode =
    raw.soundMode === 'always' || raw.soundMode === 'off' || raw.soundMode === 'schedule'
      ? raw.soundMode
      : d.soundMode;
  return {
    masterVolume: clampNumber(raw.masterVolume, 0, 1, d.masterVolume),
    soundMode,
    sounds: {
      stageChange: raw.sounds?.stageChange ?? d.sounds.stageChange,
      evaluationAlert: raw.sounds?.evaluationAlert ?? d.sounds.evaluationAlert,
      budgetApproved: raw.sounds?.budgetApproved ?? d.sounds.budgetApproved,
      garantia: raw.sounds?.garantia ?? d.sounds.garantia,
      pecasDisponiveis: raw.sounds?.pecasDisponiveis ?? d.sounds.pecasDisponiveis,
      slide: raw.sounds?.slide ?? d.sounds.slide,
    },
    evaluationAlert: {
      enabled: raw.evaluationAlert?.enabled ?? d.evaluationAlert.enabled,
      intervalMinutes: clampNumber(raw.evaluationAlert?.intervalMinutes, 1, 240, d.evaluationAlert.intervalMinutes),
      onScreenSeconds: clampNumber(raw.evaluationAlert?.onScreenSeconds, 3, 60, d.evaluationAlert.onScreenSeconds),
    },
    refreshSeconds: clampNumber(raw.refreshSeconds, 5, 120, d.refreshSeconds),
    pageSeconds: clampNumber(raw.pageSeconds, 3, 60, d.pageSeconds),
    highlightSeconds: clampNumber(raw.highlightSeconds, 3, 30, d.highlightSeconds),
    overlaySeconds: clampNumber(raw.overlaySeconds, 3, 20, d.overlaySeconds),
  };
}

function load(): TvSettings {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return mergeWithDefaults(raw ? JSON.parse(raw) : null);
  } catch {
    return mergeWithDefaults(null);
  }
}

let current: TvSettings = load();
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((l) => l());
}

export function getTvSettings(): TvSettings {
  return current;
}

/** Substitui as configurações inteiras (já validadas) e persiste. */
export function setTvSettings(next: TvSettings): void {
  current = mergeWithDefaults(next);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* ignore */
  }
  emit();
}

export function resetTvSettings(): void {
  setTvSettings(DEFAULT_TV_SETTINGS);
}

/** Volume geral atual (0..1) — lido pelas funções de som. */
export function getMasterVolume(): number {
  return current.masterVolume;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Hook reativo: re-renderiza quando as configurações mudam. */
export function useTvSettings(): TvSettings {
  return useSyncExternalStore(subscribe, getTvSettings, getTvSettings);
}
