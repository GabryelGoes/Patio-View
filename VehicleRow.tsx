/**
 * Seletor de linha do quadro conforme o modo (VITE_TV_MODE).
 * As duas TVs têm colunas/visuais bem diferentes, então cada modo tem sua
 * própria implementação (VehicleRow.patio / VehicleRow.laboratorio), mantidas
 * no mesmo repositório.
 */

import { isLab } from './config/tvMode';
import VehicleRowPatio from './VehicleRow.patio';
import VehicleRowLaboratorio from './VehicleRow.laboratorio';

const VehicleRow = isLab ? VehicleRowLaboratorio : VehicleRowPatio;

export default VehicleRow;
