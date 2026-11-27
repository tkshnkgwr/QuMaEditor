/**
 * Web Audio API による完全オフライン・ゼロ外部アセットのリアルタイム環境音シンセサイザー
 * - 雨音、ホワイトノイズ、ピンクノイズ、小川のせせらぎ、森のそよ風、瞑想ドローンをリアルタイム音響合成 (DSP)
 * - ポモドーロタイマー完了用のクリアなサイン波ベル音生成もサポート
 */

export type AmbientSoundType = 'rain' | 'whitenoise' | 'pinknoise' | 'brook' | 'breeze' | 'space';

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
    description: 'しとしと降る穏やかな雨と繊細な雨粒の音',
  },
  {
    id: 'whitenoise',
    label: 'ホワイトノイズ (White Noise)',
    icon: '📻',
    description: '周囲の雑音をマスキングする均一で柔らかなノイズ',
  },
  {
    id: 'pinknoise',
    label: 'ピンクノイズ (Pink Noise)',
    icon: '🌸',
    description: '耳に優しく温かみのある 1/f ゆらぎノイズ',
  },
  {
    id: 'brook',
    label: '小川のせせらぎ (Brook)',
    icon: '🌊',
    description: '澄んだ浅瀬の水流とチャプチャプ弾けるせせらぎ音',
  },
  {
    id: 'breeze',
    label: '森のそよ風 (Breeze)',
    icon: '🍃',
    description: '木々の葉を優しく揺らす穏やかなそよ風と葉擦れ音',
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
  private activeNodes: AudioNode[] = [];
  private activeSources: AudioScheduledSourceNode[] = [];
  private activeIntervals: number[] = [];
  private activeTimeouts: number[] = [];
  private isRunning: boolean = false;
  private volume: number = 0.5;
  private sessionId: number = 0;

  private getAudioContext(): AudioContext {
    if (!this.ctx || this.ctx.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  /**
   * バッファの末尾を先頭へクロスフェードし、ループ境界のクリック音を除去する
   */
  private applySeamlessLoop(raw: Float32Array, targetLength: number, fadeSamples: number): Float32Array {
    const out = new Float32Array(targetLength);
    out.set(raw.subarray(0, targetLength));

    for (let i = 0; i < fadeSamples; i++) {
      const t = i / fadeSamples;
      // コサインカーブによる等パワーに近い滑らかなクロスフェード
      const fadeIn = 0.5 * (1 - Math.cos(Math.PI * t));
      const fadeOut = 1 - fadeIn;
      out[i] = out[i] * fadeIn + raw[targetLength + i] * fadeOut;
    }
    return out;
  }

  /**
   * ピンクノイズ用 AudioBuffer を動的生成 (Paul Kellet フィルターアルゴリズム + シームレスループ)
   */
  private createPinkNoiseBuffer(ctx: AudioContext, seconds: number = 6): AudioBuffer {
    const targetLength = Math.floor(ctx.sampleRate * seconds);
    const fadeSamples = Math.min(Math.floor(ctx.sampleRate * 0.15), Math.floor(targetLength / 4));
    const totalLength = targetLength + fadeSamples;
    const raw = new Float32Array(totalLength);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    // フィルター状態のウォームアップ
    for (let i = 0; i < 1024; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      b6 = white * 0.115926;
    }

    for (let i = 0; i < totalLength; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      raw[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }

    const buffer = ctx.createBuffer(1, targetLength, ctx.sampleRate);
    buffer.getChannelData(0).set(this.applySeamlessLoop(raw, targetLength, fadeSamples));
    return buffer;
  }

  /**
   * ホワイトノイズ用 AudioBuffer を動的生成 (シームレスループ対応)
   */
  private createWhiteNoiseBuffer(ctx: AudioContext, seconds: number = 4): AudioBuffer {
    const targetLength = Math.floor(ctx.sampleRate * seconds);
    const fadeSamples = Math.min(Math.floor(ctx.sampleRate * 0.1), Math.floor(targetLength / 4));
    const totalLength = targetLength + fadeSamples;
    const raw = new Float32Array(totalLength);

    for (let i = 0; i < totalLength; i++) {
      raw[i] = (Math.random() * 2 - 1) * 0.2;
    }

    const buffer = ctx.createBuffer(1, targetLength, ctx.sampleRate);
    buffer.getChannelData(0).set(this.applySeamlessLoop(raw, targetLength, fadeSamples));
    return buffer;
  }

  /**
   * 雨粒・水しぶき用の短いノイズバースト用 AudioBuffer を生成
   */
  private createBurstNoiseBuffer(ctx: AudioContext, seconds: number = 0.06): AudioBuffer {
    const length = Math.max(64, Math.floor(ctx.sampleRate * seconds));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  /**
   * ステレオパン接続ヘルパー（StereoPannerNode 非対応環境でも安全にフォールバック）
   */
  private connectWithPan(ctx: AudioContext, sourceNode: AudioNode, destination: AudioNode, pan: number) {
    if (typeof ctx.createStereoPanner === 'function') {
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime);
      sourceNode.connect(panner);
      panner.connect(destination);
      return panner;
    }
    sourceNode.connect(destination);
    return null;
  }

  /**
   * 再帰タイマーを安全に登録する（停止・切替時に即座にキャンセル）
   */
  private scheduleNext(sessionId: number, delayMs: number, callback: () => void) {
    const id = window.setTimeout(() => {
      this.activeTimeouts = this.activeTimeouts.filter((t) => t !== id);
      if (!this.isRunning || this.sessionId !== sessionId) return;
      callback();
    }, delayMs);
    this.activeTimeouts.push(id);
  }

  /**
   * 現在の音響生成ノードをすべて安全に停止・破棄
   */
  private cleanupCurrentSound() {
    this.sessionId++;

    this.activeIntervals.forEach((id) => clearInterval(id));
    this.activeIntervals = [];

    this.activeTimeouts.forEach((id) => clearTimeout(id));
    this.activeTimeouts = [];

    this.activeSources.forEach((src) => {
      try {
        src.stop();
      } catch {
        // 既に停止済みの場合は無視
      }
      try {
        src.disconnect();
      } catch {
        // 切断済みの場合は無視
      }
    });
    this.activeSources = [];

    this.activeNodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        // 切断済みの場合は無視
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
    this.isRunning = true;

    if (!this.masterGain) {
      this.masterGain = ctx.createGain();
      this.masterGain.connect(ctx.destination);
    }
    this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);

    const currentSession = this.sessionId;

    switch (type) {
      case 'rain':
        this.buildRainSound(ctx, currentSession);
        break;
      case 'whitenoise':
        this.buildWhiteNoiseSound(ctx);
        break;
      case 'pinknoise':
        this.buildPinkNoiseSound(ctx);
        break;
      case 'brook':
        this.buildBrookSound(ctx, currentSession);
        break;
      case 'breeze':
        this.buildBreezeSound(ctx);
        break;
      case 'space':
        this.buildSpaceDroneSound(ctx);
        break;
    }
  }

  /**
   * 環境音の停止
   */
  public stop() {
    this.isRunning = false;
    this.cleanupCurrentSound();
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

  /**
   * 🌧️ 雨音: しとしと降る穏やかな雨幕 + 繊細な雨粒インパルス
   * - 重い低中域の圧を抑えて「土砂降り感」を解消し、落ち着いた小雨〜中雨を再現
   */
  private buildRainSound(ctx: AudioContext, sessionId: number) {
    const buffer = this.createPinkNoiseBuffer(ctx, 6);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // 低域の重い雨圧をカットして「しとしと感」を出す
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(520, ctx.currentTime);
    highpass.Q.setValueAtTime(0.7, ctx.currentTime);

    // 耳障りな高域を丸めつつ、細かな雨脚の輪郭を残す
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(2400, ctx.currentTime);
    lowpass.Q.setValueAtTime(0.7, ctx.currentTime);

    const rainGain = ctx.createGain();
    rainGain.gain.setValueAtTime(0.28, ctx.currentTime);

    // 雨脚にわずかな自然な強弱をつける超低速 LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.07, ctx.currentTime);
    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(0.04, ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(rainGain.gain);
    lfo.start();

    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(rainGain);
    rainGain.connect(this.masterGain!);
    source.start();

    this.activeSources.push(source, lfo);
    this.activeNodes.push(highpass, lowpass, rainGain, lfoGain);

    // 繊細な雨粒（葉や軒先に落ちる粒立ち）を不規則に散りばめる
    const dropBus = ctx.createGain();
    dropBus.gain.setValueAtTime(0.75, ctx.currentTime);
    dropBus.connect(this.masterGain!);
    this.activeNodes.push(dropBus);

    const burstBuffer = this.createBurstNoiseBuffer(ctx, 0.04);

    const spawnRaindrop = () => {
      if (!this.isRunning || this.sessionId !== sessionId) return;
      const now = ctx.currentTime;
      const pan = (Math.random() * 2 - 1) * 0.7;

      if (Math.random() < 0.78) {
        // 細い雨粒の衝撃（極短バンドパスノイズ）
        const dropSrc = ctx.createBufferSource();
        dropSrc.buffer = burstBuffer;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1600 + Math.random() * 2800, now);
        bp.Q.setValueAtTime(2.5 + Math.random() * 2.5, now);

        const env = ctx.createGain();
        const peak = 0.025 + Math.random() * 0.055;
        const dur = 0.008 + Math.random() * 0.014;
        env.gain.setValueAtTime(0.0001, now);
        env.gain.linearRampToValueAtTime(peak, now + 0.002);
        env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        dropSrc.connect(bp);
        bp.connect(env);
        this.connectWithPan(ctx, env, dropBus, pan);

        dropSrc.start(now);
        dropSrc.stop(now + dur + 0.01);
      } else {
        // 軒先や水たまりに落ちる柔らかな水滴（微小ピッチ上昇サイン波）
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        const baseFreq = 750 + Math.random() * 900;
        const dur = 0.028 + Math.random() * 0.025;
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.22, now + dur);

        const env = ctx.createGain();
        const peak = 0.012 + Math.random() * 0.022;
        env.gain.setValueAtTime(0.0001, now);
        env.gain.linearRampToValueAtTime(peak, now + 0.003);
        env.gain.exponentialRampToValueAtTime(0.0001, now + dur);

        osc.connect(env);
        this.connectWithPan(ctx, env, dropBus, pan);

        osc.start(now);
        osc.stop(now + dur + 0.01);
      }

      // 不規則な間隔で次の雨粒をスケジュール (60ms〜220ms)
      const nextDelay = 60 + Math.random() * 160;
      this.scheduleNext(sessionId, nextDelay, spawnRaindrop);
    };

    this.scheduleNext(sessionId, 80, spawnRaindrop);
  }

  /** 📻 ホワイトノイズ: 柔らかく整音されたリフレッシュノイズ */
  private buildWhiteNoiseSound(ctx: AudioContext) {
    const buffer = this.createWhiteNoiseBuffer(ctx, 4);
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

    this.activeSources.push(source);
    this.activeNodes.push(filter, gain);
  }

  /** 🌸 ピンクノイズ: 1/f 特性を持つ温かみのある均質なマスキングノイズ */
  private buildPinkNoiseSound(ctx: AudioContext) {
    const buffer = this.createPinkNoiseBuffer(ctx, 6);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // 超低域の不要なDC・振動成分だけを除去
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(40, ctx.currentTime);
    highpass.Q.setValueAtTime(0.7, ctx.currentTime);

    // 耳に刺さる超高域をごく緩やかに整える
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(6500, ctx.currentTime);
    lowpass.Q.setValueAtTime(0.5, ctx.currentTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.45, ctx.currentTime);

    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(gain);
    gain.connect(this.masterGain!);
    source.start();

    this.activeSources.push(source);
    this.activeNodes.push(highpass, lowpass, gain);
  }

  /**
   * 🌊 小川のせせらぎ: 澄んだ浅瀬の水流 + Minnaert 共振によるチャプチャプ気泡音 + 微細なしぶき
   * - 風の音に聞こえる原因だった低域の遅いスイープを排し、中高域の軽やかな流れと水の粒立ちを合成
   */
  private buildBrookSound(ctx: AudioContext, sessionId: number) {
    const now = ctx.currentTime;
    const whiteBuffer = this.createWhiteNoiseBuffer(ctx, 5);
    const pinkBuffer = this.createPinkNoiseBuffer(ctx, 5);

    // レイヤー1A: 浅瀬のサラサラとした水流ベース（低域をカットして風っぽさを排除）
    const flowSrc = ctx.createBufferSource();
    flowSrc.buffer = pinkBuffer;
    flowSrc.loop = true;

    const flowHp = ctx.createBiquadFilter();
    flowHp.type = 'highpass';
    flowHp.frequency.setValueAtTime(680, now);
    flowHp.Q.setValueAtTime(0.8, now);

    const flowBp = ctx.createBiquadFilter();
    flowBp.type = 'bandpass';
    flowBp.frequency.setValueAtTime(1150, now);
    flowBp.Q.setValueAtTime(1.1, now);

    const flowGain = ctx.createGain();
    flowGain.gain.setValueAtTime(0.22, now);

    // 2つの非整数比 LFO で浅瀬の小波の細かい揺らぎを表現
    const flowLfo1 = ctx.createOscillator();
    flowLfo1.type = 'sine';
    flowLfo1.frequency.setValueAtTime(0.85, now);
    const flowLfo1Gain = ctx.createGain();
    flowLfo1Gain.gain.setValueAtTime(0.045, now);

    const flowLfo2 = ctx.createOscillator();
    flowLfo2.type = 'sine';
    flowLfo2.frequency.setValueAtTime(1.43, now);
    const flowLfo2Gain = ctx.createGain();
    flowLfo2Gain.gain.setValueAtTime(0.03, now);

    flowLfo1.connect(flowLfo1Gain);
    flowLfo1Gain.connect(flowGain.gain);
    flowLfo2.connect(flowLfo2Gain);
    flowLfo2Gain.connect(flowGain.gain);

    flowSrc.connect(flowHp);
    flowHp.connect(flowBp);
    flowBp.connect(flowGain);
    flowGain.connect(this.masterGain!);

    // レイヤー1B: 清流の高域のきらめき（チョロチョロとした水面の質感）
    const sparkleSrc = ctx.createBufferSource();
    sparkleSrc.buffer = whiteBuffer;
    sparkleSrc.loop = true;

    const sparkleBp = ctx.createBiquadFilter();
    sparkleBp.type = 'bandpass';
    sparkleBp.frequency.setValueAtTime(2600, now);
    sparkleBp.Q.setValueAtTime(1.6, now);

    const sparkleGain = ctx.createGain();
    sparkleGain.gain.setValueAtTime(0.11, now);

    const sparkleLfo = ctx.createOscillator();
    sparkleLfo.type = 'sine';
    sparkleLfo.frequency.setValueAtTime(1.9, now);
    const sparkleLfoGain = ctx.createGain();
    sparkleLfoGain.gain.setValueAtTime(0.035, now);

    sparkleLfo.connect(sparkleLfoGain);
    sparkleLfoGain.connect(sparkleGain.gain);

    sparkleSrc.connect(sparkleBp);
    sparkleBp.connect(sparkleGain);
    sparkleGain.connect(this.masterGain!);

    flowSrc.start();
    flowLfo1.start();
    flowLfo2.start();
    sparkleSrc.start();
    sparkleLfo.start();

    this.activeSources.push(flowSrc, flowLfo1, flowLfo2, sparkleSrc, sparkleLfo);
    this.activeNodes.push(
      flowHp,
      flowBp,
      flowGain,
      flowLfo1Gain,
      flowLfo2Gain,
      sparkleBp,
      sparkleGain,
      sparkleLfoGain
    );

    // レイヤー2: 小川特有の気泡・チャプチャプ音（Minnaert 共振によるピッチ上昇パルス）+ 小さな水しぶき
    const bubbleBus = ctx.createGain();
    bubbleBus.gain.setValueAtTime(0.85, now);
    bubbleBus.connect(this.masterGain!);
    this.activeNodes.push(bubbleBus);

    const splashBuffer = this.createBurstNoiseBuffer(ctx, 0.05);

    const triggerBubble = (offsetSec: number = 0) => {
      const start = ctx.currentTime + offsetSec;
      const pan = (Math.random() * 2 - 1) * 0.65;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      // 浅い小川の小さな気泡〜石の間のコロコロ音
      const f0 = 480 + Math.random() * 1250;
      const pitchRatio = 1.25 + Math.random() * 0.4;
      const dur = 0.025 + Math.random() * 0.048;

      osc.frequency.setValueAtTime(f0, start);
      osc.frequency.exponentialRampToValueAtTime(f0 * pitchRatio, start + dur);

      const env = ctx.createGain();
      const peak = 0.022 + Math.random() * 0.042;
      env.gain.setValueAtTime(0.0001, start);
      env.gain.linearRampToValueAtTime(peak, start + 0.004);
      env.gain.exponentialRampToValueAtTime(0.0001, start + dur);

      osc.connect(env);
      this.connectWithPan(ctx, env, bubbleBus, pan);

      osc.start(start);
      osc.stop(start + dur + 0.01);

      // 約35%の確率で石に当たる微細な水しぶきを重ねる
      if (Math.random() < 0.35) {
        const splashSrc = ctx.createBufferSource();
        splashSrc.buffer = splashBuffer;

        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1500 + Math.random() * 2200, start);
        bp.Q.setValueAtTime(2.8, start);

        const sEnv = ctx.createGain();
        const sPeak = 0.02 + Math.random() * 0.035;
        const sDur = 0.014 + Math.random() * 0.022;
        sEnv.gain.setValueAtTime(0.0001, start);
        sEnv.gain.linearRampToValueAtTime(sPeak, start + 0.003);
        sEnv.gain.exponentialRampToValueAtTime(0.0001, start + sDur);

        splashSrc.connect(bp);
        bp.connect(sEnv);
        this.connectWithPan(ctx, sEnv, bubbleBus, pan);

        splashSrc.start(start);
        splashSrc.stop(start + sDur + 0.01);
      }
    };

    const spawnBrookCluster = () => {
      if (!this.isRunning || this.sessionId !== sessionId) return;

      triggerBubble(0);
      // ときどき 2〜3 粒が連続してチャプチャプ鳴るクラスタリング
      if (Math.random() < 0.45) {
        triggerBubble(0.035 + Math.random() * 0.045);
      }
      if (Math.random() < 0.2) {
        triggerBubble(0.08 + Math.random() * 0.06);
      }

      const nextDelay = 55 + Math.random() * 135;
      this.scheduleNext(sessionId, nextDelay, spawnBrookCluster);
    };

    this.scheduleNext(sessionId, 50, spawnBrookCluster);
  }

  /**
   * 🍃 森のそよ風: 低域の唸りを除いた穏やかな空気感 + 木々の葉擦れ（サワサワ感）
   * - 強風に聞こえる低周波成分と過大な音量を抑え、ゆったりと寄せては引く優しいそよぎを再現
   */
  private buildBreezeSound(ctx: AudioContext) {
    const now = ctx.currentTime;
    const bufferA = this.createPinkNoiseBuffer(ctx, 6);
    const bufferB = this.createPinkNoiseBuffer(ctx, 6);

    // レイヤー1: 穏やかな空気の流れ（低域の「ゴーッ」をカット）
    const airSrc = ctx.createBufferSource();
    airSrc.buffer = bufferA;
    airSrc.loop = true;

    const airHp = ctx.createBiquadFilter();
    airHp.type = 'highpass';
    airHp.frequency.setValueAtTime(320, now);
    airHp.Q.setValueAtTime(0.7, now);

    const airLp = ctx.createBiquadFilter();
    airLp.type = 'lowpass';
    airLp.frequency.setValueAtTime(920, now);
    airLp.Q.setValueAtTime(0.6, now);

    const airGain = ctx.createGain();
    airGain.gain.setValueAtTime(0.16, now);

    // 約12.5秒周期でふわっと息づくように音量を揺らす
    const airLfo = ctx.createOscillator();
    airLfo.type = 'sine';
    airLfo.frequency.setValueAtTime(0.08, now);
    const airLfoGain = ctx.createGain();
    airLfoGain.gain.setValueAtTime(0.1, now);

    airLfo.connect(airLfoGain);
    airLfoGain.connect(airGain.gain);

    airSrc.connect(airHp);
    airHp.connect(airLp);
    airLp.connect(airGain);
    airGain.connect(this.masterGain!);

    // レイヤー2: 木々の葉が擦れ合う優しい葉擦れ音（サワサワ感）
    const leafSrc = ctx.createBufferSource();
    leafSrc.buffer = bufferB;
    leafSrc.loop = true;

    const leafBp = ctx.createBiquadFilter();
    leafBp.type = 'bandpass';
    leafBp.frequency.setValueAtTime(2100, now);
    leafBp.Q.setValueAtTime(1.1, now);

    const leafLp = ctx.createBiquadFilter();
    leafLp.type = 'lowpass';
    leafLp.frequency.setValueAtTime(4200, now);

    const leafGain = ctx.createGain();
    leafGain.gain.setValueAtTime(0.11, now);

    // 約9秒周期で葉擦れが静かに寄せては引く
    const leafVolLfo = ctx.createOscillator();
    leafVolLfo.type = 'sine';
    leafVolLfo.frequency.setValueAtTime(0.11, now);
    const leafVolLfoGain = ctx.createGain();
    leafVolLfoGain.gain.setValueAtTime(0.085, now);

    leafVolLfo.connect(leafVolLfoGain);
    leafVolLfoGain.connect(leafGain.gain);

    // 葉擦れの帯域もごく緩やかに揺らして自然な通り抜け感を出す
    const leafFreqLfo = ctx.createOscillator();
    leafFreqLfo.type = 'sine';
    leafFreqLfo.frequency.setValueAtTime(0.06, now);
    const leafFreqLfoGain = ctx.createGain();
    leafFreqLfoGain.gain.setValueAtTime(300, now);

    leafFreqLfo.connect(leafFreqLfoGain);
    leafFreqLfoGain.connect(leafBp.frequency);

    leafSrc.connect(leafBp);
    leafBp.connect(leafLp);
    leafLp.connect(leafGain);
    leafGain.connect(this.masterGain!);

    airSrc.start();
    airLfo.start();
    leafSrc.start();
    leafVolLfo.start();
    leafFreqLfo.start();

    this.activeSources.push(airSrc, airLfo, leafSrc, leafVolLfo, leafFreqLfo);
    this.activeNodes.push(
      airHp,
      airLp,
      airGain,
      airLfoGain,
      leafBp,
      leafLp,
      leafGain,
      leafVolLfoGain,
      leafFreqLfoGain
    );
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

      this.activeSources.push(osc);
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
