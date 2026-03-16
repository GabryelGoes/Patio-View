
import React, { useState, useEffect } from 'react';
import { Vehicle, Stage } from '../types.ts';
import { CarOnLiftSvg } from './CarOnLiftSvg.tsx';

interface VehicleRowProps {
  vehicle: Vehicle;
  isHighlighted?: boolean;
  hasAnyHighlight?: boolean;
  isAlerting?: boolean;
}

const getStageColors = (stage: Stage) => {
  const s = stage.toLowerCase();
  
  if (s.includes('não aprovado') || s.includes('nao aprovado')) {
    return 'bg-violet-600 text-white border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.2)]';
  }

  if (s.includes('garantia')) return 'bg-red-700 text-white border-red-600';
  
  // Nova cor para Aguardando Aprovação (Âmbar/Dourado)
  if (s.includes('aguardando aprovação') || s.includes('aguardando aprovacao')) {
    return 'bg-amber-500 text-white border-amber-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]';
  }

  if (s.includes('avaliação') && s.includes('aguardando')) return 'bg-zinc-900 text-zinc-500 border-zinc-800';
  if (s.includes('avaliação') || s.includes('aprovação')) return 'bg-yellow-400 text-yellow-950 border-yellow-300';
  
  if (s.includes('serviço')) return 'bg-blue-600 text-white border-blue-500';
  if (s.includes('aprovado')) return 'bg-orange-600 text-white border-orange-500';
  
  if (s.includes('peças')) return 'bg-cyan-500 text-cyan-950 border-cyan-400';
  if (s.includes('teste')) return 'bg-green-800 text-white border-green-700'; 
  if (s.includes('finalizado')) return 'bg-green-500 text-white border-green-400';
  
  return 'bg-zinc-800 text-white border-zinc-700';
};

const BrakeDiscProfile: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 100 100" className={`${className} overflow-visible`} xmlns="http://www.w3.org/2000/svg">
    <g className="animate-disc-spin origin-center">
      <circle cx="50" cy="50" r="45" fill="#bdc3c7" stroke="#ecf0f1" strokeWidth="1" />
      <circle cx="50" cy="50" r="42" fill="#dcdde1" />
      <circle cx="50" cy="50" r="40" fill="none" stroke="#95a5a6" strokeWidth="12" strokeDasharray="1,3" opacity="0.6" />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
        <g key={deg} transform={`rotate(${deg} 50 50)`}>
          <circle cx="50" cy="22" r="1.5" fill="#2c3e50" />
          <circle cx="50" cy="32" r="1.5" fill="#2c3e50" />
        </g>
      ))}
      <circle cx="50" cy="50" r="15" fill="#7f8c8d" stroke="#95a5a6" strokeWidth="2" />
      {[0, 72, 144, 216, 288].map(deg => (
        <circle key={deg} cx={50 + 8 * Math.cos(deg * Math.PI / 180)} cy={50 + 8 * Math.sin(deg * Math.PI / 180)} r="2" fill="#000" />
      ))}
    </g>
    <g transform="translate(12, 0)"> 
      <path d="M65,10 C85,15 85,85 65,90 L85,90 C95,80 95,20 85,10 Z" fill="#e11d48" className="drop-shadow-[0_0_15px_rgba(0,0,0,0.4)]" />
      <rect x="75" y="30" width="10" height="40" rx="2" fill="#b91c1c" />
      <rect x="78" y="40" width="4" height="20" rx="1" fill="rgba(255,255,255,0.3)" />
    </g>
  </svg>
);

const MagnifierAnimation: React.FC = () => (
  <div className="relative w-10 h-10 shrink-0 flex items-center justify-center mr-2 animate-magnifier-scan">
    <svg viewBox="0 0 24 24" className="w-8 h-8 fill-none stroke-current text-white stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <path d="M11 8v6M8 11h6" className="opacity-40" />
    </svg>
  </div>
);

const CarLiftAnimation: React.FC = () => (
  <div className="relative w-24 h-14 shrink-0 flex items-center justify-center mr-2 overflow-visible translate-x-[15%]">
    <svg viewBox="-40 -10 165 70" className="w-full h-full text-white overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="45" y="15" width="4" height="30" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="39" y="45" width="16" height="2" rx="1" fill="currentColor" opacity="0.4" />
      <g className="animate-lift-move-workshop">
        <rect x="27" y="32" width="40" height="2" rx="1" fill="currentColor" />
        <rect x="44" y="30" width="6" height="4" rx="1" fill="currentColor" />
        <g transform="translate(-31, -50) scale(0.40)">
          <CarOnLiftSvg />
        </g>
      </g>
    </svg>
  </div>
);

const FastDiscAnimation: React.FC = () => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
    <div className="animate-disc-drive flex items-center justify-center w-full h-full overflow-visible">
      <div className="relative">
        <BrakeDiscProfile className="w-16 h-16 drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse -z-10"></div>
      </div>
    </div>
  </div>
);

