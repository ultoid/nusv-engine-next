import type { AnimationData } from '../core/types.js';
import type { AnimationAnchor } from './AnimationPlayer.js';

interface EffekseerHandleLike {
  exists: boolean;
  stop(): void;
  setLocation(x: number, y: number, z: number): void;
  setRotation(x: number, y: number, z: number): void;
  setScale(x: number, y: number, z: number): void;
  setSpeed(speed: number): void;
}

interface EffekseerEffectLike {
  isLoaded?: boolean;
}

interface EffekseerContextLike {
  init(webglContext: WebGLRenderingContext, settings?: Record<string, unknown>): void;
  update(deltaFrames?: number): void;
  draw(): void;
  setProjectionPerspective(fov: number, aspect: number, near: number, far: number): void;
  setCameraLookAt(
    px: number, py: number, pz: number,
    tx: number, ty: number, tz: number,
    ux: number, uy: number, uz: number
  ): void;
  loadEffect(
    data: string | ArrayBuffer,
    scale?: number,
    onload?: () => void,
    onerror?: (reason: string, path: string) => void
  ): EffekseerEffectLike;
  releaseEffect(effect: EffekseerEffectLike): void;
  play(effect: EffekseerEffectLike, x: number, y: number, z: number): EffekseerHandleLike | null;
  stopAll(): void;
  setResourceLoader(
    loader: (path: string, onload?: (res: unknown) => void, onerror?: (reason: string, path: string) => void) => void
  ): void;
}

interface EffekseerGlobal {
  initRuntime(path: string, onload: () => void, onerror: () => void): void;
  createContext(): EffekseerContextLike | null;
  releaseContext(context: EffekseerContextLike): void;
}

interface AssetReadPayload {
  dataUrl?: string;
  buffer?: ArrayBuffer;
}

let runtimeReadyPromise: Promise<boolean> | null = null;

function getEffekseerGlobal(): EffekseerGlobal | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as unknown as { effekseer?: EffekseerGlobal }).effekseer;
}

export async function readProjectAssetViaIpc(relativePath: string): Promise<AssetReadPayload | null> {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    nusvRuntime?: { loadAssetData?: (p: string) => Promise<AssetReadPayload | null> };
    nusvEditor?: { readAssetData?: (p: string) => Promise<AssetReadPayload | null> };
  };
  if (win.nusvRuntime?.loadAssetData) {
    return win.nusvRuntime.loadAssetData(relativePath);
  }
  if (win.nusvEditor?.readAssetData) {
    return win.nusvEditor.readAssetData(relativePath);
  }
  return null;
}

export function ensureEffekseerRuntime(wasmPath = './effekseer.wasm'): Promise<boolean> {
  if (runtimeReadyPromise) return runtimeReadyPromise;
  const eff = getEffekseerGlobal();
  if (!eff) {
    runtimeReadyPromise = Promise.resolve(false);
    return runtimeReadyPromise;
  }
  runtimeReadyPromise = new Promise<boolean>((resolve) => {
    try {
      eff.initRuntime(
        wasmPath,
        () => resolve(true),
        () => resolve(false)
      );
    } catch {
      resolve(false);
    }
  });
  return runtimeReadyPromise;
}

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'webp']);

