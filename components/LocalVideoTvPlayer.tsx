import React, { useEffect, useRef, useState } from 'react';
import UploadedVideoTvPlayer from './UploadedVideoTvPlayer.tsx';
import {
  useVideoFolder,
  currentHandle,
  getLocalVideoObjectUrl,
  chooseFolder,
  ensureGranted,
  supportsLocalVideo,
} from '../utils/localVideoFolder.ts';

type LocalVideoTvPlayerProps = {
  /** Nome do arquivo na pasta local (ex.: "promo.mp4"). */
  name: string;
};

type Status = 'loading' | 'ready' | 'unsupported' | 'no-folder' | 'no-permission' | 'not-found';

/** Caixa central com mensagem + ação (selecionar/permitir pasta). */
const Notice: React.FC<{ title: string; subtitle?: string; action?: { label: string; onClick: () => void } }> = ({
  title,
  subtitle,
  action,
}) => (
  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
    <p className="text-xl font-black text-white/90">{title}</p>
    {subtitle && <p className="max-w-[80%] text-sm font-semibold text-zinc-400">{subtitle}</p>}
    {action && (
      <button
        onClick={action.onClick}
        className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 px-6 py-3 text-sm font-black uppercase tracking-wider text-yellow-300 transition active:scale-95 hover:bg-yellow-500/20"
      >
        {action.label}
      </button>
    )}
  </div>
);

/** Toca um vídeo lido de uma pasta local do PC (sem upload). */
const LocalVideoTvPlayer: React.FC<LocalVideoTvPlayerProps> = ({ name }) => {
  const folder = useVideoFolder();
  const [url, setUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const urlRef = useRef<string | null>(null);

  const revoke = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    revoke();
    setUrl(null);

    if (!supportsLocalVideo()) {
      setStatus('unsupported');
      return;
    }
    if (!folder.ready) {
      setStatus('loading');
      return;
    }
    if (!folder.hasFolder) {
      setStatus('no-folder');
      return;
    }
    if (!folder.granted) {
      setStatus('no-permission');
      return;
    }

    (async () => {
      const objUrl = await getLocalVideoObjectUrl(currentHandle(), name);
      if (cancelled) {
        if (objUrl) URL.revokeObjectURL(objUrl);
        return;
      }
      if (!objUrl) {
        setStatus('not-found');
        return;
      }
      urlRef.current = objUrl;
      setUrl(objUrl);
      setStatus('ready');
    })();

    return () => {
      cancelled = true;
    };
  }, [name, folder.ready, folder.hasFolder, folder.granted]);

  useEffect(() => () => revoke(), []);

  if (status === 'ready' && url) {
    return <UploadedVideoTvPlayer src={url} />;
  }

  if (status === 'unsupported') {
    return <Notice title="Vídeo local indisponível" subtitle="Este navegador não suporta pastas locais. Abra a TV no Google Chrome." />;
  }
  if (status === 'no-folder') {
    return (
      <Notice
        title="Configurar pasta de vídeos"
        subtitle="Selecione a pasta do PC onde ficam os vídeos da TV."
        action={{ label: 'Selecionar pasta', onClick: () => void chooseFolder() }}
      />
    );
  }
  if (status === 'no-permission') {
    return (
      <Notice
        title="Permitir acesso à pasta"
        subtitle="O Chrome precisa da sua autorização para ler os vídeos locais."
        action={{ label: 'Permitir acesso', onClick: () => void ensureGranted() }}
      />
    );
  }
  if (status === 'not-found') {
    return (
      <Notice
        title={`Vídeo não encontrado: ${name}`}
        subtitle="Confira se o arquivo está na pasta selecionada (o nome deve ser igual)."
        action={{ label: 'Trocar pasta', onClick: () => void chooseFolder() }}
      />
    );
  }

  return <Notice title="Carregando vídeo…" />;
};

export default LocalVideoTvPlayer;
