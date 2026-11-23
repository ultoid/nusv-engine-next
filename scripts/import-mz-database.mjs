import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { validateBundle } from '../.electron-dist/src/core/validation.js';

const mzDataDir = 'E:/Downloads/RPG-Maker-MZ-SteamRIP.com/RPG Maker MZ/newdata/data';
const projectRoot = resolve('project/my-rpg-game');

console.log('Reading MZ Data from:', mzDataDir);
console.log('Target project root:', projectRoot);

const slugify = (str) => {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'entry';
};

const mzActors = JSON.parse(readFileSync(join(mzDataDir, 'Actors.json'), 'utf8')).filter(Boolean);
const mzClasses = JSON.parse(readFileSync(join(mzDataDir, 'Classes.json'), 'utf8')).filter(Boolean);
const mzSkills = JSON.parse(readFileSync(join(mzDataDir, 'Skills.json'), 'utf8')).filter(Boolean);
const mzItems = JSON.parse(readFileSync(join(mzDataDir, 'Items.json'), 'utf8')).filter(Boolean);
const mzWeapons = JSON.parse(readFileSync(join(mzDataDir, 'Weapons.json'), 'utf8')).filter(Boolean);
const mzArmors = JSON.parse(readFileSync(join(mzDataDir, 'Armors.json'), 'utf8')).filter(Boolean);
const mzEnemies = JSON.parse(readFileSync(join(mzDataDir, 'Enemies.json'), 'utf8')).filter(Boolean);
const mzTroops = JSON.parse(readFileSync(join(mzDataDir, 'Troops.json'), 'utf8')).filter(Boolean);
const mzStates = JSON.parse(readFileSync(join(mzDataDir, 'States.json'), 'utf8')).filter(Boolean);

// Current project game data and manifest
const gameJsonPath = join(projectRoot, 'data', 'game.json');
const currentGame = JSON.parse(readFileSync(gameJsonPath, 'utf8'));

const projectJsonPath = join(projectRoot, 'nusv.project.json');
const currentProject = JSON.parse(readFileSync(projectJsonPath, 'utf8'));

// 1. Classes
const classMap = new Map(); // mzId -> nusvId
const convertedClasses = [];
for (const c of mzClasses) {
  if (!c.name || c.name.startsWith('---')) continue;
  const id = `class.${slugify(c.name)}`;
  classMap.set(c.id, id);
  convertedClasses.push({
    id,
    name: c.name,
    tier: (c.id === 4 || c.id === 6) ? 2 : 1,
    growth: {
      str: Math.max(1, Math.round((c.params[2]?.[99] || 100) / 100)),
      int: Math.max(1, Math.round((c.params[4]?.[99] || 100) / 100)),
      agi: Math.max(1, Math.round((c.params[6]?.[99] || 100) / 100)),
      vit: Math.max(1, Math.round((c.params[3]?.[99] || 100) / 100))
    }
  });
}

// 2. States
const stateMap = new Map(); // mzId -> nusvId
const convertedStates = [];
for (const s of mzStates) {
  if (!s.name || s.name.startsWith('---')) continue;
  const id = `state.mz-${s.id}-${slugify(s.name)}`;
  stateMap.set(s.id, id);
  convertedStates.push({
    id,
    name: s.name,
    duration: Math.max(1, s.maxTurns || s.minTurns || 1),
    pdr: s.traits?.some(t => t.code === 23 && t.dataId === 9) ? 0 : 1,
    preventsAction: s.restriction === 4
  });
}

