/**
 * Vídeos locais da TV — sem upload para Storage/Vercel.
 *
 * O slide guarda apenas uma referência "local:arquivo.mp4" e a TV lê o vídeo do PC.
 * Há dois modos, escolhidos automaticamente conforme o navegador:
 *
 *  - 'fsaccess' (Chrome/Edge): usa a File System Access API. Guarda o handle da
 *    pasta no IndexedDB; a TV lê os arquivos AO VIVO (trocar um vídeo na pasta já
 *    reflete). Após reiniciar o navegador pode pedir 1 clique para reautorizar.
 *
 *  - 'files' (Firefox/Safari): usa <input type="file" webkitdirectory>. Como esses
 *    navegadores não têm a File System Access API, importamos os vídeos da pasta e
 *    guardamos os arquivos no IndexedDB (persistem entre sessões). É um "instantâneo":
 *    para atualizar os vídeos, basta selecionar a pasta novamente.
 */

import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';

export const LOCAL_PREFIX = 'local:';

const VIDEO_EXT = /\.(mp4|webm|ogg|ogv|mov|m4v)$/i;

/** True se a mediaUrl aponta para um arquivo local (ex.: "local:promo.mp4"). */
export function isLocalVideoRef(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.trim().toLowerCase().startsWith(LOCAL_PREFIX);
}

/** Extrai o nome do arquivo de uma referência "local:...". */
export function localVideoName(url: string): string {
  return String(url).trim().slice(LOCAL_PREFIX.length).replace(/^[/\\]+/, '').trim();
}

/** O navegador tem a File System Access API (Chrome/Edge)? */
export function supportsFsAccess(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).showDirectoryPicker === 'function';
}

/** É possível usar pastas locais neste navegador? (Chrome/Edge e também Firefox/Safari). */
export function supportsLocalVideo(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/** Modo de leitura de pasta local conforme o navegador. */
export function localVideoMode(): 'fsaccess' | 'files' {
  return supportsFsAccess() ? 'fsaccess' : 'files';
}

// Handle da pasta (FileSystemDirectoryHandle). Tipado como any para não depender de libs de tipos.
type DirHandle = any;

// --------------------------- IndexedDB ---------------------------
const DB_NAME = 'tv-local-media';
const DB_VERSION = 1;
const STORE = 'handles';
const KEY = 'videoDir'; // handle da pasta (modo fsaccess)
const FILES_KEY = 'videoFiles'; // mapa { nome: File } (modo files)

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDb();
  try {
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const r = tx.objectStore(STORE).get(key);
      r.onsuccess = () => resolve((r.result as T) ?? null);
      r.onerror = () => reject(r.error);
    });
  } finally {
    db.close();
  }
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function idbDel(key: string): Promise<void> {
  const db = await openDb();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

// --------------------------- FS Access (Chrome/Edge) ---------------------------
async function pickFolder(): Promise<DirHandle | null> {
  if (!supportsFsAccess()) return null;
  try {
    const h = await (window as any).showDirectoryPicker({ id: 'tv-video-folder', mode: 'read' });
    await idbSet(KEY, h).catch(() => {});
    return h;
  } catch {
    return null; // usuário cancelou
  }
}

async function verifyPermission(h: DirHandle, requestIfNeeded: boolean): Promise<boolean> {
  if (!h) return false;
  try {
    const opts = { mode: 'read' as const };
    if ((await h.queryPermission(opts)) === 'granted') return true;
    if (requestIfNeeded && (await h.requestPermission(opts)) === 'granted') return true;
    return false;
  } catch {
    return false;
  }
}

async function getUrlFromHandle(h: DirHandle, name: string): Promise<string | null> {
  if (!h || !name) return null;
  try {
    const fileHandle = await h.getFileHandle(name);
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

// --------------------------- Input webkitdirectory (Firefox/Safari) ---------------------------
function isVideoFile(file: File): boolean {
  return (typeof file.type === 'string' && file.type.startsWith('video/')) || VIDEO_EXT.test(file.name);
}

/** Abre o seletor de pasta via <input webkitdirectory> e devolve os arquivos. */
function pickFolderFiles(): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    (input as any).webkitdirectory = true;
    input.style.position = 'fixed';
    input.style.left = '-9999px';

    let done = false;
    const finish = (value: FileList | null) => {
      if (done) return;
      done = true;
      window.removeEventListener('focus', onFocus);
      setTimeout(() => input.remove(), 0);
      resolve(value);
    };
    const onFocus = () => {
      // Se a janela voltou ao foco e nenhum arquivo foi escolhido, tratamos como cancelamento.
      setTimeout(() => {
        if (!done && (!input.files || input.files.length === 0)) finish(null);
      }, 800);
    };

    input.onchange = () => finish(input.files && input.files.length ? input.files : null);
    window.addEventListener('focus', onFocus);
    document.body.appendChild(input);
    input.click();
  });
}

/** Procura um arquivo importado por nome (case-insensitive, ignora caminho). */
function findFile(name: string): File | null {
  if (!name) return null;
  const target = name.toLowerCase();
  for (const [key, file] of Object.entries(filesMap)) {
    const base = key.split(/[/\\]/).pop()?.toLowerCase() ?? key.toLowerCase();
    if (key.toLowerCase() === target || base === target) return file as File;
  }
  return null;
}

