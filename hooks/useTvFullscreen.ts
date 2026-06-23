import { useCallback, useEffect, useState } from 'react';
import {
  isBrowserFullscreen,
  supportsBrowserFullscreen,
  toggleBrowserFullscreen,
} from '../utils/tvFullscreen';

/** Tela cheia só pelo botão no cabeçalho — sem capturar toques na página. */
export function useTvFullscreen() {
  const supported = supportsBrowserFullscreen();
  const [active, setActive] = useState(isBrowserFullscreen);

  useEffect(() => {
    if (!supported) return;
    const onFullscreenChange = () => setActive(isBrowserFullscreen());
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
    };
  }, [supported]);

  const toggle = useCallback(async () => {
    if (!supported) return;
    const on = await toggleBrowserFullscreen();
    setActive(on);
  }, [supported]);

  return { supported, active, toggle };
}
