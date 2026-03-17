
import React, { useState, useEffect, useRef } from 'react';
import { WorkshopData, Stage, Vehicle } from './types.ts';
import { fetchWorkshopData } from './services/patioApiService.ts';
import Clock from './Clock.tsx';
import VehicleRow from './VehicleRow.tsx';
import CelebrationOverlay from './CelebrationOverlay.tsx';
import GarantiaOverlay from './GarantiaOverlay.tsx';

const STAGE_PRIORITY: Record<string, number> = {
  'Garantia': 1,
  'Aguardando Avaliação': 2,
  'Em Avaliação': 3,
  'Avaliação Técnica': 4,
  'Aguardando Aprovação': 5,
  'Aprovado': 6,
  'Orçamento Aprovado': 7,
  'Aguardando Peças': 8,
  'Em Serviço': 9,
  'Fase de Teste': 10,
  'Finalizado': 11,
  'Orçamento Não Aprovado': 12
};

const playNotificationSound = async (soundEnabled: boolean, repeat = 1) => {
  if (!soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') await ctx.resume();
    
    const playNote = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    let now = ctx.currentTime;
    for (let i = 0; i < repeat; i++) {
      playNote(880, now, 0.15); 
      playNote(1046.5, now + 0.1, 0.2); 
      now += 0.4;
    }
  } catch (e) { console.warn(e); }
};

