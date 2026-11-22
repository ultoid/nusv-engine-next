import type { Container } from 'pixi.js'; import type { InputManager } from './InputManager.js';
export interface Scene { readonly view: Container; enter(): void | Promise<void>; update(deltaSeconds: number, input: InputManager): void; exit(): void; }
export class SceneManager { private current?: Scene; async change(scene: Scene) { this.current?.exit(); this.current = scene; await scene.enter(); } update(delta: number, input: InputManager) { this.current?.update(delta, input); } get view() { return this.current?.view; } }
