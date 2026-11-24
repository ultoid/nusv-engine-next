export interface ShowTextOptions {
  speakerName?: string;
  faceName?: string;
  faceIndex?: number;
  faceUrl?: string;
  background?: number; // 0: Window, 1: Dim, 2: Transparent
  positionType?: number; // 0: Top, 1: Middle, 2: Bottom
}

export class DialogueController {
  private box = document.createElement('section');

  constructor() {
    this.box.className = 'dialogue';
    document.body.append(this.box);
  }

  showText(text: string, options?: ShowTextOptions) {
    return new Promise<void>(resolve => {
      this.box.replaceChildren();

      // Reset & apply positioning and background styling
      this.box.className = 'dialogue';
      if (options?.positionType === 0) {
        this.box.classList.add('pos-top');
      } else if (options?.positionType === 1) {
        this.box.classList.add('pos-middle');
      } else {
        this.box.classList.add('pos-bottom');
      }

      if (options?.background === 1) {
        this.box.classList.add('bg-dim');
      } else if (options?.background === 2) {
        this.box.classList.add('bg-transparent');
      } else {
        this.box.classList.add('bg-window');
      }

      // Speaker Name box (RPG Maker MZ style name tag above the window)
      if (options?.speakerName) {
        const nameBox = document.createElement('div');
        nameBox.className = 'dialogue-name-box';
        const nameSpan = document.createElement('span');
        nameSpan.textContent = options.speakerName;
        nameBox.append(nameSpan);
        this.box.append(nameBox);
      }

      // Main inner content layout
      const inner = document.createElement('div');
      inner.className = 'dialogue-inner';

      // Face graphic portrait
      if (options?.faceUrl) {
        const faceContainer = document.createElement('div');
        faceContainer.className = 'dialogue-face-frame';
        const faceImg = document.createElement('img');
        faceImg.src = options.faceUrl;
        faceImg.alt = options.speakerName || 'Face';
        faceImg.className = 'dialogue-face-image';
        faceContainer.append(faceImg);
        inner.append(faceContainer);
      }

      // Text body
      const body = document.createElement('div');
      body.className = 'dialogue-body';
      const paragraph = document.createElement('p');
      paragraph.className = 'dialogue-text';
      paragraph.textContent = text;
      body.append(paragraph);
      inner.append(body);

      // Next / Advance button
      const button = document.createElement('button');
      button.className = 'dialogue-next-btn';
      button.textContent = '▼';
      button.title = 'Lanjut (Enter / Space)';

      const done = (event?: KeyboardEvent) => {
        if (event && !['Enter', 'Space', 'KeyZ', 'KeyX'].includes(event.code)) return;
        if (event) {
          event.preventDefault();
          event.stopImmediatePropagation();
        }
        window.removeEventListener('keydown', done, true);
        this.box.classList.remove('open');
        resolve();
      };

      button.onclick = () => done();
      this.box.append(inner, button);
      this.box.classList.add('open');
      window.addEventListener('keydown', done, true);
    });
  }

  choose(prompt: string, choices: string[]) {
    return new Promise<number>(resolve => {
      let selected = 0;
      this.box.replaceChildren();
      this.box.className = 'dialogue pos-bottom bg-window';
      const title = document.createElement('p');
      title.textContent = prompt;
      const list = document.createElement('div');
      list.className = 'dialogue-choices';
      this.box.append(title, list);

      const draw = () => {
        list.replaceChildren(
          ...choices.map((choice, index) => {
            const button = document.createElement('button');
            button.textContent = `${index === selected ? '› ' : ''}${choice}`;
            button.onclick = () => finish(index);
            return button;
          })
        );
      };

      const finish = (index: number) => {
        window.removeEventListener('keydown', key, true);
        this.box.classList.remove('open');
        resolve(index);
      };

      const key = (event: KeyboardEvent) => {
        if (event.code === 'ArrowUp') selected = (selected + choices.length - 1) % choices.length;
        else if (event.code === 'ArrowDown') selected = (selected + 1) % choices.length;
        else if (['Enter', 'Space', 'KeyZ'].includes(event.code)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          return finish(selected);
        } else return;
        event.preventDefault();
        event.stopImmediatePropagation();
        draw();
      };

      window.addEventListener('keydown', key, true);
      this.box.classList.add('open');
      draw();
    });
  }

