import React from 'react';
import {
  DEFAULT_TV_SETTINGS,
  resetTvSettings,
  setTvSettings,
  useTvSettings,
  type SoundMode,
  type TvSettings,
  type TvSoundEvent,
} from './config/tvSettings';
import { TV_CONFIG } from './config/tvMode';
import { SOUND_PRESETS, playPreset } from './utils/tvSounds';

interface TvSettingsPanelProps {
  onClose: () => void;
}

const SOUND_MODES: { value: SoundMode; label: string }[] = [
  { value: 'always', label: 'Sempre' },
  { value: 'schedule', label: 'Comercial' },
  { value: 'off', label: 'Mudo' },
];

const SOUND_ROWS: { key: TvSoundEvent; label: string; patioOnly?: boolean }[] = [
  { key: 'budgetApproved', label: 'Orçamento aprovado' },
  { key: 'garantia', label: 'Garantia' },
  { key: 'pecasDisponiveis', label: 'Peças disponíveis', patioOnly: true },
  { key: 'stageChange', label: 'Mudança de etapa' },
  { key: 'evaluationAlert', label: 'Alerta de avaliação' },
  { key: 'slide', label: 'Avisos e slides' },
];

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void }> = ({ checked, onChange }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-zinc-600'}`}
    aria-pressed={checked}
  >
    <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? 'left-6' : 'left-1'}`} />
  </button>
);

const selectCls =
  'rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1.5 text-xs font-bold text-white outline-none focus:border-emerald-400';

const NumberSelect: React.FC<{ value: number; options: number[]; unit: string; onChange: (v: number) => void }> = ({
  value,
  options,
  unit,
  onChange,
}) => (
  <select value={value} onChange={(e) => onChange(Number(e.target.value))} className={selectCls}>
    {options.map((o) => (
      <option key={o} value={o}>
        {o} {unit}
      </option>
    ))}
  </select>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="rounded-2xl border border-zinc-700/70 bg-zinc-900/60 p-3">
    <h3 className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">{title}</h3>
    <div className="flex flex-col gap-2">{children}</div>
  </section>
);

const Row: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex items-center justify-between gap-2">
    <p className="min-w-0 flex-1 truncate text-sm font-bold text-white">{label}</p>
    <div className="flex shrink-0 items-center gap-2">{children}</div>
  </div>
);

const TestButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    title="Tocar prévia"
    className="rounded-lg bg-zinc-800 px-2.5 py-1.5 text-xs font-bold text-white hover:bg-zinc-700"
  >
    ▶
  </button>
);

const TvSettingsPanel: React.FC<TvSettingsPanelProps> = ({ onClose }) => {
  const settings = useTvSettings();

  const patch = (p: Partial<TvSettings>) => setTvSettings({ ...settings, ...p });
  const patchSound = (k: TvSoundEvent, v: boolean) => setTvSettings({ ...settings, sounds: { ...settings.sounds, [k]: v } });
  const patchChoice = (k: TvSoundEvent, id: string) =>
    setTvSettings({ ...settings, soundChoices: { ...settings.soundChoices, [k]: id } });
  const patchEval = (p: Partial<TvSettings['evaluationAlert']>) =>
    setTvSettings({ ...settings, evaluationAlert: { ...settings.evaluationAlert, ...p } });

  const muted = settings.soundMode === 'off';

  return (
    <div className="fixed inset-0 z-[800] flex items-center justify-center bg-black/80 p-3 backdrop-blur-sm">
      <div className="flex max-h-[96vh] w-full max-w-6xl flex-col rounded-3xl border border-zinc-700 bg-zinc-950 shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-zinc-800 px-5 py-3">
          <div>
            <h2 className="text-lg font-black text-white">Configurações da TV</h2>
            <p className="text-xs text-zinc-400">Salvo neste dispositivo · Painel {TV_CONFIG.label}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-bold text-white hover:bg-zinc-700">
            Fechar
          </button>
        </header>

        <div className="grid flex-1 grid-cols-1 gap-3 p-4 lg:grid-cols-2">
          <Section title="Sons por evento — escolha o toque">
            {muted && (
              <p className="rounded-lg bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">
                Som geral em "Mudo". Mude em "Som geral" para ouvir.
              </p>
            )}
            {SOUND_ROWS.filter((r) => !r.patioOnly || TV_CONFIG.showPecasDisponiveisOverlay).map((r) => (
              <Row key={r.key} label={r.label}>
                <select value={settings.soundChoices[r.key]} onChange={(e) => patchChoice(r.key, e.target.value)} className={selectCls}>
                  {SOUND_PRESETS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <TestButton onClick={() => void playPreset(settings.soundChoices[r.key])} />
                <Toggle checked={settings.sounds[r.key]} onChange={(v) => patchSound(r.key, v)} />
              </Row>
            ))}
          </Section>

          <div className="flex flex-col gap-3">
            <Section title="Som geral">
              <Row label="Quando tocar">
                <div className="flex overflow-hidden rounded-xl border border-zinc-600">
                  {SOUND_MODES.map((m) => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => patch({ soundMode: m.value })}
                      className={`px-3 py-1.5 text-xs font-bold transition-colors ${
                        settings.soundMode === m.value ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </Row>
              <Row label={`Volume geral · ${Math.round(settings.masterVolume * 100)}%`}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(settings.masterVolume * 100)}
                  onChange={(e) => patch({ masterVolume: Number(e.target.value) / 100 })}
                  className="h-2 w-36 cursor-pointer accent-emerald-500"
                />
                <TestButton onClick={() => void playPreset('bell')} />
              </Row>
            </Section>

            <Section title="Alerta de avaliação">
              <Row label="Ativar alerta">
                <Toggle checked={settings.evaluationAlert.enabled} onChange={(v) => patchEval({ enabled: v })} />
              </Row>
              <Row label="Repetir a cada">
                <NumberSelect
                  value={settings.evaluationAlert.intervalMinutes}
                  options={[5, 10, 15, 20, 30, 45, 60, 90, 120]}
                  unit="min"
                  onChange={(v) => patchEval({ intervalMinutes: v })}
                />
              </Row>
              <Row label="Duração na tela">
                <NumberSelect
                  value={settings.evaluationAlert.onScreenSeconds}
                  options={[5, 8, 10, 12, 15, 20, 30]}
                  unit="s"
                  onChange={(v) => patchEval({ onScreenSeconds: v })}
                />
              </Row>
            </Section>

            <Section title="Exibição">
              <Row label="Atualizar quadro">
                <NumberSelect value={settings.refreshSeconds} options={[5, 10, 15, 20, 30, 60]} unit="s" onChange={(v) => patch({ refreshSeconds: v })} />
              </Row>
              <Row label="Tempo por página">
                <NumberSelect value={settings.pageSeconds} options={[5, 7, 10, 12, 15, 20, 30]} unit="s" onChange={(v) => patch({ pageSeconds: v })} />
              </Row>
              <Row label="Duração do destaque">
                <NumberSelect value={settings.highlightSeconds} options={[5, 8, 10, 12, 15]} unit="s" onChange={(v) => patch({ highlightSeconds: v })} />
              </Row>
              <Row label="Duração das telas">
                <NumberSelect value={settings.overlaySeconds} options={[5, 7, 10, 12, 15]} unit="s" onChange={(v) => patch({ overlaySeconds: v })} />
              </Row>
            </Section>
          </div>
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-zinc-800 px-5 py-3">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Restaurar todas as configurações para o padrão?')) resetTvSettings();
            }}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold text-zinc-300 hover:bg-zinc-800"
          >
            Restaurar padrões
          </button>
          <span className="hidden text-xs text-zinc-500 sm:block">▶ = ouvir prévia · padrão {DEFAULT_TV_SETTINGS.refreshSeconds}s / 30min</span>
          <button type="button" onClick={onClose} className="rounded-xl bg-emerald-500 px-5 py-2 text-sm font-black text-black hover:bg-emerald-400">
            Concluído
          </button>
        </footer>
      </div>
    </div>
  );
};

export default TvSettingsPanel;
