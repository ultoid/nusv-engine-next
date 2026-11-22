import '../../style.css';
import { Runtime } from '../runtime/Runtime.js';
const errorBox = document.querySelector<HTMLElement>('#runtime-error')!;
async function start() { try { if (!window.nusvRuntime) throw new Error('Runtime host tidak tersedia. Jalankan melalui NUSV Engine.'); const bundle = await window.nusvRuntime.loadProject(); const runtime = new Runtime(); await runtime.boot(bundle, document.querySelector<HTMLElement>('#game')!); window.addEventListener('beforeunload', () => runtime.destroy()); } catch (error) { errorBox.textContent = `Gagal menjalankan proyek: ${error instanceof Error ? error.message : String(error)}`; console.error(error); } }
void start();
