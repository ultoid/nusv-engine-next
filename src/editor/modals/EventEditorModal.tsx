import React, { useState } from 'react';
import type { EventCommand, EventGraphic, EventPage, MapEvent, ProjectBundle, MoveType, PriorityType } from '../../core/types.js';
import { commandTypes, commandName, commandPreview, createCommand } from '../events/eventCommands.js';
import { CommandFields } from '../events/CommandFields.js';
import { EventCommandPickerModal } from './EventCommandPickerModal.js';
import { CharacterPickerModal } from './CharacterPickerModal.js';
import { MoveRouteModal } from './MoveRouteModal.js';

export interface EventEditorModalProps {
  bundle: ProjectBundle;
  currentEvent: MapEvent;
  eventPage: number;
  setEventPage: (idx: number) => void;
  eventView: 'visual' | 'json';
  setEventView: (v: 'visual' | 'json') => void;
  eventDraft: string;
  setEventDraft: (s: string) => void;
  characterOptions: string[];
  selectedCommandIndex: number | null;
  setSelectedCommandIndex: (idx: number | null) => void;
  copiedPage: EventPage | null;
  newCommandType: EventCommand['type'];
  setNewCommandType: (t: EventCommand['type']) => void;
  updateEventVisual: (fn: (draft: MapEvent) => void) => void;
  updateCurrentPage: (fn: (page: EventPage) => void) => void;
  handleNewPage: () => void;
  handleDeletePage: () => void;
  handleCopyPage: () => void;
  handlePastePage: () => void;
  copyEvent: () => void;
  addCommand: () => void;
  addCommandAt?: (index: number, type: EventCommand['type']) => void;
  moveCommand: (index: number, direction: -1 | 1) => void;
  removeCommand: (index: number) => void;
  updateCommand: (index: number, cmd: EventCommand) => void;
  applyEvent: () => void;
  assetUrls?: Record<string, string>;
  onClose: () => void;
}

