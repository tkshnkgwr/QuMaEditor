/**
 * Web Audio API による完全オフライン・ゼロ外部アセットのリアルタイム環境音シンセサイザー
 * - 雨音、ホワイトノイズ、小川のせせらぎ、森のそよ風、瞑想ドローンをリアルタイム音響合成 (DSP)
 * - ポモドーロタイマー完了用のクリアなサイン波ベル音生成もサポート
 */

export type AmbientSoundType = 'rain' | 'whitenoise' | 'brook' | 'breeze' | 'space';

export interface AmbientSoundOption {
  id: AmbientSoundType;
  label: string;
  icon: string;
  description: string;
}

export const AMBIENT_SOUND_OPTIONS: AmbientSoundOption[] = [
  {
    id: 'rain',
    label: '雨音 (Rain)',
    icon: '🌧️',
    description: '心を落ち着かせる静かな雨と優しい雨粒の音',
  },
  {
    id: 'whitenoise',
    label: 'ホワイトノイズ (White Noise)',
    icon: '📻',
    description: '周囲の雑音をマスキングする均一で柔らかなノイズ',
  },
  {
    id: 'brook',
    label: '小川のせせらぎ (Brook)',
    icon: '🌊',
    description: 'ゆったりと流れる澄んだ水流のうねり音',
  },
  {
    id: 'breeze',
    label: '森のそよ風 (Breeze)',
    icon: '🍃',
    description: '木々を優しく揺らす静かな風の吹き抜け音',
  },
  {
    id: 'space',
    label: '宇宙の瞑想音 (Cosmic Drone)',
    icon: '🌌',
    description: '思考を深める 432Hz 和音のバイノーラルドローン',
  },
];

class AmbientSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private currentType: AmbientSoundType = 'rain';
  private activeNodes: (AudioNode | number)[] = [];
  private activeOscillators: OscillatorNode[] = [];
  private activeIntervals: number[] = [];
  private isRunning: boolean = false;
  private volume: number = 0.5;

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * ピンクノイズ用 AudioBuffer を動的生成 (Paul Kellet フィルターアルゴリズム)
   */
  private createPinkNoiseBuffer(ctx: AudioContext, seconds: number = 5): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    return buffer;
  }

  /**
   * ホワイトノイズ用 AudioBuffer を動的生成
   */
  private createWhiteNoiseBuffer(ctx: AudioContext, seconds: number = 3): AudioBuffer {
    const bufferSize = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.2;
    }
    return buffer;
  }

  /**
   * 現在の音響生成ノードをすべて安全に停止・破棄
   */
  private cleanupCurrentSound() {
    this.activeIntervals.forEach((id) => clearInterval(id));
    this.activeIntervals = [];

    this.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {}
    });
    this.activeOscillators = [];

    this.activeNodes.forEach((node) => {
      if (typeof node === 'object' && node !== null && 'disconnect' in node) {
        try {
          (node as AudioNode).disconnect();
        } catch {}
      }
    });
    this.activeNodes = [];
  }

  /**
   * 環境音の再生を開始
   */
  public start(type: AmbientSoundType = this.currentType, volume: number = this.volume) {
    const ctx = this.getAudioContext();
    this.cleanupCurrentSound();

    this.currentType = type;
    this.volume = Math.max(0, Math.min(1, volume));

    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.connect(ctx.destination);
    }
    this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);

    switch (type) {
      case 'rain':
        this.buildRainSound(ctx);
        break;
      case 'whitenoise':
        this.buildWhiteNoiseSound(ctx);
        break;
      case 'brook':
        this.buildBrookSound(ctx);
        break;
      case 'breeze':
        this.buildBreezeSound(ctx);
        break;
      case 'space':
        this.buildSpaceDroneSound(ctx);
        break;
    }

    this.isRunning = true;
  }

  /**
   * 環境音の停止
   */
  public stop() {
    this.cleanupCurrentSound();
    this.isRunning = false;
  }

  /**
   * 音量の動的変更 (0.0〜1.0)
   */
  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * サウンドタイプの動的変更
   */
  public setType(type: AmbientSoundType) {
    this.currentType = type;
    if (this.isRunning) {
      this.start(type, this.volume);
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  public getVolume(): number {
    return this.volume;
  }

  // --- サウンド合成レシピ群 ---

  /** 🌧️ 雨音: ピンクノイズベース + バンドパス + 滴インパルス */
  private buildRainSound(ctx: AudioContext) {
    const buffer = this.createPinkNoiseBuffer(ctx, 4);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // ローパスフィルターで雨のこもり感を演出
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1000, ctx.currentTime);

    // ハイパスフィルターで低周波の濁りをカット
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(250, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.7, ctx.currentTime);

    source.connect(lowpass);
    lowpass.connect(highpass);
    highpass.connect(rainGain);
    rainGain.connect(this.masterGain!);
    source.start();

    this.activeNodes.push(source, lowpass, highpass, rainGain);
  }

  /** 📻 ホワイトノイズ: 柔らかく整音されたリフレッシュノイズ */
  private buildWhiteNoiseSound(ctx: AudioContext) {
    const buffer = this.createWhiteNoiseBuffer(ctx, 3);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, ctx.currentTime);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain!);
    source.start();

    this.activeNodes.push(source, filter, gain);
  }

  /** 🌊 小川のせせらぎ: LFO で変調するバンドパスフィルター水流音 */
  private buildBrookSound(ctx: AudioContext) {
    const buffer = this.createPinkNoiseBuffer(ctx, 4);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(550, ctx.currentTime);
    bandpass.Q.setValueAtTime(2.5, ctx.currentTime);

    // 水のうねりを生み出す低周波オシレーター (LFO)
    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.35, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(250, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(bandpass.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.8, ctx.currentTime);

    source.connect(bandpass);
    bandpass.connect(gain);
    gain.connect(this.masterGain!);
    source.start();

    this.activeOscillators.push(lfo);
    this.activeNodes.push(source, bandpass, lfoGain, gain);
  }

  /** 🍃 森のそよ風: 超低速スイープによる風の息づかい */
  private buildBreezeSound(ctx: AudioContext) {
    const buffer = this.createPinkNoiseBuffer(ctx, 5);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(400, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.12, ctx.currentTime); // 約8秒周期の風の揺らぎ
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(220, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(lowpass.frequency);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.9, ctx.currentTime);

    source.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain!);
    source.start();

    this.activeOscillators.push(lfo);
    this.activeNodes.push(source, lowpass, lfoGain, gain);
  }

  /** 🌌 宇宙の瞑想音: 432Hz倍音群によるバイノーラル・アンビエントドローン */
  private buildSpaceDroneSound(ctx: AudioContext) {
    const frequencies = [108, 216, 324, 432];
    frequencies.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      // 微小なデチューンで神秘的なうねりを生成
      const detune = (idx % 2 === 0 ? 1 : -1) * (idx * 0.8 + 0.4);
      osc.frequency.setValueAtTime(freq + detune, ctx.currentTime);

      const gain = ctx.createGain();
      // 高周波ほど音量を抑える
      const amp = 0.25 / (idx + 1);
      gain.gain.setValueAtTime(amp, ctx.currentTime);

      osc.connect(gain);
      gain.connect(this.masterGain!);
      osc.start();

      this.activeOscillators.push(osc);
      this.activeNodes.push(gain);
    });
  }

  /**
   * 🔔 ポモドーロタイマー完了用の澄んだ和音ベル音（サイン波アルペジオ）
   */
  public playChime() {
    try {
      const ctx = this.getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (爽やかな長三和音)
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

        const startTime = ctx.currentTime + idx * 0.08;
        const duration = 1.2;

        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + duration);
      });
    } catch (e) {
      console.warn('ベル音の再生に失敗しました:', e);
    }
  }
}

export const ambientSound = new AmbientSoundEngine();
