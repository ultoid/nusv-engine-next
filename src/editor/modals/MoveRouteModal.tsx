import React, { useState } from 'react';
import type { MoveRoute, MoveRouteCode, MoveRouteCommand } from '../../core/types.js';

export interface MoveRouteModalProps {
  initialRoute?: MoveRoute;
  targetName?: string;
  showWaitOption?: boolean;
  onApply: (route: MoveRoute) => void;
  onClose: () => void;
}

const moveCodeLabels: Record<MoveRouteCode, string> = {
  moveDown: 'Move Down',
  moveLeft: 'Move Left',
  moveRight: 'Move Right',
  moveUp: 'Move Up',
  moveLowerLeft: 'Move Lower Left',
  moveLowerRight: 'Move Lower Right',
  moveUpperLeft: 'Move Upper Left',
  moveUpperRight: 'Move Upper Right',
  moveRandom: 'Move at Random',
  moveTowardPlayer: 'Move toward Player',
  moveAwayFromPlayer: 'Move away from Player',
  stepForward: '1 Step Forward',
  stepBackward: '1 Step Backward',
  jump: 'Jump',
  wait: 'Wait...',
  turnDown: 'Turn Down',
  turnLeft: 'Turn Left',
  turnRight: 'Turn Right',
  turnUp: 'Turn Up',
  turn90Right: 'Turn 90° Right',
  turn90Left: 'Turn 90° Left',
  turn180: 'Turn 180°',
  turn90RightOrLeft: 'Turn 90° R/L',
  turnRandom: 'Turn at Random',
  turnTowardPlayer: 'Turn toward Player',
  turnAwayFromPlayer: 'Turn away from Player',
  switchOn: 'Switch ON...',
  switchOff: 'Switch OFF...',
  changeSpeed: 'Change Speed...',
  changeFrequency: 'Change Freq...',
  walkAnimeOn: 'Walk Anime ON',
  walkAnimeOff: 'Walk Anime OFF',
  stepAnimeOn: 'Step Anime ON',
  stepAnimeOff: 'Step Anime OFF',
  directionFixOn: 'Direction Fix ON',
  directionFixOff: 'Direction Fix OFF',
  throughOn: 'Through ON',
  throughOff: 'Through OFF',
  transparentOn: 'Transparent ON',
  transparentOff: 'Transparent OFF',
  script: 'Script...'
};