export function EventEditorModal({
  bundle,
  currentEvent,
  eventPage,
  setEventPage,
  eventView,
  setEventView,
  eventDraft,
  setEventDraft,
  characterOptions,
  selectedCommandIndex,
  setSelectedCommandIndex,
  copiedPage,
  newCommandType,
  setNewCommandType,
  updateEventVisual,
  updateCurrentPage,
  handleNewPage,
  handleDeletePage,
  handleCopyPage,
  handlePastePage,
  copyEvent,
  addCommand,
  addCommandAt,
  moveCommand,
  removeCommand,
  updateCommand,
  applyEvent,
  assetUrls = {},
  onClose
}: EventEditorModalProps) {
  const [editingCommandIndex, setEditingCommandIndex] = useState<number | null>(null);
  const [isCommandPickerOpen, setIsCommandPickerOpen] = useState(false);
  const [isCharacterPickerOpen, setIsCharacterPickerOpen] = useState(false);
  const [isMoveRouteOpen, setIsMoveRouteOpen] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<EventCommand | null>(null);
  const [sheetContextMenu, setSheetContextMenu] = useState<{ x: number; y: number; index: number } | null>(null);

  React.useEffect(() => {
    if (!sheetContextMenu) return;

    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('.mz-sheet-context-menu')) {
        return;
      }
      setSheetContextMenu(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setSheetContextMenu(null);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('wheel', handlePointerDown, { capture: true, passive: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('wheel', handlePointerDown, true);
    };
  }, [sheetContextMenu]);

  const activeEv: MapEvent = React.useMemo(() => {
    try {
      const parsed = JSON.parse(eventDraft);
      if (parsed && typeof parsed === 'object' && Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        return parsed as MapEvent;
      }
    } catch {}
    return currentEvent;
  }, [eventDraft, currentEvent]);

  React.useEffect(() => {
    try {
      const parsed = JSON.parse(eventDraft);
      if (!parsed || parsed.id !== currentEvent.id || !Array.isArray(parsed.pages)) {
        setEventDraft(JSON.stringify(currentEvent, null, 2));
      }
    } catch {
      setEventDraft(JSON.stringify(currentEvent, null, 2));
    }
  }, [currentEvent.id]);

  const safeIdx = Math.min(eventPage, Math.max(0, activeEv.pages.length - 1));
  const curPage = activeEv.pages[safeIdx] ?? activeEv.pages[0];
  const cond = curPage.conditions ?? {};
  const graphic = curPage.graphic;

  const handleClearPage = () => {
    updateCurrentPage(p => { p.commands = []; });
    setSelectedCommandIndex(null);
  };

  const handleInsertCommand = (type: EventCommand['type']) => {
    setIsCommandPickerOpen(false);
    const targetIdx = selectedCommandIndex !== null && selectedCommandIndex < curPage.commands.length
      ? selectedCommandIndex + 1
      : curPage.commands.length;
    if (addCommandAt) {
      addCommandAt(targetIdx, type);
    } else {
      updateCurrentPage(p => {
        p.commands.splice(targetIdx, 0, createCommand(type, bundle));
      });
    }
    setSelectedCommandIndex(targetIdx);
    setEditingCommandIndex(targetIdx);
  };

  const getGraphicStyle = (g?: EventGraphic) => {
    if (!g?.characterName || !assetUrls[g.characterName]) return null;
    const isSingle = g.characterName.split('/').pop()?.startsWith('$');
    const charIdx = isSingle ? 0 : (g.characterIndex ?? 0);
    const colChar = isSingle ? 0 : charIdx % 4;
    const rowChar = isSingle ? 0 : Math.floor(charIdx / 4);

    const pattern = g.pattern ?? 1;
    const dirMap: Record<string, number> = { down: 0, left: 1, right: 2, up: 3 };
    const dirIdx = dirMap[g.direction ?? 'down'] ?? 0;

    const frameX = (colChar * 3 + pattern) * 48;
    const frameY = (rowChar * 4 + dirIdx) * 48;

    return {
      backgroundImage: `url("${assetUrls[g.characterName]}")`,
      backgroundPosition: `-${frameX}px -${frameY}px`,
      backgroundSize: isSingle ? '144px 192px' : '576px 384px',
      width: '48px',
      height: '48px',
      imageRendering: 'pixelated' as const,
    };
  };

  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mz-event-dialog" onClick={e => e.stopPropagation()}>
        {/* Title bar */}
        <div className="mz-dialog-titlebar">
          <span>{(() => {
            const numStr = activeEv.id.replace('event.', '').replace('new-', '');
            const displayId = /^\d+$/.test(numStr) ? String(numStr).padStart(3, '0') : activeEv.id.replace('event.', '');
            return `ID:${displayId} - Event Editor`;
          })()}</span>
          <button className="mz-close-btn" onClick={onClose} title="Tutup">×</button>
        </div>

        {/* Top bar: Name, Note, Page action buttons */}
        <div className="mz-event-topbar">
          <div className="mz-field-inline">
            <label>Name:</label>
            <input
              type="text"
              className="mz-input mz-name-input"
              value={activeEv.name}
              onChange={e => {
                const name = e.target.value;
                updateEventVisual(draft => { draft.name = name; });
              }}
            />
          </div>

          <div className="mz-field-inline">
            <label>Note:</label>
            <input
              type="text"
              className="mz-input mz-note-input"
              placeholder=""
              value={String((activeEv as any).note ?? '')}
              onChange={e => {
                const val = e.target.value;
                updateEventVisual(draft => { (draft as any).note = val; });
              }}
            />
          </div>

          <div className="mz-page-buttons">
            <button type="button" className="mz-btn" onClick={handleNewPage}>New Event Page</button>
            <button type="button" className="mz-btn" onClick={handleCopyPage}>Copy Event Page</button>
            <button type="button" className="mz-btn" disabled={!copiedPage} onClick={handlePastePage}>Paste Event Page</button>
            <button type="button" className="mz-btn" disabled={activeEv.pages.length <= 1} onClick={handleDeletePage}>Delete Event Page</button>
            <button type="button" className="mz-btn" onClick={handleClearPage}>Clear Event Page</button>
          </div>
        </div>

        {/* Numbered Page Tabs */}
        <div className="mz-page-tabs">
          {activeEv.pages.map((_, pIdx) => (
            <button
              key={pIdx}
              type="button"
              className={`mz-tab-item ${pIdx === safeIdx ? 'active' : ''}`}
              onClick={() => {
                setEventPage(pIdx);
                setSelectedCommandIndex(null);
                setEditingCommandIndex(null);
              }}
            >
              {pIdx + 1}
            </button>
          ))}
        </div>

        {/* Main Body */}
        {eventView === 'visual' ? (
          <div className="mz-event-body">
            {/* Left Column: Page Settings */}
            <div className="mz-left-col">
              {/* Conditions Box */}
              <div className="mz-group-box">
                <div className="mz-group-title">Conditions</div>
                <div className="mz-group-content mz-conditions-content">
                  {/* Switch 1 */}
                  <div className="mz-cond-row">
                    <label className="mz-checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(cond.switchId)}
                        onChange={e => {
                          updateCurrentPage(p => {
                            p.conditions = {
                              ...(p.conditions ?? {}),
                              switchId: e.target.checked ? 'story.flag' : undefined,
                              switchValue: e.target.checked ? true : undefined
                            };
                          });
                        }}
                      />
                      <span>Switch</span>
                    </label>
                    <input
                      type="text"
                      className="mz-input mz-cond-input"
                      disabled={!cond.switchId}
                      value={cond.switchId ?? ''}
                      placeholder="ID Switch 1"
                      onChange={e => {
                        const val = e.target.value;
                        updateCurrentPage(p => {
                          if (p.conditions) p.conditions.switchId = val;
                        });
                      }}
                    />
                    <select
                      className="mz-select mz-bool-select"
                      disabled={!cond.switchId}
                      value={String(cond.switchValue ?? true)}
                      onChange={e => {
                        const val = e.target.value === 'true';
                        updateCurrentPage(p => {
                          if (p.conditions) p.conditions.switchValue = val;
                        });
                      }}
                    >
                      <option value="true">ON</option>
                      <option value="false">OFF</option>
                    </select>
                  </div>

                  {/* Switch 2 */}
                  <div className="mz-cond-row">
                    <label className="mz-checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(cond.switch2Id)}
                        onChange={e => {
                          updateCurrentPage(p => {
                            p.conditions = {
                              ...(p.conditions ?? {}),
                              switch2Id: e.target.checked ? 'story.flag2' : undefined,
                              switch2Value: e.target.checked ? true : undefined
                            };
                          });
                        }}
                      />
                      <span>Switch</span>
                    </label>
                    <input
                      type="text"
                      className="mz-input mz-cond-input"
                      disabled={!cond.switch2Id}
                      value={cond.switch2Id ?? ''}
                      placeholder="ID Switch 2"
                      onChange={e => {
                        const val = e.target.value;
                        updateCurrentPage(p => {
                          if (p.conditions) p.conditions.switch2Id = val;
                        });
                      }}
                    />
                    <select
                      className="mz-select mz-bool-select"
                      disabled={!cond.switch2Id}
                      value={String(cond.switch2Value ?? true)}
                      onChange={e => {
                        const val = e.target.value === 'true';
                        updateCurrentPage(p => {
                          if (p.conditions) p.conditions.switch2Value = val;
                        });
                      }}
                    >
                      <option value="true">ON</option>
                      <option value="false">OFF</option>
                    </select>
                  </div>

                  {/* Variable */}
                  <div className="mz-cond-row">
                    <label className="mz-checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(cond.variableId)}
                        onChange={e => {
                          updateCurrentPage(p => {
                            p.conditions = {
                              ...(p.conditions ?? {}),
                              variableId: e.target.checked ? 'story.step' : undefined,
                              variableValue: e.target.checked ? 1 : undefined
                            };
                          });
                        }}
                      />
                      <span>Variable</span>
                    </label>
                    <input
                      type="text"
                      className="mz-input mz-cond-input"
                      disabled={!cond.variableId}
                      value={cond.variableId ?? ''}
                      placeholder="ID Variabel"
                      onChange={e => {
                        const val = e.target.value;
                        updateCurrentPage(p => {
                          if (p.conditions) p.conditions.variableId = val;
                        });
                      }}
                    />
                    <span className="mz-op">≥</span>
                    <input
                      type="number"
                      className="mz-input mz-num-input"
                      disabled={!cond.variableId}
                      value={cond.variableValue ?? 0}
                      onChange={e => {
                        const val = Number(e.target.value);
                        updateCurrentPage(p => {
                          if (p.conditions) p.conditions.variableValue = val;
                        });
                      }}
                    />
                  </div>

                  {/* Self Switch */}
                  <div className="mz-cond-row">
                    <label className="mz-checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(cond.selfSwitchKey)}
                        onChange={e => {
                          updateCurrentPage(p => {
                            p.conditions = {
                              ...(p.conditions ?? {}),
                              selfSwitchKey: e.target.checked ? 'A' : undefined,
                              selfSwitchValue: e.target.checked ? true : undefined
                            };
                          });
                        }}
                      />
                      <span>Self Switch</span>
                    </label>
                    <select
                      className="mz-select mz-self-select"
                      disabled={!cond.selfSwitchKey}
                      value={cond.selfSwitchKey ?? 'A'}
                      onChange={e => {
                        const key = e.target.value as 'A' | 'B' | 'C' | 'D';
                        updateCurrentPage(p => {
                          if (p.conditions) p.conditions.selfSwitchKey = key;
                        });
                      }}
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                    <select
                      className="mz-select mz-bool-select"
                      disabled={!cond.selfSwitchKey}
                      value={String(cond.selfSwitchValue ?? true)}
                      onChange={e => {
                        const val = e.target.value === 'true';
                        updateCurrentPage(p => {
                          if (p.conditions) p.conditions.selfSwitchValue = val;
                        });
                      }}
                    >
                      <option value="true">ON</option>
                      <option value="false">OFF</option>
                    </select>
                  </div>

                  {/* Item */}
                  <div className="mz-cond-row">
                    <label className="mz-checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(cond.itemId)}
                        onChange={e => {
                          updateCurrentPage(p => {
                            p.conditions = {
                              ...(p.conditions ?? {}),
                              itemId: e.target.checked ? (bundle.game.items[0]?.id ?? 'item.potion') : undefined
                            };
                          });
                        }}
                      />
                      <span>Item</span>
                    </label>
                    <select
                      className="mz-select mz-dropdown-wide"
                      disabled={!cond.itemId}
                      value={cond.itemId ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        updateCurrentPage(p => {
                          if (p.conditions) p.conditions.itemId = val;
                        });
                      }}
                    >
                      {bundle.game.items.map(it => (
                        <option key={it.id} value={it.id}>{it.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Actor */}
                  <div className="mz-cond-row">
                    <label className="mz-checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(cond.actorId)}
                        onChange={e => {
                          updateCurrentPage(p => {
                            p.conditions = {
                              ...(p.conditions ?? {}),
                              actorId: e.target.checked ? (bundle.game.actors[0]?.id ?? 'actor.hero') : undefined
                            };
                          });
                        }}
                      />
                      <span>Actor</span>
                    </label>
                    <select
                      className="mz-select mz-dropdown-wide"
                      disabled={!cond.actorId}
                      value={cond.actorId ?? ''}
                      onChange={e => {
                        const val = e.target.value;
                        updateCurrentPage(p => {
                          if (p.conditions) p.conditions.actorId = val;
                        });
                      }}
                    >
                      {bundle.game.actors.map(ac => (
                        <option key={ac.id} value={ac.id}>{ac.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Sub-grid: Left sub-col (Image, Options) & Right sub-col (Autonomous, Priority, Trigger) */}
              <div className="mz-settings-subgrid">
                {/* Left sub-col */}
                <div className="mz-settings-col">
                  {/* Image Box */}
                  <div className="mz-group-box">
                    <div className="mz-group-title">Image</div>
                    <div className="mz-group-content mz-image-content">
                      <div
                        className="mz-checkerboard-box mz-clickable-image"
                        title="Klik untuk memilih sprite karakter RPG Maker MZ"
                        onClick={() => setIsCharacterPickerOpen(true)}
                        onDoubleClick={() => setIsCharacterPickerOpen(true)}
                        style={{ cursor: 'pointer' }}
                      >
                        {graphic && getGraphicStyle(graphic) ? (
                          <div style={getGraphicStyle(graphic)!} />
                        ) : (
                          <span className="mz-image-placeholder">{graphic?.characterName ? graphic.characterName.split('/').pop()?.replace('.png', '') : 'None'}</span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="mz-btn mz-btn-sm"
                        style={{ width: '100%', marginBottom: '2px' }}
                        onClick={() => setIsCharacterPickerOpen(true)}
                      >
                        Choose Graphic...
                      </button>

                      <select
                        className="mz-select mz-select-sm"
                        value={graphic?.characterName ?? ''}
                        onChange={e => {
                          const name = e.target.value;
                          updateCurrentPage(p => {
                            if (!name) {
                              delete p.graphic;
                            } else {
                              p.graphic = {
                                characterName: name,
                                characterIndex: p.graphic?.characterIndex ?? 0,
                                direction: p.graphic?.direction ?? 'down',
                                pattern: p.graphic?.pattern ?? 1
                              };
                            }
                          });
                        }}
                      >
                        <option value="">(None)</option>
                        {characterOptions.map(opt => (
                          <option key={opt} value={opt}>{opt.split('/').pop()?.replace('.png', '')}</option>
                        ))}
                      </select>

                      {graphic && (
                        <div className="mz-graphic-controls">
                          <select
                            className="mz-select mz-select-xs"
                            value={graphic.characterIndex ?? 0}
                            title="Index Karakter (0-7)"
                            onChange={e => {
                              const idx = Number(e.target.value);
                              updateCurrentPage(p => {
                                if (p.graphic) p.graphic.characterIndex = idx;
                              });
                            }}
                          >
                            {[0, 1, 2, 3, 4, 5, 6, 7].map(num => (
                              <option key={num} value={num}>#{num}</option>
                            ))}
                          </select>

                          <select
                            className="mz-select mz-select-xs"
                            value={graphic.direction ?? 'down'}
                            title="Arah Hadap"
                            onChange={e => {
                              const dir = e.target.value as 'down' | 'left' | 'right' | 'up';
                              updateCurrentPage(p => {
                                if (p.graphic) p.graphic.direction = dir;
                              });
                            }}
                          >
                            <option value="down">Down</option>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                            <option value="up">Up</option>
                          </select>

                          <select
                            className="mz-select mz-select-xs"
                            value={graphic.pattern ?? 1}
                            title="Frame Pola (0, 1, 2)"
                            onChange={e => {
                              const pat = Number(e.target.value);
                              updateCurrentPage(p => {
                                if (p.graphic) p.graphic.pattern = pat;
                              });
                            }}
                          >
                            <option value="0">P: 0</option>
                            <option value="1">P: 1</option>
                            <option value="2">P: 2</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Options Box */}
                  <div className="mz-group-box">
                    <div className="mz-group-title">Options</div>
                    <div className="mz-group-content mz-options-content">
                      <label className="mz-checkbox-label" title="Animasi berjalan saat berpindah">
                        <input
                          type="checkbox"
                          checked={curPage.walkAnime !== false}
                          onChange={e => {
                            const val = e.target.checked;
                            updateCurrentPage(p => { p.walkAnime = val; });
                          }}
                        />
                        <span>Walking</span>
                      </label>
                      <label className="mz-checkbox-label" title="Animasi melangkah saat diam">
                        <input
                          type="checkbox"
                          checked={Boolean(curPage.stepAnime)}
                          onChange={e => {
                            const val = e.target.checked;
                            updateCurrentPage(p => { p.stepAnime = val; });
                          }}
                        />
                        <span>Stepping</span>
                      </label>
                      <label className="mz-checkbox-label" title="Arah hadap terkunci (tidak berputar saat diajak bicara)">
                        <input
                          type="checkbox"
                          checked={Boolean(curPage.directionFix)}
                          onChange={e => {
                            const val = e.target.checked;
                            updateCurrentPage(p => { p.directionFix = val; });
                          }}
                        />
                        <span>Direction Fix</span>
                      </label>
                      <label className="mz-checkbox-label" title="Dapat ditembus oleh karakter/rintangan">
                        <input
                          type="checkbox"
                          checked={Boolean(curPage.through)}
                          onChange={e => {
                            const through = e.target.checked;
                            updateCurrentPage(p => {
                              p.through = through;
                              if (through) p.solid = false;
                            });
                          }}
                        />
                        <span>Through</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Right sub-col */}
                <div className="mz-settings-col">
                  {/* Autonomous Movement Box */}
                  <div className="mz-group-box">
                    <div className="mz-group-title">Autonomous Movement</div>
                    <div className="mz-group-content">
                      <div className="mz-row-compact">
                        <label>Type:</label>
                        <select
                          className="mz-select mz-select-sm"
                          value={curPage.moveType ?? 'fixed'}
                          onChange={e => {
                            const val = e.target.value as MoveType;
                            updateCurrentPage(p => { p.moveType = val; });
                          }}
                        >
                          <option value="fixed">Fixed</option>
                          <option value="random">Random</option>
                          <option value="approach">Approach</option>
                          <option value="custom">Custom</option>
                        </select>
                      </div>
                      <div className="mz-row-compact" style={{ marginTop: '2px', marginBottom: '2px' }}>
                        <button
                          type="button"
                          className="mz-btn mz-btn-sm"
                          disabled={curPage.moveType !== 'custom'}
                          onClick={() => setIsMoveRouteOpen(true)}
                          style={{ width: '100%', height: '24px' }}
                          title={curPage.moveType === 'custom' ? 'Atur rute pergerakan otonom' : 'Pilih Type "Custom" untuk mengatur rute'}
                        >
                          Route... {curPage.moveRoute?.list?.length ? `(${curPage.moveRoute.list.length})` : ''}
                        </button>
                      </div>
                      <div className="mz-row-compact">
                        <label>Speed:</label>
                        <select
                          className="mz-select mz-select-sm"
                          value={String(curPage.moveSpeed ?? 3)}
                          onChange={e => {
                            const val = Number(e.target.value);
                            updateCurrentPage(p => { p.moveSpeed = val; });
                          }}
                        >
                          <option value="1">1: x8 Slower</option>
                          <option value="2">2: x4 Slower</option>
                          <option value="3">3: x2 Slower</option>
                          <option value="4">4: Normal</option>
                          <option value="5">5: x2 Faster</option>
                          <option value="6">6: x4 Faster</option>
                        </select>
                      </div>
                      <div className="mz-row-compact">
                        <label>Frequency:</label>
                        <select
                          className="mz-select mz-select-sm"
                          value={String(curPage.moveFrequency ?? 3)}
                          onChange={e => {
                            const val = Number(e.target.value);
                            updateCurrentPage(p => { p.moveFrequency = val; });
                          }}
                        >
                          <option value="1">1: Lowest</option>
                          <option value="2">2: Lower</option>
                          <option value="3">3: Normal</option>
                          <option value="4">4: Higher</option>
                          <option value="5">5: Highest</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Priority Box */}
                  <div className="mz-group-box">
                    <div className="mz-group-title">Priority</div>
                    <div className="mz-group-content">
                      <select
                        className="mz-select mz-dropdown-wide"
                        value={curPage.priorityType ?? (curPage.solid ? 'same' : 'below')}
                        onChange={e => {
                          const val = e.target.value as PriorityType;
                          updateCurrentPage(p => {
                            p.priorityType = val;
                            p.solid = val === 'same' && !p.through;
                          });
                        }}
                      >
                        <option value="below">Below characters</option>
                        <option value="same">Same as characters</option>
                        <option value="above">Above characters</option>
                      </select>
                    </div>
                  </div>

                  {/* Trigger Box */}
                  <div className="mz-group-box">
                    <div className="mz-group-title">Trigger</div>
                    <div className="mz-group-content">
                      <select
                        className="mz-select mz-dropdown-wide"
                        value={curPage.trigger ?? activeEv.trigger ?? 'interact'}
                        onChange={e => {
                          const trg = e.target.value as any;
                          updateCurrentPage(p => { p.trigger = trg; });
                        }}
                      >
                        <option value="interact">Action Button</option>
                        <option value="touch">Player Touch</option>
                        <option value="event_touch">Event Touch</option>
                        <option value="autorun">Autorun</option>
                        <option value="parallel">Parallel</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Contents (Command Tree) */}
            <div className="mz-right-col" onClick={() => setSheetContextMenu(null)}>
              <div className="mz-group-box mz-contents-box">
                <div className="mz-contents-header">
                  <span className="mz-group-title-label">Contents</span>
                  <div className="mz-command-toolbar">
                    <button
                      type="button"
                      className="mz-btn mz-btn-primary"
                      onClick={() => setIsCommandPickerOpen(true)}
                      title="Buka dialog perintah event RPG Maker MZ (3 Tab)"
                    >
                      + Add Command...
                    </button>
                    <select
                      className="mz-select mz-add-select"
                      value={newCommandType}
                      onChange={event => setNewCommandType(event.target.value as EventCommand['type'])}
                    >
                      {commandTypes.map(type => (
                        <option key={type} value={type}>{commandName[type]}</option>
                      ))}
                    </select>
                    <button type="button" className="mz-btn" onClick={addCommand}>+ Quick</button>
                    <button
                      type="button"
                      className="mz-btn"
                      disabled={selectedCommandIndex === null}
                      onClick={() => setEditingCommandIndex(selectedCommandIndex)}
                    >
                      Edit...
                    </button>
                    <button
                      type="button"
                      className="mz-btn"
                      disabled={selectedCommandIndex === null}
                      onClick={() => {
                        if (selectedCommandIndex !== null) {
                          removeCommand(selectedCommandIndex);
                          setSelectedCommandIndex(null);
                          setEditingCommandIndex(null);
                        }
                      }}
                    >
                      Delete
                    </button>
                    <button
                      type="button"
                      className="mz-btn mz-btn-sm"
                      disabled={selectedCommandIndex === null || selectedCommandIndex === 0}
                      onClick={() => {
                        if (selectedCommandIndex !== null) {
                          moveCommand(selectedCommandIndex, -1);
                          setSelectedCommandIndex(selectedCommandIndex - 1);
                        }
                      }}
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      className="mz-btn mz-btn-sm"
                      disabled={selectedCommandIndex === null || selectedCommandIndex >= curPage.commands.length - 1}
                      onClick={() => {
                        if (selectedCommandIndex !== null) {
                          moveCommand(selectedCommandIndex, 1);
                          setSelectedCommandIndex(selectedCommandIndex + 1);
                        }
                      }}
                      title="Move Down"
                    >
                      ▼
                    </button>
                  </div>
                </div>

                <div
                  className="mz-command-sheet"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (editingCommandIndex !== null || isCommandPickerOpen || isCharacterPickerOpen) return;
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      setIsCommandPickerOpen(true);
                    } else if (e.key === ' ' || e.key === 'Spacebar') {
                      e.preventDefault();
                      if (selectedCommandIndex !== null && curPage.commands[selectedCommandIndex]) {
                        setEditingCommandIndex(selectedCommandIndex);
                      }
                    } else if (e.key === 'Delete' || e.key === 'Backspace') {
                      e.preventDefault();
                      if (selectedCommandIndex !== null && curPage.commands[selectedCommandIndex]) {
                        removeCommand(selectedCommandIndex);
                        setSelectedCommandIndex(null);
                      }
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      if (selectedCommandIndex !== null && selectedCommandIndex > 0) {
                        setSelectedCommandIndex(selectedCommandIndex - 1);
                      }
                    } else if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      if (selectedCommandIndex !== null && selectedCommandIndex < curPage.commands.length - 1) {
                        setSelectedCommandIndex(selectedCommandIndex + 1);
                      } else if (selectedCommandIndex === null && curPage.commands.length > 0) {
                        setSelectedCommandIndex(0);
                      }
                    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
                      if (selectedCommandIndex !== null && curPage.commands[selectedCommandIndex]) {
                        setCopiedCommand(structuredClone(curPage.commands[selectedCommandIndex]));
                      }
                    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
                      if (copiedCommand) {
                        const pasteIdx = selectedCommandIndex !== null ? selectedCommandIndex + 1 : curPage.commands.length;
                        updateCurrentPage(p => {
                          p.commands.splice(pasteIdx, 0, structuredClone(copiedCommand));
                        });
                        setSelectedCommandIndex(pasteIdx);
                      }
                    }
                  }}
                >
                  {curPage.commands.map((command, index) => {
                    const isSelected = index === selectedCommandIndex;
                    return (
                      <div key={index} className="mz-command-block">
                        <div
                          className={`mz-command-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedCommandIndex(index)}
                          onDoubleClick={() => setEditingCommandIndex(index)}
                          onContextMenu={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setSelectedCommandIndex(index);
                            setSheetContextMenu({ x: e.clientX, y: e.clientY, index });
                          }}
                        >
                          <span className="mz-bullet">◆</span>
                          <span className="mz-cmd-name">{commandName[command.type]}</span>
                          <span className="mz-cmd-colon">:</span>
                          <span className="mz-cmd-args">{commandPreview(command)}</span>
                        </div>

                        {/* Nested visual branches */}
                        {command.type === 'branch' && (
                          <div className="mz-nested-branch">
                            {command.thenCommands.map((tc, tcIdx) => (
                              <div key={`then-${tcIdx}`} className="mz-command-row mz-sub-row">
                                <span className="mz-tree-branch">├─</span>
                                <span className="mz-bullet">◆</span>
                                <span className="mz-cmd-name">{commandName[tc.type]}</span>
                                <span className="mz-cmd-colon">:</span>
                                <span className="mz-cmd-args">{commandPreview(tc)}</span>
                              </div>
                            ))}
                            {command.elseCommands !== undefined && (
                              <>
                                <div className="mz-command-row mz-sub-row mz-branch-label">
                                  <span className="mz-tree-branch">├─</span>
                                  <span className="mz-bullet">◆</span>
                                  <span className="mz-cmd-name">Else</span>
                                </div>
                                {command.elseCommands.map((ec, ecIdx) => (
                                  <div key={`else-${ecIdx}`} className="mz-command-row mz-sub-row">
                                    <span className="mz-tree-branch">│ ├─</span>
                                    <span className="mz-bullet">◆</span>
                                    <span className="mz-cmd-name">{commandName[ec.type]}</span>
                                    <span className="mz-cmd-colon">:</span>
                                    <span className="mz-cmd-args">{commandPreview(ec)}</span>
                                  </div>
                                ))}
                              </>
                            )}
                            <div className="mz-command-row mz-sub-row mz-branch-end">
                              <span className="mz-tree-branch">└─</span>
                              <span className="mz-bullet">◆</span>
                              <span className="mz-cmd-name">End</span>
                            </div>
                          </div>
                        )}

                        {command.type === 'loop' && (
                          <div className="mz-nested-branch">
                            {command.commands.map((lc, lcIdx) => (
                              <div key={`loop-${lcIdx}`} className="mz-command-row mz-sub-row">
                                <span className="mz-tree-branch">├─</span>
                                <span className="mz-bullet">◆</span>
                                <span className="mz-cmd-name">{commandName[lc.type]}</span>
                                <span className="mz-cmd-colon">:</span>
                                <span className="mz-cmd-args">{commandPreview(lc)}</span>
                              </div>
                            ))}
                            <div className="mz-command-row mz-sub-row mz-branch-end">
                              <span className="mz-tree-branch">└─</span>
                              <span className="mz-bullet">◆</span>
                              <span className="mz-cmd-name">Repeat Above</span>
                            </div>
                          </div>
                        )}

                        {command.type === 'choice' && (
                          <div className="mz-nested-branch">
                            {command.choices.map((ch, chIdx) => (
                              <div key={`ch-${chIdx}`}>
                                <div className="mz-command-row mz-sub-row mz-branch-label">
                                  <span className="mz-tree-branch">├─</span>
                                  <span className="mz-bullet">◆</span>
                                  <span className="mz-cmd-name">When [{ch.text}]</span>
                                </div>
                                {ch.commands.map((cc, ccIdx) => (
                                  <div key={`choice-cmd-${ccIdx}`} className="mz-command-row mz-sub-row">
                                    <span className="mz-tree-branch">│ ├─</span>
                                    <span className="mz-bullet">◆</span>
                                    <span className="mz-cmd-name">{commandName[cc.type]}</span>
                                    <span className="mz-cmd-colon">:</span>
                                    <span className="mz-cmd-args">{commandPreview(cc)}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                            <div className="mz-command-row mz-sub-row mz-branch-end">
                              <span className="mz-tree-branch">└─</span>
                              <span className="mz-bullet">◆</span>
                              <span className="mz-cmd-name">End</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Empty zebra rows for authentic RPG Maker MZ spreadsheet look */}
                  {Array.from({ length: Math.max(1, 16 - curPage.commands.length) }).map((_, i) => (
                    <div
                      key={`empty-${i}`}
                      className="mz-command-row mz-empty-row"
                      title="Klik dua kali untuk menambah perintah (Event Commands)"
                      onDoubleClick={() => setIsCommandPickerOpen(true)}
                    >
                      {i === 0 && curPage.commands.length === 0 && <span className="mz-bullet">◆</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mv-code-panel" style={{ margin: '8px 12px' }}>
            <div className="mv-code-title"><span>Event Data</span><code>{activeEv.id}.json</code></div>
            <textarea className="mv-code-editor" spellCheck={false} value={eventDraft} onChange={event => setEventDraft(event.target.value)} />
            <div className="mv-applybar">
              <span>JSON mempertahankan setiap perintah runtime dan kondisi halaman.</span>
              <button className="primary" onClick={applyEvent}>Terapkan JSON</button>
            </div>
          </div>
        )}

        {/* Command Edit Popover / Sub-Modal (if editing) */}
        {editingCommandIndex !== null && curPage.commands[editingCommandIndex] && (
          <div className="mz-edit-popover-backdrop" onClick={() => setEditingCommandIndex(null)}>
            <div className="mz-edit-popover" onClick={e => e.stopPropagation()}>
              <div className="mz-dialog-titlebar">
                <span>Edit Command #{editingCommandIndex + 1}: {commandName[curPage.commands[editingCommandIndex].type]}</span>
                <button type="button" className="mz-close-btn" onClick={() => setEditingCommandIndex(null)} title="Tutup">×</button>
              </div>
              <div className="mz-edit-popover-body">
                <CommandFields
                  command={curPage.commands[editingCommandIndex]}
                  bundle={bundle}
                  onChange={cmd => updateCommand(editingCommandIndex, cmd)}
                />
              </div>
              <div className="mz-edit-popover-footer">
                <button type="button" className="mz-btn mz-btn-primary" onClick={() => setEditingCommandIndex(null)}>OK</button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Dialog Action Bar */}
        <div className="mz-dialog-footer">
          <div className="mz-footer-left">
            <button type="button" className="mz-btn" onClick={() => void copyEvent()}>Salin Event</button>
            <button type="button" className="mz-btn" onClick={() => setEventView(eventView === 'visual' ? 'json' : 'visual')}>
              {eventView === 'visual' ? 'Mode JSON' : 'Mode Visual'}
            </button>
          </div>

          <div className="mz-footer-right">
            <button
              type="button"
              className="mz-btn mz-btn-primary"
              onClick={() => {
                applyEvent();
                onClose();
              }}
            >
              OK
            </button>
            <button type="button" className="mz-btn" onClick={onClose}>Cancel</button>
            <button type="button" className="mz-btn" onClick={applyEvent}>Apply</button>
          </div>
        </div>

        {/* Context Menu for Command Rows */}
        {sheetContextMenu && (
          <div
            className="mz-sheet-context-menu"
            style={{ left: `${sheetContextMenu.x}px`, top: `${sheetContextMenu.y}px` }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setSheetContextMenu(null);
                setIsCommandPickerOpen(true);
              }}
            >
              <span>New / Insert...</span>
              <kbd>Enter</kbd>
            </button>
            <button
              disabled={selectedCommandIndex === null}
              onClick={() => {
                setSheetContextMenu(null);
                if (selectedCommandIndex !== null) setEditingCommandIndex(selectedCommandIndex);
              }}
            >
              <span>Edit...</span>
              <kbd>Space</kbd>
            </button>
            <hr />
            <button
              disabled={selectedCommandIndex === null}
              onClick={() => {
                if (selectedCommandIndex !== null && curPage.commands[selectedCommandIndex]) {
                  setCopiedCommand(structuredClone(curPage.commands[selectedCommandIndex]));
                }
                setSheetContextMenu(null);
              }}
            >
              <span>Copy</span>
              <kbd>Ctrl+C</kbd>
            </button>
            <button
              disabled={!copiedCommand}
              onClick={() => {
                if (copiedCommand) {
                  const pasteIdx = selectedCommandIndex !== null ? selectedCommandIndex + 1 : curPage.commands.length;
                  updateCurrentPage(p => {
                    p.commands.splice(pasteIdx, 0, structuredClone(copiedCommand));
                  });
                  setSelectedCommandIndex(pasteIdx);
                }
                setSheetContextMenu(null);
              }}
            >
              <span>Paste</span>
              <kbd>Ctrl+V</kbd>
            </button>
            <hr />
            <button
              disabled={selectedCommandIndex === null || selectedCommandIndex === 0}
              onClick={() => {
                if (selectedCommandIndex !== null && selectedCommandIndex > 0) {
                  moveCommand(selectedCommandIndex, -1);
                  setSelectedCommandIndex(selectedCommandIndex - 1);
                }
                setSheetContextMenu(null);
              }}
            >
              <span>Move Up</span>
              <kbd>▲</kbd>
            </button>
            <button
              disabled={selectedCommandIndex === null || selectedCommandIndex >= curPage.commands.length - 1}
              onClick={() => {
                if (selectedCommandIndex !== null && selectedCommandIndex < curPage.commands.length - 1) {
                  moveCommand(selectedCommandIndex, 1);
                  setSelectedCommandIndex(selectedCommandIndex + 1);
                }
                setSheetContextMenu(null);
              }}
            >
              <span>Move Down</span>
              <kbd>▼</kbd>
            </button>
            <hr />
            <button
              disabled={selectedCommandIndex === null}
              onClick={() => {
                if (selectedCommandIndex !== null) {
                  removeCommand(selectedCommandIndex);
                  setSelectedCommandIndex(null);
                }
                setSheetContextMenu(null);
              }}
            >
              <span>Delete</span>
              <kbd>Del</kbd>
            </button>
          </div>
        )}

        {/* Character Graphic Picker Sub-Modal */}
        {isCharacterPickerOpen && (
          <CharacterPickerModal
            currentGraphic={graphic}
            characterOptions={characterOptions}
            assetUrls={assetUrls}
            onSelect={g => {
              updateCurrentPage(p => {
                if (!g) {
                  delete p.graphic;
                } else {
                  p.graphic = g;
                }
              });
            }}
            onClose={() => setIsCharacterPickerOpen(false)}
          />
        )}

        {/* Event Command 3-Tab Picker Sub-Modal */}
        {isCommandPickerOpen && (
          <EventCommandPickerModal
            onSelect={handleInsertCommand}
            onClose={() => setIsCommandPickerOpen(false)}
          />
        )}

        {/* Autonomous Movement Route Sub-Modal */}
        {isMoveRouteOpen && (
          <MoveRouteModal
            initialRoute={curPage.moveRoute}
            targetName={activeEv.name || activeEv.id}
            showWaitOption={false}
            onApply={route => {
              updateCurrentPage(p => {
                p.moveRoute = route;
              });
            }}
            onClose={() => setIsMoveRouteOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
