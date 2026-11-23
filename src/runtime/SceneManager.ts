import type { Container } from 'pixi.js';
import type { InputManager } from './InputManager.js';

export interface Scene {
  readonly view: Container;
  enter(): void | Promise<void>;
  update(deltaSeconds: number, input: InputManager): void;
  exit(): void;
}

export class SceneManager {
  private current?: Scene;
  private stage?: Container;

  attach(stage: Container) {
    this.stage = stage;
    if (this.current?.view) {
      this.stage.addChild(this.current.view);
    }
  }

  async change(scene: Scene) {
    if (this.current && this.stage && this.current.view.parent === this.stage) {
      this.stage.removeChild(this.current.view);
    }
    this.current?.exit();
    this.current = scene;
    await scene.enter();
    if (this.stage && !this.stage.children.includes(scene.view)) {
      this.stage.addChild(scene.view);
    }
  }

  update(delta: number, input: InputManager) {
    this.current?.update(delta, input);
  }

  get view() {
    return this.current?.view;
  }
}
