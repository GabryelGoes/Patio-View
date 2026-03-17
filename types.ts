
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

export interface WorkshopData {
  boardName: string;
  vehicles: Vehicle[];
}

// ---------- Quadro de avisos (TV) ----------

export interface Notice {
  id: string;
  title: string;
  body: string;
  highlight: boolean;
  active: boolean;
  sortOrder: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyGoal {
  weekStart: string;
  targetAmount: number;
  currentAmount: number;
}

export interface WorkshopAndNotices {
  boardName: string;
  vehicles: Vehicle[];
  notices: Notice[];
  weeklyGoal: WeeklyGoal | null;
}
