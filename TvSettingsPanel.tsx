import React from 'react';
import {
  DEFAULT_TV_SETTINGS,
  resetTvSettings,
  setTvSettings,
  useTvSettings,
  type SoundMode,
  type TvSettings,
  type TvSoundToggles,
} from './config/tvSettings';
import { TV_CONFIG } from './config/tvMode';
import {
  playGarantiaSound,
  playSlideSound,
  playStageChangeBeep,
  playVictorySound,
} from './utils/tvSounds';

interface TvSettingsPanelProps {
  onClose: () => void;
}

const SOUND_MODES: { value: SoundMode; label: string; hint: string }[] = [
  { value: 'always', label: 'Sempre', hint: 'Toca em qualquer horário' },
  { value: 'schedule', label: 'Horário comercial', hint: '08–12h e 13:30–19h' },
  { value: 'off', label: 'Mudo', hint: 'Nunca toca' },
];

const SOUND_ROWS: {
  key: keyof TvSoundToggles;
  label: string;
  desc: string;
  test: () => void;
  patioOnly?: boolean;
}[] = [
  { key: 'budgetApproved', label: 'Orçamento aprovado', desc: 'Tela de celebração', test: () => void playVictorySound() },
  { key: 'garantia', label: 'Garantia', desc: 'Tela de garantia', test: () => void playGarantiaSound() },
  { key: 'pecasDisponiveis', label: 'Peças disponíveis', desc: 'Tela de peças', test: () => void playVictorySound(), patioOnly: true },
  { key: 'stageChange', label: 'Mudança de etapa', desc: 'Bip ao mover um carro', test: () => void playStageChangeBeep(1) },
  { key: 'evaluationAlert', label: 'Alerta de avaliação', desc: 'Carros aguardando avaliação', test: () => void playStageChangeBeep(2) },
  { key: 'slide', label: 'Avisos e slides', desc: 'Avisos programados com som', test: () => void playSlideSound() },
];

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-zinc-600'}`}
    aria-pressed={checked}
  >
    <span
      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`}
    />
  </button>
);

const NumberSelect: React.FC<{
  value: number;
  options: number[];
  unit: string;
  onChange: (v: number) => void;
}> = ({ value, options, unit, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(Number(e.target.value))}
    className="rounded-lg border border-zinc-600 bg-zinc-800 px-3 py-2 text-sm font-bold text-white outline-none focus:border-emerald-400"
  >
    {options.map((o) => (
      <option key={o} value={o}>
        {o} {unit}
      </option>
    ))}
  </select>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="rounded-2xl border border-zinc-700/70 bg-zinc-900/60 p-4 sm:p-5">
    <h3 className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-emerald-400">{title}</h3>
    <div className="flex flex-col gap-3">{children}</div>
  </section>
);

const Row: React.FC<{ label: string; desc?: string; children: React.ReactNode }> = ({ label, desc, children }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="min-w-0">
      <p className="truncate text-sm font-bold text-white">{label}</p>
      {desc && <p className="truncate text-xs text-zinc-400">{desc}</p>}
    </div>
    <div className="flex shrink-0 items-center gap-2">{children}</div>
  </div>
);

const TvSettingsPanel: React.FC<TvSettingsPanelProps> = ({ onClose }) => {
  const settings = useTvSettings();

  const patch = (p: Partial<TvSettings>) => setTvSettings({ ...settings, ...p });
  const patchSounds = (k: keyof TvSoundToggles, v: boolean) =>
    setTvSettings({ ...settings, sounds: { ...settings.sounds, [k]: v } });
  const patchEval = (p: Partial<TvSettings['evaluationAlert']>) =>
    setTvSettings({ ...settings, evaluationAlert: { ...settings.evaluationAlert, ...p } });

  const muted = settings.soundMode === 'off';

  return (
    <div className="fixed inset-0 z-[800] flex items-start justify-center overflow-y-auto bg-black/80 p-3 backdrop-blur-sm sm:p-6">
      <div className="my-auto w-full max-w-2xl rounded-3xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="text-lg font-black text-white">Configurações da TV</h2>
            <p className="text-xs text-zinc-400">Salvo neste dispositivo · Painel {TV_CONFIG.label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700"
          >
            Fechar
          </button>
        </header>

        <div className="flex flex-col gap-4 p-4 sm:p-5">
          <Section title="Som geral">
            <Row label="Quando tocar" desc="Define se os sons da TV ficam ativos">
              <div className="flex overflow-hidden rounded-xl border border-zinc-600">
                {SOUND_MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    title={m.hint}
                    onClick={() => patch({ soundMode: m.value })}
                    className={`px-3 py-2 text-xs font-bold transition-colors ${
                      settings.soundMode === m.value ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Volume geral" desc={`${Math.round(settings.masterVolume * 100)}%`}>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(settings.masterVolume * 100)}
                onChange={(e) => patch({ masterVolume: Number(e.target.value) / 100 })}
                className="h-2 w-40 cursor-pointer accent-emerald-500"
              />
              <button
                type="button"
                onClick={() => void playSlideSound()}
                className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-700"
              >
                Testar
              </button>
            </Row>
          </Section>

          <Section title="Sons por evento">
            {muted && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300">
                O som geral está em "Mudo". Ative em "Som geral" para estes sons tocarem.
              </p>
            )}
            {SOUND_ROWS.filter((r) => !r.patioOnly || TV_CONFIG.showPecasDisponiveisOverlay).map((r) => (
              <Row key={r.key} label={r.label} desc={r.desc}>
                <button
                  type="button"
                  onClick={r.test}
                  className="rounded-lg bg-zinc-800 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-700"
                >
                  Testar
                </button>
                <Toggle checked={settings.sounds[r.key]} onChange={(v) => patchSounds(r.key, v)} />
              </Row>
            ))}
          </Section>

          <Section title="Alerta de avaliação">
            <Row label="Ativar alerta" desc="Avisa quando há carros aguardando avaliação">
              <Toggle checked={settings.evaluationAlert.enabled} onChange={(v) => patchEval({ enabled: v })} />
            </Row>
            <Row label="Repetir a cada" desc="Frequência do lembrete">
              <NumberSelect
                value={settings.evaluationAlert.intervalMinutes}
                options={[5, 10, 15, 20, 30, 45, 60, 90, 120]}
                unit="min"
                onChange={(v) => patchEval({ intervalMinutes: v })}
              />
            </Row>
            <Row label="Duração na tela" desc="Tempo que o alerta fica em destaque">
              <NumberSelect
                value={settings.evaluationAlert.onScreenSeconds}
                options={[5, 8, 10, 12, 15, 20, 30]}
                unit="s"
                onChange={(v) => patchEval({ onScreenSeconds: v })}
              />
            </Row>
          </Section>

          <Section title="Exibição">
            <Row label="Atualizar quadro" desc="Frequência de busca de dados">
              <NumberSelect
                value={settings.refreshSeconds}
                options={[5, 10, 15, 20, 30, 60]}
                unit="s"
                onChange={(v) => patch({ refreshSeconds: v })}
              />
            </Row>
            <Row label="Tempo por página" desc="Troca automática de páginas de carros">
              <NumberSelect
                value={settings.pageSeconds}
                options={[5, 7, 10, 12, 15, 20, 30]}
                unit="s"
                onChange={(v) => patch({ pageSeconds: v })}
              />
            </Row>
            <Row label="Duração do destaque" desc="Realce ao um carro mudar de etapa">
              <NumberSelect
                value={settings.highlightSeconds}
                options={[5, 8, 10, 12, 15]}
                unit="s"
                onChange={(v) => patch({ highlightSeconds: v })}
              />
            </Row>
            <Row label="Duração das telas" desc="Orçamento / garantia / peças">
              <NumberSelect
                value={settings.overlaySeconds}
                options={[5, 7, 10, 12, 15]}
                unit="s"
                onChange={(v) => patch({ overlaySeconds: v })}
              />
            </Row>
          </Section>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-zinc-800 px-5 py-4">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Restaurar todas as configurações para o padrão?')) resetTvSettings();
            }}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
          >
            Restaurar padrões
          </button>
          <span className="text-xs text-zinc-500">Padrão: {DEFAULT_TV_SETTINGS.refreshSeconds}s · 30min</span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-black text-black hover:bg-emerald-400"
          >
            Concluído
          </button>
        </footer>
      </div>
    </div>
  );
};

export default TvSettingsPanel;
