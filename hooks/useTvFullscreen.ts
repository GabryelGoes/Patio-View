import { useCallback, useEffect, useRef, useState } from 'react';
import {
  burstFullscreenRetries,
  enterBrowserFullscreen,
  FULLSCREEN_AUTO_RETRY_MS,
  hasFullscreenPreference,
  isBrowserFullscreen,
  setFullscreenPreference,
  supportsBrowserFullscreen,
  toggleBrowserFullscreen,
} from '../utils/tvFullscreen';

export function useTvFullscreen() {
  const supported = supportsBrowserFullscreen();
  const [active, setActive] = useState(isBrowserFullscreen);
  const [autoEnabled, setAutoEnabled] = useState(() => hasFullscreenPreference());
  const needsPrompt = supported && !active && !autoEnabled;
  const burstCancelRef = useRef<(() => void) | null>(null);

  const markEnabled = useCallback(() => {
    setFullscreenPreference(true);
    setAutoEnabled(true);
  }, []);

  const requestFullscreen = useCallback(async () => {
    if (!supported) return false;
    const ok = await enterBrowserFullscreen();
    if (ok) {
      markEnabled();
      setActive(true);
    }
    return ok;
  }, [supported, markEnabled]);

  const tryAutoEnter = useCallback(() => {
    if (!supported || !hasFullscreenPreference() || isBrowserFullscreen()) return;
    if (document.visibilityState === 'hidden') return;
    void enterBrowserFullscreen().then((ok) => {
      if (ok) {
        markEnabled();
        setActive(true);
      }
    });
  }, [supported, markEnabled]);

  useEffect(() => {
    if (!supported) return;

    const onFullscreenChange = () => {
      const on = isBrowserFullscreen();
      setActive(on);

      if (on) {
        burstCancelRef.current?.();
        burstCancelRef.current = null;
        return;
      }

      if (!hasFullscreenPreference()) {
        setAutoEnabled(false);
        return;
      }

      burstCancelRef.current?.();
      burstCancelRef.current = burstFullscreenRetries();
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      burstCancelRef.current?.();
      burstCancelRef.current = null;
    };
  }, [supported]);

  useEffect(() => {
    if (!supported) return;

    tryAutoEnter();

    const onVisible = () => {
      if (document.visibilityState === 'visible') tryAutoEnter();
    };
    const onFocus = () => tryAutoEnter();
    const onPageShow = () => tryAutoEnter();

    window.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    window.addEventListener('pageshow', onPageShow);

    const interval = window.setInterval(() => {
      if (!hasFullscreenPreference()) return;
      tryAutoEnter();
    }, FULLSCREEN_AUTO_RETRY_MS);

    return () => {
      window.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('pageshow', onPageShow);
      window.clearInterval(interval);
    };
  }, [supported, tryAutoEnter]);

  useEffect(() => {
    if (!supported || !needsPrompt) return;
    const onPointerDown = () => void requestFullscreen();
    document.addEventListener('pointerdown', onPointerDown, { once: true, capture: true });
    return () => document.removeEventListener('pointerdown', onPointerDown, { capture: true });
  }, [supported, needsPrompt, requestFullscreen]);

  useEffect(() => {
    if (!supported || !autoEnabled) return;
    const onPointerDown = () => {
      if (!isBrowserFullscreen()) void requestFullscreen();
    };
    const onKeyDown = () => {
      if (!isBrowserFullscreen()) void requestFullscreen();
    };
    document.addEventListener('pointerdown', onPointerDown, { capture: true });
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, { capture: true });
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [supported, autoEnabled, requestFullscreen]);

  const toggle = useCallback(async () => {
    if (!supported) return;
    const on = await toggleBrowserFullscreen();
    setActive(on);
    if (on) markEnabled();
  }, [supported, markEnabled]);

  return { supported, active, needsPrompt, autoEnabled, requestFullscreen, toggle };
}
