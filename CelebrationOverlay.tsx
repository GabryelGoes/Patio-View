import React, { useEffect, useRef, useState } from 'react';
import { Vehicle } from './types.ts';
import { MercosulPlate } from './components/MercosulPlate.tsx';
import { playEventSound } from './utils/tvSounds.ts';
import { celebrationVehicleParts, getVehicleBrandLogoUrl } from './utils/vehicleBrandLogo.ts';

interface CelebrationOverlayProps {
  vehicle: Vehicle;
  onComplete: () => void;
  soundEnabled: boolean;
  durationMs?: number;
}

const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  vehicle,
  onComplete,
  soundEnabled,
  durationMs = 7000,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [entered, setEntered] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const parts = celebrationVehicleParts(vehicle.brand, vehicle.model);
  const logoUrl = logoFailed ? null : getVehicleBrandLogoUrl(parts.brand);
  const modelText = (parts.model || 'Veículo').toLocaleUpperCase('pt-BR');
  const modelSize = modelText.length > 18 ? '3.4vh' : modelText.length > 12 ? '4.6vh' : '5.6vh';

  useEffect(() => {
    const img = new Image();
    let cancelled = false;
    const start = () => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (!cancelled) setEntered(true);
        });
      });
    };
    img.onload = start;
    img.onerror = start;
    img.src = '/orcamento-aprovado-bg.png';
    if (img.complete) start();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (soundEnabled) void playEventSound('budgetApproved');
    let completeTimer: ReturnType<typeof setTimeout> | null = null;
    const timer = setTimeout(() => {
      setIsExiting(true);
      completeTimer = setTimeout(() => onCompleteRef.current(), 1150);
    }, durationMs);
    return () => {
      clearTimeout(timer);
      if (completeTimer !== null) clearTimeout(completeTimer);
    };
  }, [soundEnabled, durationMs]);

  return (
    <div className={`cele-shell${entered ? ' is-entered' : ''}${isExiting ? ' is-exiting' : ''}`}>
      <div className="cele-scene">
        <div className="cele-bar">
          {logoUrl && (
            <>
              <div className="cele-logo">
                <img
                  src={logoUrl}
                  alt=""
                  draggable={false}
                  onError={() => setLogoFailed(true)}
                />
              </div>
              <span className="cele-sep" />
            </>
          )}
          <p className="cele-model" style={{ fontSize: modelSize }}>{modelText}</p>
          <MercosulPlate plate={vehicle.plate} />
        </div>
      </div>
      <style>{`
        .cele-shell {
          position: fixed;
          inset: 0;
          z-index: 100;
          overflow: hidden;
          transform: translateY(0);
          transition: transform 1.15s cubic-bezier(0.45, 0.05, 0.25, 1);
        }
        .cele-shell.is-exiting { transform: translateY(-100%); }
        .cele-scene {
          position: absolute;
          inset: 0;
          background: #050302 url('/orcamento-aprovado-bg.png') center / cover no-repeat;
          transform: translateY(-100%);
        }
        .cele-shell.is-entered .cele-scene {
          animation: cele-down 1.5s cubic-bezier(0.2, 0.55, 0.2, 1) forwards;
        }
        .cele-bar {
          position: absolute;
          left: 50%;
          top: 67%;
          transform: translateX(-50%);
          width: max-content;
          max-width: min(92vw, 1180px);
          height: auto;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 1.7vh;
          padding: 1.35vh 1.8vh 1.35vh 2vh;
          border-radius: 22px;
          background: linear-gradient(180deg, rgba(62, 62, 62, 0.42) 0%, rgba(8, 8, 8, 0.78) 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.28);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            0 16px 36px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(16px);
        }
        .cele-logo {
          height: 7.2vh;
          width: auto;
          max-width: 20vh;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cele-logo img {
          height: 7.2vh;
          width: auto;
          max-width: 20vh;
          object-fit: contain;
          object-position: center;
        }
        .cele-sep {
          width: 1.5px;
          height: 7.4vh;
          flex: 0 0 auto;
          background: rgba(255, 255, 255, 0.72);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.25);
        }
        .cele-model {
          flex: 0 1 auto;
          min-width: 0;
          max-width: 42vw;
          margin: 0;
          color: #ffffff;
          font-family: Montserrat, Inter, sans-serif;
          font-weight: 800;
          letter-spacing: 0.045em;
          line-height: 1;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.45);
        }
        @keyframes cele-down {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default CelebrationOverlay;