// --------------------------- Resolver unificado ---------------------------
/** Resolve "arquivo.mp4" para um objectURL tocável, no modo do navegador atual. */
export async function resolveLocalVideoUrl(name: string): Promise<string | null> {
  if (localVideoMode() === 'fsaccess') return getUrlFromHandle(handle, name);
  const f = findFile(name);
  return f ? URL.createObjectURL(f) : null;
}

// --------------------------- Store reativo ---------------------------
export type FolderState = {
  /** Já terminou a leitura inicial do IndexedDB. */
  ready: boolean;
  /** Há uma pasta/vídeos configurados. */
  hasFolder: boolean;
  /** Permissão de leitura concedida na sessão atual. */
  granted: boolean;
  /** Modo em uso. */
  mode: 'fsaccess' | 'files';
};

let handle: DirHandle | null = null;
let filesMap: Record<string, File> = {};
let state: FolderState = {
  ready: false,
  hasFolder: false,
  granted: false,
  mode: typeof window !== 'undefined' ? localVideoMode() : 'fsaccess',
};
const listeners = new Set<() => void>();

function emit(): void {
  for (const l of listeners) l();
}

function setState(patch: Partial<FolderState>): void {
  state = { ...state, ...patch };
  emit();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): FolderState {
  return state;
}

let initStarted = false;
async function initFolder(): Promise<void> {
  if (initStarted) return;
  initStarted = true;
  try {
    if (localVideoMode() === 'fsaccess') {
      const saved = await idbGet<DirHandle>(KEY);
      if (saved) {
        handle = saved;
        const granted = await verifyPermission(saved, false);
        setState({ ready: true, hasFolder: true, granted });
        return;
      }
    } else {
      const saved = await idbGet<Record<string, File>>(FILES_KEY);
      if (saved && Object.keys(saved).length > 0) {
        filesMap = saved;
        setState({ ready: true, hasFolder: true, granted: true });
        return;
      }
    }
  } catch {
    /* ignore */
  }
  setState({ ready: true });
}

/** Abre o seletor de pasta (gesto do usuário) e guarda a escolha. */
export async function chooseFolder(): Promise<boolean> {
  if (localVideoMode() === 'fsaccess') {
    const picked = await pickFolder();
    if (!picked) return false;
    handle = picked;
    const granted = await verifyPermission(picked, true);
    setState({ hasFolder: true, granted });
    return granted;
  }

  // Modo files (Firefox/Safari): importar vídeos da pasta e salvar no IndexedDB.
  const files = await pickFolderFiles();
  if (!files) return false;
  const map: Record<string, File> = {};
  let totalBytes = 0;
  let skippedLarge = 0;
  const LARGE_SINGLE = 100 * 1024 * 1024;
  const LARGE_TOTAL = 200 * 1024 * 1024;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (!isVideoFile(f)) continue;
    if (f.size > LARGE_SINGLE) {
      skippedLarge++;
      continue;
    }
    totalBytes += f.size;
    if (totalBytes > LARGE_TOTAL) break;
    map[f.name] = f;
  }
  if (Object.keys(map).length === 0) {
    if (skippedLarge > 0 && typeof window !== 'undefined') {
      window.alert(
        'Vídeo(s) muito grande(s) para este navegador.\n\nUse Google Chrome ou Edge na TV e selecione a pasta em modo leitura — vídeos longos funcionam sem limite de tamanho.'
      );
    }
    return false;
  }
  if (skippedLarge > 0 && typeof window !== 'undefined') {
    window.alert(
      `${skippedLarge} vídeo(s) grande(s) ignorado(s). Para vídeos longos, use Chrome/Edge e selecione a pasta (leitura ao vivo, sem copiar para o navegador).`
    );
  }
  filesMap = map;
  try {
    await idbSet(FILES_KEY, map);
  } catch {
    if (typeof window !== 'undefined') {
      window.alert(
        'Não foi possível guardar os vídeos no navegador (pasta muito grande).\n\nUse Chrome ou Edge e selecione a mesma pasta — os arquivos ficam no disco, sem limite.'
      );
    }
    return false;
  }
  setState({ hasFolder: true, granted: true });
  return true;
}

/** Garante permissão na pasta já configurada (gesto do usuário). */
export async function ensureGranted(): Promise<boolean> {
  if (localVideoMode() !== 'fsaccess') return state.hasFolder; // no modo files não há permissão a pedir
  if (!handle) return false;
  if (state.granted) return true;
  const granted = await verifyPermission(handle, true);
  setState({ granted });
  return granted;
}

/** Remove a pasta/vídeos configurados. */
export async function forgetFolder(): Promise<void> {
  handle = null;
  filesMap = {};
  await idbDel(KEY).catch(() => {});
  await idbDel(FILES_KEY).catch(() => {});
  setState({ hasFolder: false, granted: false });
}

/** Hook React: estado da pasta de vídeos (dispara init na 1ª montagem). */
export function useVideoFolder(): FolderState {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    void initFolder();
  }, []);
  return snap;
}
