
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
}

export interface WorkshopData {
  boardName: string;
  vehicles: Vehicle[];
}
