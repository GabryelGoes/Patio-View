import React, { useEffect, useRef, useState } from 'react';
import { Vehicle } from './types.ts';
import { playEventSound } from './utils/tvSounds.ts';
import { celebrationVehicleParts, getVehicleBrandLogoUrl } from './utils/vehicleBrandLogo.ts';

interface CelebrationOverlayProps {
  vehicle: Vehicle;
  onComplete: () => void;
  soundEnabled: boolean;
  durationMs?: number;
}

function plateLabel(plate: string): string {
  const clean = (plate || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return clean || '-------';
}

const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  vehicle,
  onComplete,
  soundEnabled,
  durationMs = 7000,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const parts = celebrationVehicleParts(vehicle.brand, vehicle.model);
  const logoUrl = logoFailed ? null : getVehicleBrandLogoUrl(parts.brand);
  const modelText = (parts.model || 'Veículo').toLocaleUpperCase('pt-BR');
  const plateText = plateLabel(vehicle.plate);
  const modelSize = modelText.length > 18 ? '3.2vh' : modelText.length > 12 ? '4.4vh' : '5.5vh';
  const plateSize = plateText.length > 8 ? '2.7vh' : '3.6vh';

  useEffect(() => {
    if (soundEnabled) void playEventSound('budgetApproved');
    let completeTimer: ReturnType<typeof setTimeout> | null = null;
    const timer = setTimeout(() => {
      setIsExiting(true);
      completeTimer = setTimeout(() => onCompleteRef.current(), 1000);
    }, durationMs);
    return () => {
      clearTimeout(timer);
      if (completeTimer !== null) clearTimeout(completeTimer);
    };
  }, [soundEnabled, durationMs]);

  return (
    <div className={`cele-shell${isExiting ? ' is-exiting' : ''}`}>
      <div className="cele-scene">
        <svg className="cele-arcs" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id="celeArc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffd27a" />
              <stop offset="38%" stopColor="#ff8a1c" />
              <stop offset="100%" stopColor="#ff4a00" />
            </linearGradient>
            <filter id="celeArcGlow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="16" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g fill="none" stroke="url(#celeArc)" strokeLinecap="round" filter="url(#celeArcGlow)">
            <path d="M 310 -70 C 150 30, 40 150, -70 340" strokeWidth="92" />
            <path d="M 310 -70 C 150 30, 40 150, -70 340" strokeWidth="28" stroke="#ffb15a" />
            <path d="M 1290 -70 C 1450 30, 1560 150, 1670 340" strokeWidth="92" />
            <path d="M 1290 -70 C 1450 30, 1560 150, 1670 340" strokeWidth="28" stroke="#ffb15a" />
            <path d="M -70 560 C 40 750, 150 860, 310 980" strokeWidth="92" />
            <path d="M -70 560 C 40 750, 150 860, 310 980" strokeWidth="28" stroke="#ffb15a" />
            <path d="M 1670 560 C 1560 750, 1450 860, 1290 980" strokeWidth="92" />
            <path d="M 1670 560 C 1560 750, 1450 860, 1290 980" strokeWidth="28" stroke="#ffb15a" />
          </g>
        </svg>

        <div className="cele-stack">
          <svg className="cele-icon" viewBox="0 0 160 160" aria-hidden="true">
            <defs>
              <linearGradient id="celeIconBg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff9a2e" />
                <stop offset="52%" stopColor="#ff6a00" />
                <stop offset="100%" stopColor="#f24d00" />
              </linearGradient>
              <filter id="celeIconShadow" x="-40%" y="-40%" width="180%" height="180%">
                <feDropShadow dx="0" dy="12" stdDeviation="8" floodColor="#ff6a00" floodOpacity="0.55" />
              </filter>
            </defs>
            <rect x="10" y="8" width="140" height="140" rx="34" fill="url(#celeIconBg)" filter="url(#celeIconShadow)" />
            <rect x="50" y="36" width="54" height="72" rx="6" fill="#ffffff" />
            <rect x="60" y="50" width="34" height="5" rx="2.5" fill="#ff7a12" />
            <rect x="60" y="62" width="26" height="5" rx="2.5" fill="#ff7a12" />
            <rect x="60" y="74" width="20" height="5" rx="2.5" fill="#ff7a12" />
            <circle cx="100" cy="102" r="20" fill="#ffffff" />
            <path
              d="M90.5 102.5 l6.6 6.8 l13.2-14.2"
              fill="none"
              stroke="#f24d00"
              strokeWidth="4.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <h1 className="cele-orcamento">ORÇAMENTO</h1>
          <h1 className="cele-aprovado">APROVADO</h1>

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
            <div className="cele-plate" aria-label={`Placa ${plateText}`}>
              <div className="cele-plate-top">
                <span>BRASIL</span>
                <span className="cele-flag" aria-hidden="true">
                  <span className="cele-flag-diamond" />
                  <span className="cele-flag-circle" />
                </span>
              </div>
              <div className="cele-plate-body" style={{ fontSize: plateSize }}>{plateText}</div>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .cele-shell {
          position: fixed;
          inset: 0;
          z-index: 100;
          overflow: hidden;
          transform: translateY(0);
          transition: transform 1s cubic-bezier(0.7, 0, 0.3, 1);
        }
        .cele-shell.is-exiting { transform: translateY(-100%); }
        .cele-scene {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background:
            radial-gradient(ellipse 48% 40% at -4% -6%, rgba(255, 130, 20, 0.55), transparent 62%),
            radial-gradient(ellipse 48% 40% at 104% -6%, rgba(255, 110, 10, 0.5), transparent 62%),
            radial-gradient(ellipse 46% 38% at -6% 108%, rgba(255, 110, 10, 0.48), transparent 64%),
            radial-gradient(ellipse 46% 38% at 106% 108%, rgba(255, 100, 0, 0.42), transparent 64%),
            #050302;
          animation: cele-in 0.55s ease-out both;
        }
        .cele-arcs {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }
        .cele-stack {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: min(92vw, 1600px);
          transform: translateY(-1.2vh);
        }
        .cele-icon {
          width: 16.8vh;
          height: 16.8vh;
          margin-bottom: 2.2vh;
          filter: drop-shadow(0 10px 18px rgba(0, 0, 0, 0.35));
        }
        .cele-orcamento,
        .cele-aprovado {
          margin: 0;
          font-family: Montserrat, Inter, sans-serif;
          font-weight: 900;
          text-transform: uppercase;
          line-height: 0.86;
          text-align: center;
        }
        .cele-orcamento {
          color: #ffffff;
          font-size: 9.5vh;
          letter-spacing: -0.015em;
          text-shadow:
            0 2px 0 rgba(0, 0, 0, 0.28),
            0 12px 22px rgba(0, 0, 0, 0.45);
        }
        .cele-aprovado {
          margin-top: 0.6vh;
          font-size: 14.8vh;
          letter-spacing: -0.035em;
          background: linear-gradient(180deg, #ffc85a 0%, #fd982e 26%, #f56a12 64%, #fe5604 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter:
            drop-shadow(0 0 10px rgba(255, 150, 40, 0.55))
            drop-shadow(0 0 26px rgba(255, 90, 0, 0.42))
            drop-shadow(0 8px 10px rgba(0, 0, 0, 0.35));
        }
        .cele-bar {
          margin-top: 4.6vh;
          width: min(84vw, 1420px);
          height: 16.2vh;
          min-height: 132px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          gap: 1.5vw;
          padding: 0 1.5vw 0 1.8vw;
          border-radius: 26px;
          background: linear-gradient(180deg, rgba(62, 62, 62, 0.38) 0%, rgba(8, 8, 8, 0.72) 100%);
          border: 1.5px solid rgba(255, 255, 255, 0.28);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.22),
            0 16px 36px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(16px);
        }
        .cele-logo {
          width: 20vh;
          height: 9vh;
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cele-logo img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          object-position: center;
        }
        .cele-sep {
          width: 1.5px;
          height: 52%;
          flex: 0 0 auto;
          background: rgba(255, 255, 255, 0.72);
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.25);
        }
        .cele-model {
          flex: 1 1 auto;
          min-width: 0;
          margin: 0;
          padding-left: 0.3vw;
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
        .cele-plate {
          flex: 0 0 auto;
          width: 20vh;
          height: 11vh;
          display: flex;
          flex-direction: column;
          background: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid #1a1a1a;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.35);
        }
        .cele-plate-top {
          height: 30%;
          min-height: 18px;
          background: #003399;
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 0.7vh 0 0.85vh;
          font-family: Montserrat, Inter, sans-serif;
          font-weight: 800;
          font-size: 1.15vh;
          letter-spacing: 0.34em;
          line-height: 1;
        }
        .cele-flag {
          position: relative;
          width: 2.1vh;
          height: 1.45vh;
          background: #009b3a;
          border-radius: 1px;
          flex: 0 0 auto;
          box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.25);
        }
        .cele-flag-diamond {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 68%;
          height: 68%;
          background: #ffdf00;
          transform: translate(-50%, -50%) rotate(45deg);
        }
        .cele-flag-circle {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 34%;
          height: 34%;
          border-radius: 50%;
          background: #002776;
          transform: translate(-50%, -50%);
        }
        .cele-plate-body {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #111111;
          font-family: Montserrat, Inter, sans-serif;
          font-weight: 900;
          letter-spacing: 0.03em;
          line-height: 1;
        }
        @keyframes cele-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default CelebrationOverlay;