function normalizeEffectResourceCandidates(rawPath: string): string[] {
  const clean = rawPath.split('?')[0].replaceAll('\\', '/').replace(/^\.\//, '').replace(/^\/+/, '');
  const candidates = new Set<string>();
  if (clean.startsWith('assets/')) {
    candidates.add(clean);
  } else {
    candidates.add(`assets/effects/${clean}`);
    const base = clean.split('/').pop();
    if (base) {
      candidates.add(`assets/effects/Texture/${base}`);
      candidates.add(`assets/effects/Model/${base}`);
    }
  }
  return Array.from(candidates);
}

/**
 * Manages an Effekseer WebGL context bound to a transparent <canvas>,
 * loading .efkefc and dependent Texture/Model resources via Electron IPC.
 */
export class EffekseerViewport {
  private gl: WebGLRenderingContext | null = null;
  private context: EffekseerContextLike | null = null;
  private initPromise: Promise<boolean> | null = null;
  private effectCache = new Map<string, Promise<EffekseerEffectLike | null>>();
  private loadedEffects: EffekseerEffectLike[] = [];
  private disposed = false;

  constructor(private canvas: HTMLCanvasElement) {}

  async init(): Promise<boolean> {
    if (this.disposed) return false;
    if (this.context && this.gl) return true;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      const runtimeOk = await ensureEffekseerRuntime();
      if (!runtimeOk || this.disposed) return false;

      const eff = getEffekseerGlobal();
      if (!eff) return false;

      const gl = (
        this.canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false }) ||
        this.canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
      ) as WebGLRenderingContext | null;
      if (!gl) return false;

      const ctx = eff.createContext();
      if (!ctx) return false;

      ctx.init(gl, { instanceMaxCount: 2000, squareMaxCount: 8000 });
      ctx.setResourceLoader((rawPath, onload, onerror) => {
        void (async () => {
          const candidates = normalizeEffectResourceCandidates(rawPath);
          let payload: AssetReadPayload | null = null;
          let matchedPath = candidates[0];
          for (const candidate of candidates) {
            const res = await readProjectAssetViaIpc(candidate);
            if (res && (res.buffer || res.dataUrl)) {
              payload = res;
              matchedPath = candidate;
              break;
            }
          }
          if (!payload) {
            onerror?.('not found', rawPath);
            return;
          }
          const ext = matchedPath.split('.').pop()?.toLowerCase() ?? '';
          if (IMAGE_EXTS.has(ext) && payload.dataUrl) {
            const img = new Image();
            img.onload = () => onload?.(img);
            img.onerror = () => onerror?.('image decode failed', rawPath);
            img.src = payload.dataUrl;
            return;
          }
          if (payload.buffer) {
            onload?.(payload.buffer);
            return;
          }
          onerror?.('missing buffer', rawPath);
        })();
      });

      this.gl = gl;
      this.context = ctx;
      return true;
    })();

    return this.initPromise;
  }

  async loadEffect(effectName: string): Promise<EffekseerEffectLike | null> {
    const cleanName = effectName.trim().replace(/\.efkefc$/i, '');
    if (!cleanName) return null;

    const cached = this.effectCache.get(cleanName);
    if (cached) return cached;

    const promise = (async () => {
      const ok = await this.init();
      if (!ok || !this.context || this.disposed) return null;

      const payload = await readProjectAssetViaIpc(`assets/effects/${cleanName}.efkefc`);
      if (!payload?.buffer || this.disposed) return null;

      return await new Promise<EffekseerEffectLike | null>((resolve) => {
        if (!this.context) {
          resolve(null);
          return;
        }
        let settled = false;
        const done = (value: EffekseerEffectLike | null) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };

        const effect = this.context.loadEffect(
          payload.buffer!,
          1.0,
          () => {
            this.loadedEffects.push(effect);
            done(effect);
          },
          () => done(null)
        );
        // Safety timeout in case a malformed .efkefc stalls resource loading
        setTimeout(() => done(null), 5000);
      });
    })();

    this.effectCache.set(cleanName, promise);
    const result = await promise;
    if (!result) {
      // Do not keep broken promises if project changes later, but avoid hammering missing files
      this.effectCache.set(cleanName, Promise.resolve(null));
    }
    return result;
  }

  async playAnimation(
    anim: AnimationData,
    width: number,
    height: number,
    anchor?: AnimationAnchor,
    mirror?: boolean
  ): Promise<EffekseerHandleLike | null> {
    if (anim.displayType === 0 || !anim.effectName) return null;
    const effect = await this.loadEffect(anim.effectName);
    if (!effect || !this.context || this.disposed) return null;

    const fov = 30;
    const camDist = 20;
    const worldH = 2 * camDist * Math.tan(((fov * Math.PI) / 180) / 2);
    const worldW = worldH * (width / Math.max(1, height));

    const useScreenCenter = anim.displayType === 2 || !anchor;
    const baseX = useScreenCenter ? width / 2 : anchor.x;
    const baseY = useScreenCenter
      ? height / 2
      : anim.alignBottom && anchor.bottomY !== undefined
      ? anchor.bottomY
      : anchor.y;

    const px = baseX + (anim.offsetX ?? 0);
    const py = baseY + (anim.offsetY ?? 0);
    const wx = (px / Math.max(1, width) - 0.5) * worldW;
    const wy = (0.5 - py / Math.max(1, height)) * worldH;

    const handle = this.context.play(effect, wx, wy, 0);
    if (!handle) return null;

    const scale = Math.max(0.1, (anim.scale ?? 100) / 100);
    handle.setScale(mirror ? -scale : scale, scale, scale);

    const rx = ((anim.rotation?.x ?? 0) * Math.PI) / 180;
    const ry = ((anim.rotation?.y ?? 0) * Math.PI) / 180;
    const rz = ((anim.rotation?.z ?? 0) * Math.PI) / 180;
    handle.setRotation(rx, ry, rz);

    const speed = Math.max(0.1, (anim.speed ?? 100) / 100);
    handle.setSpeed(speed);

    return handle;
  }

  updateAndDraw(deltaFrames: number, width: number, height: number): void {
    if (!this.context || !this.gl || this.disposed) return;

    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }

    this.gl.viewport(0, 0, w, h);
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    this.context.setProjectionPerspective(30, w / Math.max(1, h), 1, 2000);
    this.context.setCameraLookAt(0, 0, 20, 0, 0, 0, 0, 1, 0);
    this.context.update(deltaFrames);
    this.context.draw();
  }

  clear(): void {
    if (this.context) {
      this.context.stopAll();
    }
    if (this.gl) {
      this.gl.clearColor(0, 0, 0, 0);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
  }

  destroy(): void {
    this.disposed = true;
    const eff = getEffekseerGlobal();
    if (this.context) {
      this.context.stopAll();
      for (const effect of this.loadedEffects) {
        try {
          this.context.releaseEffect(effect);
        } catch {}
      }
      this.loadedEffects = [];
      try {
        eff?.releaseContext(this.context);
      } catch {}
      this.context = null;
    }
    this.gl = null;
    this.effectCache.clear();
  }
}
