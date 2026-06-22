import { useCallback, useEffect, useState } from 'react';
import {
  enterBrowserFullscreen,
  isBrowserFullscreen,
  supportsBrowserFullscreen,
  toggleBrowserFullscreen,
} from '../utils/tvFullscreen';

export function useTvFullscreen() {
  const supported = supportsBrowserFullscreen();
  const [active, setActive] = useState(isBrowserFullscreen);
  const [needsPrompt, setNeedsPrompt] = useState(() => supported && !isBrowserFullscreen());

  useEffect(() => {
    if (!supported) return;
    const sync = () => {
      const on = isBrowserFullscreen();
      setActive(on);
      if (!on) setNeedsPrompt(true);
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, [supported]);

  const requestFullscreen = useCallback(async () => {
    if (!supported) return false;
    const ok = await enterBrowserFullscreen();
    if (ok) setNeedsPrompt(false);
    return ok;
  }, [supported]);

  const toggle = useCallback(async () => {
    if (!supported) return;
    const on = await toggleBrowserFullscreen();
    setActive(on);
    setNeedsPrompt(!on);
  }, [supported]);

  return { supported, active, needsPrompt, requestFullscreen, toggle };
}
