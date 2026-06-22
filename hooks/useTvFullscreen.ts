import { useCallback, useEffect, useRef, useState } from 'react';
import {
  enterBrowserFullscreen,
  hasFullscreenPreference,
  isBrowserFullscreen,
  setFullscreenPreference,
  supportsBrowserFullscreen,
  toggleBrowserFullscreen,
} from '../utils/tvFullscreen';

const AUTO_RETRY_MS = 4000;

export function useTvFullscreen() {
  const supported = supportsBrowserFullscreen();
  const [active, setActive] = useState(isBrowserFullscreen);
  const [autoEnabled, setAutoEnabled] = useState(() => hasFullscreenPreference());
  const needsPrompt = supported && !active && !autoEnabled;
  const enteringRef = useRef(false);

  const requestFullscreen = useCallback(async () => {
    if (!supported || enteringRef.current) return false;
    enteringRef.current = true;
    try {
      const ok = await enterBrowserFullscreen();
      if (ok) {
        setFullscreenPreference(true);
        setAutoEnabled(true);
        setActive(true);
      }
      return ok;
    } finally {
      enteringRef.current = false;
    }
  }, [supported]);

  const tryAutoEnter = useCallback(async () => {
    if (!supported || !hasFullscreenPreference() || isBrowserFullscreen() || enteringRef.current) return;
    await requestFullscreen();
  }, [supported, requestFullscreen]);

  useEffect(() => {
    if (!supported) return;
    const sync = () => {
      const on = isBrowserFullscreen();
      setActive(on);
      if (!on && hasFullscreenPreference()) {
        window.requestAnimationFrame(() => void tryAutoEnter());
      }
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, [supported, tryAutoEnter]);

  useEffect(() => {
    if (!supported || !autoEnabled) return;
    void tryAutoEnter();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void tryAutoEnter();
    };
    const onFocus = () => void tryAutoEnter();
    window.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    const interval = window.setInterval(() => void tryAutoEnter(), AUTO_RETRY_MS);
    return () => {
      window.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
      window.clearInterval(interval);
    };
  }, [supported, autoEnabled, tryAutoEnter]);

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
    document.addEventListener('pointerdown', onPointerDown, { capture: true });
    return () => document.removeEventListener('pointerdown', onPointerDown, { capture: true });
  }, [supported, autoEnabled, requestFullscreen]);

  const toggle = useCallback(async () => {
    if (!supported) return;
    const on = await toggleBrowserFullscreen();
    setActive(on);
    if (on) {
      setFullscreenPreference(true);
      setAutoEnabled(true);
    }
  }, [supported]);

  return { supported, active, needsPrompt, autoEnabled, requestFullscreen, toggle };
}
