import { collectAnimationFrameEvents, computeAnimationDurationFrames } from '../core/animations.js';
import type { AnimationData, AnimationFlashTiming, AnimationSoundTiming } from '../core/types.js';
import type { AudioManager } from './AudioManager.js';
import { EffekseerViewport } from './EffekseerBackend.js';

export interface AnimationAnchor {
  x: number;
  y: number;
  bottomY?: number;
}

export interface ActiveFlashState {
  color: [number, number, number, number];
  target: number; // 0: Target, 1: Screen, 2: Hide Target
  remainingFrames: number;
  totalFrames: number;
}

// Paritas MZ: tidak ada fallback prosedural Canvas2D.
// Jika .efkefc tidak ada / gagal load, player tetap memainkan
// soundTimings + flashTimings selama totalFrames lalu resolve.
// Mirror dilakukan via Effekseer handle.setScale(-sx, sy, sz), bukan DOM transform.

/** @deprecated Paritas MZ: no-op. Efek hanya dari .efkefc via Effekseer. */
export function renderAnimationFrame(
  _ctx: CanvasRenderingContext2D,
  _width: number,
  _height: number,
  _anim: AnimationData,
  _progress: number,
  _anchor?: AnimationAnchor,
  _mirror?: boolean
): void {
  return;
}

export interface PlayOverlayOptions {
  anchor?: AnimationAnchor;
  targetElement?: HTMLElement | null;
  reducedMotion?: boolean;
  onSound?: (timing: AnimationSoundTiming) => void;
  onFlash?: (timing: AnimationFlashTiming) => void;
  mirror?: boolean;
  delayFrames?: number;
  priority?: number;
  waitForPrevious?: boolean;
}

interface RunningInstance {
  anim: AnimationData;
  totalFrames: number;
  elapsedFrames: number;
  delayFrames: number;
  priority: number;
  waitForPrevious: boolean;
  started: boolean;
  lastTriggeredFrame: number;
  anchor?: AnimationAnchor;
  targetElement?: HTMLElement | null;
  flashes: ActiveFlashState[];
  effekseerHandle?: { exists: boolean; stop(): void } | null;
  effViewport?: EffekseerViewport;
  mirror: boolean;
  effectStarted: boolean;
  effectPending: boolean;
  onSound?: (timing: AnimationSoundTiming) => void;
  onFlash?: (timing: AnimationFlashTiming) => void;
  resolve: () => void;
}

/**
 * Shared overlay player used by BattleController and WorldScene.
 * Effekseer WebGL (.efkefc) only — paritas MZ. Tanpa fallback prosedural.
 */
export class AnimationOverlayPlayer {
  private instances: RunningInstance[] = [];
  private rafId: number | null = null;
  private lastTimestamp = 0;
  private glCanvas?: HTMLCanvasElement;
  private effekseer?: EffekseerViewport;

  constructor(
    private canvas: HTMLCanvasElement,
    private audio?: AudioManager
  ) {}

  private ensureEffekseer(): EffekseerViewport {
    if (!this.glCanvas) {
      this.glCanvas = document.createElement('canvas');
      this.glCanvas.className = this.canvas.className;
      this.glCanvas.style.pointerEvents = 'none';
      if (this.canvas.parentElement) {
        this.canvas.parentElement.insertBefore(this.glCanvas, this.canvas);
      }
      this.effekseer = new EffekseerViewport(this.glCanvas);
    }
    return this.effekseer!;
  }

  async play(anim: AnimationData, options: PlayOverlayOptions = {}): Promise<void> {
    const totalFrames = computeAnimationDurationFrames(anim);

    if (options.reducedMotion) {
      for (const st of anim.soundTimings ?? []) {
        if (options.onSound) options.onSound(st);
        else if (this.audio) {
          void this.audio.playSeByName(st.se.name, {
            volume: (st.se.volume ?? 90) / 100,
            pitch: st.se.pitch,
            pan: st.se.pan
          });
        }
      }
      return;
    }

    this.syncCanvasSize();
    const effViewport = this.ensureEffekseer();
    const mirror = options.mirror === true;

    const delayRaw = Number(options.delayFrames ?? 0);
    const delayFrames = Number.isFinite(delayRaw) ? Math.max(0, Math.floor(delayRaw)) : 0;
    const priorityRaw = Number(options.priority ?? 0);
    const priority = Number.isFinite(priorityRaw) ? Math.floor(priorityRaw) : 0;
    // MZ: mirror sudah diterapkan di Effekseer handle (setScale -sx). Jangan mirror DOM.

    return new Promise<void>((resolve) => {
      const wrappedResolve = () => {
        resolve();
      };
      this.instances.push({
        anim,
        totalFrames,
        elapsedFrames: 0,
        delayFrames,
        priority,
        waitForPrevious: options.waitForPrevious === true,
        started: delayFrames <= 0,
        lastTriggeredFrame: 0,
        anchor: options.anchor,
        targetElement: options.targetElement,
        flashes: [],
        effekseerHandle: null,
        effViewport,
        mirror,
        effectStarted: false,
        effectPending: false,
        onSound: options.onSound,
        onFlash: options.onFlash,
        resolve: wrappedResolve
      });
      this.instances.sort((a, b) => a.priority - b.priority);
      this.ensureLoop();
    });
  }

  async playMany(
    requests: Array<{ anim: AnimationData; options?: PlayOverlayOptions }>
  ): Promise<void> {
    await Promise.all(requests.map((req) => this.play(req.anim, req.options)));
  }

