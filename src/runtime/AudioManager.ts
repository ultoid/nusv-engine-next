import type { RuntimeSettings } from '../core/types.js';
export class AudioManager{
  private context?:AudioContext;private master?:GainNode;private music?:GainNode;private oscillator?:OscillatorNode;private mood:'calm'|'danger'|'boss'|'silence'='calm';private settings:Pick<RuntimeSettings,'masterVolume'|'musicVolume'|'sfxVolume'>={masterVolume:.8,musicVolume:.65,sfxVolume:.8};
  async unlock(){this.context??=new AudioContext();if(!this.master){this.master=this.context.createGain();this.music=this.context.createGain();this.music.connect(this.master);this.master.connect(this.context.destination);this.applyMix();this.startMood();}if(this.context.state==='suspended')await this.context.resume();}
  private startMood(){if(!this.context||!this.music||this.mood==='silence')return;this.oscillator?.stop();const frequencies={calm:110,danger:146.83,boss:82.41};this.oscillator=this.context.createOscillator();this.oscillator.type=this.mood==='boss'?'sawtooth':'sine';this.oscillator.frequency.value=frequencies[this.mood];this.oscillator.connect(this.music);this.oscillator.start();}
  private applyMix(){if(this.master)this.master.gain.value=this.settings.masterVolume;if(this.music)this.music.gain.value=this.settings.musicVolume*.035;}
  setMix(settings:RuntimeSettings){this.settings=settings;this.applyMix();}
  setMood(mood:'calm'|'danger'|'boss'|'silence'){if(this.mood===mood)return;this.mood=mood;this.oscillator?.stop();this.oscillator=undefined;this.startMood();}
  setVolume(value:number){this.settings.masterVolume=Math.max(0,Math.min(1,value));this.applyMix();}
  close(){this.oscillator?.stop();return this.context?.close();}
}
