
import React, { useState, useEffect } from 'react';

const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-baseline gap-4">
      <div className="text-lg font-bold text-zinc-500 uppercase tracking-[0.2em]">
        {time.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
      </div>
      <div className="text-3xl font-black tracking-tighter text-white tabular-nums leading-none">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
};

export default Clock;
