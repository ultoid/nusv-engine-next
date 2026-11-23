import 'pixi.js/unsafe-eval';
import { Application } from 'pixi.js';
import type { ProgressState, ProjectBundle } from '../core/types.js';
import { validateBundle } from '../core/validation.js';
import { AudioManager } from './AudioManager.js';
import { WorldScene } from './WorldScene.js';
import { TitleScene } from './TitleScene.js';
import { GameLoop } from './GameLoop.js';
import { InputManager } from './InputManager.js';
import { Logger } from './Logger.js';
import { SceneManager } from './SceneManager.js';
import { TextureManager } from './TextureManager.js';

export class Runtime {
  private app = new Application();
  private input = new InputManager();
  private audio = new AudioManager();
  private textures = new TextureManager();
  private scenes = new SceneManager();
  private loop?: GameLoop;
  private log = new Logger('runtime');

  async boot(raw: unknown, host: HTMLElement) {
    const bundle: ProjectBundle = validateBundle(raw);
    const { width, height } = bundle.project.logicalResolution;
    await this.app.init({
      width,
      height,
      background: 0x0d1720,
      preference: 'webgl',
      antialias: false,
      autoStart: false,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true
    });
    this.app.canvas.setAttribute('aria-label', `Playtest ${bundle.project.title}`);
    host.replaceChildren(this.app.canvas);
    this.scenes.attach(this.app.stage);

    const shouldShowTitle = bundle.project.showTitle === true && !bundle.project.debug;
    if (shouldShowTitle) {
      const startWorld = (savedProgress?: ProgressState) => {
        const worldScene = new WorldScene(bundle, this.audio, this.textures);
        if (savedProgress) {
          (worldScene as unknown as { state: ProgressState }).state = savedProgress;
        }
        void this.scenes.change(worldScene);
      };
      await this.scenes.change(new TitleScene(bundle, this.audio, this.textures, startWorld));
    } else {
      await this.scenes.change(new WorldScene(bundle, this.audio, this.textures));
    }

    this.input.attach();
    window.addEventListener('pointerdown', () => void this.audio.unlock(), { once: true });
    this.loop = new GameLoop(
      delta => {
        this.input.beginFrame();
        this.scenes.update(delta, this.input);
        this.input.endFrame();
      },
      () => this.app.render()
    );
    this.loop.start();
    this.log.info(`boot ${bundle.project.projectId}`);
  }

  destroy() {
    this.loop?.stop();
    this.input.detach();
    void this.audio.close();
    this.app.destroy(true);
  }
}