  private ensureLoop() {
    if (this.rafId !== null) return;
    this.lastTimestamp = performance.now();
    const tick = (now: number) => {
      const dtMs = Math.min(50, Math.max(1, now - this.lastTimestamp));
      this.lastTimestamp = now;
      const dtFrames = dtMs / (1000 / 60);

      this.syncCanvasSize();
      const ctx = this.canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }

      let hasEffekseer = false;
      const remaining: RunningInstance[] = [];
      this.instances.sort((a, b) => a.priority - b.priority);

      for (let instIdx = 0; instIdx < this.instances.length; instIdx++) {
        const inst = this.instances[instIdx];
        if (inst.waitForPrevious) {
          const hasActivePredecessor = remaining.some((prev) => !prev.waitForPrevious);
          if (hasActivePredecessor) {
            remaining.push(inst);
            continue;
          }
        }
        if (!inst.started) {
          inst.delayFrames -= dtFrames;
          if (inst.delayFrames > 0) {
            remaining.push(inst);
            continue;
          }
          inst.started = true;
          inst.delayFrames = 0;
        }
        // Efek baru dibuat setelah jeda selesai: creating it during the delay
        // window would let clear()/stopAll() kill it before it is ever drawn.
        if (inst.started && !inst.effectStarted && inst.effViewport) {
          inst.effectStarted = true;
          inst.effectPending = true;
          const viewport = inst.effViewport;
          const effectAnim = inst.anim;
          const effectMirror = inst.mirror;
          const effectAnchor = inst.anchor;
          const effectWidth = this.canvas.width;
          const effectHeight = this.canvas.height;
          void (async () => {
            const handle = await viewport.playAnimation(
              effectAnim,
              effectWidth,
              effectHeight,
              effectAnchor,
              effectMirror
            );
            inst.effekseerHandle = handle;
            inst.effectPending = false;
          })();
        }
        inst.elapsedFrames += dtFrames;
        const currentIntFrame = Math.min(inst.totalFrames, Math.max(1, Math.floor(inst.elapsedFrames) + 1));

        while (inst.lastTriggeredFrame < currentIntFrame) {
          inst.lastTriggeredFrame++;
          const { sounds, flashes } = collectAnimationFrameEvents(inst.anim, inst.lastTriggeredFrame);
          for (const st of sounds) {
            if (inst.onSound) inst.onSound(st);
            else if (this.audio) {
              void this.audio.playSeByName(st.se.name, {
                volume: (st.se.volume ?? 90) / 100,
                pitch: st.se.pitch,
                pan: st.se.pan
              });
            }
          }
          for (const ft of flashes) {
            inst.onFlash?.(ft);
            inst.flashes.push({
              color: ft.color ?? [255, 255, 255, 255],
              target: ft.target ?? 0,
              remainingFrames: ft.duration || 1,
              totalFrames: ft.duration || 1
            });
          }
        }

        const handleAlive = Boolean(inst.effekseerHandle?.exists);
        if (inst.effekseerHandle) {
          if (handleAlive) hasEffekseer = true;
        }
        // Effek yang masih dimuat: jangan anggap sudah selesai dan jangan clear().
        if (inst.effectPending) hasEffekseer = true;
        // Tanpa .efkefc: tidak ada gambar (paritas MZ). Timing SE/flash tetap jalan.

        // Update flash states (target tint / screen flash / hide target)
        let hideTarget = false;
        let targetFlashAlpha = 0;
        const activeFlashes: ActiveFlashState[] = [];

        for (const fl of inst.flashes) {
          fl.remainingFrames -= dtFrames;
          if (fl.remainingFrames <= 0) continue;
          activeFlashes.push(fl);
          const ratio = Math.max(0, fl.remainingFrames / fl.totalFrames);
          if (fl.target === 2) {
            hideTarget = true;
          } else if (fl.target === 1 && ctx) {
            const [r, g, b, a] = fl.color;
            ctx.save();
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(a / 255) * ratio * 0.65})`;
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.restore();
          } else {
            targetFlashAlpha = Math.max(targetFlashAlpha, ratio);
          }
        }
        inst.flashes = activeFlashes;

        if (inst.targetElement) {
          if (hideTarget) {
            inst.targetElement.style.opacity = '0';
          } else {
            inst.targetElement.style.opacity = '';
          }
          if (targetFlashAlpha > 0) {
            inst.targetElement.style.filter = `brightness(${1 + targetFlashAlpha * 1.4})`;
          } else {
            inst.targetElement.style.filter = '';
          }
        }

        const animActive = inst.effectPending
          ? true
          : inst.effekseerHandle
          ? handleAlive
          : inst.elapsedFrames < inst.totalFrames;
        if (animActive || inst.flashes.length > 0) {
          remaining.push(inst);
        } else {
          if (inst.targetElement) {
            inst.targetElement.style.opacity = '';
            inst.targetElement.style.filter = '';
          }
          inst.resolve();
        }
      }

      if (hasEffekseer && this.effekseer) {
        this.effekseer.updateAndDraw(dtFrames, this.canvas.width, this.canvas.height);
      } else {
        this.effekseer?.clear();
      }

      this.instances = remaining;
      if (this.instances.length > 0) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.effekseer?.clear();
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private syncCanvasSize() {
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width || this.canvas.width));
    const h = Math.max(1, Math.round(rect.height || this.canvas.height));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    if (this.glCanvas && (this.glCanvas.width !== w || this.glCanvas.height !== h)) {
      this.glCanvas.width = w;
      this.glCanvas.height = h;
    }
  }

  destroy() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    for (const inst of this.instances) {
      if (inst.targetElement) {
        inst.targetElement.style.opacity = '';
        inst.targetElement.style.filter = '';
      }
      inst.resolve();
    }
    this.instances = [];
    this.effekseer?.destroy();
    this.glCanvas?.remove();
    this.glCanvas = undefined;
    this.effekseer = undefined;
  }
}
