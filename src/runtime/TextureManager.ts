import { Rectangle, Texture } from 'pixi.js';
import type { Direction } from '../core/world.js';

export class TextureManager {
  private dataUrlCache = new Map<string, string>();
  private imageCache = new Map<string, HTMLImageElement>();
  private textureCache = new Map<string, Texture>();
  private frameCache = new Map<string, Texture>();
  private faceCropCache = new Map<string, string>();
  private svCropCache = new Map<string, string>();

  async loadDataUrl(path: string): Promise<string | null> {
    if (!path) return null;
    if (this.dataUrlCache.has(path)) return this.dataUrlCache.get(path)!;

    let dataUrl: string | null = null;
    if (typeof window !== 'undefined') {
      if (window.nusvRuntime?.loadAssetData) {
        const res = await window.nusvRuntime.loadAssetData(path);
        if (res?.dataUrl) dataUrl = res.dataUrl;
      } else if (window.nusvEditor?.readAssetData) {
        const res = await window.nusvEditor.readAssetData(path);
        if (res?.dataUrl) dataUrl = res.dataUrl;
      }
    }

    if (!dataUrl && typeof fetch !== 'undefined') {
      try {
        const resp = await fetch(path);
        if (resp.ok) {
          const blob = await resp.blob();
          dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        }
      } catch {
        // Fallback to direct path if fetch fails
      }
    }

    if (dataUrl) {
      this.dataUrlCache.set(path, dataUrl);
    }
    return dataUrl;
  }

  async loadImage(path: string): Promise<HTMLImageElement | null> {
    if (this.imageCache.has(path)) return this.imageCache.get(path)!;
    const dataUrl = await this.loadDataUrl(path);
    if (!dataUrl) return null;

    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(path, img);
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  async getTexture(path: string): Promise<Texture | null> {
    if (this.textureCache.has(path)) return this.textureCache.get(path)!;
    const img = await this.loadImage(path);
    if (!img) return null;

    try {
      const texture = Texture.from(img);
      this.textureCache.set(path, texture);
      return texture;
    } catch {
      return null;
    }
  }

  /**
   * Retrieves a specific walking/facing frame for a character in RPG Maker MZ standard format.
   * Standard sheet: 4x2 characters, 3 frames x 4 directions each (48x48 px frames).
   * Direction: 0: down, 1: left, 2: right, 3: up.
   * Step: 0: step1, 1: idle, 2: step2, 3: idle (pattern: [1, 0, 1, 2][step % 4]).
   */
  async getCharacterFrame(
    path: string,
    characterIndex: number = 0,
    direction: Direction = 'down',
    step: number = 1
  ): Promise<Texture | null> {
    const pattern = [1, 0, 1, 2][Math.abs(step) % 4];
    const cacheKey = `${path}:${characterIndex}:${direction}:${pattern}`;
    if (this.frameCache.has(cacheKey)) return this.frameCache.get(cacheKey)!;

    const baseTexture = await this.getTexture(path);
    if (!baseTexture) return null;

    const isSingle = path.split('/').pop()?.startsWith('$') ?? false;
    let blockWidth = baseTexture.width;
    let blockHeight = baseTexture.height;
    let col = 0;
    let row = 0;

    if (!isSingle) {
      blockWidth = baseTexture.width / 4;
      blockHeight = baseTexture.height / 2;
      col = characterIndex % 4;
      row = Math.floor(characterIndex / 4);
    }

    const frameWidth = blockWidth / 3;
    const frameHeight = blockHeight / 4;
    const dirRow = direction === 'down' ? 0 : direction === 'left' ? 1 : direction === 'right' ? 2 : 3;

    const frameX = col * blockWidth + pattern * frameWidth;
    const frameY = row * blockHeight + dirRow * frameHeight;

    try {
      const frameRect = new Rectangle(frameX, frameY, frameWidth, frameHeight);
      const frameTexture = new Texture({
        source: baseTexture.source,
        frame: frameRect
      });
      this.frameCache.set(cacheKey, frameTexture);
      return frameTexture;
    } catch {
      return null;
    }
  }

  /**
   * Extracts a 144x144 face portrait from a standard 4x2 RPG Maker MZ face sheet.
   */
  async getFaceDataUrl(path: string, faceIndex: number = 0): Promise<string | null> {
    const cacheKey = `${path}:${faceIndex}`;
    if (this.faceCropCache.has(cacheKey)) return this.faceCropCache.get(cacheKey)!;

    const img = await this.loadImage(path);
    if (!img) return null;

    try {
      const col = faceIndex % 4;
      const row = Math.floor(faceIndex / 4);
      const faceW = img.naturalWidth / 4 || 144;
      const faceH = img.naturalHeight / 2 || 144;

      const canvas = document.createElement('canvas');
      canvas.width = faceW;
      canvas.height = faceH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(img, col * faceW, row * faceH, faceW, faceH, 0, 0, faceW, faceH);
      const croppedUrl = canvas.toDataURL('image/png');
      this.faceCropCache.set(cacheKey, croppedUrl);
      return croppedUrl;
    } catch {
      return null;
    }
  }

  /**
   * Extracts a side-view battler frame (default 64x64) from a standard 9x6 RPG Maker MZ sv_actor sheet.
   */
  async getSvBattlerDataUrl(path: string, col = 0, row = 0): Promise<string | null> {
    const cacheKey = `${path}:${col}:${row}`;
    if (this.svCropCache.has(cacheKey)) return this.svCropCache.get(cacheKey)!;

    const img = await this.loadImage(path);
    if (!img) return null;

    try {
      const frameW = Math.floor(img.naturalWidth / 9) || 64;
      const frameH = Math.floor(img.naturalHeight / 6) || 64;

      const canvas = document.createElement('canvas');
      canvas.width = frameW;
      canvas.height = frameH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      ctx.drawImage(img, col * frameW, row * frameH, frameW, frameH, 0, 0, frameW, frameH);
      const croppedUrl = canvas.toDataURL('image/png');
      this.svCropCache.set(cacheKey, croppedUrl);
      return croppedUrl;
    } catch {
      return null;
    }
  }

  /**
   * Extracts a tile texture from a tileset image using exact pixel coordinates.
   */
  async getTileTextureByPixel(path: string, srcX: number, srcY: number, width: number = 48, height: number = width): Promise<Texture | null> {
    const cacheKey = `${path}:${srcX}:${srcY}:${width}:${height}`;
    if (this.frameCache.has(cacheKey)) return this.frameCache.get(cacheKey)!;

    const baseTexture = await this.getTexture(path);
    if (!baseTexture) return null;

    try {
      const frameRect = new Rectangle(srcX, srcY, width, height);
      const tileTexture = new Texture({
        source: baseTexture.source,
        frame: frameRect
      });
      this.frameCache.set(cacheKey, tileTexture);
      return tileTexture;
    } catch {
      return null;
    }
  }

  /**
   * Extracts a tile texture from a tileset image.
   */
  async getTileTexture(path: string, col: number, row: number, tileSize: number = 48): Promise<Texture | null> {
    const cacheKey = `${path}:tile:${col}:${row}:${tileSize}`;
    if (this.frameCache.has(cacheKey)) return this.frameCache.get(cacheKey)!;

    const baseTexture = await this.getTexture(path);
    if (!baseTexture) return null;

    try {
      const frameRect = new Rectangle(col * tileSize, row * tileSize, tileSize, tileSize);
      const tileTexture = new Texture({
        source: baseTexture.source,
        frame: frameRect
      });
      this.frameCache.set(cacheKey, tileTexture);
      return tileTexture;
    } catch {
      return null;
    }
  }
}