export function MoveRouteModal({
  initialRoute,
  targetName = 'Target',
  showWaitOption = false,
  onApply,
  onClose
}: MoveRouteModalProps) {
  const [list, setList] = useState<MoveRouteCommand[]>(
    initialRoute?.list ? structuredClone(initialRoute.list) : [{ code: 'stepForward' }]
  );
  const [repeat, setRepeat] = useState<boolean>(initialRoute?.repeat ?? true);
  const [skippable, setSkippable] = useState<boolean>(initialRoute?.skippable ?? true);
  const [wait, setWait] = useState<boolean>(initialRoute?.wait ?? false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(list.length > 0 ? 0 : null);

  const addCommand = (code: MoveRouteCode, parameters?: any[]) => {
    const cmd: MoveRouteCommand = { code, parameters };
    if (selectedIndex !== null && selectedIndex < list.length) {
      const nextList = [...list];
      nextList.splice(selectedIndex + 1, 0, cmd);
      setList(nextList);
      setSelectedIndex(selectedIndex + 1);
    } else {
      setList([...list, cmd]);
      setSelectedIndex(list.length);
    }
  };

  const removeSelected = () => {
    if (selectedIndex === null) return;
    const nextList = list.filter((_, idx) => idx !== selectedIndex);
    setList(nextList);
    if (nextList.length === 0) setSelectedIndex(null);
    else if (selectedIndex >= nextList.length) setSelectedIndex(nextList.length - 1);
  };

  const handleApply = () => {
    onApply({
      repeat,
      skippable,
      wait: showWaitOption ? wait : undefined,
      list
    });
    onClose();
  };

  return (
    <div className="mv-modal-backdrop mz-route-modal-backdrop" onClick={onClose}>
      <div className="mz-route-dialog" onClick={e => e.stopPropagation()}>
        <div className="mz-dialog-titlebar">
          <span>Set Movement Route ({targetName})</span>
          <button type="button" className="mz-close-btn" onClick={onClose} title="Tutup">×</button>
        </div>

        <div className="mz-route-body">
          {/* Left Column: Command List */}
          <div className="mz-route-left-col">
            <div className="mz-panel-header">Route Commands ({list.length})</div>
            <div className="mz-route-list-viewport">
              {list.length === 0 ? (
                <div className="mz-route-empty">Tidak ada rute pergerakan. Klik tombol di kanan untuk menambah langkah.</div>
              ) : (
                list.map((cmd, idx) => {
                  const isSelected = selectedIndex === idx;
                  const label = moveCodeLabels[cmd.code] ?? cmd.code;
                  const paramText = cmd.parameters?.length ? ` [${cmd.parameters.join(', ')}]` : '';
                  return (
                    <div
                      key={idx}
                      className={`mz-route-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedIndex(idx)}
                    >
                      <span className="mz-route-bullet">◆</span>
                      <span className="mz-route-text">{label}{paramText}</span>
                    </div>
                  );
                })
              )}
            </div>

            <div className="mz-route-actions-row">
              <button
                type="button"
                className="mz-btn"
                disabled={selectedIndex === null}
                onClick={removeSelected}
              >
                Delete Step
              </button>
              <button
                type="button"
                className="mz-btn"
                disabled={list.length === 0}
                onClick={() => { setList([]); setSelectedIndex(null); }}
              >
                Clear All
              </button>
            </div>
          </div>

          {/* Right Column: Palette of RPG Maker MZ Route Buttons */}
          <div className="mz-route-right-col">
            <div className="mz-route-group">
              <div className="mz-group-title">Movement</div>
              <div className="mz-route-btn-grid">
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('moveDown')}>Move Down</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('moveLeft')}>Move Left</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('moveRight')}>Move Right</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('moveUp')}>Move Up</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('moveLowerLeft')}>Move Lower L</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('moveLowerRight')}>Move Lower R</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('moveUpperLeft')}>Move Upper L</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('moveUpperRight')}>Move Upper R</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('moveRandom')}>Move at Random</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('moveTowardPlayer')}>Move toward Player</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('moveAwayFromPlayer')}>Move away from Player</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('stepForward')}>1 Step Forward</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('stepBackward')}>1 Step Backward</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => {
                  const frames = prompt('Wait frames (60 = 1s):', '60');
                  if (frames) addCommand('wait', [Number(frames)]);
                }}>Wait...</button>
              </div>
            </div>

            <div className="mz-route-group">
              <div className="mz-group-title">Turn & Facing</div>
              <div className="mz-route-btn-grid">
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('turnDown')}>Turn Down</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('turnLeft')}>Turn Left</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('turnRight')}>Turn Right</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('turnUp')}>Turn Up</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('turn90Right')}>Turn 90° Right</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('turn90Left')}>Turn 90° Left</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('turn180')}>Turn 180°</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('turn90RightOrLeft')}>Turn 90° R/L</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('turnRandom')}>Turn at Random</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('turnTowardPlayer')}>Turn toward Player</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('turnAwayFromPlayer')}>Turn away from Player</button>
              </div>
            </div>

            <div className="mz-route-group">
              <div className="mz-group-title">Options & Switches</div>
              <div className="mz-route-btn-grid">
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('walkAnimeOn')}>Walk Anime ON</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('walkAnimeOff')}>Walk Anime OFF</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('stepAnimeOn')}>Step Anime ON</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('stepAnimeOff')}>Step Anime OFF</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('directionFixOn')}>Dir Fix ON</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('directionFixOff')}>Dir Fix OFF</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('throughOn')}>Through ON</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => addCommand('throughOff')}>Through OFF</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => {
                  const sw = prompt('Switch ID untuk di-ON-kan:', 'story.flag');
                  if (sw) addCommand('switchOn', [sw]);
                }}>Switch ON...</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => {
                  const sw = prompt('Switch ID untuk di-OFF-kan:', 'story.flag');
                  if (sw) addCommand('switchOff', [sw]);
                }}>Switch OFF...</button>
                <button type="button" className="mz-btn mz-btn-sm" onClick={() => {
                  const code = prompt('Script code:');
                  if (code) addCommand('script', [code]);
                }}>Script...</button>
              </div>
            </div>

            {/* Bottom check options */}
            <div className="mz-route-options-box">
              <label className="mz-checkbox-label">
                <input
                  type="checkbox"
                  checked={repeat}
                  onChange={e => setRepeat(e.target.checked)}
                />
                <span>Repeat Movements</span>
              </label>

              <label className="mz-checkbox-label">
                <input
                  type="checkbox"
                  checked={skippable}
                  onChange={e => setSkippable(e.target.checked)}
                />
                <span>Skip If Cannot Move</span>
              </label>

              {showWaitOption && (
                <label className="mz-checkbox-label">
                  <input
                    type="checkbox"
                    checked={wait}
                    onChange={e => setWait(e.target.checked)}
                  />
                  <span>Wait for Completion</span>
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mz-dialog-footer">
          <div className="mz-footer-left" />
          <div className="mz-footer-right">
            <button type="button" className="mz-btn mz-btn-primary" onClick={handleApply}>OK</button>
            <button type="button" className="mz-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
