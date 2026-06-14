/**
 * Modo do painel de TV (unificado Pátio/Laboratório).
 *
 * Define-se por ambiente: VITE_TV_MODE = "patio" | "laboratorio".
 * Sem a variável, assume "patio" (compatível com o deploy histórico do Pátio).
 *
 * Toda diferença visual/comportamental entre as duas TVs fica concentrada aqui,
 * para o restante do código ser compartilhado e mantido uma única vez.
 */

export type TvMode = 'patio' | 'laboratorio';

const rawMode = ((import.meta as any).env?.VITE_TV_MODE ?? 'patio')
  .toString()
  .trim()
  .toLowerCase();

export const TV_MODE: TvMode =
  rawMode === 'laboratorio' || rawMode === 'lab' || rawMode === 'laboratório'
    ? 'laboratorio'
    : 'patio';

export const isLab = TV_MODE === 'laboratorio';
export const isPatio = TV_MODE === 'patio';

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
  columns: { first: 'Modelo / Placa', fourth: 'Entrega', fifth: 'Mecânico' },
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
