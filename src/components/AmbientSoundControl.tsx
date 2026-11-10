import React, { useState, useRef, useEffect } from 'react';
import { Headphones, Volume2, VolumeX, Play, Pause, ChevronDown } from 'lucide-react';
import { ambientSound, AMBIENT_SOUND_OPTIONS, AmbientSoundType } from '../utils/ambientSound';

interface AmbientSoundControlProps {
  isDark?: boolean;
  defaultType?: AmbientSoundType;
  defaultVolume?: number;
  onSettingsChange?: (type: AmbientSoundType, volume: number) => void;
}

export const AmbientSoundControl: React.FC<AmbientSoundControlProps> = ({
  isDark = true,
  defaultType = 'rain',
  defaultVolume = 0.5,
  onSettingsChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(() => ambientSound.getIsRunning());
  const [currentType, setCurrentType] = useState<AmbientSoundType>(defaultType);
  const [volume, setVolume] = useState<number>(defaultVolume);
  const popoverRef = useRef<HTMLDivElement>(null);

  // 外部クリックでポップオーバーを閉じる
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const togglePlay = () => {
    if (isPlaying) {
      ambientSound.stop();
      setIsPlaying(false);
    } else {
      ambientSound.start(currentType, volume);
      setIsPlaying(true);
    }
  };

  const handleChangeType = (type: AmbientSoundType) => {
    setCurrentType(type);
    ambientSound.setType(type);
    onSettingsChange?.(type, volume);
  };

  const handleChangeVolume = (newVol: number) => {
    setVolume(newVol);
    ambientSound.setVolume(newVol);
    onSettingsChange?.(currentType, newVol);
  };

  const currentOption = AMBIENT_SOUND_OPTIONS.find((opt) => opt.id === currentType) || AMBIENT_SOUND_OPTIONS[0];

  return (
    <div className="relative inline-flex items-center" ref={popoverRef}>
      {/* トリガーボタン */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-sans transition-all cursor-pointer ${
          isPlaying
            ? isDark
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 shadow-xs shadow-emerald-950'
              : 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs'
            : isDark
            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
        }`}
        title={`環境音BGM (${isPlaying ? '再生中: ' + currentOption.label : '停止中'})`}
      >
        <Headphones className={`w-3.5 h-3.5 ${isPlaying ? 'animate-pulse text-emerald-400' : ''}`} />
        <span className="hidden sm:inline font-medium">
          {isPlaying ? currentOption.icon : '環境音'}
        </span>
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* フローティングポップオーバー */}
      {isOpen && (
        <div
          className={`absolute top-full mt-1.5 right-0 z-50 w-72 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all ${
            isDark
              ? 'bg-slate-900/95 border-slate-700/80 text-slate-200 shadow-black/80'
              : 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/60'
          }`}
        >
          {/* ヘッダー */}
          <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-700/40">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Headphones className="w-3.5 h-3.5 text-cyan-400" />
              <span>集中アンビエント環境音</span>
            </div>
            <button
              type="button"
              onClick={togglePlay}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3 h-3 fill-current" />
                  <span>停止</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>再生</span>
                </>
              )}
            </button>
          </div>

          {/* サウンド選択リスト */}
          <div className="space-y-1 mb-3">
            {AMBIENT_SOUND_OPTIONS.map((opt) => {
              const isSelected = opt.id === currentType;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChangeType(opt.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? isDark
                        ? 'bg-cyan-950/70 border border-cyan-700/60 text-cyan-200 font-medium'
                        : 'bg-cyan-100 border border-cyan-300 text-cyan-900 font-medium'
                      : isDark
                      ? 'hover:bg-slate-800/60 text-slate-300'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{opt.icon}</span>
                    <div>
                      <div className="font-semibold">{opt.label}</div>
                      <div className="text-[10px] opacity-70 leading-tight">{opt.description}</div>
                    </div>
                  </div>
                  {isSelected && isPlaying && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* 音量スライダー */}
          <div className="pt-2 border-t border-slate-700/40">
            <div className="flex items-center justify-between text-[11px] mb-1 font-medium text-slate-400">
              <span className="flex items-center gap-1">
                {volume === 0 ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                音量
              </span>
              <span>{Math.round(volume * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => handleChangeVolume(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};
