import React, { useState, useMemo } from 'react';
import type { ProjectBundle, GameData, TermsData } from '../core/types.js';

export interface TermFieldDef {
  index: number;
  label: string;
  defaultVal: string;
}

export const BASIC_STATUS_FIELDS: TermFieldDef[] = [
  { index: 0, label: 'Level:', defaultVal: 'Level' },
  { index: 1, label: 'Level (abbr.):', defaultVal: 'Lv' },
  { index: 2, label: 'HP:', defaultVal: 'HP' },
  { index: 3, label: 'HP (abbr.):', defaultVal: 'HP' },
  { index: 4, label: 'MP:', defaultVal: 'MP' },
  { index: 5, label: 'MP (abbr.):', defaultVal: 'MP' },
  { index: 6, label: 'TP:', defaultVal: 'TP' },
  { index: 7, label: 'TP (abbr.):', defaultVal: 'TP' },
  { index: 8, label: 'EXP:', defaultVal: 'EXP' },
  { index: 9, label: 'EXP (abbr.):', defaultVal: 'EXP' }
];

export const PARAM_FIELDS: TermFieldDef[] = [
  { index: 0, label: 'Max HP:', defaultVal: 'Max HP' },
  { index: 1, label: 'Max MP:', defaultVal: 'Max MP' },
  { index: 2, label: 'Attack:', defaultVal: 'Attack' },
  { index: 3, label: 'Defense:', defaultVal: 'Defense' },
  { index: 4, label: 'M.Attack:', defaultVal: 'M.Attack' },
  { index: 5, label: 'M.Defense:', defaultVal: 'M.Defense' },
  { index: 6, label: 'Agility:', defaultVal: 'Agility' },
  { index: 7, label: 'Luck:', defaultVal: 'Luck' },
  { index: 8, label: 'Hit Rate:', defaultVal: 'Hit' },
  { index: 9, label: 'Evasion Rate:', defaultVal: 'Evasion' }
];

export const COMMAND_FIELDS: TermFieldDef[] = [
  // Row 1
  { index: 0, label: 'Fight:', defaultVal: 'Fight' },
  { index: 1, label: 'Escape:', defaultVal: 'Escape' },
  { index: 2, label: 'Attack:', defaultVal: 'Attack' },
  { index: 3, label: 'Guard:', defaultVal: 'Guard' },
  // Row 2
  { index: 4, label: 'Item:', defaultVal: 'Item' },
  { index: 5, label: 'Skill:', defaultVal: 'Skill' },
  { index: 6, label: 'Equip:', defaultVal: 'Equip' },
  { index: 7, label: 'Status:', defaultVal: 'Status' },
  // Row 3
  { index: 8, label: 'Formation:', defaultVal: 'Formation' },
  { index: 9, label: 'Options:', defaultVal: 'Options' },
  { index: 10, label: 'Save:', defaultVal: 'Save' },
  { index: 11, label: 'Game End:', defaultVal: 'Game End' },
  // Row 4
  { index: 12, label: 'Weapon:', defaultVal: 'Weapon' },
  { index: 13, label: 'Armor:', defaultVal: 'Armor' },
  { index: 14, label: 'Key Item:', defaultVal: 'Key Item' },
  { index: 15, label: 'Equip:', defaultVal: 'Equip' },
  // Row 5
  { index: 16, label: 'Optimize:', defaultVal: 'Optimize' },
  { index: 17, label: 'Clear:', defaultVal: 'Clear' },
  { index: 18, label: 'Buy:', defaultVal: 'Buy' },
  { index: 19, label: 'Sell:', defaultVal: 'Sell' },
  // Row 6
  { index: 20, label: 'New Game:', defaultVal: 'New Game' },
  { index: 21, label: 'Continue:', defaultVal: 'Continue' },
  { index: 22, label: 'To Title:', defaultVal: 'To Title' },
  { index: 23, label: 'Cancel:', defaultVal: 'Cancel' }
];