// 3. Skills
const skillMap = new Map(); // mzId -> nusvId
const convertedSkills = [];
for (const s of mzSkills) {
  if (!s.name || s.name.startsWith('---')) continue;
  const id = `skill.mz-${s.id}-${slugify(s.name)}`;
  skillMap.set(s.id, id);

  const isHeal = s.damage?.type === 3;
  const isRevive = (s.effects || []).some(e => e.code === 22 && e.dataId === 1) || /revive|raise/i.test(s.name);
  const isMagical = s.hitType === 2;
  const kind = isRevive ? 'revive' : (isHeal ? 'heal' : (isMagical ? 'magical' : 'physical'));
  const target = (s.scope >= 7 && s.scope <= 11) ? 'ally' : 'enemy';

  // Parse formula or default power
  let power = 1.0;
  if (s.damage?.formula) {
    const match = s.damage.formula.match(/\* (\d+)/);
    if (match) power = Math.max(0.5, Number(match[1]) / 2);
    else power = 1.5;
  }

  const skillEntry = {
    id,
    name: s.name,
    kind,
    power,
    target,
    mpCost: Math.max(0, s.mpCost || 0),
    spCost: Math.max(0, s.tpCost || 0)
  };

  const stateEffect = (s.effects || []).find(e => e.code === 21 && stateMap.has(e.dataId));
  if (stateEffect) {
    skillEntry.stateId = stateMap.get(stateEffect.dataId);
    skillEntry.stateChance = stateEffect.value1 || 1.0;
  }

  convertedSkills.push(skillEntry);
}

// 4. Items
const itemMap = new Map(); // mzId -> nusvId
const convertedItems = [];
for (const it of mzItems) {
  if (!it.name || it.name.startsWith('---')) continue;
  const id = `item.mz-${it.id}-${slugify(it.name)}`;
  itemMap.set(it.id, id);

  const isHeal = it.damage?.type === 3 || (it.effects || []).some(e => e.code === 11);
  const isRevive = (it.effects || []).some(e => e.code === 22 && e.dataId === 1) || /revive/i.test(it.name);
  const kind = isRevive ? 'revive' : (isHeal ? 'heal' : 'key');

  const itemEntry = {
    id,
    name: it.name,
    kind
  };
  if (isHeal) itemEntry.healHp = 500;
  if (isRevive) itemEntry.reviveHpRatio = 0.5;

  convertedItems.push(itemEntry);
}

// 5. Equipment (Weapons + Armors)
const weaponMap = new Map();
const armorMap = new Map();
const convertedEquipment = [];

for (const w of mzWeapons) {
  if (!w.name || w.name.startsWith('---')) continue;
  const id = `equip.mz-w-${w.id}-${slugify(w.name)}`;
  weaponMap.set(w.id, id);
  const p = w.params || [];
  convertedEquipment.push({
    id,
    name: w.name,
    slot: 'weapon',
    weaponType: w.wtypeId === 1 ? 'finesse' : (w.wtypeId === 7 || w.wtypeId === 8 ? 'ranged' : 'melee'),
    bonuses: {
      atk: Math.max(0, p[2] || 0),
      def: Math.max(0, p[3] || 0),
      mat: Math.max(0, p[4] || 0),
      mdf: Math.max(0, p[5] || 0),
      agi: Math.max(0, p[6] || 0)
    },
    stats: {
      str: Math.max(0, Math.round((p[2] || 0) / 3))
    }
  });
}

for (const a of mzArmors) {
  if (!a.name || a.name.startsWith('---')) continue;
  const id = `equip.mz-a-${a.id}-${slugify(a.name)}`;
  armorMap.set(a.id, id);
  const p = a.params || [];
  // etypeId: 2=Shield(head/body?), 3=Head, 4=Body, 5=Accessory
  let slot = 'body';
  if (a.etypeId === 3) slot = 'head';
  else if (a.etypeId === 5) slot = 'accessory';
  else if (a.etypeId === 2) slot = 'body'; // shield mapped to body/head

  convertedEquipment.push({
    id,
    name: a.name,
    slot,
    bonuses: {
      atk: Math.max(0, p[2] || 0),
      def: Math.max(0, p[3] || 0),
      mat: Math.max(0, p[4] || 0),
      mdf: Math.max(0, p[5] || 0),
      agi: Math.max(0, p[6] || 0)
    },
    stats: {
      vit: Math.max(0, Math.round((p[3] || 0) / 3))
    }
  });
}

