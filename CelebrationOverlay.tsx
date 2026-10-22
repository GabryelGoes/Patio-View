import React, { useEffect, useRef, useState } from 'react';
import { Vehicle } from './types.ts';
import { playEventSound } from './utils/tvSounds.ts';
import { celebrationVehicleParts } from './utils/vehicleBrandLogo.ts';
import { isAssignedMechanicName } from './utils/mechanicName.ts';

interface CelebrationOverlayProps {
  vehicle: Vehicle;
  onComplete: () => void;
  soundEnabled: boolean;
  durationMs?: number;
}

const ART_W = 1679;
const ART_H = 937;

/** Caixa em porcentagem da arte (1679×937). */
function artBox(x: number, y: number, w: number, h: number): React.CSSProperties {
  return {
    left: `${(x / ART_W) * 100}%`,
    top: `${(y / ART_H) * 100}%`,
    width: `${(w / ART_W) * 100}%`,
    height: `${(h / ART_H) * 100}%`,
  };
}

function vehicleTitle(brand: string | null | undefined, model: string): string {
  const parts = celebrationVehicleParts(brand, model);
  const modelName = (parts.model || '').trim();
  const brandName = (parts.brand || '').trim();
  if (
    brandName &&
    modelName &&
    !modelName.toLocaleLowerCase('pt-BR').startsWith(brandName.toLocaleLowerCase('pt-BR'))
  ) {
    return `${brandName} ${modelName}`;
  }
  return modelName || brandName || 'Veículo';
}

function plateChars(plate: string): string {
  const clean = (plate || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return clean || '-------';
}

/** Encaixa o texto na caixa, sem esticar as letras. */
function useFitWidth(text: string, fill = 0.96, shiftEm = 0) {
  const boxRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const el = textRef.current;
    if (!box || !el) return;
    let cancelled = false;
    const fit = () => {
      if (cancelled || box.clientHeight === 0) return;
      const boxH = box.clientHeight;
      el.style.transform = 'none';
      el.style.fontSize = `${boxH}px`;
      const byWidth = el.scrollWidth > 0 ? ((box.clientWidth * fill) / el.scrollWidth) * boxH : boxH;
      const byHeight = el.offsetHeight > 0 ? ((boxH * fill) / el.offsetHeight) * boxH : boxH;
      el.style.fontSize = `${Math.min(byWidth, byHeight)}px`;
      el.style.transform = shiftEm ? `translateY(${shiftEm}em)` : 'none';
    };
    fit();
    void document.fonts.ready.then(fit);
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [text, fill, shiftEm]);

  return { boxRef, textRef };
}

const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  vehicle,
  onComplete,
  soundEnabled,
  durationMs = 7000,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [entered, setEntered] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const title = vehicleTitle(vehicle.brand, vehicle.model);
  const plate = plateChars(vehicle.plate);
  const mechanic = isAssignedMechanicName(vehicle.mechanic) ? vehicle.mechanic.trim() : '';
  const nameFit = useFitWidth(title, 0.94);
  const plateFit = useFitWidth(plate, 0.94, -0.04);
  const mechanicFit = useFitWidth(mechanic, 0.92);

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
    img.src = '/orcamento-aprovado-laranja.png';
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
        <div className="cele-art">
          <img src="/orcamento-aprovado-laranja.png" alt="" draggable={false} />
          <div ref={nameFit.boxRef} className="cele-slot cele-name" style={artBox(456, 534, 744, 62)}>
            <span ref={nameFit.textRef}>{title}</span>
          </div>
          <div
            ref={plateFit.boxRef}
            className="cele-slot cele-plate"
            style={artBox(598, 669, 484, 96)}
            aria-label={`Placa ${plate}`}
          >
            <span ref={plateFit.textRef}>{plate}</span>
          </div>
          {mechanic && (
            <div ref={mechanicFit.boxRef} className="cele-slot cele-mech" style={artBox(708, 830, 380, 36)}>
              <span ref={mechanicFit.textRef}>{mechanic}</span>
            </div>
          )}
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
          container-type: size;
          background: #fb6901;
          transform: translateY(-100%);
        }
        .cele-shell.is-entered .cele-scene {
          animation: cele-down 1.5s cubic-bezier(0.2, 0.55, 0.2, 1) forwards;
        }
        .cele-art {
          position: absolute;
          left: 50%;
          top: 50%;
          width: max(100cqw, calc(100cqh * ${ART_W} / ${ART_H}));
          height: max(100cqh, calc(100cqw * ${ART_H} / ${ART_W}));
          transform: translate(-50%, -50%);
        }
        .cele-art img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: fill;
          user-select: none;
        }
        .cele-slot {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          container-type: size;
        }
        .cele-slot span {
          display: block;
          white-space: nowrap;
          transform-origin: center center;
        }
        .cele-name span {
          color: #2a2a2a;
          font-family: Montserrat, Inter, sans-serif;
          font-weight: 800;
          font-size: 92cqh;
          line-height: 1;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .cele-plate span {
          color: #1a1a1a;
          font-family: "Barlow Condensed", "Arial Narrow", Arial, sans-serif;
          font-weight: 700;
          font-size: 132cqh;
          line-height: 0.7;
          letter-spacing: 0.11em;
          padding-left: 0.11em;
        }
        .cele-mech span {
          color: #2a2a2a;
          font-family: Inter, sans-serif;
          font-weight: 700;
          font-size: 78cqh;
          line-height: 1;
          letter-spacing: 0.01em;
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