export const DEFAULT_MESSAGES: Array<{ key: string; label: string; defaultVal: string }> = [
  { key: 'alwaysDash', label: 'Always Dash', defaultVal: 'Always Dash' },
  { key: 'commandRemember', label: 'Command Remember', defaultVal: 'Command Remember' },
  { key: 'touchUi', label: 'Touch UI', defaultVal: 'Touch UI' },
  { key: 'bgmVolume', label: 'BGM Volume', defaultVal: 'BGM Volume' },
  { key: 'bgsVolume', label: 'BGS Volume', defaultVal: 'BGS Volume' },
  { key: 'meVolume', label: 'ME Volume', defaultVal: 'ME Volume' },
  { key: 'seVolume', label: 'SE Volume', defaultVal: 'SE Volume' },
  { key: 'possession', label: 'Possession', defaultVal: 'Possession' },
  { key: 'expTotal', label: 'EXP Total', defaultVal: 'Current %1' },
  { key: 'expNext', label: 'EXP Next', defaultVal: 'To Next %1' },
  { key: 'saveMessage', label: 'Save Message', defaultVal: 'Which file would you like to save to?' },
  { key: 'loadMessage', label: 'Load Message', defaultVal: 'Which file would you like to load?' },
  { key: 'file', label: 'File', defaultVal: 'File' },
  { key: 'autosave', label: 'Autosave', defaultVal: 'Autosave' },
  { key: 'partyName', label: 'Party Name', defaultVal: "%1's Party" },
  { key: 'emerge', label: 'Emerge', defaultVal: '%1 emerged!' },
  { key: 'preemptive', label: 'Preemptive', defaultVal: '%1 got the upper hand!' },
  { key: 'surprise', label: 'Surprise', defaultVal: '%1 was surprised!' },
  { key: 'escapeStart', label: 'Escape Start', defaultVal: '%1 has started to escape!' },
  { key: 'escapeFailure', label: 'Escape Failure', defaultVal: 'However, it was unable to escape!' },
  { key: 'victory', label: 'Victory', defaultVal: '%1 was victorious!' },
  { key: 'defeat', label: 'Defeat', defaultVal: '%1 was defeated.' },
  { key: 'obtainExp', label: 'Obtain EXP', defaultVal: '%1 %2 received!' },
  { key: 'obtainGold', label: 'Obtain Gold', defaultVal: '%1\\G found!' },
  { key: 'obtainItem', label: 'Obtain Item', defaultVal: '%1 found!' },
  { key: 'levelUp', label: 'Level Up', defaultVal: '%1 is now %2 %3!' },
  { key: 'obtainSkill', label: 'Obtain Skill', defaultVal: '%1 learned!' },
  { key: 'useItem', label: 'Use Item', defaultVal: '%1 uses %2!' },
  { key: 'criticalToEnemy', label: 'Critical to Enemy', defaultVal: 'An excellent hit!!' },
  { key: 'criticalToActor', label: 'Critical to Actor', defaultVal: 'A painful blow!!' },
  { key: 'actorDamage', label: 'Actor Damage', defaultVal: '%1 took %2 damage!' },
  { key: 'actorRecovery', label: 'Actor Recovery', defaultVal: '%1 recovered %2 %3!' },
  { key: 'actorGain', label: 'Actor Gain', defaultVal: '%1 gained %2 %3!' },
  { key: 'actorLoss', label: 'Actor Loss', defaultVal: '%1 lost %2 %3!' },
  { key: 'actorDrain', label: 'Actor Drain', defaultVal: '%1 was drained of %2 %3!' },
  { key: 'actorNoDamage', label: 'Actor No Damage', defaultVal: '%1 took no damage!' },
  { key: 'actorNoHit', label: 'Actor No Hit', defaultVal: 'Miss! %1 took no damage!' },
  { key: 'enemyDamage', label: 'Enemy Damage', defaultVal: '%1 took %2 damage!' },
  { key: 'enemyRecovery', label: 'Enemy Recovery', defaultVal: '%1 recovered %2 %3!' },
  { key: 'enemyGain', label: 'Enemy Gain', defaultVal: '%1 gained %2 %3!' },
  { key: 'enemyLoss', label: 'Enemy Loss', defaultVal: '%1 lost %2 %3!' },
  { key: 'enemyDrain', label: 'Enemy Drain', defaultVal: '%1 was drained of %2 %3!' },
  { key: 'enemyNoDamage', label: 'Enemy No Damage', defaultVal: '%1 took no damage!' },
  { key: 'enemyNoHit', label: 'Enemy No Hit', defaultVal: 'Miss! %1 took no damage!' },
  { key: 'evasion', label: 'Evasion', defaultVal: '%1 evaded the attack!' },
  { key: 'magicEvasion', label: 'Magic Evasion', defaultVal: '%1 nullified the magic!' },
  { key: 'magicReflection', label: 'Magic Reflection', defaultVal: '%1 reflected the magic!' },
  { key: 'counterAttack', label: 'Counter Attack', defaultVal: '%1 counterattacked!' },
  { key: 'substitute', label: 'Substitute', defaultVal: '%1 protected %2!' },
  { key: 'buffAdd', label: 'Buff Add', defaultVal: "%1's %2 went up!" },
  { key: 'debuffAdd', label: 'Debuff Add', defaultVal: "%1's %2 went down!" },
  { key: 'buffRemove', label: 'Buff Remove', defaultVal: "%1's %2 returned to normal!" },
  { key: 'actionFailure', label: 'Action Failure', defaultVal: 'There was no effect on %1!' }
];

