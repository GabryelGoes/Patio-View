
import type { TvChimeScheduleConfig } from './utils/tvChimeSchedule';

export type Stage = 
  | 'Aguardando Avaliação' 
  | 'Em Avaliação' 
  | 'Avaliação Técnica'
  | 'Aguardando Aprovação' 
  | 'Aprovado' 
  | 'Orçamento Aprovado'
  | 'Em Serviço' 
  | 'Aguardando Peças'
  | 'Peças Disponíveis'
  | 'Envio Conserto'
  | 'Chegada Conserto'
  | 'Fase de Teste' 
  | 'Finalizado' 
  | 'Pronto pra Retirada'
  | 'Garantia' 
  | 'Orçamento Não Aprovado';

export interface Vehicle {
  id: string;
  model: string;
  plate: string;
  client: string;
  stage: Stage;
  deliveryDate: string;
  rawDueDate?: Date; // Data original para cálculos
  mechanic: string;
  lastActivity: string;
  /** Etiqueta de garantia (vem da API): persiste em qualquer etapa até remover no modal do sistema principal. Na TV, o aro vermelho só aparece quando garantiaTag é true e o veículo NÃO está na etapa Garantia. */
  garantiaTag?: boolean;
  /** Compartimento da bancada do laboratório (1..24). NULL/undefined = fora da bancada. */
  benchSlot?: number | null;
  /** Tipo de produto do laboratório (ex.: "Módulo completo", "Módulo hidráulico", "Pinça de freio"). */
  productType?: string;
  /** Produto encaminhado da oficina (pátio) — recebe aro de destaque âmbar na TV. */
  fromWorkshop?: boolean;
}

export type TvSlideType = 'notice' | 'image' | 'video' | 'goal' | 'alert';

export interface TvSlide {
  id: string;
  slideType: TvSlideType;
  title: string;
  body: string;
  mediaUrl: string | null;
  durationSeconds: number;
  sortOrder: number;
  goalCurrent: number | null;
  goalTarget: number | null;
  goalLabel: string | null;
  /** Bip ao exibir este slide na TV (respeita também o som do header). */
  playSound?: boolean;
  /** Só tipo goal: true = R$, false = só %. */
  goalShowValues?: boolean;
  /** Fixar este slide na TV (gestão no app principal). */
  pinImmediate?: boolean;
  /** Imagem/vídeo preenche toda a área da TV (sem bordas). */
  mediaFullscreen?: boolean;
  /** Encaixe da mídia na TV: cover (preencher), contain (inteira) ou fill (esticar). */
  mediaObjectFit?: 'cover' | 'contain' | 'fill';
}

export interface TvWeeklyGoal {
  label: string;
  currentAmount: number;
  targetAmount: number;
  /** Se false, a barra de meta não aparece na TV (páginas de veículos). */
  showWeeklyBar?: boolean;
}

export interface WorkshopData {
  boardName: string;
  vehicles: Vehicle[];
  tvSlides: TvSlide[];
  weeklyGoal: TvWeeklyGoal | null;
  chimeSchedule: TvChimeScheduleConfig | null;
}
