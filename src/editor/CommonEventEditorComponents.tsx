import React, { useState, useMemo } from 'react';
import type { CommonEventData, EventCommand, ProjectBundle } from '../core/types.js';
import { EventCommandPickerModal } from './modals/EventCommandPickerModal.js';
import { CommandFields } from './events/CommandFields.js';
import { commandName, commandPreview, createCommand } from './events/eventCommands.js';

// ============================================================================
// Modal: Switch Picker Dialog
// ============================================================================
export function CommonEventSwitchModal({
  currentSwitchId,
  bundle,
  onSelect,
  onClose
}: {
  currentSwitchId?: string;
  bundle: ProjectBundle;
  onSelect: (switchId: string) => void;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState(currentSwitchId || 'switch.0001');
  const [filter, setFilter] = useState('');
  const [customName, setCustomName] = useState('');

  // Collect all switch IDs used in the project
  const knownSwitches = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];
    // Default standard switches 1 to 20
    for (let i = 1; i <= 20; i++) {
      const idStr = String(i).padStart(4, '0');
      list.push({
        id: `switch.${idStr}`,
        name: `Switch ${idStr}`
      });
    }

    // Scan common events
    if (Array.isArray(bundle.game.commonEvents)) {
      for (const ce of bundle.game.commonEvents) {
        if (ce.switchId && !list.some((s) => s.id === ce.switchId)) {
          list.push({ id: ce.switchId, name: ce.switchId });
        }
      }
    }

    return list;
  }, [bundle.game.commonEvents]);

  const filteredSwitches = useMemo(() => {
    if (!filter.trim()) return knownSwitches;
    const q = filter.toLowerCase();
    return knownSwitches.filter((s) => s.id.toLowerCase().includes(q) || s.name.toLowerCase().includes(q));
  }, [knownSwitches, filter]);

  return (
    <div className="mz-modal-overlay">
      <div className="mz-modal" style={{ width: 440 }}>
        <div className="mz-modal-header">
          <span className="mz-modal-title">Switches</span>
          <button className="mz-btn-close" onClick={onClose}>×</button>
        </div>
        <div style={{ padding: '8px 12px 4px' }}>
          <input
            type="text"
            className="mz-input"
            style={{ width: '100%' }}
            placeholder="Search switch or enter ID..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div style={{ padding: '4px 12px', minHeight: 220, maxHeight: 260, overflowY: 'auto' }}>
          <div className="mz-table-container" style={{ maxHeight: 250 }}>
            <table className="mz-grid-table">
              <thead>
                <tr>
                  <th style={{ width: '35%' }}>ID</th>
                  <th style={{ width: '65%' }}>Name</th>
                </tr>
              </thead>
              <tbody>
                {filteredSwitches.map((item) => (
                  <tr
                    key={item.id}
                    className={`mz-table-clickable-row ${selectedId === item.id ? 'mz-selected-row' : ''}`}
                    onClick={() => {
                      setSelectedId(item.id);
                      setCustomName(item.name);
                    }}
                    onDoubleClick={() => {
                      onSelect(item.id);
                      onClose();
                    }}
                    style={{ background: selectedId === item.id ? '#2563eb' : undefined, color: selectedId === item.id ? '#fff' : undefined }}
                  >
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div style={{ padding: '8px 12px', borderTop: '1px solid #cbd5e1' }}>
          <label className="mz-label">Selected Switch ID:</label>
          <input
            type="text"
            className="mz-input"
            style={{ width: '100%' }}
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          />
        </div>
        <div className="mz-modal-footer">
          <button
            className="mz-btn mz-btn-primary"
            onClick={() => {
              if (selectedId.trim()) onSelect(selectedId.trim());
              onClose();
            }}
          >
            OK
          </button>
          <button className="mz-btn" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Form: Common Event Detail Form (Exact RPG Maker MZ Layout)
// ============================================================================
export function CommonEventDetailForm({
  commonEvent,
  bundle,
  onUpdate,
  assetUrlMap = {}
}: {
  commonEvent: CommonEventData;
  bundle: ProjectBundle;
  onUpdate: (patch: Record<string, unknown>) => void;
  assetUrlMap?: Record<string, string>;
}) {
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingCommandIndex, setEditingCommandIndex] = useState<number | null>(null);
  const [selectedCommandIndex, setSelectedCommandIndex] = useState<number | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const commands = commonEvent.commands || [];

  // Trigger normalization: 0: 'none', 1: 'autorun', 2: 'parallel'
  const triggerVal = useMemo(() => {
    const t = commonEvent.trigger;
    if (t === 1 || t === 'autorun') return 'autorun';
    if (t === 2 || t === 'parallel') return 'parallel';
    return 'none';
  }, [commonEvent.trigger]);

  const isSwitchEnabled = triggerVal === 'autorun' || triggerVal === 'parallel';

  const handleAddCommand = (type: EventCommand['type']) => {
    const cmd = createCommand(type, bundle);
    let insertIdx = commands.length;
    if (selectedCommandIndex !== null && selectedCommandIndex >= 0 && selectedCommandIndex < commands.length) {
      insertIdx = selectedCommandIndex + 1;
    }
    const next = [...commands];
    next.splice(insertIdx, 0, cmd);
    onUpdate({ commands: next });
    setSelectedCommandIndex(insertIdx);
    setPickerOpen(false);
  };

  const handleDeleteCommand = (idx: number) => {
    onUpdate({ commands: commands.filter((_, i) => i !== idx) });
    if (selectedCommandIndex === idx) {
      setSelectedCommandIndex(commands.length > 1 ? Math.min(idx, commands.length - 2) : null);
    }
  };

  const handleMoveCommand = (idx: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && idx === 0) || (direction === 'down' && idx === commands.length - 1)) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const next = [...commands];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    onUpdate({ commands: next });
    setSelectedCommandIndex(targetIdx);
  };

  const handleUpdateCommand = (idx: number, updated: EventCommand) => {
    const next = [...commands];
    next[idx] = updated;
    onUpdate({ commands: next });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* 1. General Settings (RPG Maker MZ Group Box) */}
      <div className="mz-group-box">
        <span className="mz-group-title">General Settings</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 240px) 140px 1fr', gap: 14, alignItems: 'center' }}>
          {/* Name */}
          <div>
            <label className="mz-label">Name:</label>
            <input
              type="text"
              className="mz-input"
              style={{ width: '100%' }}
              value={commonEvent.name || ''}
              onChange={(e) => onUpdate({ name: e.target.value })}
            />
          </div>

          {/* Trigger */}
          <div>
            <label className="mz-label">Trigger:</label>
            <select
              className="mz-select"
              style={{ width: '100%' }}
              value={triggerVal}
              onChange={(e) => onUpdate({ trigger: e.target.value })}
            >
              <option value="none">None</option>
              <option value="autorun">Autorun</option>
              <option value="parallel">Parallel</option>
            </select>
          </div>

          {/* Switch */}
          <div>
            <label className="mz-label" style={{ color: isSwitchEnabled ? '#1e293b' : '#94a3b8' }}>Switch:</label>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="text"
                className="mz-input"
                style={{
                  flex: 1,
                  backgroundColor: isSwitchEnabled ? '#fff' : '#f1f5f9',
                  color: isSwitchEnabled ? '#1e293b' : '#94a3b8'
                }}
                disabled={!isSwitchEnabled}
                readOnly
                value={isSwitchEnabled ? commonEvent.switchId || 'switch.0001' : ''}
              />
              <button
                type="button"
                className="mz-btn"
                style={{ padding: '0 8px' }}
                disabled={!isSwitchEnabled}
                onClick={() => setSwitchModalOpen(true)}
              >
                ...
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Contents (Event Commands List with MZ diamond bullets and indentation) */}
      <div className="mz-group-box">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <span className="mz-group-title" style={{ margin: 0 }}>Contents</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              className="mz-btn mz-btn-primary"
              style={{ padding: '2px 10px', fontSize: 11 }}
              onClick={() => setPickerOpen(true)}
            >
              + Add Command
            </button>
            <button
              type="button"
              className="mz-btn"
              style={{ padding: '2px 8px', fontSize: 11 }}
              disabled={selectedCommandIndex === null || !commands[selectedCommandIndex]}
              onClick={() => {
                if (selectedCommandIndex !== null) setEditingCommandIndex(selectedCommandIndex);
              }}
            >
              Edit
            </button>
            <button
              type="button"
              className="mz-btn mz-btn-danger"
              style={{ padding: '2px 8px', fontSize: 11 }}
              disabled={selectedCommandIndex === null || !commands[selectedCommandIndex]}
              onClick={() => {
                if (selectedCommandIndex !== null) handleDeleteCommand(selectedCommandIndex);
              }}
            >
              Delete
            </button>
            <button
              type="button"
              className="mz-btn"
              style={{ padding: '2px 6px', fontSize: 11 }}
              disabled={selectedCommandIndex === null || selectedCommandIndex === 0}
              onClick={() => {
                if (selectedCommandIndex !== null) handleMoveCommand(selectedCommandIndex, 'up');
              }}
            >
              ▲
            </button>
            <button
              type="button"
              className="mz-btn"
              style={{ padding: '2px 6px', fontSize: 11 }}
              disabled={selectedCommandIndex === null || selectedCommandIndex >= commands.length - 1}
              onClick={() => {
                if (selectedCommandIndex !== null) handleMoveCommand(selectedCommandIndex, 'down');
              }}
            >
              ▼
            </button>
          </div>
        </div>

        {/* Command Sheet */}
        <div
          className="mz-command-sheet"
          style={{ height: 380, maxHeight: 480, overflowY: 'auto' }}
          tabIndex={0}
          onKeyDown={(e) => {
            if (editingCommandIndex !== null || pickerOpen) return;
            if (e.key === 'Enter') {
              e.preventDefault();
              if (selectedCommandIndex !== null && commands[selectedCommandIndex]) {
                setEditingCommandIndex(selectedCommandIndex);
              } else {
                setPickerOpen(true);
              }
            } else if (e.key === 'Delete') {
              if (selectedCommandIndex !== null && commands[selectedCommandIndex]) {
                handleDeleteCommand(selectedCommandIndex);
              }
            }
          }}
        >
          {commands.map((command, index) => {
            const isSelected = index === selectedCommandIndex;
            return (
              <div key={index} className="mz-command-block">
                <div
                  className={`mz-command-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedCommandIndex(index)}
                  onDoubleClick={() => setEditingCommandIndex(index)}
                >
                  <span className="mz-bullet">◆</span>
                  <span className="mz-cmd-name">{commandName[command.type] || command.type}</span>
                  <span className="mz-cmd-colon">:</span>
                  <span className="mz-cmd-args">{commandPreview(command)}</span>
                </div>

                {/* Nested visual branches */}
                {command.type === 'branch' && (
                  <div className="mz-nested-branch">
                    {command.thenCommands?.map((tc, tcIdx) => (
                      <div key={`then-${tcIdx}`} className="mz-command-row mz-sub-row">
                        <span className="mz-tree-branch">├─</span>
                        <span className="mz-bullet">◆</span>
                        <span className="mz-cmd-name">{commandName[tc.type] || tc.type}</span>
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
                            <span className="mz-cmd-name">{commandName[ec.type] || ec.type}</span>
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
                    {command.commands?.map((lc, lcIdx) => (
                      <div key={`loop-${lcIdx}`} className="mz-command-row mz-sub-row">
                        <span className="mz-tree-branch">├─</span>
                        <span className="mz-bullet">◆</span>
                        <span className="mz-cmd-name">{commandName[lc.type] || lc.type}</span>
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
                    {command.choices?.map((ch, chIdx) => (
                      <div key={`ch-${chIdx}`}>
                        <div className="mz-command-row mz-sub-row mz-branch-label">
                          <span className="mz-tree-branch">├─</span>
                          <span className="mz-bullet">◆</span>
                          <span className="mz-cmd-name">When [{ch.text}]</span>
                        </div>
                        {ch.commands?.map((cc, ccIdx) => (
                          <div key={`choice-cmd-${ccIdx}`} className="mz-command-row mz-sub-row">
                            <span className="mz-tree-branch">│ ├─</span>
                            <span className="mz-bullet">◆</span>
                            <span className="mz-cmd-name">{commandName[cc.type] || cc.type}</span>
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
          {Array.from({ length: Math.max(1, 16 - commands.length) }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="mz-command-row mz-empty-row"
              title="Double click or click + Add Command to insert command"
              onClick={() => setSelectedCommandIndex(commands.length)}
              onDoubleClick={() => {
                setSelectedCommandIndex(commands.length);
                setPickerOpen(true);
              }}
            >
              {i === 0 && <span className="mz-bullet">◆</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Accordion for NUSV Core Advanced Settings (Technical ID & Note) */}
      <div className="mz-advanced-accordion">
        <button
          type="button"
          className="mz-accordion-header"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span>Pengaturan Lanjutan (Advanced Settings)</span>
          <span>{showAdvanced ? '▲' : '▼'}</span>
        </button>

        {showAdvanced && (
          <div className="mz-accordion-content" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label className="mz-label">Technical ID:</label>
              <input
                type="text"
                className="mz-input"
                style={{ width: '100%', maxWidth: 300 }}
                value={commonEvent.id || ''}
                onChange={(e) => onUpdate({ id: e.target.value })}
              />
              <span className="mz-hint" style={{ display: 'block', marginTop: 4 }}>
                ID internal engine untuk event umum ini (contoh: <code>common.0001</code>).
              </span>
            </div>

            <div>
              <label className="mz-label">Note (Catatan):</label>
              <textarea
                className="mz-textarea"
                rows={3}
                style={{ width: '100%' }}
                placeholder="Catatan developer untuk common event ini..."
                value={commonEvent.note || ''}
                onChange={(e) => onUpdate({ note: e.target.value })}
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {pickerOpen && (
        <EventCommandPickerModal
          onSelect={handleAddCommand}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {switchModalOpen && (
        <CommonEventSwitchModal
          currentSwitchId={commonEvent.switchId}
          bundle={bundle}
          onSelect={(switchId) => onUpdate({ switchId })}
          onClose={() => setSwitchModalOpen(false)}
        />
      )}

      {/* Command Edit Popover Modal */}
      {editingCommandIndex !== null && commands[editingCommandIndex] && (
        <div className="mz-modal-overlay" onClick={() => setEditingCommandIndex(null)}>
          <div className="mz-modal" style={{ width: 560, maxHeight: 600, overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div className="mz-modal-header">
              <span className="mz-modal-title">
                Edit Command #{editingCommandIndex + 1}: {commandName[commands[editingCommandIndex].type] || commands[editingCommandIndex].type}
              </span>
              <button type="button" className="mz-btn-close" onClick={() => setEditingCommandIndex(null)}>×</button>
            </div>
            <div className="mz-modal-body">
              <CommandFields
                command={commands[editingCommandIndex]}
                bundle={bundle}
                onChange={(cmd) => handleUpdateCommand(editingCommandIndex, cmd)}
                assetUrls={assetUrlMap}
              />
            </div>
            <div className="mz-modal-footer">
              <button
                type="button"
                className="mz-btn mz-btn-primary"
                onClick={() => setEditingCommandIndex(null)}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