// 6. Enemies
const enemyMap = new Map();
const convertedEnemies = [];
for (const e of mzEnemies) {
  if (!e.name || e.name.startsWith('---')) continue;
  const id = `enemy.mz-${e.id}-${slugify(e.name)}`;
  enemyMap.set(e.id, id);
  const p = e.params || [];

  const enemySkillIds = (e.actions || [])
    .map(a => skillMap.get(a.skillId))
    .filter(Boolean);
  if (!enemySkillIds.length && convertedSkills.length) {
    enemySkillIds.push(convertedSkills[0].id);
  }

  convertedEnemies.push({
    id,
    name: e.name,
    weaponType: 'melee',
    stats: {
      str: Math.max(5, Math.round((p[2] || 10) / 2)),
      int: Math.max(5, Math.round((p[4] || 10) / 2)),
      dex: 10,
      luk: Math.max(5, Math.round((p[7] || 10) / 2)),
      agi: Math.max(5, Math.round((p[6] || 10) / 2)),
      vit: Math.max(5, Math.round((p[3] || 10) / 2))
    },
    base: {
      hp: Math.max(10, p[0] || 100),
      mp: Math.max(0, p[1] || 10),
      atk: Math.max(1, p[2] || 10),
      def: Math.max(1, p[3] || 10),
      mat: Math.max(1, p[4] || 10),
      mdf: Math.max(1, p[5] || 10),
      agi: Math.max(1, p[6] || 10)
    },
    skillIds: enemySkillIds,
    reward: {
      gold: Math.max(0, e.gold || 0),
      baseExp: Math.max(0, e.exp || 0),
      classExp: Math.max(0, Math.round((e.exp || 0) * 0.8))
    }
  });
}

// 7. Troops
const troopMap = new Map();
const convertedTroops = [];
for (const t of mzTroops) {
  if (!t.name || t.name.startsWith('---')) continue;
  const id = `troop.mz-${t.id}-${slugify(t.name)}`;
  troopMap.set(t.id, id);

  const enemyIds = (t.members || [])
    .map(m => enemyMap.get(m.enemyId))
    .filter(Boolean);

  if (enemyIds.length) {
    convertedTroops.push({
      id,
      name: t.name,
      enemyIds
    });
  }
}

// 8. Actors
const convertedActors = [];
for (const a of mzActors) {
  if (!a.name || a.name.startsWith('---')) continue;
  const id = `actor.${slugify(a.name)}`;
  const c = mzClasses.find(cl => cl.id === a.classId) || mzClasses[0];
  const p = c?.params || [];

  const defaultEquip = {};
  if (a.equips?.[0] && weaponMap.has(a.equips[0])) {
    defaultEquip.weapon = weaponMap.get(a.equips[0]);
  }
  if (a.equips?.[1] && armorMap.has(a.equips[1])) {
    defaultEquip.head = armorMap.get(a.equips[1]);
  }
  if (a.equips?.[3] && armorMap.has(a.equips[3])) {
    defaultEquip.body = armorMap.get(a.equips[3]);
  }

  const classLearnings = (c?.learnings || [])
    .filter(l => skillMap.has(l.skillId))
    .map(l => ({
      classId: classMap.get(a.classId) || 'class.swordsman',
      level: Math.max(1, Math.min(60, l.level)),
      skillId: skillMap.get(l.skillId)
    }));

  const initialSkills = [];
  if (convertedSkills.length) initialSkills.push(convertedSkills[0].id); // attack
  for (const l of classLearnings) {
    if (l.level <= 1 && !initialSkills.includes(l.skillId)) {
      initialSkills.push(l.skillId);
    }
  }

  convertedActors.push({
    id,
    name: a.name,
    classId: classMap.get(a.classId) || 'class.swordsman',
    classTier: 1,
    availableClassIds: Array.from(new Set([classMap.get(a.classId) || 'class.swordsman'])),
    targetRate: 1.0,
    classGrowth: {
      str: 1,
      vit: 1,
      agi: 1,
      int: 1
    },
    classLearnings,
    defaultEquipment: defaultEquip,
    stats: {
      str: Math.max(5, Math.round((p[2]?.[1] || 15) / 2)),
      int: Math.max(5, Math.round((p[4]?.[1] || 15) / 2)),
      dex: 10,
      luk: Math.max(5, Math.round((p[7]?.[1] || 15) / 2)),
      agi: Math.max(5, Math.round((p[6]?.[1] || 15) / 2)),
      vit: Math.max(5, Math.round((p[3]?.[1] || 15) / 2))
    },
    base: {
      hp: Math.max(20, p[0]?.[1] || 100),
      mp: Math.max(5, p[1]?.[1] || 20),
      atk: Math.max(1, p[2]?.[1] || 10),
      def: Math.max(1, p[3]?.[1] || 10),
      mat: Math.max(1, p[4]?.[1] || 10),
      mdf: Math.max(1, p[5]?.[1] || 10),
      agi: Math.max(1, p[6]?.[1] || 10)
    },
    weaponType: a.classId === 5 ? 'finesse' : (a.classId === 7 ? 'ranged' : 'melee'),
    skillIds: initialSkills,
    characterImage: `assets/characters/${a.characterName}.png`,
    characterIndex: a.characterIndex ?? 0,
    faceImage: `assets/faces/${a.faceName}.png`,
    faceIndex: a.faceIndex ?? 0
  });
}