// ------------------------------------------------------------------------------------------------
// Edit Message Modal
// ------------------------------------------------------------------------------------------------

interface EditMessageModalProps {
  label: string;
  initialValue: string;
  onSave: (val: string) => void;
  onClose: () => void;
}

export function EditMessageModal({ label, initialValue, onSave, onClose }: EditMessageModalProps) {
  const [val, setVal] = useState(initialValue);

  return (
    <div className="mv-modal-backdrop" onClick={onClose}>
      <div className="mv-modal" style={{ width: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="mv-modal-header">
          <span>Edit Message: {label}</span>
          <button type="button" className="mv-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="mv-modal-body" style={{ padding: 16 }}>
          <label className="mz-form-field">
            <span style={{ fontSize: 11, fontWeight: 600, color: '#475569' }}>Format Text:</span>
            <input
              type="text"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              autoFocus
              style={{ width: '100%', padding: '6px 8px', fontSize: 13 }}
            />
          </label>
        </div>
        <div className="mv-modal-footer">
          <button type="button" className="primary" onClick={() => { onSave(val); onClose(); }}>
            OK
          </button>
          <button type="button" onClick={onClose}>Batal</button>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------------------------------------
// Terms Editor Component (Matches media_1795528326248_57e5ec2e.jpg)
// ------------------------------------------------------------------------------------------------

export function TermsEditor({
  bundle,
  onUpdateGame
}: {
  bundle: ProjectBundle;
  onUpdateGame: (patch: Partial<GameData>) => void;
}) {
  const terms: TermsData = useMemo(() => bundle.game.terms || {}, [bundle.game.terms]);

  // Read arrays with defaults
  const basic = useMemo(() => {
    const list = [...(terms.basic || [])];
    BASIC_STATUS_FIELDS.forEach((f) => {
      if (list[f.index] === undefined) list[f.index] = f.defaultVal;
    });
    return list;
  }, [terms.basic]);

  const params = useMemo(() => {
    const list = [...(terms.params || [])];
    PARAM_FIELDS.forEach((f) => {
      if (list[f.index] === undefined) list[f.index] = f.defaultVal;
    });
    return list;
  }, [terms.params]);

  const commands = useMemo(() => {
    const list = [...(terms.commands || [])];
    COMMAND_FIELDS.forEach((f) => {
      if (list[f.index] === undefined) list[f.index] = f.defaultVal;
    });
    return list;
  }, [terms.commands]);

  const messages = useMemo(() => {
    const map: Record<string, string> = { ...(terms.messages || {}) };
    DEFAULT_MESSAGES.forEach((m) => {
      if (map[m.key] === undefined) map[m.key] = m.defaultVal;
    });
    return map;
  }, [terms.messages]);

  // Message selection state for right card
  const [selectedMessageKey, setSelectedMessageKey] = useState<string>(DEFAULT_MESSAGES[0]?.key || 'alwaysDash');
  const [editModal, setEditModal] = useState<{ open: boolean; key: string; label: string; text: string }>({
    open: false,
    key: '',
    label: '',
    text: ''
  });

  // Accordion for advanced non-MZ settings
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Update handlers
  const handleUpdateBasic = (index: number, val: string) => {
    const nextList = [...basic];
    nextList[index] = val;
    onUpdateGame({ terms: { ...terms, basic: nextList } });
  };

  const handleUpdateParam = (index: number, val: string) => {
    const nextList = [...params];
    nextList[index] = val;
    onUpdateGame({ terms: { ...terms, params: nextList } });
  };

  const handleUpdateCommand = (index: number, val: string) => {
    const nextList = [...commands];
    nextList[index] = val;
    onUpdateGame({ terms: { ...terms, commands: nextList } });
  };

  const handleUpdateMessage = (key: string, val: string) => {
    const nextMsgs = { ...messages, [key]: val };
    onUpdateGame({ terms: { ...terms, messages: nextMsgs } });
  };

  const activeMsgDef = DEFAULT_MESSAGES.find((m) => m.key === selectedMessageKey);
  const activeMsgText = messages[selectedMessageKey] ?? activeMsgDef?.defaultVal ?? '';

  return (
    <section className="mz-db-content mz-db-system-pane" style={{ padding: 12 }}>
      {/* 2-Column Main Layout: Left (Basic Statuses, Parameters, Commands) & Right (Messages) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 12 }}>
        {/* =========================================================================
            LEFT COLUMN: Basic Statuses, Parameters, Commands
           ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Top: Basic Statuses & Parameters side-by-side */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {/* Basic Statuses */}
            <div className="mz-form-card" style={{ padding: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                Basic Statuses
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px' }}>
                {BASIC_STATUS_FIELDS.map((f) => (
                  <label key={f.index} className="mz-form-field" style={{ margin: 0 }}>
                    <span style={{ fontSize: 10, color: '#475569' }}>{f.label}</span>
                    <input
                      type="text"
                      value={basic[f.index] ?? ''}
                      onChange={(e) => handleUpdateBasic(f.index, e.target.value)}
                      style={{ padding: '3px 6px', fontSize: 11 }}
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Parameters */}
            <div className="mz-form-card" style={{ padding: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
                Parameters
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 8px' }}>
                {PARAM_FIELDS.map((f) => (
                  <label key={f.index} className="mz-form-field" style={{ margin: 0 }}>
                    <span style={{ fontSize: 10, color: '#475569' }}>{f.label}</span>
                    <input
                      type="text"
                      value={params[f.index] ?? ''}
                      onChange={(e) => handleUpdateParam(f.index, e.target.value)}
                      style={{ padding: '3px 6px', fontSize: 11 }}
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom: Commands (4 columns x 6 rows) */}
          <div className="mz-form-card" style={{ padding: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Commands
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px 8px' }}>
              {COMMAND_FIELDS.map((f) => (
                <label key={f.index} className="mz-form-field" style={{ margin: 0 }}>
                  <span style={{ fontSize: 10, color: '#475569' }}>{f.label}</span>
                  <input
                    type="text"
                    value={commands[f.index] ?? ''}
                    onChange={(e) => handleUpdateCommand(f.index, e.target.value)}
                    style={{ padding: '3px 6px', fontSize: 11 }}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* =========================================================================
            RIGHT COLUMN: Messages Table + Edit Bar
           ========================================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="mz-form-card" style={{ padding: 10, display: 'flex', flexDirection: 'column', height: '100%' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#334155', display: 'block', marginBottom: 6 }}>
              Messages
            </span>

            {/* Scrollable Messages Table */}
            <div
              style={{
                flex: 1,
                minHeight: 380,
                maxHeight: 440,
                overflowY: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: 3,
                background: '#ffffff'
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ padding: '4px 6px', width: '35%' }}>Type</th>
                    <th style={{ padding: '4px 6px' }}>Text</th>
                  </tr>
                </thead>
                <tbody>
                  {DEFAULT_MESSAGES.map((msg, idx) => {
                    const isSelected = msg.key === selectedMessageKey;
                    const textVal = messages[msg.key] ?? msg.defaultVal;
                    const isEven = idx % 2 === 0;

                    return (
                      <tr
                        key={msg.key}
                        onClick={() => setSelectedMessageKey(msg.key)}
                        onDoubleClick={() =>
                          setEditModal({
                            open: true,
                            key: msg.key,
                            label: msg.label,
                            text: textVal
                          })
                        }
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? '#0078d7' : isEven ? '#ffffff' : '#f8fafc',
                          color: isSelected ? '#ffffff' : '#0f172a',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        <td
                          style={{
                            padding: '3px 6px',
                            fontWeight: isSelected ? 600 : 500,
                            color: isSelected ? '#ffffff' : '#475569'
                          }}
                        >
                          {msg.label}
                        </td>
                        <td
                          style={{
                            padding: '3px 6px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {textVal}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Edit Bar for Selected Message */}
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#475569' }}>
                <span style={{ fontWeight: 600 }}>Edit: {activeMsgDef?.label}</span>
                <span style={{ fontSize: 10, color: '#94a3b8' }}>Double-click baris untuk modal</span>
              </div>
              <input
                type="text"
                value={activeMsgText}
                onChange={(e) => handleUpdateMessage(selectedMessageKey, e.target.value)}
                style={{ width: '100%', padding: '5px 8px', fontSize: 12, border: '1px solid #94a3b8', borderRadius: 3 }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOTTOM ACCORDION: Advanced / Non-MZ Terms Settings
         ========================================================================= */}
      <div className="mz-advanced-accordion" style={{ marginTop: 14 }}>
        <button
          type="button"
          className="mz-accordion-header"
          onClick={() => setAdvancedOpen(!advancedOpen)}
        >
          <span>⚙ Pengaturan Lanjutan (Advanced Terms Settings)</span>
          <span>{advancedOpen ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
        </button>

        {advancedOpen && (
          <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <label className="mz-form-field">
              <span>Bahasa Utama Permainan (Active Locale):</span>
              <select defaultValue="en">
                <option value="en">English (Default)</option>
                <option value="id">Bahasa Indonesia</option>
                <option value="ja">日本語 (Japanese)</option>
              </select>
            </label>
            <label className="mz-form-field">
              <span>Format Variabel Pesan (Message Variable Syntax):</span>
              <select defaultValue="percent">
                <option value="percent">RPG Maker Standard (%1, %2, \G, \V[n])</option>
                <option value="brace">Template Literals ({'{0}'}, {'{1}'})</option>
              </select>
            </label>
          </div>
        )}
      </div>

      {/* Double click Edit Message Modal */}
      {editModal.open && (
        <EditMessageModal
          label={editModal.label}
          initialValue={editModal.text}
          onSave={(val) => handleUpdateMessage(editModal.key, val)}
          onClose={() => setEditModal({ open: false, key: '', label: '', text: '' })}
        />
      )}
    </section>
  );
}
