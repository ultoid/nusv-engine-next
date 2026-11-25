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

/**
 * Renders a single procedural RPG Maker MZ-style animation frame onto a 2D canvas context.
 */
export function renderAnimationFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  anim: AnimationData,
  progress: number,
  anchor?: AnimationAnchor
): void {
  if (anim.displayType === 0) return;

  const clamped = Math.max(0, Math.min(1, progress));
  const useScreenCenter = anim.displayType === 2 || !anchor;
  const baseX = useScreenCenter ? width / 2 : anchor.x;
  const baseY = useScreenCenter
    ? height / 2
    : anim.alignBottom && anchor.bottomY !== undefined
    ? anchor.bottomY
    : anchor.y;

  const centerX = baseX + (anim.offsetX ?? 0);
  const centerY = baseY + (anim.offsetY ?? 0);
  const scale = Math.max(0.1, (anim.scale ?? 100) / 100);

  const rx = ((anim.rotation?.x ?? 0) * Math.PI) / 180;
  const ry = ((anim.rotation?.y ?? 0) * Math.PI) / 180;
  const rz = ((anim.rotation?.z ?? 0) * Math.PI) / 180;

  // Approximate 3D X/Y tilt via foreshortening while keeping visibility non-zero
  const tiltX = Math.cos(ry) >= 0 ? Math.max(0.25, Math.cos(ry)) : Math.min(-0.25, Math.cos(ry));
  const tiltY = Math.cos(rx) >= 0 ? Math.max(0.25, Math.cos(rx)) : Math.min(-0.25, Math.cos(rx));

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rz);
  ctx.scale(scale * tiltX, scale * tiltY);

  const eff = (anim.effectName || '').toLowerCase();

  if (eff.includes('fire')) {
    drawFireEffect(ctx, clamped);
  } else if (eff.includes('ice')) {
    drawIceEffect(ctx, clamped);
  } else if (eff.includes('thunder')) {
    drawThunderEffect(ctx, clamped);
  } else if (eff.includes('water')) {
    drawWaterEffect(ctx, clamped);
  } else if (eff.includes('earth')) {
    drawEarthEffect(ctx, clamped);
  } else if (eff.includes('wind')) {
    drawWindEffect(ctx, clamped);
  } else if (eff.includes('heal') || eff.includes('cure') || eff.includes('revive')) {
    drawHealEffect(ctx, clamped);
  } else if (eff.includes('light') || eff.includes('holy')) {
    drawLightEffect(ctx, clamped);
  } else if (eff.includes('dark')) {
    drawDarkEffect(ctx, clamped);
  } else if (eff.includes('slash') || eff.includes('sword') || eff.includes('claw')) {
    drawSlashEffect(ctx, clamped, eff.includes('claw'));
  } else if (eff.includes('pierce') || eff.includes('arrow') || eff.includes('shoot') || eff.includes('laser')) {
    drawPierceEffect(ctx, clamped);
  } else if (eff.includes('poison') || eff.includes('sleep') || eff.includes('blind') || eff.includes('silence') || eff.includes('state')) {
    drawStateEffect(ctx, clamped);
  } else {
    drawHitBurstEffect(ctx, clamped);
  }

  ctx.restore();
}

function drawFireEffect(ctx: CanvasRenderingContext2D, p: number) {
  const count = 16;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + p * 2.2;
    const dist = p * 78 * ((i % 3) * 0.45 + 0.65);
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist - p * 44;
    const alpha = Math.max(0, 1 - p);
    ctx.fillStyle = i % 2 === 0 ? `rgba(249, 115, 22, ${alpha})` : `rgba(250, 204, 21, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(2, 16 * (1 - p * 0.55)), 0, Math.PI * 2);
    ctx.fill();
  }
  const coreAlpha = Math.max(0, 1 - p * 1.2);
  ctx.fillStyle = `rgba(254, 240, 138, ${coreAlpha * 0.7})`;
  ctx.beginPath();
  ctx.arc(0, -p * 18, 28 * (1 - p * 0.4), 0, Math.PI * 2);
  ctx.fill();
}

function drawIceEffect(ctx: CanvasRenderingContext2D, p: number) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + 0.3;
    const dist = (i % 2 === 0 ? 1 : 0.6) * p * 82;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;
    const alpha = Math.max(0, 1 - p * 0.9);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(angle + Math.PI / 4);
    ctx.fillStyle = `rgba(186, 230, 253, ${alpha * 0.45})`;
    ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -14);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 14);
    ctx.lineTo(-8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawThunderEffect(ctx: CanvasRenderingContext2D, p: number) {
  const flicker = Math.max(0, Math.sin(p * Math.PI * 5));
  const fade = Math.max(0, 1 - p * 0.85);
  const alpha = Math.min(1, flicker * 0.7 + fade * 0.5);
  ctx.strokeStyle = `rgba(250, 204, 21, ${alpha})`;
  ctx.lineWidth = 4;
  for (let bolt = -1; bolt <= 1; bolt++) {
    const ox = bolt * 24;
    ctx.beginPath();
    ctx.moveTo(ox - 12, -90);
    ctx.lineTo(ox + 14, -35);
    ctx.lineTo(ox - 16, 5);
    ctx.lineTo(ox + 12, 55);
    ctx.lineTo(ox - 4, 85);
    ctx.stroke();
  }
  ctx.strokeStyle = `rgba(254, 249, 195, ${alpha})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, p * 70, 0, Math.PI * 2);
  ctx.stroke();
}

