import React from 'react';
import { setTvMode } from './config/tvMode.ts';

/**
 * Tela inicial de escolha do painel (domínio único).
 * Aparece quando ainda não há modo escolhido. Ao clicar, salva a escolha
 * (localStorage) e recarrega já no painel selecionado — a TV passa a abrir
 * direto nele nas próximas vezes.
 */
const TvModeSelectScreen: React.FC = () => {
  return (
    <div className="h-screen w-screen bg-black text-white flex flex-col items-center justify-center select-none px-6">
      <h1 className="font-black italic text-5xl mb-2">
        <span className="text-yellow-400">REI DO ABS</span>
      </h1>
      <p className="text-zinc-500 font-bold uppercase tracking-[0.35em] text-sm mb-12">
        Selecione o painel desta TV
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-3xl">
        <button
          onClick={() => setTvMode('patio')}
          className="group rounded-3xl border-2 border-yellow-500/40 bg-yellow-400/[0.06] hover:bg-yellow-400/[0.12] transition-all active:scale-[0.98] p-10 flex flex-col items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-yellow-400/40"
        >
          <span className="text-6xl">🚗</span>
          <span className="font-black italic text-4xl uppercase text-yellow-400">Pátio</span>
          <span className="text-zinc-400 text-sm uppercase tracking-widest">Veículos</span>
        </button>

        <button
          onClick={() => setTvMode('laboratorio')}
          className="group rounded-3xl border-2 border-violet-500/40 bg-violet-500/[0.06] hover:bg-violet-500/[0.12] transition-all active:scale-[0.98] p-10 flex flex-col items-center justify-center gap-3 focus:outline-none focus:ring-4 focus:ring-violet-400/40"
        >
          <span className="text-6xl">🔬</span>
          <span className="font-black italic text-4xl uppercase text-violet-400">Laboratório</span>
          <span className="text-zinc-400 text-sm uppercase tracking-widest">Módulos</span>
        </button>
      </div>

      <p className="text-zinc-600 text-xs mt-12 text-center max-w-md">
        Você pode trocar de painel a qualquer momento pelo botão no canto superior direito.
      </p>
    </div>
  );
};

export default TvModeSelectScreen;
