import React from 'react';

/**
 * Placa Mercosul de automóvel nas medidas da Resolução CONTRAN 969/2022:
 * 400×130 mm, faixa azul 390×30 mm, caracteres FE (altura 65 mm),
 * emblema 32×22 mm, bandeira 28×20 mm.
 * A largura de cada caractere segue a caixa do Barlow Condensed Bold
 * reduzida à altura oficial de 65 mm.
 */
const ADVANCE: Record<string, number> = {
  A: 482, B: 470, C: 464, D: 476, E: 438, F: 421, G: 467, H: 480, I: 230,
  J: 452, K: 491, L: 426, M: 548, N: 514, O: 473, P: 465, Q: 461, R: 471,
  S: 444, T: 468, U: 479, V: 488, W: 689, X: 475, Y: 474, Z: 412,
  '0': 453, '1': 284, '2': 438, '3': 436, '4': 484, '5': 439, '6': 440,
  '7': 407, '8': 440, '9': 435,
};

const CAP_UNITS = 700;
const CHAR_MM = 65;
const GAP_MM = 4;

function plateChars(plate: string): string {
  const clean = (plate || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  return clean || '-------';
}

function charMm(ch: string): number {
  const adv = ADVANCE[ch] ?? 450;
  return (adv * CHAR_MM) / CAP_UNITS;
}

export const MercosulPlate: React.FC<{ plate: string }> = ({ plate }) => {
  const chars = plateChars(plate).split('');
  const rowMm = chars.reduce((sum, ch) => sum + charMm(ch), 0) + Math.max(0, chars.length - 1) * GAP_MM;
  const fit = rowMm > 348 ? 348 / rowMm : 1;

  return (
    <div className="mp-sizer" aria-label={`Placa ${chars.join('')}`}>
      <div className="mp">
        <div className="mp-band" />
        <svg className="mp-emblem" viewBox="0 0 32 22" aria-hidden="true">
          <rect width="32" height="22" rx="1.2" fill="#ffffff" />
          <path d="M1.4 13.2c6.2-6.4 12.2 2.2 18.2-3.2 2.4-2.1 5.2-2.6 8-2.2v12.6H1.4V13.2z" fill="#009B3A" />
          <circle cx="16" cy="8.1" r="4.15" fill="#0038A8" />
          <path d="M12.7 8.5c1.1-1.7 2.2-1.7 3.3 0 1.1 1.6 2.2 1.6 3.3 0" fill="none" stroke="#fff" strokeWidth="0.7" />
          <text
            x="16"
            y="20.1"
            textAnchor="middle"
            fontFamily="Arial, sans-serif"
            fontSize="3.15"
            fontWeight="700"
            fill="#0038A8"
          >
            MERCOSUL
          </text>
        </svg>
        <svg className="mp-flag" viewBox="0 0 28 20" aria-hidden="true">
          <rect width="28" height="20" rx="1.4" fill="#ffffff" />
          <rect x="1" y="1" width="26" height="18" rx="0.8" fill="#009B3A" />
          <path fill="#FFDF00" d="M14 2.3 L24.6 10 L14 17.7 L3.4 10 Z" />
          <circle cx="14" cy="10" r="3.55" fill="#002776" />
          <path d="M10.7 10.7 Q14 8.5 17.3 10.7" fill="none" stroke="#fff" strokeWidth="0.7" />
          <g fill="#fff">
            <circle cx="12.4" cy="8.7" r="0.28" />
            <circle cx="13.6" cy="8.2" r="0.22" />
            <circle cx="14.2" cy="10.2" r="0.32" />
            <circle cx="15.1" cy="8.4" r="0.2" />
            <circle cx="16.2" cy="9.1" r="0.24" />
          </g>
        </svg>
        <span className="mp-brasil">BRASIL</span>
        <svg className="mp-qr" viewBox="0 0 18 18" aria-hidden="true">
          <rect width="18" height="18" fill="#fff" />
          <path fill="#111" d="M1 1h6v6H1zm1 1v4h4V2zm8-1h6v6h-6zm5 1v4h-4V2zM1 11h6v6H1zm1 1v4h4v-4zm2-9h2v2H4zm0 10h2v2H4zm10-10h2v2h-2zM10 10h2v2h-2zm2 2h2v2h-2zm2 0h2v2h-2zm-4 2h2v2h-2zm2 2h2v2h-2zm2-2h2v4h-2zm-6-2h2v2H8z" />
        </svg>
        <div className="mp-chars" style={{ transform: `scale(${fit})` }}>
          {chars.map((ch, index) => (
            <span key={`${ch}-${index}`} className="mp-slot" style={{ ['--adv' as string]: ADVANCE[ch] ?? 450 }}>
              <span className="mp-glyph">{ch}</span>
            </span>
          ))}
        </div>
        <span className="mp-br">BR</span>
      </div>
      <style>{`
        .mp-sizer {
          container-type: inline-size;
          height: 12.6vh;
          width: calc(12.6vh * 400 / 130);
          flex: 0 0 auto;
        }
        .mp {
          position: relative;
          width: 100cqi;
          height: calc(100cqi * 130 / 400);
          border-radius: calc(100cqi * 8 / 400);
          overflow: hidden;
          background: linear-gradient(180deg, #ffffff 0%, #f7f7f7 55%, #ececec 100%);
          box-shadow:
            0 10px 22px rgba(0, 0, 0, 0.38),
            inset 0 0 0 1px rgba(0, 0, 0, 0.45);
        }
        .mp-band {
          position: absolute;
          left: calc(100cqi * 5 / 400);
          top: 0;
          width: calc(100cqi * 390 / 400);
          height: calc(100cqi * 30 / 400);
          background: #0038a8;
        }
        .mp-emblem {
          position: absolute;
          left: calc(100cqi * 15 / 400);
          top: calc(100cqi * 4 / 400);
          width: calc(100cqi * 32 / 400);
          height: calc(100cqi * 22 / 400);
        }
        .mp-flag {
          position: absolute;
          left: calc(100cqi * 368 / 400);
          top: calc(100cqi * 4 / 400);
          width: calc(100cqi * 28 / 400);
          height: calc(100cqi * 20 / 400);
        }
        .mp-brasil {
          position: absolute;
          left: 50%;
          top: calc(100cqi * 15 / 400);
          transform: translate(-50%, -50%);
          color: #ffffff;
          font-family: "Barlow Condensed", "Arial Narrow", Arial, sans-serif;
          font-weight: 600;
          font-size: calc(100cqi * 13.5 / 400);
          letter-spacing: 0.46em;
          line-height: 1;
          padding-left: 0.46em;
        }
        .mp-qr {
          position: absolute;
          left: calc(100cqi * 9 / 400);
          top: calc(100cqi * 34 / 400);
          width: calc(100cqi * 18 / 400);
          height: calc(100cqi * 18 / 400);
        }
        .mp-chars {
          position: absolute;
          left: 0;
          right: 0;
          top: calc(100cqi * 47.5 / 400);
          height: calc(100cqi * 65 / 400);
          display: flex;
          justify-content: center;
          align-items: flex-start;
          gap: calc(100cqi * ${GAP_MM} / 400);
          transform-origin: center top;
        }
        .mp-slot {
          position: relative;
          width: calc(100cqi * var(--adv) * ${CHAR_MM} / ${CAP_UNITS} / 400);
          height: 100%;
          flex: 0 0 auto;
        }
        .mp-glyph {
          position: absolute;
          left: 0;
          width: 100%;
          top: -0.2em;
          text-align: center;
          font-family: "Barlow Condensed", "Arial Narrow", Arial, sans-serif;
          font-weight: 700;
          font-size: calc(100cqi * ${CHAR_MM} / 400 / 0.7);
          line-height: 1;
          color: #111111;
        }
        .mp-br {
          position: absolute;
          left: calc(100cqi * 8 / 400);
          bottom: calc(100cqi * 3.5 / 400);
          font-family: "Barlow Condensed", Arial, sans-serif;
          font-weight: 700;
          font-size: calc(100cqi * 8 / 400);
          letter-spacing: 0.02em;
          line-height: 1;
          color: #111111;
        }
      `}</style>
    </div>
  );
};
