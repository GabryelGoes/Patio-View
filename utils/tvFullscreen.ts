/** Tela cheia do navegador (esconde barra de endereço e abas). */

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
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

export function isBrowserFullscreen(): boolean {
  const doc = document as FullscreenDocument;
  return !!(doc.fullscreenElement || doc.webkitFullscreenElement);
}

export async function enterBrowserFullscreen(): Promise<boolean> {
  const el = document.documentElement as FullscreenElement;
  try {
    if (el.requestFullscreen) {
      await el.requestFullscreen();
      return isBrowserFullscreen();
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return isBrowserFullscreen();
    }
  } catch {
    return false;
  }
  return false;
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
