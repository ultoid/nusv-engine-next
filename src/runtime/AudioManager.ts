import type { RuntimeSettings } from '../core/types.js';

export class AudioManager {
  private context?: AudioContext;
  private master?: GainNode;
  private music?: GainNode;
  private sfxGain?: GainNode;
  private oscillator?: OscillatorNode;
  private currentBgmSource?: AudioBufferSourceNode;
  private currentBgmPath?: string;
  private currentBgsSource?: AudioBufferSourceNode;
  private bufferCache = new Map<string, AudioBuffer>();
  private mood: 'calm' | 'danger' | 'boss' | 'silence' = 'calm';
  private settings: Pick<RuntimeSettings, 'masterVolume' | 'musicVolume' | 'sfxVolume'> = {
    masterVolume: 0.8,
    musicVolume: 0.65,
    sfxVolume: 0.8
  };

  async unlock() {
    this.context ??= new AudioContext();
    if (!this.master) {
      this.master = this.context.createGain();
      this.music = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.music.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.context.destination);
      this.applyMix();
      this.startMood();
    }
    if (this.context.state === 'suspended') {
      await this.context.resume();
    }
  }

  private startMood() {
    if (!this.context || !this.music || this.mood === 'silence' || this.currentBgmSource) return;
    this.oscillator?.stop();
    const frequencies = { calm: 110, danger: 146.83, boss: 82.41 };
    this.oscillator = this.context.createOscillator();
    this.oscillator.type = this.mood === 'boss' ? 'sawtooth' : 'sine';
    this.oscillator.frequency.value = frequencies[this.mood];
    this.oscillator.connect(this.music);
    this.oscillator.start();
  }

  private applyMix() {
    if (this.master) this.master.gain.value = this.settings.masterVolume;
    if (this.music) this.music.gain.value = this.settings.musicVolume * 0.4;
    if (this.sfxGain) this.sfxGain.gain.value = this.settings.sfxVolume * 0.6;
  }

  setMix(settings: RuntimeSettings) {
    this.settings = settings;
    this.applyMix();
  }

  setMood(mood: 'calm' | 'danger' | 'boss' | 'silence') {
    if (this.mood === mood) return;
    this.mood = mood;
    this.oscillator?.stop();
    this.oscillator = undefined;
    this.startMood();
  }

  setVolume(value: number) {
    this.settings.masterVolume = Math.max(0, Math.min(1, value));
    this.applyMix();
  }

  // --- Real Audio Playback (RPG Maker MZ standard) ---

  async loadAudioBuffer(path: string): Promise<AudioBuffer | null> {
    if (this.bufferCache.has(path)) {
      return this.bufferCache.get(path)!;
    }
    await this.unlock();
    if (!this.context) return null;

    try {
      let arrayBuffer: ArrayBuffer | null = null;
      if (typeof window !== 'undefined' && window.nusvRuntime?.loadAssetData) {
        const res = await window.nusvRuntime.loadAssetData(path);
        if (res?.buffer) arrayBuffer = res.buffer;
      }
      if (!arrayBuffer && typeof fetch !== 'undefined') {
        const resp = await fetch(path);
        if (resp.ok) arrayBuffer = await resp.arrayBuffer();
      }
      if (!arrayBuffer) return null;

      const decoded = await this.context.decodeAudioData(arrayBuffer.slice(0));
      this.bufferCache.set(path, decoded);
      return decoded;
    } catch {
      return null;
    }
  }

  async playBgm(path: string, options?: { loop?: boolean; volume?: number }) {
    if (!path) {
      this.stopBgm();
      return;
    }
    if (this.currentBgmPath === path && this.currentBgmSource) {
      return;
    }
    this.stopBgm();
    this.currentBgmPath = path;

    this.oscillator?.stop();
    this.oscillator = undefined;

    const buffer = await this.loadAudioBuffer(path);
    if (!buffer || !this.context || !this.music) {
      this.startMood();
      return;
    }

    try {
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = options?.loop !== false;
      source.connect(this.music);
      source.start(0);
      this.currentBgmSource = source;
    } catch {
      this.startMood();
    }
  }

  stopBgm() {
    if (this.currentBgmSource) {
      try {
        this.currentBgmSource.stop();
        this.currentBgmSource.disconnect();
      } catch {}
      this.currentBgmSource = undefined;
    }
    this.currentBgmPath = undefined;
  }

  async playSe(path: string, _options?: { volume?: number }) {
    if (!path) return;
    await this.unlock();
    if (!this.context || !this.sfxGain) return;

    const buffer = await this.loadAudioBuffer(path);
    if (buffer) {
      try {
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.connect(this.sfxGain);
        source.start(0);
        return;
      } catch {}
    }

    // Mini synth feedback tone if buffer not ready
    try {
      const osc = this.context.createOscillator();
      const g = this.context.createGain();
      osc.frequency.setValueAtTime(520, this.context.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, this.context.currentTime + 0.06);
      g.gain.setValueAtTime(0.15, this.context.currentTime);
      g.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.06);
      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start();
      osc.stop(this.context.currentTime + 0.06);
    } catch {}
  }

  stopSe() {
    // SE is fire-and-forget in WebAudio, reset handled gracefully
  }

  async playMe(path: string, _options?: { volume?: number }) {
    if (!path) return;
    await this.unlock();
    if (!this.context || !this.music) return;
    const buffer = await this.loadAudioBuffer(path);
    if (!buffer) return;
    try {
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = false;
      source.connect(this.music);
      source.start(0);
    } catch {}
  }

  async playBgs(path: string, _options?: { volume?: number }) {
    if (!path) {
      this.stopBgs();
      return;
    }
    await this.unlock();
    if (!this.context || !this.sfxGain) return;
    const buffer = await this.loadAudioBuffer(path);
    if (!buffer) return;
    this.stopBgs();
    try {
      const source = this.context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(this.sfxGain);
      source.start(0);
      this.currentBgsSource = source;
    } catch {}
  }

  stopBgs() {
    if (this.currentBgsSource) {
      try {
        this.currentBgsSource.stop();
        this.currentBgsSource.disconnect();
      } catch {}
      this.currentBgsSource = undefined;
    }
  }

  async fadeoutBgs(seconds: number) {
    if (this.currentBgsSource && this.context) {
      setTimeout(() => this.stopBgs(), Math.max(10, seconds * 1000));
    }
  }

  close() {
    this.stopBgm();
    this.oscillator?.stop();
    return this.context?.close();
  }
}
