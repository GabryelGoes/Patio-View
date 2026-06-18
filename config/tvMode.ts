/**
 * Modo do painel de TV (unificado Pátio/Laboratório) — domínio único.
 *
 * A escolha é resolvida em runtime, nesta ordem de prioridade:
 *   1. Parâmetro de URL: ?modo=laboratorio (ou ?mode=patio)  — também é persistido
 *   2. Escolha salva no navegador (localStorage 'tv_mode')    — a TV "lembra"
 *   3. Variável de ambiente VITE_TV_MODE (padrão de deploy)   — compatibilidade
 *
 * Se nada disso existir, `hasTvMode` é false e o App mostra a tela de seleção.
 * Ao trocar de modo usamos `setTvMode`, que salva e RECARREGA a página — assim os
 * seletores de serviço/linha (que resolvem o modo no carregamento) pegam o novo modo.
 *
 * Toda diferença visual/comportamental entre as duas TVs fica concentrada aqui.
 */

export type TvMode = 'patio' | 'laboratorio';

const STORAGE_KEY = 'tv_mode';

function normalizeMode(value: string | null | undefined): TvMode | null {
  const s = (value ?? '').toString().trim().toLowerCase();
  if (s === 'laboratorio' || s === 'lab' || s === 'laboratório') return 'laboratorio';
  if (s === 'patio' || s === 'pátio') return 'patio';
  return null;
}

function readUrlMode(): TvMode | null {
  try {
    const params = new URLSearchParams(window.location.search);
    return normalizeMode(params.get('modo') ?? params.get('mode'));
  } catch {
    return null;
  }
}

function readStoredMode(): TvMode | null {
  try {
    return normalizeMode(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

const envMode = normalizeMode((import.meta as any).env?.VITE_TV_MODE);
const urlMode = readUrlMode();

// URL tem prioridade e também persiste a escolha (para sobreviver a reloads).
if (urlMode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, urlMode);
  } catch {
    /* ignore */
  }
}

const resolvedMode: TvMode | null = urlMode ?? readStoredMode() ?? envMode;

/** Houve uma escolha explícita de modo? Se não, o App exibe a tela de seleção. */
export const hasTvMode = resolvedMode != null;

/** Modo efetivo. Quando nada foi escolhido, assume 'patio' (mas hasTvMode=false). */
export const TV_MODE: TvMode = resolvedMode ?? 'patio';
export const isLab = TV_MODE === 'laboratorio';
export const isPatio = TV_MODE === 'patio';

/** Limpa parâmetros de modo da URL atual (para não "fixar" via querystring). */
function stripModeParamsAndReload(): void {
  try {
    const url = new URL(window.location.href);
    url.searchParams.delete('modo');
    url.searchParams.delete('mode');
    window.location.replace(url.toString());
  } catch {
    window.location.reload();
  }
}

/** Salva o modo escolhido e recarrega para aplicar em todo o app. */
export function setTvMode(mode: TvMode): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  stripModeParamsAndReload();
}

/** Esquece a escolha e volta para a tela de seleção. */
export function clearTvMode(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  stripModeParamsAndReload();
}

export interface TvModeConfig {
  mode: TvMode;
  /** Título da aba do navegador. */
  documentTitle: string;
  /** Sufixo ao lado de "REI DO ABS" no cabeçalho. */
  sectionLabel: string;
  /** Classe de cor da marca no cabeçalho. */
  brandAccentClass: string;
  /** Texto do contador central (recebe a quantidade). */
  countText: (count: number) => string;
  /** Classe do contador central. */
  countClass: string;
  /** Classe do texto de alerta "AVALIAÇÃO PENDENTE". */
  alertTextClass: string;
  /** Classe do botão de som quando ligado. */
  soundOnClass: string;
  /** Cabeçalhos das colunas do quadro. */
  columns: { first: string; fourth: string; fifth: string };
  /** Texto e classes do "box vazio". */
  emptyBox: { text: string; className: string };
  /** Ordem de prioridade das etapas (menor = aparece antes). */
  stagePriority: Record<string, number>;
  /** Exibe a overlay/animação de "Peças Disponíveis" (somente Pátio). */
  showPecasDisponiveisOverlay: boolean;
}

const PATIO_CONFIG: TvModeConfig = {
  mode: 'patio',
  documentTitle: 'Rei do ABS - Painel de Pátio',
  sectionLabel: 'PÁTIO',
  brandAccentClass: 'text-yellow-400',
  countText: (n) => `${n} VEÍCULOS NO PÁTIO`,
  countClass: 'text-yellow-500/50',
  alertTextClass: 'text-yellow-400',
  soundOnClass:
    'bg-zinc-800 text-yellow-400 border-zinc-700 shadow-[0_0_15px_rgba(250,204,21,0.2)]',
  columns: { first: 'Modelo', fourth: 'Placa', fifth: 'Mecânico' },
  emptyBox: {
    text: 'Box Livre',
    className: 'border-white/5 bg-white/[0.02] text-white/10',
  },
  stagePriority: {
    Garantia: 1,
    'Aguardando Avaliação': 2,
    'Em Avaliação': 3,
    'Avaliação Técnica': 4,
    'Aguardando Aprovação': 5,
    Aprovado: 6,
    'Orçamento Aprovado': 7,
    'Aguardando Peças': 8,
    'Peças Disponíveis': 9,
    'Em Serviço': 10,
    'Fase de Teste': 11,
    Finalizado: 12,
    'Orçamento Não Aprovado': 13,
  },
  showPecasDisponiveisOverlay: true,
};

const LABORATORIO_CONFIG: TvModeConfig = {
  mode: 'laboratorio',
  documentTitle: 'Rei do ABS - Painel do Laboratório',
  sectionLabel: 'LABORATÓRIO',
  brandAccentClass: 'text-violet-400',
  countText: (n) => `${n} MÓDULOS NO LABORATÓRIO`,
  countClass: 'text-violet-400 tabular-nums',
  alertTextClass: 'text-violet-300',
  soundOnClass:
    'bg-zinc-800 text-violet-400 border-zinc-700 shadow-[0_0_15px_rgba(139,92,246,0.25)]',
  columns: { first: 'Carro / OS', fourth: 'Compartimento', fifth: 'Produto' },
  emptyBox: {
    text: 'Vaga Livre',
    className: 'border-violet-500/10 bg-violet-500/[0.03] text-violet-200/20',
  },
  stagePriority: {
    Garantia: 1,
    'Aguardando Avaliação': 2,
    'Avaliação Técnica': 3,
    'Aguardando Aprovação': 4,
    'Orçamento Aprovado': 5,
    'Aguardando Peças': 6,
    'Peças Disponíveis': 7,
    'Envio Conserto': 8,
    'Chegada Conserto': 9,
    'Em Serviço': 10,
    'Pronto pra Retirada': 11,
    'Orçamento Não Aprovado': 12,
  },
  showPecasDisponiveisOverlay: false,
};

export const TV_CONFIG: TvModeConfig = isLab ? LABORATORIO_CONFIG : PATIO_CONFIG;
