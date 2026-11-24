import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import type {
  TroopData,
  TroopMember,
  TroopPage,
  TroopPageConditions
} from '../core/combat-types.js';
import type { EventCommand, ProjectBundle } from '../core/types.js';
import { EventCommandPickerModal } from './modals/EventCommandPickerModal.js';
import { commandName, commandPreview, createCommand } from './events/eventCommands.js';
import { autoResolveEncounter } from '../core/simulation.js';

// Default Battleback assets
export const DEFAULT_BATTLEBACKS_1 = [
  'Castle1', 'Castle2', 'Castle3', 'Cobblestones1', 'Cobblestones2',
  'Colosseum', 'Crystal', 'Cyberspace', 'DemonCastle1', 'Desert',
  'Dirt', 'DirtCave', 'DirtField', 'Fort1', 'Fort2', 'Grassland',
  'GrassMaze', 'Ground1', 'Ground2', 'IceCave', 'Lava', 'PoisonSwamp',
  'RockCave', 'Ship', 'Snow', 'Snowfield', 'Wasteland', 'Water1'
];

export const DEFAULT_BATTLEBACKS_2 = [
  'Brick', 'Bridge', 'Castle1', 'Castle2', 'Castle3', 'Cliff',
  'Clouds', 'Colosseum', 'Crystal', 'Cyberspace', 'DarkSpace',
  'DemonCastle1', 'DemonicWorld', 'Desert', 'DirtCave', 'Forest',
  'Fort1', 'Fort2', 'Grassland', 'GrassMaze', 'IceCave', 'IceMaze',
  'Lava', 'LavaCave', 'PoisonSwamp', 'Port', 'RockCave', 'Ruins1',
  'Ruins2', 'Ship', 'Snow', 'Town1', 'Town2', 'Wasteland'
];

// Helper to format conditions string
export function formatTroopConditions(
  conds: TroopPageConditions | undefined,
  troop: TroopData,
  bundle: ProjectBundle
): string {
  if (!conds) return "Don't Run";
  const parts: string[] = [];

  if (conds.turnValid) {
    const a = conds.turnA ?? 0;
    const b = conds.turnB ?? 0;
    parts.push(`Turn ${a}${b > 0 ? ` + ${b}*X` : ''}`);
  }
  if (conds.enemyValid) {
    const idx = conds.enemyIndex ?? 0;
    const enemyId = troop.enemyIds[idx] || troop.members?.[idx]?.enemyId;
    const enemy = bundle.game.enemies.find((e) => e.id === enemyId);
    const name = enemy?.name || `#${idx + 1}`;
    parts.push(`Enemy [${name}] HP <= ${conds.enemyHp ?? 50}%`);
  }
  if (conds.actorValid) {
    const act = bundle.game.actors.find((a) => a.id === conds.actorId);
    const name = act?.name || conds.actorId || 'Actor';
    parts.push(`Actor [${name}] HP <= ${conds.actorHp ?? 50}%`);
  }
  if (conds.switchValid) {
    parts.push(`Switch [${conds.switchId || 'switch'}] is ON`);
  }
  if (conds.turnEnding) {
    parts.push('Turn Ending');
  }

  return parts.length > 0 ? parts.join(', ') : "Don't Run";
}