console.log(`Converted Summary:`);
console.log(`- Actors: ${convertedActors.length}`);
console.log(`- Classes: ${convertedClasses.length}`);
console.log(`- Skills: ${convertedSkills.length}`);
console.log(`- Items: ${convertedItems.length}`);
console.log(`- Equipment: ${convertedEquipment.length}`);
console.log(`- Enemies: ${convertedEnemies.length}`);
console.log(`- Troops: ${convertedTroops.length}`);
console.log(`- States: ${convertedStates.length}`);

// Merge with existing project data so nothing breaks in maps or existing quests/shops
const mergeList = (existing = [], incoming = []) => {
  const map = new Map();
  for (const item of existing) map.set(item.id, item);
  for (const item of incoming) map.set(item.id, item);
  return Array.from(map.values());
};

const nextGame = {
  ...currentGame,
  actors: mergeList(currentGame.actors, convertedActors),
  classes: mergeList(currentGame.classes || [], convertedClasses),
  skills: mergeList(currentGame.skills, convertedSkills),
  items: mergeList(currentGame.items, convertedItems),
  equipment: mergeList(currentGame.equipment, convertedEquipment),
  enemies: mergeList(currentGame.enemies, convertedEnemies),
  troops: mergeList(currentGame.troops, convertedTroops),
  states: mergeList(currentGame.states, convertedStates)
};

// Update party in nusv.project.json to include Reid and Priscilla!
const nextProject = {
  ...currentProject,
  party: ['actor.reid', 'actor.priscilla']
};

// Test bundle validation
const maps = {};
for (const mapId of nextProject.maps) {
  const mapFile = join(projectRoot, 'maps', `${mapId}.json`);
  maps[mapId] = JSON.parse(readFileSync(mapFile, 'utf8'));
}
const assetManifest = JSON.parse(readFileSync(join(projectRoot, 'assets', 'manifest.json'), 'utf8'));

const testBundle = {
  project: nextProject,
  game: nextGame,
  maps,
  assets: assetManifest
};

console.log('Validating converted bundle...');
try {
  const validated = validateBundle(testBundle);
  console.log('Validation SUCCESS! Writing files...');
  writeFileSync(gameJsonPath, JSON.stringify(nextGame, null, 2) + '\n', 'utf8');
  writeFileSync(projectJsonPath, JSON.stringify(nextProject, null, 2) + '\n', 'utf8');
  console.log('Updated:', gameJsonPath);
  console.log('Updated:', projectJsonPath);
} catch (err) {
  console.error('Validation FAILED:', err.message);
  process.exit(1);
}
