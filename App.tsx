
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { WorkshopData, Stage, Vehicle } from './types.ts';
import { fetchWorkshopData } from './services/tvApiService.ts';
import { TV_CONFIG, clearTvMode } from './config/tvMode.ts';
import Clock from './Clock.tsx';
import VehicleRow from './VehicleRow.tsx';
import CelebrationOverlay from './CelebrationOverlay.tsx';
import PecasDisponiveisOverlay from './PecasDisponiveisOverlay.tsx';
import GarantiaOverlay from './GarantiaOverlay.tsx';
import TvSlidePage from './components/TvSlidePage.tsx';
import { TvChimeBannerCard } from './components/TvChimeBannerCard.tsx';
import { playSlideAlertSound } from './utils/slideAlertSound.ts';
import { defaultTvChimeSchedule, normalizeTvChimeConfig, type TvChimeKind } from './utils/tvChimeSchedule.ts';
import { useTvChimeSchedule, type TvChimeFirePayload } from './hooks/useTvChimeSchedule.ts';
import {
  useVideoFolder,
  chooseFolder,
  ensureGranted,
  supportsLocalVideo,
} from './utils/localVideoFolder.ts';

/** Botão para configurar/autorizar a pasta de vídeos locais da TV. */
const VideoFolderButton: React.FC = () => {
  const folder = useVideoFolder();
  if (!supportsLocalVideo()) return null;

  const ok = folder.hasFolder && folder.granted;
  const needsPermission = folder.hasFolder && !folder.granted;
  const title = ok
    ? 'Pasta de vídeos configurada (clique para trocar)'
    : needsPermission
      ? 'Clique para permitir o acesso à pasta de vídeos'
      : 'Configurar pasta de vídeos locais';

  const onClick = () => {
    if (needsPermission) void ensureGranted();
    else void chooseFolder();
  };

  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-7 h-[22px] rounded-md border flex items-center justify-center transition-all active:scale-95 ${
        ok
          ? 'bg-zinc-800 text-emerald-400 border-zinc-700'
          : needsPermission
            ? 'bg-amber-500/15 text-amber-400 border-amber-500/40 animate-pulse'
            : 'bg-zinc-800 text-zinc-400 border-zinc-700'
      }`}
    >
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
        <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
      </svg>
    </button>
  );
};

const STAGE_PRIORITY: Record<string, number> = TV_CONFIG.stagePriority;

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

  useEffect(() => {
    document.title = TV_CONFIG.documentTitle;
  }, []);
  
  const [celebrationQueue, setCelebrationQueue] = useState<Vehicle[]>([]);
  const [pecasDisponiveisQueue, setPecasDisponiveisQueue] = useState<Vehicle[]>([]);
  const [garantiaQueue, setGarantiaQueue] = useState<{vehicle: Vehicle, indexInPage: number}[]>([]);
  const [highlightQueue, setHighlightQueue] = useState<string[]>([]);
  
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const previousVehiclesRef = useRef<Record<string, string>>({});
  const CARS_PER_PAGE = 6;

  const [chimeLive, setChimeLive] = useState(() => defaultTvChimeSchedule());
  const chimeLiveRef = useRef(chimeLive);
  chimeLiveRef.current = chimeLive;
  const chimeLiveJsonRef = useRef('');
  const [chimeBanner, setChimeBanner] = useState<{
    title: string;
    message: string;
    phase: 'pre' | 'main';
    kind: TvChimeKind;
  } | null>(null);
  const chimeBannerTimerRef = useRef<number | null>(null);

  const loadData = async () => {
    try {
      const result = await fetchWorkshopData();
      const sortedVehicles = result.vehicles
        .filter(v => STAGE_PRIORITY[v.stage] !== undefined)
        .sort((a, b) => (STAGE_PRIORITY[a.stage] || 99) - (STAGE_PRIORITY[b.stage] || 99));

      const newlyApproved: Vehicle[] = [];
      const newlyPecasDisponiveis: Vehicle[] = [];
      const newlyGarantia: {vehicle: Vehicle, indexInPage: number}[] = [];
      const standardChanges: string[] = [];

      sortedVehicles.forEach((vehicle, globalIndex) => {
        const prevStage = previousVehiclesRef.current[vehicle.id];
        const currentStage = vehicle.stage;

        if (prevStage && prevStage !== currentStage) {
          if (currentStage === 'Orçamento Aprovado') {
            newlyApproved.push(vehicle);
          } else if (TV_CONFIG.showPecasDisponiveisOverlay && currentStage === 'Peças Disponíveis') {
            newlyPecasDisponiveis.push(vehicle);
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
      if (newlyPecasDisponiveis.length > 0)
        setPecasDisponiveisQueue(prev => [...prev, ...newlyPecasDisponiveis]);
      if (newlyGarantia.length > 0) setGarantiaQueue(prev => [...prev, ...newlyGarantia]);
      if (standardChanges.length > 0) setHighlightQueue(prev => [...prev, ...standardChanges]);

      const nextData: WorkshopData = { ...result, vehicles: sortedVehicles };
      const chNorm = normalizeTvChimeConfig(nextData.chimeSchedule ?? null);
      const cj = JSON.stringify(chNorm);
      if (cj !== chimeLiveJsonRef.current) {
        chimeLiveJsonRef.current = cj;
        setChimeLive(chNorm);
      }
      setData(nextData);
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (data?.tvSlides?.some((sl) => sl.pinImmediate)) return;
    if (highlightQueue.length > 0 && !activeHighlightId && celebrationQueue.length === 0 && pecasDisponiveisQueue.length === 0 && garantiaQueue.length === 0) {
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
  }, [highlightQueue, activeHighlightId, celebrationQueue.length, pecasDisponiveisQueue.length, garantiaQueue.length, data, soundEnabled]);

  useEffect(() => {
    loadData();
    /** Atualização periódica do quadro (15s) — reduz invocações na Vercel sem perder fluidez. */
    const refreshInterval = setInterval(loadData, 15000);
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
      if (data.tvSlides?.some((sl) => sl.pinImmediate)) return;
      const firstPendingIndex = data.vehicles.findIndex(v => 
        v.stage.toLowerCase().includes('avaliação') && v.stage.toLowerCase().includes('aguardando')
      );
      if (firstPendingIndex !== -1) {
        setPage(Math.floor(firstPendingIndex / CARS_PER_PAGE));
      }
    }
  }, [isEvaluationAlertActive, data]);

  const vehiclePages = Math.max(1, Math.ceil((data?.vehicles.length || 0) / CARS_PER_PAGE));
  const slideCount = data?.tvSlides?.length ?? 0;
  const totalPages = vehiclePages + slideCount;

  const pinnedSlideIndex = useMemo(() => {
    const slides = data?.tvSlides;
    if (!slides?.length) return -1;
    return slides.findIndex((sl) => sl.pinImmediate === true);
  }, [data?.tvSlides]);

  const isPinnedMode = pinnedSlideIndex >= 0;

  /** Com slide fixo na gestão, mantém a TV neste slide (sem contagem de tempo). */
  useEffect(() => {
    if (!data || !isPinnedMode || pinnedSlideIndex < 0) return;
    const vp = Math.max(1, Math.ceil(data.vehicles.length / CARS_PER_PAGE));
    setPage(vp + pinnedSlideIndex);
  }, [data, isPinnedMode, pinnedSlideIndex]);

  useEffect(() => {
    if (!data || isPinnedMode) return;
    const tp = Math.max(1, Math.ceil(data.vehicles.length / CARS_PER_PAGE)) + (data.tvSlides?.length ?? 0);
    if (page >= tp) setPage(0);
  }, [page, data?.vehicles?.length, data?.tvSlides?.length, isPinnedMode]);

  useEffect(() => {
    if (!data) return;
    if (isPinnedMode) return;
    const hasActiveOverlay = celebrationQueue.length > 0 || pecasDisponiveisQueue.length > 0 || garantiaQueue.length > 0 || !!activeHighlightId || isEvaluationAlertActive;
    if (hasActiveOverlay) return;

    const vp = Math.max(1, Math.ceil(data.vehicles.length / CARS_PER_PAGE));
    const sc = data.tvSlides?.length ?? 0;
    const total = vp + sc;
    if (total <= 1) return;

    let ms = 7000;
    if (page >= vp && page < vp + sc && data.tvSlides) {
      const slide = data.tvSlides[page - vp];
      ms = Math.min(120000, Math.max(5000, (slide.durationSeconds || 10) * 1000));
    }

    const id = setTimeout(() => {
      setPage((prev) => (prev + 1) % total);
    }, ms);
    return () => clearTimeout(id);
  }, [
    page,
    data?.vehicles?.length,
    data?.tvSlides?.length,
    celebrationQueue.length,
    pecasDisponiveisQueue.length,
    garantiaQueue.length,
    activeHighlightId,
    isEvaluationAlertActive,
    isPinnedMode,
  ]);

  const isSlidePage = slideCount > 0 && page >= vehiclePages;
  const currentSlide = isSlidePage && data?.tvSlides ? data.tvSlides[page - vehiclePages] : null;

  /** Mídia (imagem/vídeo) em tela cheia: cobre todo o painel, sem cabeçalho/bordas. */
  const isFullscreenMedia =
    !!currentSlide &&
    !!currentSlide.mediaUrl &&
    (currentSlide.slideType === 'image' || currentSlide.slideType === 'video') &&
    currentSlide.mediaFullscreen === true;

  const lastSlideSoundIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isSlidePage) {
      lastSlideSoundIdRef.current = null;
      return;
    }
    if (!currentSlide || currentSlide.playSound !== true || !soundEnabled) return;
    if (lastSlideSoundIdRef.current === currentSlide.id) return;
    lastSlideSoundIdRef.current = currentSlide.id;
    void playSlideAlertSound();
  }, [isSlidePage, currentSlide, soundEnabled]);

  const chimeConfigForHook = useMemo(
    () => ({
      ...chimeLive,
      soundVolume: soundEnabled ? chimeLive.soundVolume : 0.0001,
      preNotifyPlaySound: soundEnabled && chimeLive.preNotifyPlaySound,
    }),
    [chimeLive, soundEnabled]
  );

  const onTvChimeFire = useCallback(
    (payload: TvChimeFirePayload) => {
      const cfg = chimeLiveRef.current;
      const seconds =
        payload.phase === 'pre'
          ? Math.min(18, Math.max(8, cfg.bannerSeconds))
          : cfg.bannerSeconds;
      if (chimeBannerTimerRef.current) window.clearTimeout(chimeBannerTimerRef.current);
      if (payload.phase === 'pre' && cfg.preNotifyMinutes > 0) {
        setChimeBanner({
          title: `Em ${cfg.preNotifyMinutes} min`,
          message: `${payload.alert.label} · ${payload.alert.time}`,
          phase: 'pre',
          kind: 'info',
        });
      } else if (payload.phase === 'main') {
        setChimeBanner({
          title: payload.alert.label,
          message: payload.alert.message || '—',
          phase: 'main',
          kind: payload.alert.kind,
        });
      }
      chimeBannerTimerRef.current = window.setTimeout(() => {
        setChimeBanner(null);
        chimeBannerTimerRef.current = null;
      }, seconds * 1000);
    },
    []
  );

  useTvChimeSchedule({
    enabled: !loading && chimeLive.masterEnabled,
    config: chimeConfigForHook,
    onFire: onTvChimeFire,
  });

  const weeklyPercent =
    data?.weeklyGoal &&
    data.weeklyGoal.targetAmount > 0 &&
    Number.isFinite(data.weeklyGoal.currentAmount / data.weeklyGoal.targetAmount)
      ? Math.max(
          0,
          Math.min(130, (data.weeklyGoal.currentAmount / data.weeklyGoal.targetAmount) * 100)
        )
      : 0;

  if (loading && !data) return <div className="h-screen bg-black flex items-center justify-center text-white font-black">SINCRONIZANDO...</div>;

  const startIndex = page * CARS_PER_PAGE;

  const visibleVehicles = !isSlidePage && data
    ? data.vehicles.slice(startIndex, startIndex + CARS_PER_PAGE)
    : [];
  const totalPagesCount = Math.max(1, totalPages);
  const hasAnyHighlight = celebrationQueue.length > 0 || pecasDisponiveisQueue.length > 0 || garantiaQueue.length > 0 || !!activeHighlightId || isEvaluationAlertActive;

  return (
    <div className="h-screen w-screen bg-black flex flex-col p-4 pb-6 overflow-hidden select-none">
      {isFullscreenMedia && currentSlide && (
        <div className="fixed inset-0 z-[60] bg-black">
          <TvSlidePage slide={currentSlide} fullscreen />
        </div>
      )}
      {chimeBanner && (
        <div className="pointer-events-none fixed inset-0 z-[500] flex items-center justify-center bg-black/60 p-4 sm:p-8">
          <TvChimeBannerCard
            variant="display"
            phase={chimeBanner.phase}
            kind={chimeBanner.kind}
            title={chimeBanner.title}
            message={chimeBanner.message}
            className="pointer-events-auto w-full"
            onDismiss={() => {
              setChimeBanner(null);
              if (chimeBannerTimerRef.current) {
                window.clearTimeout(chimeBannerTimerRef.current);
                chimeBannerTimerRef.current = null;
              }
            }}
            dismissAriaLabel="Fechar aviso"
          />
        </div>
      )}
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

      {celebrationQueue.length === 0 && pecasDisponiveisQueue.length > 0 && (
        <PecasDisponiveisOverlay
          key={pecasDisponiveisQueue[0].id}
          vehicle={pecasDisponiveisQueue[0]}
          onComplete={() => {
            const finishedId = pecasDisponiveisQueue[0].id;
            setHighlightQueue(prev => [...prev, finishedId]);
            setPecasDisponiveisQueue(prev => prev.slice(1));
          }}
          soundEnabled={soundEnabled}
        />
      )}
      
      {celebrationQueue.length === 0 && pecasDisponiveisQueue.length === 0 && garantiaQueue.length > 0 && (
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
          <span className={TV_CONFIG.brandAccentClass}>REI DO ABS</span>
          <span className="text-white/20 ml-3 text-2xl uppercase">{TV_CONFIG.sectionLabel}</span>
        </h1>
        <div className="text-center pb-1 flex flex-col items-center">
          <p className={`text-[10px] font-black ${TV_CONFIG.countClass} tracking-[0.2em] uppercase mb-0.5`}>
            {TV_CONFIG.countText(data?.vehicles.length || 0)}
          </p>
          <p className="text-[11px] font-bold text-zinc-500 tracking-[0.25em] uppercase leading-none">
            {isEvaluationAlertActive 
              ? <span className={`${TV_CONFIG.alertTextClass} animate-pulse`}>ALERTA: AVALIAÇÃO PENDENTE</span> 
              : isSlidePage
                ? (currentSlide?.pinImmediate
                  ? <span className="text-amber-400/95">TV — CONTEÚDO FIXO</span>
                  : <span className="text-emerald-400/90">TV — CONTEÚDO</span>)
                : `PÁGINA ${page + 1} - ${totalPagesCount}`}
          </p>
        </div>
        <div className="flex justify-end items-center gap-4">
          <button
            onClick={() => clearTvMode()}
            title="Trocar painel (Pátio / Laboratório)"
            className="w-7 h-[22px] rounded-md border flex items-center justify-center transition-all active:scale-95 bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-white"
          >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
              <path d="M7.41 18.59 8.83 20 4 15.17l4.83-4.83-1.42 1.41L5.83 13H16v2H5.83zM16.59 5.41 15.17 4 20 8.83l-4.83 4.83 1.42-1.41L18.17 11H8V9h10.17z" />
            </svg>
          </button>
          <VideoFolderButton />
          <button 
            onClick={() => setSoundEnabled(!soundEnabled)} 
            className={`w-7 h-[22px] rounded-md border flex items-center justify-center transition-all active:scale-95 ${
              soundEnabled 
                ? TV_CONFIG.soundOnClass 
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

      {!isSlidePage &&
        data?.weeklyGoal &&
        data.weeklyGoal.targetAmount > 0 &&
        data.weeklyGoal.showWeeklyBar !== false && (
        <div className="px-5 mb-3 space-y-1">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
            <span>{data.weeklyGoal.label}</span>
            <span className="text-yellow-500/90 tabular-nums">{Math.round(weeklyPercent)}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-white/5 overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-yellow-400 to-orange-500 transition-all"
              style={{ width: `${weeklyPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className={`flex w-full px-12 mb-2 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-600 italic transition-opacity ${hasAnyHighlight ? 'opacity-20' : 'opacity-100'}`}>
        {isSlidePage ? (
          <div className="w-full text-center">Conteúdo da TV</div>
        ) : (
          <>
            <div className="w-[22%]">{TV_CONFIG.columns.first}</div>
            <div className="w-[16%] pl-6">Cliente</div>
            <div className="w-[34%] pl-6 text-center">Etapa Atual</div>
            <div className="w-[14%] pl-6 text-center">{TV_CONFIG.columns.fourth}</div>
            <div className="w-[14%] pl-6">{TV_CONFIG.columns.fifth}</div>
          </>
        )}
      </div>

      {isSlidePage && currentSlide && isFullscreenMedia ? (
        <main className="flex-1 min-h-0" />
      ) : isSlidePage && currentSlide ? (
        <main className="flex-1 flex flex-col min-h-0">
          <TvSlidePage slide={currentSlide} />
        </main>
      ) : (
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
            <div key={i} className={`h-full border-2 border-dashed ${TV_CONFIG.emptyBox.className} rounded-[24px] flex items-center justify-center font-black text-2xl uppercase italic`}>{TV_CONFIG.emptyBox.text}</div>
          ))}
        </main>
      )}
    </div>
  );
};

export default App;
