
export type Stage = 
  | 'Aguardando Avaliação' 
  | 'Em Avaliação' 
  | 'Avaliação Técnica'
  | 'Aguardando Aprovação' 
  | 'Aprovado' 
  | 'Orçamento Aprovado'
  | 'Em Serviço' 
  | 'Aguardando Peças' 
  | 'Fase de Teste' 
  | 'Finalizado' 
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
}