  toast(text: string) {
    this.box.replaceChildren();
    this.box.className = 'dialogue toast';
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    this.box.append(paragraph);
    this.box.classList.add('open');
    setTimeout(() => this.box.classList.remove('open'), 1200);
  }

  inputNumber(digits: number = 4, initialValue: number = 0): Promise<number> {
    return new Promise<number>(resolve => {
      this.box.replaceChildren();
      this.box.className = 'dialogue pos-middle bg-window open';
      
      const container = document.createElement('div');
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '12px';
      container.style.alignItems = 'center';
      
      const label = document.createElement('p');
      label.textContent = 'Masukkan Angka (Input Number):';
      label.style.fontWeight = 'bold';
      
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'mz-input';
      input.value = String(initialValue);
      input.max = String(Math.pow(10, digits) - 1);
      input.min = '0';
      input.style.fontSize = '24px';
      input.style.textAlign = 'center';
      input.style.width = '180px';
      input.style.letterSpacing = '4px';

      const btn = document.createElement('button');
      btn.textContent = 'OK (Enter)';
      btn.style.padding = '6px 20px';

      const finish = () => {
        window.removeEventListener('keydown', onKey, true);
        this.box.classList.remove('open');
        resolve(Number(input.value) || 0);
      };

      const onKey = (e: KeyboardEvent) => {
        if (e.code === 'Enter') {
          e.preventDefault();
          finish();
        }
      };

      btn.onclick = finish;
      container.append(label, input, btn);
      this.box.append(container);
      window.addEventListener('keydown', onKey, true);
      setTimeout(() => input.focus(), 50);
    });
  }

  selectItem(itemList: Array<{ id: string; name: string }>): Promise<string> {
    return new Promise<string>(resolve => {
      let selected = 0;
      this.box.replaceChildren();
      this.box.className = 'dialogue pos-middle bg-window open';

      const title = document.createElement('p');
      title.textContent = 'Pilih Item (Select Item):';
      title.style.fontWeight = 'bold';
      const list = document.createElement('div');
      list.className = 'dialogue-choices';

      const draw = () => {
        list.replaceChildren(
          ...itemList.map((it, idx) => {
            const btn = document.createElement('button');
            btn.textContent = `${idx === selected ? '› ' : ''}${it.name}`;
            btn.onclick = () => finish(it.id);
            return btn;
          })
        );
      };

      const finish = (id: string) => {
        window.removeEventListener('keydown', key, true);
        this.box.classList.remove('open');
        resolve(id);
      };

      const key = (e: KeyboardEvent) => {
        if (e.code === 'ArrowUp') selected = (selected + itemList.length - 1) % itemList.length;
        else if (e.code === 'ArrowDown') selected = (selected + 1) % itemList.length;
        else if (['Enter', 'Space', 'KeyZ'].includes(e.code)) {
          e.preventDefault();
          e.stopImmediatePropagation();
          return finish(itemList[selected]?.id ?? '');
        } else if (e.code === 'Escape' || e.code === 'KeyX') {
          e.preventDefault();
          e.stopImmediatePropagation();
          return finish('');
        } else return;
        e.preventDefault();
        e.stopImmediatePropagation();
        draw();
      };

      window.addEventListener('keydown', key, true);
      this.box.append(title, list);
      draw();
    });
  }

  scrollingText(text: string, speed: number = 2): Promise<void> {
    return new Promise<void>(resolve => {
      this.box.replaceChildren();
      this.box.className = 'dialogue pos-middle bg-dim open';
      const p = document.createElement('p');
      p.className = 'dialogue-text';
      p.textContent = text;
      p.style.whiteSpace = 'pre-line';
      p.style.textAlign = 'center';
      const btn = document.createElement('button');
      btn.textContent = 'Lanjut (Enter / Space)';
      const done = () => {
        window.removeEventListener('keydown', onKey, true);
        this.box.classList.remove('open');
        resolve();
      };
      const onKey = (e: KeyboardEvent) => {
        if (['Enter', 'Space', 'Escape'].includes(e.code)) {
          e.preventDefault();
          done();
        }
      };
      btn.onclick = done;
      this.box.append(p, btn);
      window.addEventListener('keydown', onKey, true);
    });
  }

  destroy() {
    this.box.remove();
  }
}