const App: React.FC = () => {
  const [data, setData] = useState<WorkshopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const now = new Date();
    const m = now.getHours() * 60 + now.getMinutes();
    // 08:00-12:00 (480-720) & 13:30-19:00 (810-1140)
    return (m >= 480 && m < 720) || (m >= 810 && m < 1140);
  });
  const [isEvaluationAlertActive, setIsEvaluationAlertActive] = useState(false);

  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const m = now.getHours() * 60 + now.getMinutes();
      const shouldBeOn = (m >= 480 && m < 720) || (m >= 810 && m < 1140);
      setSoundEnabled(shouldBeOn);
    };
    const interval = setInterval(checkSchedule, 60000);
    return () => clearInterval(interval);
  }, []);
  
  const [celebrationQueue, setCelebrationQueue] = useState<Vehicle[]>([]);
  const [garantiaQueue, setGarantiaQueue] = useState<{vehicle: Vehicle, indexInPage: number}[]>([]);
  const [highlightQueue, setHighlightQueue] = useState<string[]>([]);
  
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const previousVehiclesRef = useRef<Record<string, string>>({});
  const CARS_PER_PAGE = 6;

  const loadData = async () => {
    try {
      const result = await fetchWorkshopData();
      const sortedVehicles = result.vehicles
        .filter(v => STAGE_PRIORITY[v.stage] !== undefined)
        .sort((a, b) => (STAGE_PRIORITY[a.stage] || 99) - (STAGE_PRIORITY[b.stage] || 99));

      const newlyApproved: Vehicle[] = [];
      const newlyGarantia: {vehicle: Vehicle, indexInPage: number}[] = [];
      const standardChanges: string[] = [];

      sortedVehicles.forEach((vehicle, globalIndex) => {
        const prevStage = previousVehiclesRef.current[vehicle.id];
        const currentStage = vehicle.stage;

        if (prevStage && prevStage !== currentStage) {
          if (currentStage === 'Orçamento Aprovado') {
            newlyApproved.push(vehicle);
          } else if (currentStage === 'Garantia') {
            const indexInPage = globalIndex % CARS_PER_PAGE;
            newlyGarantia.push({ vehicle, indexInPage });
          } else {
            standardChanges.push(vehicle.id);
          }
        }
        previousVehiclesRef.current[vehicle.id] = currentStage;
      });

      if (newlyApproved.length > 0) setCelebrationQueue(prev => [...prev, ...newlyApproved]);
      if (newlyGarantia.length > 0) setGarantiaQueue(prev => [...prev, ...newlyGarantia]);
      if (standardChanges.length > 0) setHighlightQueue(prev => [...prev, ...standardChanges]);

      setData({ ...result, vehicles: sortedVehicles });
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (highlightQueue.length > 0 && !activeHighlightId && celebrationQueue.length === 0 && garantiaQueue.length === 0) {
      const nextId = highlightQueue[0];
      if (data) {
        const index = data.vehicles.findIndex(v => v.id === nextId);
        if (index !== -1) {
          setPage(Math.floor(index / CARS_PER_PAGE));
          setActiveHighlightId(nextId);
          playNotificationSound(soundEnabled);
          setTimeout(() => {
            setActiveHighlightId(null);
            setHighlightQueue(prev => prev.slice(1));
          }, 8000);
        } else {
          setHighlightQueue(prev => prev.slice(1));
        }
      }
    }
  }, [highlightQueue, activeHighlightId, celebrationQueue.length, garantiaQueue.length, data, soundEnabled]);

  useEffect(() => {
    loadData();
    const refreshInterval = setInterval(loadData, 5000);
    return () => clearInterval(refreshInterval);
  }, [soundEnabled]);

  useEffect(() => {
    let interval: any;
    if (isEvaluationAlertActive && soundEnabled) {
      playNotificationSound(soundEnabled, 1);
      interval = setInterval(() => {
        playNotificationSound(soundEnabled, 1);
      }, 1800);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isEvaluationAlertActive, soundEnabled]);

  useEffect(() => {
    const triggerAlert = () => {
      const hasPending = data?.vehicles.some(v => 
        v.stage.toLowerCase().includes('avaliação') && v.stage.toLowerCase().includes('aguardando')
      );
      if (hasPending) {
        setIsEvaluationAlertActive(true);
        setTimeout(() => setIsEvaluationAlertActive(false), 12000);
      }
    };

    const alertInterval = setInterval(triggerAlert, 30 * 60 * 1000);
    const checkSync = setInterval(() => {
      const now = new Date();
      if (now.getMinutes() % 30 === 0 && now.getSeconds() === 0) triggerAlert();
    }, 1000);
    return () => { clearInterval(alertInterval); clearInterval(checkSync); };
  }, [data]);

  useEffect(() => {
    if (isEvaluationAlertActive && data) {
      const firstPendingIndex = data.vehicles.findIndex(v => 
        v.stage.toLowerCase().includes('avaliação') && v.stage.toLowerCase().includes('aguardando')
      );
      if (firstPendingIndex !== -1) {
        setPage(Math.floor(firstPendingIndex / CARS_PER_PAGE));
      }
    }
  }, [isEvaluationAlertActive, data]);

  useEffect(() => {
    if (!data || data.vehicles.length <= CARS_PER_PAGE) {
      setPage(0);
      return;
    }
    const hasActiveOverlay = celebrationQueue.length > 0 || garantiaQueue.length > 0 || !!activeHighlightId || isEvaluationAlertActive;
    if (hasActiveOverlay) return;

    const totalPages = Math.ceil(data.vehicles.length / CARS_PER_PAGE);
    if (totalPages < 1) return;
    const pageInterval = setInterval(() => setPage((prev) => (prev + 1) % totalPages), 7000);
    return () => clearInterval(pageInterval);
  }, [data?.vehicles?.length, celebrationQueue.length, garantiaQueue.length, activeHighlightId, isEvaluationAlertActive]);

  if (loading && !data) return <div className="h-screen bg-black flex items-center justify-center text-white font-black">SINCRONIZANDO...</div>;

  const startIndex = page * CARS_PER_PAGE;
  const visibleVehicles = data?.vehicles.slice(startIndex, startIndex + CARS_PER_PAGE) || [];
  const totalPagesCount = Math.ceil((data?.vehicles.length || 0) / CARS_PER_PAGE) || 1;
  const hasAnyHighlight = celebrationQueue.length > 0 || garantiaQueue.length > 0 || !!activeHighlightId || isEvaluationAlertActive;

  return (
    <div className="h-screen w-screen bg-black flex flex-col p-4 pb-6 overflow-hidden select-none">
      {celebrationQueue.length > 0 && (
        <CelebrationOverlay 
          key={celebrationQueue[0].id}
          vehicle={celebrationQueue[0]} 
          onComplete={() => {
            const finishedId = celebrationQueue[0].id;
            setHighlightQueue(prev => [...prev, finishedId]);
            setCelebrationQueue(prev => prev.slice(1));
          }} 
          soundEnabled={soundEnabled} 
        />
      )}
      
      {celebrationQueue.length === 0 && garantiaQueue.length > 0 && (
        <GarantiaOverlay 
          key={garantiaQueue[0].vehicle.id}
          vehicle={garantiaQueue[0].vehicle} 
          indexInPage={garantiaQueue[0].indexInPage}
          onComplete={() => {
            const finishedId = garantiaQueue[0].vehicle.id;
            setHighlightQueue(prev => [...prev, finishedId]);
            setGarantiaQueue(prev => prev.slice(1));
          }} 
          soundEnabled={soundEnabled} 
        />
      )}

      <header className="grid grid-cols-3 items-end mb-4 px-4 h-14">
        <h1 className="font-black italic text-3xl">
          <span className="text-yellow-400">REI DO ABS</span>
          <span className="text-white/20 ml-3 text-2xl uppercase">PÁTIO</span>
        </h1>
        <div className="text-center pb-1 flex flex-col items-center">
          <p className="text-[10px] font-black text-yellow-500/50 tracking-[0.2em] uppercase mb-0.5">
            {data?.vehicles.length || 0} VEÍCULOS NO PÁTIO
          </p>
          <p className="text-[11px] font-bold text-zinc-500 tracking-[0.25em] uppercase leading-none">
            {isEvaluationAlertActive 
              ? <span className="text-yellow-400 animate-pulse">ALERTA: AVALIAÇÃO PENDENTE</span> 
              : `PÁGINA ${page + 1} - ${totalPagesCount}`}
          </p>
        </div>
        <div className="flex justify-end items-center gap-4">
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className={`w-7 h-[22px] rounded-md border flex items-center justify-center transition-all active:scale-95 ${
              soundEnabled 
                ? 'bg-zinc-800 text-yellow-400 border-zinc-700 shadow-[0_0_15px_rgba(250,204,21,0.2)]' 
                : 'bg-red-500/10 text-red-500 border-red-500/30'
            }`}
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              {soundEnabled ? (
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
              ) : (
                <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
              )}
            </svg>
          </button>
          <Clock />
        </div>
      </header>

      <div className={`flex w-full px-12 mb-2 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-600 italic transition-opacity ${hasAnyHighlight ? 'opacity-20' : 'opacity-100'}`}>
        <div className="w-[22%]">Modelo / Placa</div>
        <div className="w-[16%] pl-6">Cliente</div>
        <div className="w-[34%] pl-6 text-center">Etapa Atual</div>
        <div className="w-[14%] pl-6 text-center">Entrega</div>
        <div className="w-[14%] pl-6">Mecânico</div>
      </div>

      <main className="flex-1 grid grid-rows-6 gap-3 min-h-0">
        {visibleVehicles.map(v => (
          <VehicleRow 
            key={v.id} 
            vehicle={v} 
            isHighlighted={v.id === activeHighlightId} 
            hasAnyHighlight={hasAnyHighlight} 
            isAlerting={isEvaluationAlertActive} 
          />
        ))}
        {Array.from({ length: CARS_PER_PAGE - visibleVehicles.length }).map((_, i) => (
          <div key={i} className="h-full border-2 border-dashed border-white/5 bg-white/[0.02] rounded-[24px] flex items-center justify-center text-white/10 font-black text-2xl uppercase italic">Box Livre</div>
        ))}
      </main>
    </div>
  );
};

export default App;
