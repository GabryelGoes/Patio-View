
import React, { useState, useEffect } from 'react';
import { Vehicle, Stage } from './types.ts';
import { CarOnLiftSvg } from './components/CarOnLiftSvg.tsx';

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
  if (s.includes('avaliação') && s.includes('aguardando')) return 'bg-zinc-900 text-zinc-500 border-zinc-800';
  if (s.includes('aguardando aprovação') || s.includes('aguardando aprovacao')) return 'bg-orange-400 text-orange-950 border-orange-500';
  if (s.includes('avaliação') || s.includes('aprovação')) return 'bg-yellow-400 text-yellow-950 border-yellow-300';
  
  if (s.includes('serviço')) return 'bg-blue-600 text-white border-blue-500';
  if (s.includes('aprovado')) return 'bg-orange-600 text-white border-orange-500';
  
  if (s.includes('peças')) return 'bg-cyan-500 text-cyan-950 border-cyan-400';
  if (s.includes('teste')) return 'bg-green-800 text-white border-green-700'; 
  if (s.includes('finalizado')) return 'bg-green-500 text-black border-green-400';
  
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

const GearAnimation: React.FC = () => (
  <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
    <svg viewBox="0 0 24 24" className="w-9 h-9 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.4)] animate-gear-spin" fill="currentColor" fillRule="evenodd" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.1125649,13.0304195 C18.1454626,12.7672379 18.1701359,12.5040563 18.1701359,12.2244258 C18.1701359,11.9447953 18.1454626,11.6816137 18.1125649,11.4184321 L19.8479188,10.0614018 C20.0041828,9.93803541 20.045305,9.71597592 19.9466119,9.53503855 L18.3017267,6.68938723 C18.2030336,6.50844986 17.9809741,6.44265446 17.8000367,6.50844986 L15.7521547,7.33089244 C15.3244846,7.00191541 14.8639167,6.73050936 14.3622268,6.52489871 L14.0496986,4.34542588 C14.0250253,4.14803966 13.8523124,4 13.6467017,4 L10.3569314,4 C10.1513208,4 9.97860782,4.14803966 9.95393455,4.34542588 L9.64140637,6.52489871 C9.13971639,6.73050936 8.67914855,7.01013984 8.25147841,7.33089244 L6.20359639,6.50844986 C6.0144346,6.43443003 5.80059953,6.50844986 5.70190642,6.68938723 L4.05702126,9.53503855 C3.95010373,9.71597592 3.99945028,9.93803541 4.15571437,10.0614018 L5.89106821,11.4184321 C5.85817051,11.6816137 5.83349723,11.9530197 5.83349723,12.2244258 C5.83349723,12.4958318 5.85817051,12.7672379 5.89106821,13.0304195 L4.15571437,14.3874498 C3.99945028,14.5108161 3.95832815,14.7328756 4.05702126,14.913813 L5.70190642,17.7594643 C5.80059953,17.9404017 6.02265902,18.0061971 6.20359639,17.9404017 L8.25147841,17.1179591 C8.67914855,17.4469361 9.13971639,17.7183422 9.64140637,17.9239528 L9.95393455,20.1034257 C9.97860782,20.3008119 10.1513208,20.4488516 10.3569314,20.4488516 L13.6467017,20.4488516 C13.8523124,20.4488516 14.0250253,20.3008119 14.0496986,20.1034257 L14.3622268,17.9239528 C14.8639167,17.7183422 15.3244846,17.4387117 15.7521547,17.1179591 L17.8000367,17.9404017 C17.9891985,18.0144215 18.2030336,17.9404017 18.3017267,17.7594643 L19.9466119,14.913813 C20.045305,14.7328756 20.0041828,14.5108161 19.8479188,14.3874498 L18.1125649,13.0304195 Z M12.0018166,15.1029748 C10.4145024,15.1029748 9.12326754,13.81174 9.12326754,12.2244258 C9.12326754,10.6371116 10.4145024,9.34587676 12.0018166,9.34587676 C13.5891307,9.34587676 14.8803656,10.6371116 14.8803656,12.2244258 C14.8803656,13.81174 13.5891307,15.1029748 12.0018166,15.1029748 Z" />
    </svg>
  </div>
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
  <div className="relative w-48 h-28 shrink-0 flex items-center justify-center mr-1 overflow-visible translate-x-[30%]">
    <svg viewBox="-40 -10 165 70" className="w-full h-full text-white overflow-visible" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="45" y="15" width="4" height="30" rx="1" fill="currentColor" opacity="0.4" />
      <rect x="39" y="45" width="16" height="2" rx="1" fill="currentColor" opacity="0.4" />
      <g className="animate-lift-move-workshop">
        <rect x="27" y="32" width="40" height="2" rx="1" fill="currentColor" />
        <rect x="44" y="30" width="6" height="4" rx="1" fill="currentColor" />
        <g transform="translate(-1, 4) scale(0.57)">
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

const FaseDeTesteCarAnimation: React.FC = () => (
  <div className="relative w-14 h-10 shrink-0 flex items-center justify-center mr-3 overflow-visible">
    <svg viewBox="0 0 380.027 380.027" className="w-full h-full fill-current drop-shadow-lg animate-car-test-move overflow-visible" xmlns="http://www.w3.org/2000/svg">
      <path d="M350.517,170.253l-3.83-2.341c-22.809-13.94-48.993-21.31-75.724-21.31h-32.165 c-0.164-0.135-0.323-0.273-0.498-0.398l-42.321-30.499c-8.181-5.895-17.835-9.011-27.919-9.011h-13.185c-5.522,0-10,4.478-10,10 s4.478,10,10,10h13.185c2.312,0,4.582,0.292,6.779,0.844v19.064h-48.943v-15.048c0-5.522-4.478-10-10-10s-10,4.478-10,10v10.066 l-9.712-3.684c-1.187-0.45-2.384-0.875-3.587-1.277v-2.658c0-5.522-4.478-10-10-10c-4.943,0-9.039,3.591-9.846,8.305 c-12.544-1.406-25.353-0.396-37.521,3.097l-27.989,8.033c-2.688,0.772-4.932,2.635-6.184,5.137 c-1.252,2.501-1.399,5.413-0.405,8.028l7.061,18.579l-3.688,24.457c-0.017,0.111-0.031,0.223-0.044,0.335 c-1.323,11.364,2.281,22.783,9.89,31.328c5.17,5.806,11.874,9.925,19.229,11.972c3.893,17.185,19.278,30.06,37.623,30.06 c17.817,0,32.846-12.143,37.263-28.585h159.458c4.417,16.442,19.446,28.585,37.263,28.585s32.845-12.143,37.262-28.585h16.189 c12.06,0,21.87-9.811,21.87-21.869v-0.001C380.027,201.545,368.72,181.38,350.517,170.253z M194.839,139.537l9.804,7.065h-9.804 V139.537z M89.307,234.748c0,10.248-8.337,18.585-18.585,18.585c-10.247,0-18.584-8.337-18.584-18.585 c0-10.247,8.337-18.584,18.584-18.584C80.97,216.164,89.307,224.501,89.307,234.748z M323.29,234.748 c0,10.248-8.337,18.585-18.584,18.585c-10.248,0-18.585-8.337-18.585-18.585c0-10.247,8.337-18.584,18.585-18.584 C314.953,216.164,323.29,224.501,323.29,234.748z M358.157,224.748h-16.189c-4.417-16.442-19.445-28.584-37.262-28.584 s-32.846,12.142-37.263,28.584H107.985c-4.417-16.442-19.446-28.584-37.263-28.584c-16.918,0-31.317,10.95-36.51,26.131 c-1.997-1.093-3.827-2.521-5.404-4.293c-3.839-4.312-5.604-9.833-4.979-15.564l4.052-26.866c0.256-1.7,0.069-3.437-0.541-5.044 l-4.129-10.865l17.537-5.033c15.803-4.535,32.971-3.822,48.342,2.008l24.559,9.315c1.134,0.43,2.335,0.65,3.547,0.65h153.768 c23.049,0,45.627,6.354,65.294,18.374l3.829,2.341c12.301,7.519,19.941,21.146,19.941,35.562 C360.027,223.909,359.189,224.748,358.157,224.748z" />
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
  /** Na TV: exibir aro vermelho só quando o veículo tem a etiqueta garantia E não está na etapa Garantia (quando está na etapa Garantia não exibimos o aro). Se remover a etiqueta no modal do sistema, garantiaTag vem false e o aro some. */
  const showGarantiaRing = vehicle.garantiaTag === true && !isGarantia;

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
    if (isFinalizado) return { label: "PRONTO", highlight: false, isDelayed: false };
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
      ${showGarantiaRing ? 'ring-4 ring-red-600 ring-offset-4 ring-offset-black shadow-[0_0_0_5px_rgba(220,38,38,1),0_0_20px_rgba(220,38,38,0.6)]' : ''}
      ${isHighlighted ? 'scale-[1.06] z-50 border-white border-[4px] shadow-[0_0_80px_rgba(255,255,255,0.4)]' : 'z-0 shadow-xl scale-100 border-transparent'}
      ${shouldShake ? 'animate-wiggle border-yellow-400 border-[3px] shadow-[0_0_40px_rgba(250,204,21,0.6)] z-40' : ''}
      ${hasAnyHighlight && !isHighlighted && !shouldShake ? 'opacity-20 grayscale-[0.8] scale-100' : 'opacity-100 grayscale-0'}
      overflow-x-hidden overflow-y-visible
    `}>
      <div className="w-[22%] flex flex-col justify-center overflow-visible font-black">
        <h2 className="text-3xl font-black tracking-tighter uppercase italic leading-[1.2] truncate overflow-visible">
          {vehicle.model.replace('Land Rover', '').trim()}
        </h2>
        <span className="text-[13px] font-black opacity-60 mt-1 uppercase tracking-[0.3em]">{vehicle.plate}</span>
      </div>

      <div className="w-[16%] border-l border-current/10 pl-6 overflow-visible">
        <p className="text-xl font-black uppercase tracking-tight leading-[1.2] truncate overflow-visible">{vehicle.client}</p>
      </div>

      <div className={`w-[34%] border-l border-current/10 relative h-full flex items-center overflow-hidden ${isFinalizado || isGarantia || isFaseDeTeste ? 'pl-0 pr-0 justify-center' : 'pl-6 pr-2'}`}>
        <div className={`flex items-center gap-2 h-full w-full overflow-hidden ${isFinalizado || isGarantia || isFaseDeTeste ? 'justify-center' : ''}`}>
          {isEmServico ? (
            <div className="flex items-center justify-center gap-1 w-full -translate-x-[30%]">
              <CarLiftAnimation />
              <p className={`font-black uppercase italic tracking-tighter leading-[1.1] whitespace-nowrap ${stageFontClass}`}>{displayStage}</p>
            </div>
          ) : null}
          {!isFinalizado && !isEmServico && isAvaliacaoTecnica && <MagnifierAnimation />}
          
          {isAguardando && !isFaseDeTeste && !isNaoAprovado && !isFinalizado && !isAvaliacaoTecnica && !isEmServico && !isGarantia && (
            <div className="w-6 h-6 flex items-center justify-center border-2 border-current rounded-full shrink-0 relative mr-2 overflow-visible">
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 animate-clock-hand-slow">
                <div className="absolute left-1/2 bottom-0 w-[2px] h-[5px] bg-current rounded-full -translate-x-1/2 origin-bottom" />
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-0 h-0 animate-clock-hand-fast">
                <div className="absolute left-1/2 bottom-0 w-[2px] h-[7px] bg-current rounded-full -translate-x-1/2 origin-bottom" />
              </div>
            </div>
          )}
          
          <div className={`flex items-center overflow-hidden h-full relative ${isGarantia || isFaseDeTeste || isFinalizado ? 'w-full justify-center' : 'w-full'}`}>
            {isFaseDeTeste ? (
               <div className="flex items-center justify-center w-full gap-2 -translate-x-[15%]">
                  <FaseDeTesteCarAnimation />
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
            ) : isGarantia ? (
              <div className="flex items-center justify-center gap-2 w-full -translate-x-[25%]">
                <GearAnimation />
                <p className={`font-black uppercase italic tracking-tighter leading-[1.1] whitespace-nowrap ${stageFontClass}`}>{displayStage}</p>
              </div>
            ) : isEmServico ? null : (
              <div className={`flex items-center gap-2 w-full`}>
                {isAprovado && !isNaoAprovado && !isFinalizado && <span className="text-green-500 font-black text-4xl animate-bounce shrink-0 drop-shadow-md">✓</span>}
                {isNaoAprovado && <span className="text-red-500 font-black text-3xl animate-pulse shrink-0 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] mr-1">✕</span>}
                <p className={`font-black uppercase italic tracking-tighter leading-[1.1] whitespace-nowrap ${stageFontClass}`}>
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

        @keyframes gear-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-gear-spin { animation: gear-spin 4s linear infinite; }

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

        @keyframes clock-hand-fast {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes clock-hand-slow {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        .animate-clock-hand-fast { animation: clock-hand-fast 5s linear infinite; }
        .animate-clock-hand-slow { animation: clock-hand-slow 10s linear infinite; }
      `}</style>
    </div>
  );
};

export default VehicleRow;
