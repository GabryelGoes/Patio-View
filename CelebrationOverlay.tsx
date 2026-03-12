
import React, { useEffect, useState } from 'react';
import { Vehicle } from './types.ts';

interface CelebrationOverlayProps {
  vehicle: Vehicle;
  onComplete: () => void;
  soundEnabled: boolean;
}

const playVictorySound = async (soundEnabled: boolean) => {
  if (!soundEnabled) return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') await ctx.resume();
    
    const playTone = (freq: number, startTime: number, duration: number, volume: number, type: OscillatorType = 'triangle') => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(volume, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    const step = 0.06;
    playTone(261.63, now, 0.3, 0.2);              // C4
    playTone(329.63, now + step, 0.3, 0.2);       // E4
    playTone(392.00, now + step * 2, 0.3, 0.2);   // G4
    playTone(523.25, now + step * 3, 1.0, 0.3, 'square'); // C5 final
  } catch (e) { console.warn(e); }
};

const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({ vehicle, onComplete, soundEnabled }) => {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    playVictorySound(soundEnabled);
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(onComplete, 1000); 
    }, 7000); 
    return () => clearTimeout(timer);
  }, [onComplete, soundEnabled]);

  return (
    <div className={`fixed inset-0 z-[100] transition-transform duration-1000 cubic-bezier(0.7, 0, 0.3, 1) ${isExiting ? 'translate-y-[-100%]' : 'translate-y-0'}`}>
      <div className="absolute inset-0 bg-[#d35400] flex flex-col items-center justify-center animate-drop-bounce overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,140,0,0.8)_0%,rgba(139,69,19,1)_100%)]" />
        
        <div className="relative z-10 text-center flex flex-col items-center gap-6">
          <h1 className="text-white font-black italic text-[10vw] uppercase leading-[0.85] text-depth-3d animate-title-entry">
            ORÇAMENTO<br/>APROVADO
          </h1>
          
          <div className="bg-white/10 backdrop-blur-xl p-8 rounded-[40px] border border-white/20 w-full max-w-4xl shadow-2xl">
            <h2 className="text-white font-black text-6xl italic uppercase leading-none">{vehicle.model}</h2>
            <p className="text-white/70 font-bold text-2xl tracking-[0.3em] mt-2 uppercase">{vehicle.client}</p>
          </div>

          <div className="flex items-center gap-6 mt-2">
            <div className="bg-black/40 px-6 py-4 rounded-2xl border border-white/10">
              <span className="text-orange-400 font-black text-[10px] tracking-widest uppercase block mb-1 opacity-70">MECÂNICO</span>
              <span className="text-white font-black text-4xl italic uppercase">{vehicle.mechanic}</span>
            </div>

            <div className="bg-white rounded-lg border-[4px] border-zinc-800 overflow-hidden shadow-2xl w-[220px]">
              <div className="bg-[#003399] h-5 px-3 flex items-center justify-between">
                <span className="text-white font-bold text-[8px] tracking-[0.4em]">BRASIL</span>
                <div className="w-5 h-3 bg-[#009b3a] rounded-sm flex items-center justify-center border border-white/20">
                  <div className="w-2 h-2 bg-yellow-400 rotate-45" />
                </div>
              </div>
              <div className="h-14 flex items-center justify-center bg-white">
                <span className="text-black font-black text-[32px] font-mono tracking-tight uppercase leading-none">
                  {vehicle.plate.replace('-', '')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .text-depth-3d {
          text-shadow: 
            1px 1px 0px #8b4513,
            2px 2px 0px #8b4513,
            3px 3px 0px #8b4513,
            4px 4px 0px #8b4513,
            5px 5px 0px #8b4513,
            6px 6px 0px #8b4513,
            7px 7px 0px #8b4513,
            8px 8px 0px #8b4513,
            12px 12px 25px rgba(0,0,0,0.5);
        }
        @keyframes title-entry {
          0% { transform: scale(0.8) translateY(50px) rotateX(20deg); opacity: 0; }
          100% { transform: scale(1) translateY(0) rotateX(0deg); opacity: 1; }
        }
        .animate-title-entry { animation: title-entry 1s cubic-bezier(0.17, 0.67, 0.83, 0.67) 0.3s forwards; opacity: 0; }
        @keyframes drop-bounce { 
          0% { transform: translateY(-110%); } 
          45% { transform: translateY(0); } 
          100% { transform: translateY(0); } 
        }
        .animate-drop-bounce { animation: drop-bounce 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards; }
      `}</style>
    </div>
  );
};

export default CelebrationOverlay;