function drawWaterEffect(ctx: CanvasRenderingContext2D, p: number) {
  for (let ring = 0; ring < 3; ring++) {
    const rp = Math.max(0, Math.min(1, p - ring * 0.14));
    if (rp <= 0) continue;
    const alpha = Math.max(0, 1 - rp);
    ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
    ctx.lineWidth = 4 - ring;
    ctx.beginPath();
    ctx.arc(0, 0, rp * 85, 0, Math.PI * 2);
    ctx.stroke();
  }
  const drops = 12;
  for (let i = 0; i < drops; i++) {
    const a = (i / drops) * Math.PI * 2;
    const d = p * 72;
    const alpha = Math.max(0, 1 - p);
    ctx.fillStyle = `rgba(125, 211, 252, ${alpha})`;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEarthEffect(ctx: CanvasRenderingContext2D, p: number) {
  const count = 8;
  for (let i = 0; i < count; i++) {
    const spread = ((i / (count - 1)) - 0.5) * 120;
    const rise = Math.sin(p * Math.PI) * (50 + (i % 3) * 18);
    const alpha = Math.max(0, 1 - p);
    ctx.fillStyle = i % 2 === 0 ? `rgba(180, 83, 9, ${alpha})` : `rgba(217, 119, 6, ${alpha})`;
    ctx.fillRect(spread - 9, 30 - rise, 18, 18);
  }
}

function drawWindEffect(ctx: CanvasRenderingContext2D, p: number) {
  const alpha = Math.max(0, Math.sin(p * Math.PI));
  ctx.strokeStyle = `rgba(110, 231, 183, ${alpha})`;
  ctx.lineWidth = 4;
  for (let i = 0; i < 4; i++) {
    const start = p * Math.PI * 4 + (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.arc(0, 0, 24 + i * 16, start, start + Math.PI * 0.9);
    ctx.stroke();
  }
}

function drawHealEffect(ctx: CanvasRenderingContext2D, p: number) {
  const count = 14;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + p * 2.5;
    const radius = 38 * (1 - p * 0.35);
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius * 0.5 + 35 - p * 95;
    const alpha = Math.max(0, Math.sin(p * Math.PI));
    ctx.fillStyle = i % 2 === 0 ? `rgba(74, 222, 128, ${alpha})` : `rgba(187, 247, 208, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = `rgba(134, 239, 172, ${Math.max(0, 1 - p)})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(0, 32, 54 * p + 10, 18 * p + 6, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLightEffect(ctx: CanvasRenderingContext2D, p: number) {
  const alpha = Math.max(0, Math.sin(p * Math.PI));
  const beamW = 48 * Math.sin(p * Math.PI);
  const grad = ctx.createLinearGradient(0, -100, 0, 90);
  grad.addColorStop(0, `rgba(254, 249, 195, 0)`);
  grad.addColorStop(0.5, `rgba(254, 240, 138, ${alpha * 0.85})`);
  grad.addColorStop(1, `rgba(254, 249, 195, 0)`);
  ctx.fillStyle = grad;
  ctx.fillRect(-beamW / 2, -100, beamW, 190);
  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, p * 75, 0, Math.PI * 2);
  ctx.stroke();
}

function drawDarkEffect(ctx: CanvasRenderingContext2D, p: number) {
  const alpha = Math.max(0, 1 - p * 0.85);
  ctx.fillStyle = `rgba(88, 28, 135, ${alpha * 0.55})`;
  ctx.beginPath();
  ctx.arc(0, 0, 68 * (1 - p * 0.35), 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 - p * 3;
    const d = 75 * (1 - p);
    ctx.fillStyle = `rgba(192, 132, 252, ${alpha})`;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSlashEffect(ctx: CanvasRenderingContext2D, p: number, isClaw: boolean) {
  const alpha = Math.max(0, Math.sin(p * Math.PI));
  const streaks = isClaw ? 3 : 1;
  for (let s = 0; s < streaks; s++) {
    const offset = (s - (streaks - 1) / 2) * 20;
    ctx.strokeStyle = `rgba(248, 250, 252, ${alpha})`;
    ctx.lineWidth = isClaw ? 4 : 7;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const startAngle = -Math.PI * 0.45;
    const endAngle = startAngle + Math.PI * 0.9 * Math.min(1, p * 1.4);
    ctx.arc(offset, offset * 0.5, 68, startAngle, endAngle);
    ctx.stroke();
  }
}

function drawPierceEffect(ctx: CanvasRenderingContext2D, p: number) {
  const alpha = Math.max(0, 1 - p * 0.85);
  const travel = -85 + p * 170;
  ctx.strokeStyle = `rgba(147, 197, 253, ${alpha})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(travel - 45, travel - 45);
  ctx.lineTo(travel + 25, travel + 25);
  ctx.stroke();

  ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, p * 60, 0, Math.PI * 2);
  ctx.stroke();
}

function drawStateEffect(ctx: CanvasRenderingContext2D, p: number) {
  const alpha = Math.max(0, Math.sin(p * Math.PI));
  for (let i = 0; i < 6; i++) {
    const px = Math.sin(p * 6 + i * 1.3) * 32;
    const py = 20 - p * 75 - (i % 3) * 14;
    ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 8, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHitBurstEffect(ctx: CanvasRenderingContext2D, p: number) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + p;
    const dist = p * 72;
    const px = Math.cos(angle) * dist;
    const py = Math.sin(angle) * dist;
    const alpha = Math.max(0, 1 - p);
    ctx.fillStyle = `rgba(224, 231, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = `rgba(147, 197, 253, ${Math.max(0, 1 - p)})`;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, p * 84, 0, Math.PI * 2);
  ctx.stroke();
}

export interface PlayOverlayOptions {
  anchor?: AnimationAnchor;
  targetElement?: HTMLElement | null;
  reducedMotion?: boolean;
  onSound?: (timing: AnimationSoundTiming) => void;
  onFlash?: (timing: AnimationFlashTiming) => void;
}

interface RunningInstance {
  anim: AnimationData;
  totalFrames: number;
  elapsedFrames: number;
  lastTriggeredFrame: number;
  anchor?: AnimationAnchor;
  targetElement?: HTMLElement | null;
  flashes: ActiveFlashState[];
  effekseerHandle?: { exists: boolean; stop(): void } | null;
  onSound?: (timing: AnimationSoundTiming) => void;
  onFlash?: (timing: AnimationFlashTiming) => void;
  resolve: () => void;
}

/**
 * Shared overlay player used by BattleController and WorldScene.
 * Uses Effekseer WebGL (.efkefc) when available and falls back seamlessly to Canvas2D.
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
    const effHandle = await effViewport.playAnimation(anim, this.canvas.width, this.canvas.height, options.anchor);

    return new Promise<void>((resolve) => {
      this.instances.push({
        anim,
        totalFrames,
        elapsedFrames: 0,
        lastTriggeredFrame: 0,
        anchor: options.anchor,
        targetElement: options.targetElement,
        flashes: [],
        effekseerHandle: effHandle,
        onSound: options.onSound,
        onFlash: options.onFlash,
        resolve
      });
      this.ensureLoop();
    });
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

      for (const inst of this.instances) {
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

        const handleAlive = Boolean(inst.effekseerHandle?.exists && inst.elapsedFrames < 300);
        if (inst.effekseerHandle) {
          if (handleAlive) hasEffekseer = true;
        } else if (ctx && inst.elapsedFrames < inst.totalFrames) {
          const progress = Math.min(1, inst.elapsedFrames / inst.totalFrames);
          renderAnimationFrame(ctx, this.canvas.width, this.canvas.height, inst.anim, progress, inst.anchor);
        }

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

        const animActive = inst.effekseerHandle ? handleAlive : inst.elapsedFrames < inst.totalFrames;
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
