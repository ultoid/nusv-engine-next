import { Container } from 'pixi.js';
import type { ProgressState, ProjectBundle } from '../core/types.js';
import type { AudioManager } from './AudioManager.js';
import type { InputManager } from './InputManager.js';
import type { Scene } from './SceneManager.js';
import type { TextureManager } from './TextureManager.js';

export class TitleScene implements Scene {
  readonly view = new Container();
  private root = document.createElement('div');
  private activeIndex = 0;
  private menuButtons: HTMLButtonElement[] = [];

  constructor(
    private readonly bundle: ProjectBundle,
    private readonly audio: AudioManager,
    private readonly textures: TextureManager,
    private readonly onStart: (savedState?: ProgressState) => void
  ) {
    this.root.className = 'title-overlay';
  }

  async enter() {
    this.root.replaceChildren();

    const titleImg1 = (this.bundle.project as Record<string, unknown>).titleImage as string | undefined || 'assets/titles1/Ruins.png';
    const titleImg2 = (this.bundle.project as Record<string, unknown>).titleImage2 as string | undefined || 'assets/titles2/Medieval.png';
    const titleBgm = (this.bundle.project as Record<string, unknown>).titleBgm as string | undefined || 'assets/audio/bgm/Theme1.ogg';

    void this.textures.loadDataUrl(titleImg1).then(url => {
      if (url) this.root.style.backgroundImage = `url("${url}")`;
    });

    if (titleImg2) {
      const b2 = document.createElement('div');
      b2.className = 'title-backdrop2';
      void this.textures.loadDataUrl(titleImg2).then(url => {
        if (url) b2.style.backgroundImage = `url("${url}")`;
      });
      this.root.append(b2);
    }

    const frame = document.createElement('div');
    frame.className = 'title-frame';

    const heading = document.createElement('h1');
    heading.className = 'title-heading';
    heading.textContent = this.bundle.project.title;

    const menu = document.createElement('div');
    menu.className = 'title-menu';

    const btnNew = document.createElement('button');
    btnNew.textContent = 'Mulai Baru';
    btnNew.onclick = () => {
      void this.audio.playSe('assets/audio/se/Decision1.ogg');
      this.exit();
      this.onStart();
    };

    const btnContinue = document.createElement('button');
    btnContinue.textContent = 'Lanjutkan';
    btnContinue.onclick = async () => {
      try {
        const saved = await window.nusvRuntime?.loadProgress();
        if (saved) {
          void this.audio.playSe('assets/audio/se/Decision1.ogg');
          this.exit();
          this.onStart(saved);
        } else {
          void this.audio.playSe('assets/audio/se/Buzzer1.ogg');
        }
      } catch {
        void this.audio.playSe('assets/audio/se/Buzzer1.ogg');
      }
    };

    this.menuButtons = [btnNew, btnContinue];
    this.updateActiveButton();

    menu.append(btnNew, btnContinue);
    frame.append(heading, menu);
    this.root.append(frame);
    document.body.append(this.root);

    if (titleBgm) {
      void this.audio.playBgm(titleBgm);
    }
  }

  private updateActiveButton() {
    this.menuButtons.forEach((btn, idx) => {
      if (idx === this.activeIndex) btn.classList.add('active');
      else btn.classList.remove('active');
    });
  }

  update(_delta: number, input: InputManager) {
    if (input.wasPressed('move.up')) {
      this.activeIndex = (this.activeIndex - 1 + this.menuButtons.length) % this.menuButtons.length;
      void this.audio.playSe('assets/audio/se/Cursor1.ogg');
      this.updateActiveButton();
    } else if (input.wasPressed('move.down')) {
      this.activeIndex = (this.activeIndex + 1) % this.menuButtons.length;
      void this.audio.playSe('assets/audio/se/Cursor1.ogg');
      this.updateActiveButton();
    } else if (input.wasPressed('confirm')) {
      this.menuButtons[this.activeIndex]?.click();
    }
  }

  exit() {
    this.root.remove();
  }
}
