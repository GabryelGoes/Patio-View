import React, { useCallback, useEffect, useRef, useState } from 'react';
import UploadedVideoTvPlayer from './UploadedVideoTvPlayer.tsx';
import {
  useVideoFolder,
  resolveLocalVideoUrl,
  pickAndImportVideo,
  ensureGranted,
  supportsLocalVideo,
  localVideoMode,
} from '../utils/localVideoFolder.ts';

type LocalVideoTvPlayerProps = {
  name: string;
  objectFit?: 'contain' | 'cover' | 'fill';
};

type Status = 'loading' | 'ready' | 'unsupported' | 'needs-video' | 'no-permission';

const Notice: React.FC<{
  title: string;
  subtitle?: string;
  action?: { label: string; onClick: () => void };
}> = ({ title, subtitle, action }) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
    <p className="text-xl font-black text-white/90">{title}</p>
    {subtitle && <p className="max-w-[85%] text-sm font-semibold text-zinc-400">{subtitle}</p>}
    {action && (
      <button
        type="button"
        onClick={action.onClick}
        className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-8 py-4 text-base font-black uppercase tracking-wider text-yellow-300 transition active:scale-95 hover:bg-yellow-500/20"
      >
        {action.label}
      </button>
    )}
  </div>
);

const LocalVideoTvPlayer: React.FC<LocalVideoTvPlayerProps> = ({ name, objectFit }) => {
  const folder = useVideoFolder();
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [reloadKey, setReloadKey] = useState(0);
  const urlRef = useRef<string | null>(null);

  const revoke = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  const tryLoad = useCallback(async () => {
    if (!supportsLocalVideo()) {
      setStatus('unsupported');
      return;
    }
    if (!folder.ready) {
      setStatus('loading');
      return;
    }

    const objUrl = await resolveLocalVideoUrl(name);
    if (objUrl) {
      revoke();
      urlRef.current = objUrl;
      setUrl(objUrl);
      setStatus('ready');
      return;
    }

    if (folder.hasFolder && !folder.granted && localVideoMode() === 'fsaccess') {
      setStatus('no-permission');
      return;
    }

    setStatus('needs-video');
  }, [folder.ready, folder.hasFolder, folder.granted, name]);

  useEffect(() => {
    void tryLoad();
    return () => revoke();
  }, [tryLoad, reloadKey]);

  const onPickVideo = () => {
    void (async () => {
      const ok = await pickAndImportVideo(name);
      if (ok) setReloadKey((k) => k + 1);
    })();
  };

  if (status === 'ready' && url) {
    return <UploadedVideoTvPlayer src={url} objectFit={objectFit} />;
  }

  if (status === 'unsupported') {
    return (
      <Notice
        title="Vídeo local indisponível"
        subtitle="Use Chrome, Edge ou Firefox neste computador."
      />
    );
  }

  if (status === 'no-permission') {
    return (
      <Notice
        title="Permitir acesso aos vídeos"
        subtitle="Toque abaixo uma vez — ou selecione o arquivo diretamente."
        action={{
          label: 'Continuar',
          onClick: () => void ensureGranted().then(() => setReloadKey((k) => k + 1)),
        }}
      />
    );
  }

  if (status === 'needs-video') {
    return (
      <Notice
        title="Selecionar vídeo"
        subtitle={name ? `Escolha o arquivo: ${name}` : 'Escolha o vídeo deste slide no seu PC.'}
        action={{ label: 'Selecionar vídeo', onClick: onPickVideo }}
      />
    );
  }

  return <Notice title="Carregando…" />;
};

export default LocalVideoTvPlayer;