// ============================================================================
// Modal: Battleback Picker
// ============================================================================
export function TroopBattlebackModal({
  currentBb1,
  currentBb2,
  assetUrlMap = {},
  onConfirm,
  onClose
}: {
  currentBb1?: string;
  currentBb2?: string;
  assetUrlMap?: Record<string, string>;
  onConfirm: (bb1: string, bb2: string) => void;
  onClose: () => void;
}) {
  const listBb1 = useMemo(() => {
    const found: string[] = [];
    for (const k of Object.keys(assetUrlMap)) {
      if (k.startsWith('assets/battlebacks1/')) {
        const fn = k.split('/').pop()?.replace(/\.png$/i, '');
        if (fn && !found.includes(fn)) found.push(fn);
      }
    }
    return found.length > 0 ? found.sort() : DEFAULT_BATTLEBACKS_1;
  }, [assetUrlMap]);

  const listBb2 = useMemo(() => {
    const found: string[] = [];
    for (const k of Object.keys(assetUrlMap)) {
      if (k.startsWith('assets/battlebacks2/')) {
        const fn = k.split('/').pop()?.replace(/\.png$/i, '');
        if (fn && !found.includes(fn)) found.push(fn);
      }
    }
    return found.length > 0 ? found.sort() : DEFAULT_BATTLEBACKS_2;
  }, [assetUrlMap]);

  const [selectedBb1, setSelectedBb1] = useState<string>(
    currentBb1 ? currentBb1.replace(/\.png$/i, '').split('/').pop()! : listBb1[0] || 'Grassland'
  );
  const [selectedBb2, setSelectedBb2] = useState<string>(
    currentBb2 ? currentBb2.replace(/\.png$/i, '').split('/').pop()! : listBb2[0] || 'Grassland'
  );

  const urlBb1 =
    assetUrlMap[`assets/battlebacks1/${selectedBb1}.png`] ||
    assetUrlMap[selectedBb1] ||
    '';
  const urlBb2 =
    assetUrlMap[`assets/battlebacks2/${selectedBb2}.png`] ||
    assetUrlMap[selectedBb2] ||
    '';

  const handleSave = () => {
    onConfirm(selectedBb1, selectedBb2);
  };

  return (
    <div className="mz-modal-overlay">
      <div className="mz-modal-dialog" style={{ width: 680, maxWidth: '95vw' }}>
        <div className="mz-modal-header">
          <h3 className="mz-modal-title">Battle Background</h3>
          <button type="button" className="mz-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="mz-modal-body" style={{ display: 'grid', gridTemplateColumns: '160px 160px 1fr', gap: 12 }}>
          {/* Battleback 1 List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>Battleback 1 (Floor):</span>
            <div
              style={{
                height: 240,
                overflowY: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                background: '#fff'
              }}
            >
              {listBb1.map((b) => (
                <div
                  key={b}
                  onClick={() => setSelectedBb1(b)}
                  style={{
                    padding: '3px 6px',
                    fontSize: 11,
                    cursor: 'pointer',
                    background: selectedBb1 === b ? '#2563eb' : 'transparent',
                    color: selectedBb1 === b ? '#fff' : '#1e293b'
                  }}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Battleback 2 List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>Battleback 2 (Scenery):</span>
            <div
              style={{
                height: 240,
                overflowY: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                background: '#fff'
              }}
            >
              {listBb2.map((b) => (
                <div
                  key={b}
                  onClick={() => setSelectedBb2(b)}
                  style={{
                    padding: '3px 6px',
                    fontSize: 11,
                    cursor: 'pointer',
                    background: selectedBb2 === b ? '#2563eb' : 'transparent',
                    color: selectedBb2 === b ? '#fff' : '#1e293b'
                  }}
                >
                  {b}
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 11, fontWeight: 700 }}>Preview:</span>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 240,
                border: '1px solid #94a3b8',
                borderRadius: 4,
                overflow: 'hidden',
                background: '#1e293b'
              }}
            >
              {urlBb1 && (
                <img
                  src={urlBb1}
                  alt={selectedBb1}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              )}
              {urlBb2 && (
                <img
                  src={urlBb2}
                  alt={selectedBb2}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
              )}
            </div>
          </div>
        </div>

        <div className="mz-modal-footer">
          <button type="button" className="mz-btn mz-btn-primary" onClick={handleSave}>
            OK
          </button>
          <button type="button" className="mz-btn mz-btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Modal: Troop Page Conditions
// ============================================================================
export function TroopConditionsModal({
  currentConds,
  troop,
  bundle,
  onConfirm,
  onClose
}: {
  currentConds?: TroopPageConditions;
  troop: TroopData;
  bundle: ProjectBundle;
  onConfirm: (conds: TroopPageConditions) => void;
  onClose: () => void;
}) {
  const [turnValid, setTurnValid] = useState<boolean>(currentConds?.turnValid ?? false);
  const [turnA, setTurnA] = useState<number>(currentConds?.turnA ?? 0);
  const [turnB, setTurnB] = useState<number>(currentConds?.turnB ?? 0);

  const [enemyValid, setEnemyValid] = useState<boolean>(currentConds?.enemyValid ?? false);
  const [enemyIndex, setEnemyIndex] = useState<number>(currentConds?.enemyIndex ?? 0);
  const [enemyHp, setEnemyHp] = useState<number>(currentConds?.enemyHp ?? 50);

  const [actorValid, setActorValid] = useState<boolean>(currentConds?.actorValid ?? false);
  const [actorId, setActorId] = useState<string>(
    currentConds?.actorId || bundle.game.actors[0]?.id || ''
  );
  const [actorHp, setActorHp] = useState<number>(currentConds?.actorHp ?? 50);

  const [switchValid, setSwitchValid] = useState<boolean>(currentConds?.switchValid ?? false);
  const [switchId, setSwitchId] = useState<string>(currentConds?.switchId || 'switch.0001');

  const [turnEnding, setTurnEnding] = useState<boolean>(currentConds?.turnEnding ?? false);

  const handleSave = () => {
    onConfirm({
      turnValid,
      turnA: Number(turnA) || 0,
      turnB: Number(turnB) || 0,
      enemyValid,
      enemyIndex: Number(enemyIndex) || 0,
      enemyHp: Number(enemyHp) || 50,
      actorValid,
      actorId,
      actorHp: Number(actorHp) || 50,
      switchValid,
      switchId,
      turnEnding
    });
  };

  return (
    <div className="mz-modal-overlay">
      <div className="mz-modal-dialog" style={{ width: 440, maxWidth: '95vw' }}>
        <div className="mz-modal-header">
          <h3 className="mz-modal-title">Conditions</h3>
          <button type="button" className="mz-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="mz-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Turn */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <input
              type="checkbox"
              id="cond-turn"
              checked={turnValid}
              onChange={(e) => setTurnValid(e.target.checked)}
            />
            <label htmlFor="cond-turn" style={{ width: 60, fontWeight: 600 }}>
              Turn:
            </label>
            <input
              type="number"
              min={0}
              disabled={!turnValid}
              value={turnA}
              onChange={(e) => setTurnA(Number(e.target.value))}
              style={{ width: 60 }}
            />
            <span>+</span>
            <input
              type="number"
              min={0}
              disabled={!turnValid}
              value={turnB}
              onChange={(e) => setTurnB(Number(e.target.value))}
              style={{ width: 60 }}
            />
            <span>* X</span>
          </div>

          {/* Enemy HP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <input
              type="checkbox"
              id="cond-enemy"
              checked={enemyValid}
              onChange={(e) => setEnemyValid(e.target.checked)}
            />
            <label htmlFor="cond-enemy" style={{ width: 60, fontWeight: 600 }}>
              Enemy HP:
            </label>
            <select
              disabled={!enemyValid}
              value={enemyIndex}
              onChange={(e) => setEnemyIndex(Number(e.target.value))}
              style={{ flex: 1 }}
            >
              {troop.enemyIds.map((eId, idx) => {
                const enemy = bundle.game.enemies.find((e) => e.id === eId);
                return (
                  <option key={idx} value={idx}>
                    #{idx + 1}: {enemy?.name || eId}
                  </option>
                );
              })}
            </select>
            <span>&lt;=</span>
            <input
              type="number"
              min={0}
              max={100}
              disabled={!enemyValid}
              value={enemyHp}
              onChange={(e) => setEnemyHp(Number(e.target.value))}
              style={{ width: 55 }}
            />
            <span>%</span>
          </div>

          {/* Actor HP */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <input
              type="checkbox"
              id="cond-actor"
              checked={actorValid}
              onChange={(e) => setActorValid(e.target.checked)}
            />
            <label htmlFor="cond-actor" style={{ width: 60, fontWeight: 600 }}>
              Actor HP:
            </label>
            <select
              disabled={!actorValid}
              value={actorId}
              onChange={(e) => setActorId(e.target.value)}
              style={{ flex: 1 }}
            >
              {bundle.game.actors.map((act) => (
                <option key={act.id} value={act.id}>
                  {act.name}
                </option>
              ))}
            </select>
            <span>&lt;=</span>
            <input
              type="number"
              min={0}
              max={100}
              disabled={!actorValid}
              value={actorHp}
              onChange={(e) => setActorHp(Number(e.target.value))}
              style={{ width: 55 }}
            />
            <span>%</span>
          </div>

          {/* Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <input
              type="checkbox"
              id="cond-switch"
              checked={switchValid}
              onChange={(e) => setSwitchValid(e.target.checked)}
            />
            <label htmlFor="cond-switch" style={{ width: 60, fontWeight: 600 }}>
              Switch:
            </label>
            <input
              type="text"
              disabled={!switchValid}
              value={switchId}
              onChange={(e) => setSwitchId(e.target.value)}
              placeholder="switch.id"
              style={{ flex: 1 }}
            />
            <span>is ON</span>
          </div>

          {/* Turn Ending */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <input
              type="checkbox"
              id="cond-turn-end"
              checked={turnEnding}
              onChange={(e) => setTurnEnding(e.target.checked)}
            />
            <label htmlFor="cond-turn-end" style={{ fontWeight: 600, cursor: 'pointer' }}>
              Turn Ending
            </label>
          </div>
        </div>

        <div className="mz-modal-footer">
          <button type="button" className="mz-btn mz-btn-primary" onClick={handleSave}>
            OK
          </button>
          <button type="button" className="mz-btn mz-btn-secondary" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Modal: Troop Battle Test Simulation
// ============================================================================
export function TroopBattleTestModal({
  troop,
  bundle,
  onClose
}: {
  troop: TroopData;
  bundle: ProjectBundle;
  onClose: () => void;
}) {
  const [simulationLog, setSimulationLog] = useState<string[]>([]);
  const [status, setStatus] = useState<string>('idle');

  const runSimulation = () => {
    try {
      const party = bundle.project.party.slice(0, 4);
      const mockProgress: any = {
        formation: party,
        actorResources: Object.fromEntries(
          party.map((id) => [id, { hp: 100, mp: 50, sp: 50 }])
        ),
        actorProgress: Object.fromEntries(
          party.map((id) => [
            id,
            {
              baseLevel: 1,
              baseExp: 0,
              unspentStatPoints: 0,
              allocated: { str: 0, int: 0, dex: 0, luk: 0, agi: 0, vit: 0 },
              equipment: {},
              activeClassId: bundle.game.actors.find((a) => a.id === id)?.classId || 'class.squire',
              classes: {
                class_default: { level: 1, exp: 0, tier: 1 }
              }
            }
          ])
        ),
        inventory: {}
      };

      const result = autoResolveEncounter(bundle.game, mockProgress, troop.id, 12345);
      setStatus(result.status);
      setSimulationLog(result.log || []);
    } catch (err: any) {
      setStatus('error');
      setSimulationLog([`Simulation error: ${err.message}`]);
    }
  };

  useEffect(() => {
    runSimulation();
  }, [troop.id]);

  return (
    <div className="mz-modal-overlay">
      <div className="mz-modal-dialog" style={{ width: 560, maxWidth: '95vw' }}>
        <div className="mz-modal-header">
          <h3 className="mz-modal-title">Battle Test: {troop.name}</h3>
          <button type="button" className="mz-modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="mz-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12 }}>
              Result:{' '}
              <strong
                style={{
                  color: status === 'victory' ? '#16a34a' : status === 'defeat' ? '#dc2626' : '#2563eb'
                }}
              >
                {status.toUpperCase()}
              </strong>
            </span>
            <button type="button" className="mz-btn-small" onClick={runSimulation}>
              Re-run Test
            </button>
          </div>

          <div
            style={{
              height: 260,
              overflowY: 'auto',
              background: '#0f172a',
              color: '#e2e8f0',
              fontFamily: 'monospace',
              fontSize: 11,
              padding: 10,
              borderRadius: 4,
              border: '1px solid #334155'
            }}
          >
            {simulationLog.map((line, idx) => (
              <div key={idx} style={{ marginBottom: 3 }}>
                {line}
              </div>
            ))}
          </div>
        </div>

        <div className="mz-modal-footer">
          <button type="button" className="mz-btn mz-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Form: Troop Detail Form (Matches RPG Maker MZ Layout)
// ============================================================================
export function TroopDetailForm({
  troop,
  bundle,
  onUpdate,
  assetUrlMap = {}
}: {
  troop: TroopData;
  bundle: ProjectBundle;
  onUpdate: (patch: Record<string, unknown>) => void;
  assetUrlMap?: Record<string, string>;
}) {
  const [bgModalOpen, setBgModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [conditionsModalOpen, setConditionsModalOpen] = useState(false);
  const [commandPickerOpen, setCommandPickerOpen] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Selected enemy from the right-hand database list
  const [selectedListEnemyId, setSelectedListEnemyId] = useState<string>(
    bundle.game.enemies[0]?.id || ''
  );

  // Selected troop member on the canvas (0..N-1)
  const [selectedMemberIdx, setSelectedMemberIdx] = useState<number | null>(null);

  // Active Battle Event page index (0..pages.length - 1)
  const [activePageIndex, setActivePageIndex] = useState<number>(0);

  // Clipboard for Event Page copy/paste
  const [pageClipboard, setPageClipboard] = useState<TroopPage | null>(null);

  // Dragging state on battlefield canvas
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragMemberIdx, setDragMemberIdx] = useState<number | null>(null);

  // Normalize members list (ensure every member has x, y)
  const members: TroopMember[] = useMemo(() => {
    if (Array.isArray(troop.members) && troop.members.length > 0) {
      return troop.members;
    }
    // Fallback from enemyIds
    const eIds = Array.isArray(troop.enemyIds) ? troop.enemyIds : [];
    return eIds.map((id, idx) => ({
      enemyId: id,
      x: 180 + idx * 100,
      y: 280,
      hidden: false
    }));
  }, [troop.members, troop.enemyIds]);

  // Normalize pages list (ensure at least 1 page)
  const pages: TroopPage[] = useMemo(() => {
    if (Array.isArray(troop.pages) && troop.pages.length > 0) {
      return troop.pages;
    }
    return [
      {
        conditions: { turnEnding: false },
        span: 'battle',
        commands: []
      }
    ];
  }, [troop.pages]);

  const activePage = pages[activePageIndex] || pages[0];

  // Battleback images
  const bb1Name = troop.battleback1Name || troop.battleback1 || 'Grassland';
  const bb2Name = troop.battleback2Name || troop.battleback2 || 'Grassland';

  const urlBb1 =
    assetUrlMap[`assets/battlebacks1/${bb1Name}.png`] ||
    assetUrlMap[bb1Name] ||
    '';
  const urlBb2 =
    assetUrlMap[`assets/battlebacks2/${bb2Name}.png`] ||
    assetUrlMap[bb2Name] ||
    '';

  // Handle Auto-name
  const handleAutoName = () => {
    const counts: Record<string, number> = {};
    members.forEach((m) => {
      const enemyObj = bundle.game.enemies.find((e) => e.id === m.enemyId);
      const name = enemyObj?.name || m.enemyId;
      counts[name] = (counts[name] || 0) + 1;
    });
    const autoTitle = Object.entries(counts)
      .map(([nm, cnt]) => (cnt > 1 ? `${nm}*${cnt}` : nm))
      .join(', ');
    if (autoTitle) onUpdate({ name: autoTitle });
  };

  // Synchronize members & enemyIds
  const updateMembers = (nextMembers: TroopMember[]) => {
    onUpdate({
      members: nextMembers,
      enemyIds: nextMembers.map((m) => m.enemyId)
    });
  };

  // Add enemy from right list to canvas
  const handleAddMember = (enemyId: string) => {
    const count = members.length;
    // Default staggered position
    const x = Math.min(680, 200 + count * 80);
    const y = 280 + (count % 2 === 1 ? 40 : 0);
    const next = [...members, { enemyId, x, y, hidden: false }];
    updateMembers(next);
    setSelectedMemberIdx(next.length - 1);
  };

  // Remove selected member
  const handleRemoveSelectedMember = () => {
    if (selectedMemberIdx === null || !members[selectedMemberIdx]) return;
    const next = members.filter((_, i) => i !== selectedMemberIdx);
    updateMembers(next);
    setSelectedMemberIdx(next.length > 0 ? Math.min(selectedMemberIdx, next.length - 1) : null);
  };

  // Clear all members
  const handleClearMembers = () => {
    updateMembers([]);
    setSelectedMemberIdx(null);
  };

  // Align members evenly horizontally
  const handleAlignMembers = () => {
    if (members.length === 0) return;
    const count = members.length;
    const startX = 160;
    const endX = 640;

    const next = members.map((m, idx) => {
      const x = count === 1 ? 400 : Math.round(startX + (idx / (count - 1)) * (endX - startX));
      const y = 280 + (idx % 2 === 1 ? 40 : 0);
      return { ...m, x, y };
    });
    updateMembers(next);
  };

  // Canvas Mouse Dragging
  const handleCanvasMouseDown = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMemberIdx(idx);
    setIsDragging(true);
    setDragMemberIdx(idx);
  };

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDragging || dragMemberIdx === null || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const clientX = e.clientX - rect.left;
      const clientY = e.clientY - rect.top;

      // Scale from canvas size (e.g. 480x240) to standard MZ coords (816x624)
      const scaleX = 816 / rect.width;
      const scaleY = 624 / rect.height;

      const gameX = Math.round(Math.max(40, Math.min(780, clientX * scaleX)));
      const gameY = Math.round(Math.max(80, Math.min(580, clientY * scaleY)));

      const next = [...members];
      next[dragMemberIdx] = { ...next[dragMemberIdx], x: gameX, y: gameY };
      updateMembers(next);
    },
    [isDragging, dragMemberIdx, members]
  );

  const handleCanvasMouseUp = () => {
    setIsDragging(false);
    setDragMemberIdx(null);
  };

  // Event Page Handlers
  const handleNewPage = () => {
    const newPage: TroopPage = {
      conditions: { turnEnding: false },
      span: 'battle',
      commands: []
    };
    const next = [...pages, newPage];
    onUpdate({ pages: next });
    setActivePageIndex(next.length - 1);
  };

  const handleCopyPage = () => {
    if (activePage) {
      setPageClipboard(structuredClone(activePage));
    }
  };

  const handlePastePage = () => {
    if (!pageClipboard) return;
    const next = [...pages];
    next[activePageIndex] = structuredClone(pageClipboard);
    onUpdate({ pages: next });
  };

  const handleDeletePage = () => {
    if (pages.length <= 1) {
      // If only 1 page, just clear it
      onUpdate({
        pages: [{ conditions: { turnEnding: false }, span: 'battle', commands: [] }]
      });
      return;
    }
    const next = pages.filter((_, i) => i !== activePageIndex);
    onUpdate({ pages: next });
    setActivePageIndex(Math.max(0, activePageIndex - 1));
  };

  const handleClearPage = () => {
    const next = [...pages];
    next[activePageIndex] = {
      conditions: { turnEnding: false },
      span: 'battle',
      commands: []
    };
    onUpdate({ pages: next });
  };

  // Event Command Handlers for active page
  const handleAddCommand = (type: EventCommand['type']) => {
    const cmd = createCommand(type, bundle);
    const nextPages = [...pages];
    const cmds = [...(activePage.commands as EventCommand[]), cmd];
    nextPages[activePageIndex] = { ...activePage, commands: cmds };
    onUpdate({ pages: nextPages });
    setCommandPickerOpen(false);
  };

  const handleDeleteCommand = (cmdIdx: number) => {
    const nextPages = [...pages];
    const cmds = (activePage.commands as EventCommand[]).filter((_, i) => i !== cmdIdx);
    nextPages[activePageIndex] = { ...activePage, commands: cmds };
    onUpdate({ pages: nextPages });
  };

  const handleMoveCommand = (cmdIdx: number, dir: 'up' | 'down') => {
    const cmds = [...(activePage.commands as EventCommand[])];
    const targetIdx = dir === 'up' ? cmdIdx - 1 : cmdIdx + 1;
    if (targetIdx < 0 || targetIdx >= cmds.length) return;
    const temp = cmds[cmdIdx];
    cmds[cmdIdx] = cmds[targetIdx];
    cmds[targetIdx] = temp;
    const nextPages = [...pages];
    nextPages[activePageIndex] = { ...activePage, commands: cmds };
    onUpdate({ pages: nextPages });
  };

  return (
    <div className="mz-detail-form" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ================================================================= */}
      {/* 1. GENERAL SETTINGS                                               */}
      {/* ================================================================= */}
      <fieldset className="mz-groupbox">
        <legend>General Settings</legend>

        {/* Top Controls: Name, Auto-name, Change BG, Battle Test */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '1 1 240px' }}>
            <span style={{ fontSize: 11, fontWeight: 600 }}>Name:</span>
            <input
              type="text"
              className="mz-input"
              value={troop.name || ''}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="Troop Name"
              style={{ flex: 1 }}
            />
          </label>

          <button type="button" className="mz-btn-small" onClick={handleAutoName} title="Auto-generate troop name">
            Auto-name
          </button>
          <button type="button" className="mz-btn-small" onClick={() => setBgModalOpen(true)}>
            Change BG...
          </button>
          <button
            type="button"
            className="mz-btn-small"
            onClick={() => setTestModalOpen(true)}
            style={{ fontWeight: 600, color: '#2563eb' }}
          >
            Battle Test...
          </button>
        </div>

        {/* Middle Area: Canvas + Action Buttons + Enemies Database List */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(320px, 1fr) 80px 200px',
            gap: 10,
            marginTop: 8,
            alignItems: 'center'
          }}
        >
          {/* Battle Field Canvas */}
          <div
            ref={canvasRef}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
            style={{
              position: 'relative',
              width: '100%',
              height: 240,
              border: '1px solid #64748b',
              borderRadius: 4,
              overflow: 'hidden',
              userSelect: 'none',
              background: '#0f172a'
            }}
          >
            {/* Battleback 1 (Floor) */}
            {urlBb1 && (
              <img
                src={urlBb1}
                alt={bb1Name}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none'
                }}
              />
            )}
            {/* Battleback 2 (Scenery) */}
            {urlBb2 && (
              <img
                src={urlBb2}
                alt={bb2Name}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  pointerEvents: 'none'
                }}
              />
            )}

            {/* Troop Members rendered on canvas */}
            {members.map((m, idx) => {
              const enemy = bundle.game.enemies.find((e) => e.id === m.enemyId);
              const bName = enemy?.battlerName || enemy?.name || 'Goblin';
              const bUrl =
                assetUrlMap[enemy?.battlerImage || `assets/sv_enemies/${bName}.png`] ||
                assetUrlMap[`assets/enemies/${bName}.png`] ||
                assetUrlMap['assets/enemies/Goblin.png'] ||
                '';
              const isSelected = selectedMemberIdx === idx;

              // Game coordinates (816x624) converted to Canvas % coordinates
              const leftPercent = ((m.x ?? 400) / 816) * 100;
              const topPercent = ((m.y ?? 300) / 624) * 100;

              return (
                <div
                  key={idx}
                  onMouseDown={(e) => handleCanvasMouseDown(idx, e)}
                  style={{
                    position: 'absolute',
                    left: `${leftPercent}%`,
                    top: `${topPercent}%`,
                    transform: 'translate(-50%, -100%)',
                    cursor: 'grab',
                    zIndex: isSelected ? 10 : 2,
                    filter: isSelected
                      ? 'drop-shadow(0 0 8px #fbbf24) brightness(1.15)'
                      : 'drop-shadow(0 2px 4px rgba(0,0,0,0.6))',
                    transition: isDragging && dragMemberIdx === idx ? 'none' : 'filter 0.15s ease'
                  }}
                  title={`#${idx + 1}: ${enemy?.name || m.enemyId} (${m.x}, ${m.y})`}
                >
                  {bUrl ? (
                    <img
                      src={bUrl}
                      alt={enemy?.name}
                      style={{
                        maxHeight: 120,
                        maxWidth: 120,
                        objectFit: 'contain',
                        pointerEvents: 'none'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        fontSize: 28,
                        background: 'rgba(0,0,0,0.6)',
                        padding: '4px 8px',
                        borderRadius: 4,
                        color: '#fff'
                      }}
                    >
                      👹 {enemy?.name || m.enemyId}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Action Buttons: Add, Remove, Clear, Align */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              type="button"
              className="mz-btn-small"
              onClick={() => handleAddMember(selectedListEnemyId)}
              disabled={!selectedListEnemyId}
              style={{ fontWeight: 600 }}
            >
              &lt; Add
            </button>
            <button
              type="button"
              className="mz-btn-small"
              onClick={handleRemoveSelectedMember}
              disabled={selectedMemberIdx === null}
            >
              Remove &gt;
            </button>
            <button type="button" className="mz-btn-small" onClick={handleClearMembers}>
              Clear
            </button>
            <button type="button" className="mz-btn-small" onClick={handleAlignMembers}>
              Align
            </button>
          </div>

          {/* Enemies Database List */}
          <div
            style={{
              height: 240,
              overflowY: 'auto',
              border: '1px solid #cbd5e1',
              borderRadius: 4,
              background: '#fff'
            }}
          >
            {bundle.game.enemies.map((e, idx) => {
              const isSelected = selectedListEnemyId === e.id;
              const numStr = String(idx + 1).padStart(4, '0');
              return (
                <div
                  key={e.id}
                  onClick={() => setSelectedListEnemyId(e.id)}
                  onDoubleClick={() => handleAddMember(e.id)}
                  style={{
                    padding: '3px 6px',
                    fontSize: 11,
                    cursor: 'pointer',
                    background: isSelected ? '#2563eb' : 'transparent',
                    color: isSelected ? '#fff' : '#1e293b',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                  title={e.name}
                >
                  {numStr} {e.name}
                </div>
              );
            })}
          </div>
        </div>
      </fieldset>

      {/* ================================================================= */}
      {/* 2. BATTLE EVENT                                                   */}
      {/* ================================================================= */}
      <fieldset className="mz-groupbox">
        <legend>Battle Event</legend>

        <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 10 }}>
          {/* Left Event Page Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button type="button" className="mz-btn-small" onClick={handleNewPage}>
              New Event Page
            </button>
            <button type="button" className="mz-btn-small" onClick={handleCopyPage}>
              Copy Event Page
            </button>
            <button
              type="button"
              className="mz-btn-small"
              onClick={handlePastePage}
              disabled={!pageClipboard}
            >
              Paste Event Page
            </button>
            <button type="button" className="mz-btn-small danger" onClick={handleDeletePage}>
              Delete Event Page
            </button>
            <button type="button" className="mz-btn-small" onClick={handleClearPage}>
              Clear Event Page
            </button>
          </div>

          {/* Right: Tabbed Event Pages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Page Tabs */}
            <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #cbd5e1', paddingBottom: 2 }}>
              {pages.map((_, pIdx) => (
                <button
                  key={pIdx}
                  type="button"
                  onClick={() => setActivePageIndex(pIdx)}
                  style={{
                    padding: '3px 12px',
                    fontSize: 11,
                    fontWeight: activePageIndex === pIdx ? 700 : 400,
                    border: '1px solid #cbd5e1',
                    borderBottom: activePageIndex === pIdx ? '2px solid #2563eb' : '1px solid #cbd5e1',
                    background: activePageIndex === pIdx ? '#fff' : '#f1f5f9',
                    borderRadius: '3px 3px 0 0',
                    cursor: 'pointer'
                  }}
                >
                  {pIdx + 1}
                </button>
              ))}
            </div>

            {/* Conditions & Span Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#f8fafc',
                padding: '6px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: 4
              }}
            >
              {/* Conditions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>Conditions:</span>
                <button
                  type="button"
                  onClick={() => setConditionsModalOpen(true)}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    padding: '3px 8px',
                    fontSize: 11,
                    border: '1px solid #cbd5e1',
                    borderRadius: 3,
                    background: '#fff',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {formatTroopConditions(activePage.conditions, troop, bundle)}
                </button>
                <button
                  type="button"
                  className="mz-btn-small"
                  onClick={() => setConditionsModalOpen(true)}
                  style={{ padding: '2px 8px' }}
                >
                  ...
                </button>
              </div>

              {/* Span */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600 }}>Span:</span>
                <select
                  value={activePage.span || 'battle'}
                  onChange={(e) => {
                    const nextPages = [...pages];
                    nextPages[activePageIndex] = {
                      ...activePage,
                      span: e.target.value as 'battle' | 'turn' | 'moment'
                    };
                    onUpdate({ pages: nextPages });
                  }}
                  style={{ width: 90 }}
                >
                  <option value="battle">Battle</option>
                  <option value="turn">Turn</option>
                  <option value="moment">Moment</option>
                </select>
              </div>
            </div>

            {/* Event Commands List */}
            <div
              style={{
                height: 180,
                maxHeight: 240,
                overflowY: 'auto',
                border: '1px solid #cbd5e1',
                borderRadius: 4,
                background: '#fff',
                padding: 4
              }}
            >
              {activePage.commands && activePage.commands.length > 0 ? (
                (activePage.commands as EventCommand[]).map((cmd, cIdx) => (
                  <div
                    key={cIdx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '3px 6px',
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: 11
                    }}
                  >
                    <span style={{ color: '#94a3b8', minWidth: 20 }}>#{cIdx + 1}</span>
                    <span style={{ fontWeight: 600, color: '#2563eb', minWidth: 120 }}>
                      {commandName[cmd.type] || cmd.type}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        color: '#334155',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {commandPreview(cmd)}
                    </span>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <button
                        type="button"
                        className="mz-btn-small"
                        disabled={cIdx === 0}
                        onClick={() => handleMoveCommand(cIdx, 'up')}
                        style={{ padding: '0 4px', fontSize: 9 }}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="mz-btn-small"
                        disabled={cIdx === (activePage.commands?.length ?? 0) - 1}
                        onClick={() => handleMoveCommand(cIdx, 'down')}
                        style={{ padding: '0 4px', fontSize: 9 }}
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        className="mz-btn-small danger"
                        onClick={() => handleDeleteCommand(cIdx)}
                        style={{ padding: '0 4px', fontSize: 9 }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ padding: 12, color: '#94a3b8', fontSize: 11, textAlign: 'center' }}>
                  ◆ (Click &quot;＋ Tambah Perintah&quot; below to add commands)
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="mz-btn-small"
                onClick={() => setCommandPickerOpen(true)}
              >
                ＋ Tambah Perintah
              </button>
            </div>
          </div>
        </div>
      </fieldset>

      {/* ================================================================= */}
      {/* 3. BOTTOM ACCORDION: NUSV ENGINE ADVANCED FIELDS                   */}
      {/* ================================================================= */}
      <div
        className="mz-advanced-accordion"
        style={{ border: '1px solid #cbd5e1', borderRadius: 4, background: '#f8fafc' }}
      >
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            width: '100%',
            padding: '8px 12px',
            background: 'none',
            border: 'none',
            textAlign: 'left',
            fontWeight: 700,
            fontSize: 12,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: '#334155'
          }}
        >
          <span>⚙️ Pengaturan Lanjutan (Advanced / NUSV Engine)</span>
          <span>{showAdvanced ? '▲ Sembunyikan' : '▼ Tampilkan'}</span>
        </button>

        {showAdvanced && (
          <div style={{ padding: '12px 14px', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="mz-field-row">
              <label className="mz-field-item">
                <span>Technical ID:</span>
                <input
                  type="text"
                  value={troop.id || ''}
                  onChange={(e) => onUpdate({ id: e.target.value })}
                />
              </label>
              <label className="mz-field-item">
                <span>Raw Battleback 1:</span>
                <input
                  type="text"
                  value={troop.battleback1 || ''}
                  onChange={(e) => onUpdate({ battleback1: e.target.value })}
                />
              </label>
              <label className="mz-field-item">
                <span>Raw Battleback 2:</span>
                <input
                  type="text"
                  value={troop.battleback2 || ''}
                  onChange={(e) => onUpdate({ battleback2: e.target.value })}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* ================================================================= */}
      {/* MODALS                                                            */}
      {/* ================================================================= */}
      {bgModalOpen && (
        <TroopBattlebackModal
          currentBb1={bb1Name}
          currentBb2={bb2Name}
          assetUrlMap={assetUrlMap}
          onConfirm={(bb1, bb2) => {
            onUpdate({
              battleback1: bb1,
              battleback2: bb2,
              battleback1Name: bb1,
              battleback2Name: bb2
            });
            setBgModalOpen(false);
          }}
          onClose={() => setBgModalOpen(false)}
        />
      )}

      {conditionsModalOpen && (
        <TroopConditionsModal
          currentConds={activePage.conditions}
          troop={troop}
          bundle={bundle}
          onConfirm={(conds) => {
            const nextPages = [...pages];
            nextPages[activePageIndex] = { ...activePage, conditions: conds };
            onUpdate({ pages: nextPages });
            setConditionsModalOpen(false);
          }}
          onClose={() => setConditionsModalOpen(false)}
        />
      )}

      {testModalOpen && (
        <TroopBattleTestModal
          troop={troop}
          bundle={bundle}
          onClose={() => setTestModalOpen(false)}
        />
      )}

      {commandPickerOpen && (
        <EventCommandPickerModal
          onSelect={handleAddCommand}
          onClose={() => setCommandPickerOpen(false)}
        />
      )}
    </div>
  );
}
