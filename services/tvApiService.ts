/**
 * Seletor de serviço de dados da TV conforme o modo (VITE_TV_MODE).
 * - patio       -> patioApiService (ordens de veículos)
 * - laboratorio -> laboratorioApiService (ordens de módulos)
 *
 * Ambos exportam `fetchWorkshopData(): Promise<WorkshopData>` com a mesma assinatura.
 */

import { isLab } from '../config/tvMode';
import { fetchWorkshopData as fetchPatio } from './patioApiService';
import { fetchWorkshopData as fetchLaboratorio } from './laboratorioApiService';

export const fetchWorkshopData = isLab ? fetchLaboratorio : fetchPatio;
