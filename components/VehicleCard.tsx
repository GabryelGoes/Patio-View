
import React from 'react';
import { Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
}

const VehicleCard: React.FC<VehicleCardProps> = ({ vehicle }) => {
  // Use model and plate directly from the vehicle object instead of splitting a non-existent name property
  const { model, plate } = vehicle;

  return (
    <div className="glass-card rounded-2xl p-5 mb-4 shadow-xl">
      <div className="flex justify-between items-start mb-2">
        {/* Use the model property from the Vehicle interface instead of non-existent name */}
        <h3 className="text-xl font-bold text-white tracking-tight">{model}</h3>
        {plate && (
          <span className="bg-white/10 text-white/80 px-2 py-1 rounded-md text-[10px] font-bold tracking-widest border border-white/10">
            {plate}
          </span>
        )}
      </div>
      
      <p className="text-sm text-slate-400 mb-4 line-clamp-2 leading-relaxed">
        {/* Use client property as desc does not exist in the Vehicle type */}
        Cliente: {vehicle.client}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex gap-1.5">
          {/* Removed labels logic as labels property is not present in Vehicle type, displaying stage instead */}
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">
            {vehicle.stage}
          </span>
        </div>
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {vehicle.lastActivity}
        </span>
      </div>
    </div>
  );
};

export default VehicleCard;
