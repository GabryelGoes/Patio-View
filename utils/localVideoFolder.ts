/**
 * Vídeos locais da TV via File System Access API (Chrome/Edge).
 *
 * A mídia de vídeo não precisa subir para o Storage/Vercel: o slide guarda apenas
 * uma referência "local:arquivo.mp4" e a TV lê o arquivo direto de uma pasta do PC.
 *
 * - O handle da pasta é salvo no IndexedDB (persiste entre sessões).
 * - Após reiniciar o navegador, o Chrome pode exigir 1 clique para reautorizar
 *   (requestPermission só funciona a partir de um gesto do usuário).
 */

import { useEffect } from 'react';
import { useSyncExternalStore } from 'react';

export const LOCAL_PREFIX = 'local:';

/** True se a mediaUrl aponta para um arquivo local (ex.: "local:promo.mp4"). */
export function isLocalVideoRef(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.trim().toLowerCase().startsWith(LOCAL_PREFIX);
}

/** Extrai o nome do arquivo de uma referência "local:...". */
export function localVideoName(url: string): string {
  return String(url).trim().slice(LOCAL_PREFIX.length).replace(/^[/\\]+/, '').trim();
}

/** O navegador suporta File System Access API? (Chrome/Edge desktop). */
export function supportsLocalVideo(): boolean {
  return typeof window !== 'undefined' && typeof (window as any).showDirectoryPicker === 'function';
}

// Handle da pasta (FileSystemDirectoryHandle). Tipado como any para não depender de libs de tipos.
type DirHandle = any;

// --------------------------- IndexedDB ---------------------------
const DB_NAME = 'tv-local-media';
const DB_VERSION = 1;
const STORE = 'handles';
const KEY = 'videoDir';

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

// --------------------------- FS Access helpers ---------------------------
async function pickFolder(): Promise<DirHandle | null> {
  if (!supportsLocalVideo()) return null;
  try {
    const handle = await (window as any).showDirectoryPicker({ id: 'tv-video-folder', mode: 'read' });
    await idbSet(KEY, handle).catch(() => {});
    return handle;
  } catch {
    return null; // usuário cancelou
  }
}

async function verifyPermission(handle: DirHandle, requestIfNeeded: boolean): Promise<boolean> {
  if (!handle) return false;
  try {
    const opts = { mode: 'read' as const };
    if ((await handle.queryPermission(opts)) === 'granted') return true;
    if (requestIfNeeded && (await handle.requestPermission(opts)) === 'granted') return true;
    return false;
  } catch {
    return false;
  }
}

/** Resolve "arquivo.mp4" da pasta para um objectURL tocável. Null se não achar. */
export async function getLocalVideoObjectUrl(handle: DirHandle, name: string): Promise<string | null> {
  if (!handle || !name) return null;
  try {
    const fileHandle = await handle.getFileHandle(name);
    const file = await fileHandle.getFile();
    return URL.createObjectURL(file);
  } catch {
    return null;
  }
}

// --------------------------- Store reativo ---------------------------
export type FolderState = {
  /** Já terminou a leitura inicial do IndexedDB. */
  ready: boolean;
  /** Há uma pasta configurada. */
  hasFolder: boolean;
  /** Permissão de leitura concedida na sessão atual. */
  granted: boolean;
};

let handle: DirHandle | null = null;
let state: FolderState = { ready: false, hasFolder: false, granted: false };
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
    const saved = await idbGet<DirHandle>(KEY);
    if (saved) {
      handle = saved;
      const granted = await verifyPermission(saved, false);
      setState({ ready: true, hasFolder: true, granted });
      return;
    }
  } catch {
    /* ignore */
  }
  setState({ ready: true });
}

/** Abre o seletor de pasta (gesto do usuário) e guarda a escolha. */
export async function chooseFolder(): Promise<boolean> {
  const picked = await pickFolder();
  if (!picked) return false;
  handle = picked;
  const granted = await verifyPermission(picked, true);
  setState({ hasFolder: true, granted });
  return granted;
}

/** Garante permissão na pasta já configurada (gesto do usuário). */
export async function ensureGranted(): Promise<boolean> {
  if (!handle) return false;
  if (state.granted) return true;
  const granted = await verifyPermission(handle, true);
  setState({ granted });
  return granted;
}

/** Remove a pasta configurada. */
export async function forgetFolder(): Promise<void> {
  handle = null;
  await idbDel(KEY).catch(() => {});
  setState({ hasFolder: false, granted: false });
}

/** Handle atual (para resolver arquivos). */
export function currentHandle(): DirHandle | null {
  return handle;
}

/** Hook React: estado da pasta de vídeos (dispara init na 1ª montagem). */
export function useVideoFolder(): FolderState {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(() => {
    void initFolder();
  }, []);
  return snap;
}