const TestDriveCarAnimation: React.FC = () => (
  <div className="relative w-12 h-8 shrink-0 flex items-center justify-center mr-3 overflow-visible">
    <svg viewBox="0 0 60 30" className="w-full h-full fill-white drop-shadow-lg animate-car-test-move overflow-visible" xmlns="http://www.w3.org/2000/svg">
      {/* Minimalist car body */}
      <path d="M5,20 L55,20 L52,15 L45,8 L15,8 L8,15 Z" />
      {/* Wheels */}
      <circle cx="15" cy="20" r="4.5" fill="#111" stroke="currentColor" strokeWidth="2" />
      <circle cx="45" cy="20" r="4.5" fill="#111" stroke="currentColor" strokeWidth="2" />
      {/* Motion lines */}
      <path d="M-5,15 L0,15 M-8,18 L-2,18" stroke="currentColor" strokeWidth="2" className="opacity-60" />
    </svg>
  </div>
);

const VehicleRow: React.FC<VehicleRowProps> = ({ vehicle, isHighlighted, hasAnyHighlight, isAlerting }) => {
  const [showAnim, setShowAnim] = useState(false);
  const colorClass = getStageColors(vehicle.stage);
  const s = vehicle.stage.toLowerCase();
  
  const isNaoAprovado = s.includes('não aprovado') || s.includes('nao aprovado');
  const isFaseDeTeste = s.includes('teste');
  const isAprovado = s.includes('aprovado');
  const isEmServico = s.includes('serviço');
  const isAguardando = s.startsWith('aguardando');
  const isFinalizado = s.includes('finalizado');
  const isAvaliacaoTecnica = s.includes('avaliação técnica') || s.includes('avaliacao tecnica');
  const isGarantia = s.includes('garantia');

  const shouldShake = isAlerting && (s.includes('avaliação') && s.includes('aguardando'));
  const displayStage = isNaoAprovado ? 'Não Aprovado' : vehicle.stage;

  useEffect(() => {
    if (!isFinalizado) return;
    const interval = setInterval(() => { setShowAnim(prev => !prev); }, 3000); 
    return () => clearInterval(interval);
  }, [isFinalizado]);

  const getFontSizeClass = (text: string) => {
    if (text.length > 22) return 'text-xl';
    if (text.length > 15) return 'text-2xl';
    return 'text-3xl';
  };

  const stageFontClass = getFontSizeClass(displayStage);

  const getDeliveryStatus = () => {
    if (isFinalizado) return { label: "PRONTO", highlight: true, isDelayed: true };
    if (!vehicle.rawDueDate) return { label: vehicle.deliveryDate || '---', highlight: false, isDelayed: false };
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d = new Date(vehicle.rawDueDate);
    const delivery = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const diffDays = Math.round((delivery.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: "ATRASADO", highlight: true, isDelayed: true };
    if (diffDays === 0) return { label: "HOJE", highlight: true, isDelayed: false };
    if (diffDays === 1) return { label: "AMANHÃ", highlight: true, isDelayed: false };
    return { label: vehicle.deliveryDate, highlight: false, isDelayed: false };
  };

  const status = getDeliveryStatus();

  return (
    <div className={`
      flex items-center w-full h-full rounded-[24px] border px-8 py-3 transition-all duration-1000 relative
      ${colorClass}
      ${isHighlighted ? 'scale-[1.06] z-50 border-white border-[4px] shadow-[0_0_80px_rgba(255,255,255,0.4)]' : 'z-0 shadow-xl scale-100 border-transparent'}
      ${shouldShake ? 'animate-wiggle border-yellow-400 border-[3px] shadow-[0_0_40px_rgba(250,204,21,0.6)] z-40' : ''}
      ${hasAnyHighlight && !isHighlighted && !shouldShake ? 'opacity-20 grayscale-[0.8] scale-100' : 'opacity-100 grayscale-0'}
      overflow-x-hidden overflow-y-visible
    `}>
      <div className="w-[22%] flex flex-col justify-center overflow-visible">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-[1.2] truncate overflow-visible">
          {vehicle.model.replace('Land Rover', '').trim()}
        </h2>
        <span className="text-[13px] font-bold opacity-60 mt-1 uppercase tracking-[0.3em]">{vehicle.plate}</span>
      </div>

      <div className="w-[16%] border-l border-current/10 pl-6 overflow-visible">
        <p className="text-xl font-bold uppercase tracking-tight leading-[1.2] truncate overflow-visible">{vehicle.client}</p>
      </div>

      <div className={`w-[34%] border-l border-current/10 relative h-full flex items-center overflow-hidden ${isFinalizado || isGarantia || isFaseDeTeste || isNaoAprovado ? 'pl-0 pr-0 justify-center' : 'pl-6 pr-2'}`}>
        <div className={`flex items-center gap-2 h-full w-full overflow-hidden ${isFinalizado || isGarantia || isFaseDeTeste || isNaoAprovado ? 'justify-center' : ''}`}>
          {!isFinalizado && isEmServico && <CarLiftAnimation />}
          {!isFinalizado && isAvaliacaoTecnica && <MagnifierAnimation />}
          
          {isAguardando && !isFaseDeTeste && !isNaoAprovado && !isFinalizado && !isAvaliacaoTecnica && !isEmServico && !isGarantia && (
            <div className="w-6 h-6 flex items-center justify-center border-2 border-current rounded-full shrink-0 relative mr-2">
               <div className="absolute w-[2px] h-2 bg-current origin-bottom bottom-1/2 animate-[spin_3s_linear_infinite]"></div>
            </div>
          )}
          
          <div className={`flex items-center overflow-hidden h-full relative ${isGarantia || isFaseDeTeste || isFinalizado || isNaoAprovado ? 'w-full justify-center' : 'w-full'}`}>
            {isFaseDeTeste ? (
               <div className="flex items-center justify-center w-full">
                  <TestDriveCarAnimation />
                  <p className={`font-black uppercase italic tracking-tighter ${stageFontClass} leading-[1.1] whitespace-nowrap`}>{displayStage}</p>
               </div>
            ) : isFinalizado ? (
              <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${showAnim ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
                   <p className={`font-black uppercase italic tracking-tighter ${stageFontClass} leading-[1.1] whitespace-nowrap text-center w-full`}>{displayStage}</p>
                </div>
                <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 transform ${showAnim ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'} overflow-hidden`}>
                   <FastDiscAnimation />
                </div>
              </div>
            ) : (
              <div className={`flex items-center gap-2 w-full ${isFinalizado || isGarantia || isNaoAprovado ? 'justify-center' : ''}`}>
                {isAprovado && !isNaoAprovado && !isFinalizado && <span className="text-green-500 font-black text-4xl animate-bounce shrink-0 drop-shadow-md">✓</span>}
                
                {isNaoAprovado && (
                  <div className="relative w-8 h-8 flex items-center justify-center mr-2 shrink-0">
                    <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping" />
                    <svg viewBox="0 0 24 24" className="w-full h-full text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.9)]" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </div>
                )}

                <p className={`font-black uppercase italic tracking-tighter leading-[1.1] whitespace-nowrap ${stageFontClass} ${isGarantia || isFinalizado ? 'text-center w-full' : ''}`}>
                  {displayStage}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-[14%] border-l border-current/10 pl-4 pr-2 flex items-center justify-center h-full">
        <p className={`font-black uppercase leading-[1.2] tracking-tighter text-center ${status.isDelayed ? 'text-[1.45rem] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] animate-pulse' : 'text-2xl opacity-80'}`}>
          {status.label}
        </p>
      </div>

      <div className="w-[14%] border-l border-current/10 pl-6 h-full flex items-center">
        <p className="text-xl font-bold uppercase truncate tracking-tight leading-[1.2] opacity-90">{vehicle.mechanic}</p>
      </div>

      <style>{`
        @keyframes disc-spin { from { transform: rotate(0deg); } to { transform: rotate(1080deg); } }
        .animate-disc-spin { animation: disc-spin 1s linear infinite; }
        
        @keyframes disc-drive { 
          0% { transform: translateX(0) scale(0.6); opacity: 0; }
          15% { transform: translateX(0) scale(1); opacity: 1; }
          65% { transform: translateX(0) scale(1); opacity: 1; }
          100% { transform: translateX(300%) skewX(15deg); opacity: 0; }
        }
        .animate-disc-drive { animation: disc-drive 3s cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite; }

        @keyframes lift-move-workshop { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-16px); } }
        .animate-lift-move-workshop { animation: lift-move-workshop 4s ease-in-out infinite; }

        @keyframes magnifier-scan {
          0% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(5px, -5px) rotate(5deg); }
          50% { transform: translate(0, 0) rotate(0deg); }
          75% { transform: translate(-5px, 5px) rotate(-5deg); }
          100% { transform: translate(0, 0) rotate(0deg); }
        }
        .animate-magnifier-scan { animation: magnifier-scan 3s ease-in-out infinite; }

        @keyframes hood-wiggle { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-3deg); } }
        .animate-hood-wiggle { animation: hood-wiggle 2.5s ease-in-out infinite; transform-origin: 80px 16px; }
        @keyframes wiggle { 0%, 100% { transform: translateX(0); } 10%, 30%, 50%, 70%, 90% { transform: translateX(-6px); } 20%, 40%, 60%, 80% { transform: translateX(6px); } }
        .animate-wiggle { animation: wiggle 0.6s ease-in-out infinite; }

        @keyframes car-test-move { 
          0% { transform: translateX(-4px); } 
          50% { transform: translateX(12px); } 
          100% { transform: translateX(-4px); } 
        }
        .animate-car-test-move { animation: car-test-move 2.5s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default VehicleRow;
