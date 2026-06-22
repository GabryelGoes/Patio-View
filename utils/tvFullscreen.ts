/** Tela cheia do navegador (esconde barra de endereço e abas). */

const STORAGE_KEY = 'tv_browser_fullscreen_enabled';
export const FULLSCREEN_AUTO_RETRY_MS = 4000;

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: (options?: unknown) => Promise<void> | void;
};

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

export function supportsBrowserFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.documentElement as FullscreenElement;
  return !!(el.requestFullscreen || el.webkitRequestFullscreen);
}

export function hasFullscreenPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function setFullscreenPreference(enabled: boolean): void {
  try {
    if (enabled) window.localStorage.setItem(STORAGE_KEY, '1');
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function isBrowserFullscreen(): boolean {
  const doc = document as FullscreenDocument;
  return !!(doc.fullscreenElement || doc.webkitFullscreenElement);
}

function getFullscreenTarget(): FullscreenElement {
  return (document.documentElement as FullscreenElement) || (document.body as FullscreenElement);
}

/** Tenta entrar em tela cheia (síncrono no disparo; retorna promessa). */
export function enterBrowserFullscreen(): Promise<boolean> {
  if (isBrowserFullscreen()) return Promise.resolve(true);
  if (document.visibilityState === 'hidden') return Promise.resolve(false);

  const el = getFullscreenTarget();
  const options = { navigationUI: 'hide' as FullscreenNavigationUI };

  const run = async (): Promise<boolean> => {
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen(options);
        return isBrowserFullscreen();
      }
      if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen(options);
        return isBrowserFullscreen();
      }
    } catch {
      return false;
    }
    return false;
  };

  return run();
}

export async function exitBrowserFullscreen(): Promise<void> {
  const doc = document as FullscreenDocument;
  try {
    if (doc.fullscreenElement && doc.exitFullscreen) await doc.exitFullscreen();
    else if (doc.webkitFullscreenElement && doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
  } catch {
    /* ignore */
  }
}

export async function toggleBrowserFullscreen(): Promise<boolean> {
  if (isBrowserFullscreen()) {
    await exitBrowserFullscreen();
    return false;
  }
  return enterBrowserFullscreen();
}

/** Rajada de tentativas ao sair da tela cheia (0 ms, 250 ms, 1 s, 4 s). */
export function burstFullscreenRetries(): () => void {
  const timers: number[] = [];
  const attempt = () => {
    if (!hasFullscreenPreference() || isBrowserFullscreen() || document.visibilityState === 'hidden') return;
    void enterBrowserFullscreen();
  };

  attempt();
  for (const ms of [250, 1000, FULLSCREEN_AUTO_RETRY_MS]) {
    timers.push(window.setTimeout(attempt, ms));
  }

  return () => timers.forEach((id) => window.clearTimeout(id));
}
