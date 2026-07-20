import { useState, useEffect, useRef } from 'react'
import './App.css'

const COLS = 14
const ROWS = 9
const CELL = 56

const PATH_WAYPOINTS = [
  { row: 4, col: -1 },
  { row: 4, col: 1 },
  { row: 1, col: 1 },
  { row: 1, col: 3 },
  { row: 7, col: 3 },
  { row: 7, col: 5 },
  { row: 2, col: 5 },
  { row: 2, col: 7 },
  { row: 6, col: 7 },
  { row: 6, col: 9 },
  { row: 1, col: 9 },
  { row: 1, col: 11 },
  { row: 7, col: 11 },
  { row: 7, col: 13 },
  { row: 4, col: 13 },
  { row: 4, col: 14 },
]

function buildPath(waypoints) {
  const segments = []
  let total = 0
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i], b = waypoints[i + 1]
    const len = Math.abs(b.col - a.col) + Math.abs(b.row - a.row)
    segments.push({ a, b, len, startDist: total })
    total += len
  }
  return { segments, total }
}

const GAME_PATH = buildPath(PATH_WAYPOINTS)

function pointAtDistance(dist) {
  const segments = GAME_PATH.segments
  if (dist <= 0) {
    const seg = segments[0]
    const t = seg.len ? dist / seg.len : 0
    return { col: seg.a.col + (seg.b.col - seg.a.col) * t, row: seg.a.row + (seg.b.row - seg.a.row) * t }
  }
  if (dist >= GAME_PATH.total) {
    const seg = segments[segments.length - 1]
    const over = dist - GAME_PATH.total
    const t = seg.len ? (seg.len + over) / seg.len : 1
    return { col: seg.a.col + (seg.b.col - seg.a.col) * t, row: seg.a.row + (seg.b.row - seg.a.row) * t }
  }
  for (const seg of segments) {
    if (dist >= seg.startDist && dist <= seg.startDist + seg.len) {
      const t = seg.len ? (dist - seg.startDist) / seg.len : 0
      return { col: seg.a.col + (seg.b.col - seg.a.col) * t, row: seg.a.row + (seg.b.row - seg.a.row) * t }
    }
  }
  const last = segments[segments.length - 1]
  return { col: last.b.col, row: last.b.row }
}

function pathCellSet() {
  const cells = new Set()
  for (const seg of GAME_PATH.segments) {
    const r0 = Math.max(0, Math.min(seg.a.row, seg.b.row))
    const r1 = Math.min(ROWS - 1, Math.max(seg.a.row, seg.b.row))
    const c0 = Math.max(0, Math.min(seg.a.col, seg.b.col))
    const c1 = Math.min(COLS - 1, Math.max(seg.a.col, seg.b.col))
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        cells.add(`${r}-${c}`)
      }
    }
  }
  return cells
}

const PATH_CELLS = pathCellSet()
const TOWER_COST = 10
const SPEED = 0.04
const RANGE = 3
const DAMAGE = 200
const COOLDOWN = 1500
const FIREBALL_SPEED = 0.18
const LIGHTNING_COST = 25
const LIGHTNING_RANGE = 2
const LIGHTNING_TARGETS = 5
const ICE_COST = 30
const ICE_DAMAGE = 150
const ICE_RANGE = 3
const ICE_SLOW_FACTOR = 0.4
const ICE_SLOW_DURATION = 2000
const ARCANE_COST = 45
const ARCANE_DAMAGE = 500
const ARCANE_RANGE = 3
const ARCANE_COOLDOWN = 2200
const POISON_COST = 35
const POISON_DAMAGE = 50
const POISON_DPS = 80
const POISON_DURATION = 3000
const POISON_RANGE = 3

const TOWER_TYPES = {
  fire: {
    label: 'Fire Wizard', icon: '🔥', cost: TOWER_COST, range: RANGE, cooldown: COOLDOWN, damage: DAMAGE,
    desc: `💥 ${DAMAGE} dmg · Range ${RANGE}`,
    selectedBg: 'linear-gradient(135deg, #8b1a00, #cc4400)', border: '#ff6600', glow: '0 0 14px #ff4400, 0 0 28px #cc2200',
    goldColor: '#ffcc88', descColor: '#ffaa66',
  },
  lightning: {
    label: 'Lightning Wizard', icon: '⚡', cost: LIGHTNING_COST, range: LIGHTNING_RANGE, cooldown: COOLDOWN,
    desc: `💥 100 dmg · Hits ${LIGHTNING_TARGETS}`,
    selectedBg: 'linear-gradient(135deg, #5a4a00, #a88000)', border: '#ffe066', glow: '0 0 14px #ffee00, 0 0 28px #aa8800',
    goldColor: '#ffee88', descColor: '#ffe066',
  },
  ice: {
    label: 'Ice Wizard', icon: '❄️', cost: ICE_COST, range: ICE_RANGE, cooldown: COOLDOWN, damage: ICE_DAMAGE,
    desc: `💥 ${ICE_DAMAGE} dmg · Slows enemies`,
    selectedBg: 'linear-gradient(135deg, #003a4a, #0088aa)', border: '#66eeff', glow: '0 0 14px #00ddff, 0 0 28px #0088aa',
    goldColor: '#bbeeff', descColor: '#88ddff',
  },
  arcane: {
    label: 'Arcane Wizard', icon: '🔮', cost: ARCANE_COST, range: ARCANE_RANGE, cooldown: ARCANE_COOLDOWN, damage: ARCANE_DAMAGE,
    desc: `💥 ${ARCANE_DAMAGE} dmg · Huge single hit`,
    selectedBg: 'linear-gradient(135deg, #2a0050, #7700cc)', border: '#cc88ff', glow: '0 0 14px #aa00ff, 0 0 28px #6600aa',
    goldColor: '#ddbbff', descColor: '#cc99ff',
  },
  poison: {
    label: 'Poison Wizard', icon: '☠️', cost: POISON_COST, range: POISON_RANGE, cooldown: COOLDOWN, damage: POISON_DAMAGE,
    dot: true, dotDps: POISON_DPS, dotDuration: POISON_DURATION,
    desc: `💥 ${POISON_DAMAGE} dmg + poison over time`,
    selectedBg: 'linear-gradient(135deg, #0d3300, #2f7a00)', border: '#88ff66', glow: '0 0 14px #66ff33, 0 0 28px #338800',
    goldColor: '#ccffaa', descColor: '#aaee77',
  },
}

const ENEMY_TYPES = {
  goblin: { hp: 1000, speed: SPEED, livesCost: 1, goldReward: 5 },
  archer: { hp: 2000, speed: SPEED * 0.8, livesCost: 4, goldReward: 8 },
  troll: { hp: 4000, speed: SPEED * 0.5, livesCost: 6, goldReward: 20 },
  scout: { hp: 400, speed: SPEED * 1.6, livesCost: 1, goldReward: 3 },
  armoredGoblin: { hp: 1800, speed: SPEED * 0.9, livesCost: 2, goldReward: 10 },
}

const LEVEL_UNLOCK_WAVE = 5

const ENEMY_LABELS = { goblin: 'Goblin', archer: 'Archer', troll: 'Troll', scout: 'Scout', armoredGoblin: 'Armored Goblin' }

const PROFILE_KEY = 'wizardWar2Profile'
const SHARD_ICON = '💎'
const SHARD_NAME = 'Arcane Shards'
const LEVEL_UP_SHARD_REWARD = 10
const ACHIEVEMENT_SHARD_REWARD = 5
const UPGRADE_MAX = 3
const UPGRADE_COSTS = [15, 30, 50]
const UPGRADE_DAMAGE_BONUS = 0.25
// In-round tower upgrades, paid with gold, reset every game. How high you can
// push a tower's round tier is capped by how much you've spent on that
// wizard's permanent Arcane Shard tier (see UPGRADE_COSTS above).
const ROUND_UPGRADE_COSTS = [20, 35, 55]

const DEFAULT_PROFILE = {
  name: 'Wizard', bestScore: 0, gamesPlayed: 0, bestWave: 0, bestLevel: 1,
  shards: 0,
  claimedAchievements: [],
  upgrades: { fire: 0, lightning: 0, ice: 0, arcane: 0, poison: 0, storm: 0, crystal: 0, shadow: 0, bard: 0 },
  unlockedSpecials: [],
}

function upgradedDamage(baseDamage, tier) {
  return Math.round(baseDamage * (1 + UPGRADE_DAMAGE_BONUS * tier))
}

const SPECIAL_TOWER_TYPES = {
  storm: {
    label: 'Storm Wizard', icon: '⛈️', cost: 50, range: 2, cooldown: 2000, damage: 120, hitAll: true, special: true,
    desc: '💥 120 dmg to ALL in range',
    selectedBg: 'linear-gradient(135deg, #0a1a3a, #2244aa)', border: '#66aaff', glow: '0 0 14px #4488ff, 0 0 28px #2255cc',
    goldColor: '#bbddff', descColor: '#99ccff',
  },
  crystal: {
    label: 'Crystal Wizard', icon: '💠', cost: 60, range: 3, cooldown: 3000, damage: 800, special: true,
    desc: '💥 800 dmg · Slow, huge hit',
    selectedBg: 'linear-gradient(135deg, #002a2a, #00aaaa)', border: '#66ffff', glow: '0 0 14px #00eeee, 0 0 28px #00aaaa',
    goldColor: '#bbffff', descColor: '#77eeee',
  },
  shadow: {
    label: 'Shadow Wizard', icon: '🌑', cost: 40, range: 3, cooldown: 1500, damage: 40, special: true,
    dot: true, dotDps: 90, dotDuration: 3500,
    desc: '💥 40 dmg + strong curse over time',
    selectedBg: 'linear-gradient(135deg, #1a0a2a, #4a1a6a)', border: '#aa66ff', glow: '0 0 14px #8833cc, 0 0 28px #5a1a8a',
    goldColor: '#ddbbff', descColor: '#bb88ee',
  },
  bard: {
    label: 'Bard Wizard', icon: '🎵', cost: 45, range: 3, cooldown: 1600, damage: 90, special: true,
    amplify: true, amplifyMult: 1.5, amplifyDuration: 3000,
    desc: '💥 90 dmg + marks target for +50% dmg',
    selectedBg: 'linear-gradient(135deg, #3a1a00, #cc6600)', border: '#ffaa33', glow: '0 0 14px #ff9922, 0 0 28px #cc6600',
    goldColor: '#ffe0b3', descColor: '#ffcc88',
  },
}

const ALL_TOWER_TYPES = { ...TOWER_TYPES, ...SPECIAL_TOWER_TYPES }

const PACKS = {
  basic: {
    name: 'Basic Pack', icon: '📦', cost: 30,
    desc: 'Mostly shards back, small chance at an upgrade or a special wizard.',
    outcomes: [
      { type: 'shards', chance: 0.65, min: 10, max: 20 },
      { type: 'upgrade', chance: 0.30 },
      { type: 'special', chance: 0.05 },
    ],
  },
  rare: {
    name: 'Rare Pack', icon: '🎁', cost: 60,
    desc: 'Better odds at a special wizard, plus bigger rewards.',
    outcomes: [
      { type: 'shards', chance: 0.40, min: 15, max: 30 },
      { type: 'upgrade', chance: 0.35 },
      { type: 'special', chance: 0.25 },
    ],
  },
  legendary: {
    name: 'Legendary Pack', icon: '🏆', cost: 120,
    desc: 'The best odds in the game for a special wizard!',
    outcomes: [
      { type: 'shards', chance: 0.15, min: 30, max: 50 },
      { type: 'upgrade', chance: 0.35 },
      { type: 'special', chance: 0.50 },
    ],
  },
}

function openPack(packKey, profile) {
  const pack = PACKS[packKey]
  const roll = Math.random()
  let cumulative = 0
  let outcome = pack.outcomes[pack.outcomes.length - 1]
  for (const o of pack.outcomes) {
    cumulative += o.chance
    if (roll <= cumulative) { outcome = o; break }
  }

  if (outcome.type === 'special') {
    const locked = Object.keys(SPECIAL_TOWER_TYPES).filter(k => !profile.unlockedSpecials.includes(k))
    if (locked.length > 0) {
      const key = locked[Math.floor(Math.random() * locked.length)]
      return { kind: 'special', key, label: SPECIAL_TOWER_TYPES[key].label, icon: SPECIAL_TOWER_TYPES[key].icon }
    }
    return { kind: 'shards', amount: 40 }
  }

  if (outcome.type === 'upgrade') {
    const upgradeable = Object.keys(profile.upgrades).filter(k => (profile.upgrades[k] || 0) < UPGRADE_MAX)
    if (upgradeable.length > 0) {
      const key = upgradeable[Math.floor(Math.random() * upgradeable.length)]
      const label = TOWER_TYPES[key]?.label || SPECIAL_TOWER_TYPES[key]?.label || key
      return { kind: 'upgrade', key, label }
    }
    return { kind: 'shards', amount: 25 }
  }

  const amount = outcome.min + Math.floor(Math.random() * (outcome.max - outcome.min + 1))
  return { kind: 'shards', amount }
}

const ACHIEVEMENTS = [
  { id: 'started', label: 'Getting Started', icon: '🎮', desc: 'Play your first game', check: p => p.gamesPlayed >= 1 },
  { id: 'wave5', label: 'Wave 5 Club', icon: '🌊', desc: 'Reach wave 5 in a single game', check: p => p.bestWave >= 5 },
  { id: 'wave10', label: 'Wave 10 Club', icon: '🔟', desc: 'Reach wave 10 in a single game', check: p => p.bestWave >= 10 },
  { id: 'battlefield', label: 'Battlefield Bound', icon: '⚔️', desc: 'Unlock the Scorched Battlefield', check: p => p.bestLevel >= 2 },
  { id: 'frozen', label: 'Frozen Pioneer', icon: '🧊', desc: 'Reach the Frozen Tundra', check: p => p.bestLevel >= 3 },
  { id: 'apex', label: 'Apex Survivor', icon: '🌋', desc: 'Reach the Volcanic Wasteland', check: p => p.bestLevel >= 5 },
  { id: 'score20', label: 'High Scorer', icon: '⭐', desc: 'Score 20 points in a single game', check: p => p.bestScore >= 20 },
  { id: 'score50', label: 'Score Master', icon: '🏆', desc: 'Score 50 points in a single game', check: p => p.bestScore >= 50 },
]

const TOTAL_LEVELS = 5

const LEVELS = {
  1: {
    name: 'Grassy Meadow',
    groundShades: ['#2d5a27', '#2a5624', '#336024', '#275320'],
    pathShades: ['#7a5c3a', '#725434', '#80613f', '#6c4f30'],
    frameBg: 'linear-gradient(135deg, #2a2015, #1a1510)',
    swatch: '#3a7a2a',
  },
  2: {
    name: 'Scorched Battlefield',
    groundShades: ['#3a3630', '#332f2a', '#403a32', '#2e2a25'],
    pathShades: ['#2a1f18', '#241a14', '#2e2219', '#221812'],
    frameBg: 'linear-gradient(135deg, #241f1c, #120f0d)',
    swatch: '#4a3a30',
  },
  3: {
    name: 'Frozen Tundra',
    groundShades: ['#c8e8f5', '#b3dced', '#9ecfe6', '#a8d8ee'],
    pathShades: ['#7a95a8', '#6f8a9c', '#849fb0', '#6a8695'],
    frameBg: 'linear-gradient(135deg, #1a2830, #0d1820)',
    swatch: '#8fcdea',
  },
  4: {
    name: 'Toxic Swamp',
    groundShades: ['#3a4a2e', '#2f3d25', '#445a32', '#354228'],
    pathShades: ['#2a3320', '#232b1a', '#2e3822', '#1f2718'],
    frameBg: 'linear-gradient(135deg, #1c2416, #10150c)',
    swatch: '#3f5a2a',
  },
  5: {
    name: 'Volcanic Wasteland',
    groundShades: ['#2a1410', '#33180f', '#3a1a12', '#25120d'],
    pathShades: ['#4a1a08', '#5a2005', '#421808', '#3a1506'],
    frameBg: 'linear-gradient(135deg, #2a0f08, #150704)',
    swatch: '#5a2408',
  },
}

function jaggify(x1, y1, x2, y2, segs = 8) {
  const dx = x2 - x1, dy = y2 - y1
  const len = Math.sqrt(dx * dx + dy * dy) || 1
  const px = -dy / len, py = dx / len
  const pts = [{ x: x1, y: y1 }]
  for (let i = 1; i < segs; i++) {
    const t = i / segs
    const jitter = (Math.random() - 0.5) * 1.1
    pts.push({ x: x1 + dx * t + px * jitter, y: y1 + dy * t + py * jitter })
  }
  pts.push({ x: x2, y: y2 })
  return pts
}

function TierAura({ tier, color, centerY = 34 }) {
  if (!tier) return null
  const size = 44 + tier * 8
  return (
    <div className="tier-aura-pulse" style={{
      position: 'absolute', top: centerY - size / 2, left: '50%', transform: 'translateX(-50%)',
      width: size, height: size, borderRadius: '50%',
      background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
      opacity: 0.2 + tier * 0.13, filter: 'blur(2px)', pointerEvents: 'none',
    }} />
  )
}

function TierSparkles({ tier, color, centerX = 20, centerY = 34, radius = 26 }) {
  if (!tier || tier < 2) return null
  const count = tier
  return (
    <>
      {Array.from({ length: count }).map((_, i) => {
        const a = (i / count) * Math.PI * 2 + Math.PI / 4
        const x = centerX + Math.cos(a) * radius
        const y = centerY + Math.sin(a) * radius
        return (
          <div key={i} className="tier-sparkle" style={{
            position: 'absolute', top: y, left: x, width: 4, height: 4,
            borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}`,
            animationDelay: `${i * 0.25}s`, pointerEvents: 'none',
          }} />
        )
      })}
    </>
  )
}

function WizardBase({
  firing, facingLeft = false,
  robeColor, robeShadowColor,
  hatColor, hatBorder, hatTipBg, hatTipIcon, hatTipColor,
  wandGlowIcon, wandGlowColor, wandGlowShadow,
  footColor, footBorder, skinColor = '#f5cba7', eyeColor = '#3a2a1a',
  auraColor,
  tier = 0, tierColor,
  decorations,
}) {
  return (
    <div style={{ position: 'relative', width: 40, height: 66, transform: facingLeft ? 'scaleX(-1)' : 'none' }}>
      <div className={firing ? 'wizard-firing' : ''} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <TierAura tier={tier} color={tierColor} />
        {auraColor && (
          <div style={{
            position: 'absolute', top: 4, left: '50%', transform: 'translateX(-50%)',
            width: 52, height: 52, borderRadius: '50%',
            background: `radial-gradient(circle, ${auraColor} 0%, transparent 70%)`,
            opacity: 0.55, filter: 'blur(2px)', pointerEvents: 'none',
          }} />
        )}
        <GroundShadow width={26} height={7} bottom={-2} />
        {/* Legs */}
        <div style={{ position: 'absolute', bottom: 2, left: '50%', marginLeft: -9, width: 6, height: 11, borderRadius: 3, background: footColor, border: `1px solid ${footBorder}` }} />
        <div style={{ position: 'absolute', bottom: 2, left: '50%', marginLeft: 3, width: 6, height: 11, borderRadius: 3, background: footColor, border: `1px solid ${footBorder}` }} />
        {/* Robe body — back-shadow layer for depth */}
        <div style={{
          position: 'absolute', top: 38, left: '50%', marginLeft: -16, width: 32, height: 24,
          background: robeShadowColor, opacity: 0.5, filter: 'blur(1px)',
          clipPath: 'polygon(28% 0%, 72% 0%, 100% 100%, 0% 100%)',
        }} />
        {/* Robe body */}
        <div style={{
          position: 'absolute', top: 36, left: '50%', marginLeft: -16, width: 32, height: 24,
          background: robeColor, border: `1px solid ${robeShadowColor}`,
          clipPath: 'polygon(28% 0%, 72% 0%, 100% 100%, 0% 100%)',
        }} />
        {/* Robe highlight */}
        <div style={{
          position: 'absolute', top: 38, left: '50%', marginLeft: -12, width: 9, height: 16,
          background: 'rgba(255,255,255,0.25)', borderRadius: '40%', transform: 'rotate(-6deg)',
        }} />
        {/* Arms / sleeves */}
        <div style={{ position: 'absolute', top: 38, left: '50%', marginLeft: -19, width: 8, height: 11, borderRadius: 4, background: robeShadowColor }} />
        <div style={{ position: 'absolute', top: 37, left: '50%', marginLeft: 12, width: 8, height: 11, borderRadius: 4, background: robeShadowColor }} />
        {/* Head */}
        <div style={{
          position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)',
          width: 17, height: 16, borderRadius: '50%', background: skinColor, border: '1px solid #d4a882',
        }} />
        {/* Eyes */}
        <div style={{ position: 'absolute', top: 28, left: '50%', marginLeft: -5, width: 2, height: 2, borderRadius: '50%', background: eyeColor, boxShadow: eyeColor !== '#3a2a1a' ? `0 0 4px ${eyeColor}` : 'none' }} />
        <div style={{ position: 'absolute', top: 28, left: '50%', marginLeft: 1, width: 2, height: 2, borderRadius: '50%', background: eyeColor, boxShadow: eyeColor !== '#3a2a1a' ? `0 0 4px ${eyeColor}` : 'none' }} />
        {/* Hat brim */}
        <div style={{
          position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)',
          width: 28, height: 8, borderRadius: '50%', background: hatBorder,
        }} />
        {/* Hat cone */}
        <div style={{
          position: 'absolute', top: 1, left: '50%', marginLeft: -10, width: 20, height: 22,
          background: hatColor, clipPath: 'polygon(50% 0%, 12% 100%, 88% 100%)',
        }} />
        {/* Hat gloss streak */}
        <div style={{
          position: 'absolute', top: 6, left: '50%', marginLeft: -6, width: 5, height: 12,
          background: 'rgba(255,255,255,0.3)', borderRadius: '40%', transform: 'rotate(-8deg)',
        }} />
        {/* Hat tip */}
        <div style={{
          position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)',
          width: 13, height: 13, background: hatTipBg, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: hatTipColor, fontSize: 8, lineHeight: 1,
        }}>{hatTipIcon}</div>
        {/* Wand */}
        <div style={{
          position: 'absolute', top: 40, left: '50%', marginLeft: 15,
          width: 15, height: 3, background: 'linear-gradient(90deg, #6b3f1f, #c4a065)', borderRadius: 2,
          transform: 'rotate(-40deg)', transformOrigin: 'left center',
        }} />
        {/* Hand */}
        <div style={{ position: 'absolute', top: 37, left: '50%', marginLeft: 20, width: 8, height: 7, background: skinColor, borderRadius: '50%', border: '1px solid #d4a882' }} />
        {/* Wand tip glow */}
        <div className={firing ? 'wand-fire' : ''} style={{
          position: 'absolute', top: 27, left: '50%', marginLeft: 30,
          color: wandGlowColor, fontSize: 9, lineHeight: 1, textShadow: wandGlowShadow, userSelect: 'none',
        }}>{wandGlowIcon}</div>
        {decorations}
        <TierSparkles tier={tier} color={tierColor} />
      </div>
    </div>
  )
}

function Wizard({ firing, facingLeft = false, tier = 0 }) {
  return (
    <WizardBase
      firing={firing} facingLeft={facingLeft} tier={tier} tierColor="#ff8800"
      robeColor="radial-gradient(ellipse at 40% 30%, #ff9933, #a83a00)" robeShadowColor="#7a2600"
      hatColor="radial-gradient(circle at 38% 38%, #ffb366, #922e00)" hatBorder="#5a1a00"
      hatTipBg="#4a1500" hatTipIcon="★" hatTipColor="#ffd700"
      wandGlowIcon="✦" wandGlowColor="#ffe066" wandGlowShadow="0 0 5px #ffd700, 0 0 10px #ff8800"
      footColor="#922e00" footBorder="#5a1a00"
      decorations={
        <>
          {/* floating embers */}
          <div style={{ position: 'absolute', top: -6, left: 3, width: 4, height: 4, borderRadius: '50%', background: '#ffaa33', boxShadow: '0 0 6px #ff8800', opacity: 0.9 }} />
          <div style={{ position: 'absolute', top: -1, left: 30, width: 3, height: 3, borderRadius: '50%', background: '#ffcc55', boxShadow: '0 0 5px #ff6600', opacity: 0.8 }} />
        </>
      }
    />
  )
}

function LightningWizard({ firing, facingLeft = false, tier = 0 }) {
  return (
    <div style={{ position: 'relative', width: 40, height: 66, transform: facingLeft ? 'scaleX(-1)' : 'none' }}>
      <div className={firing ? 'wizard-firing' : ''} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <TierAura tier={tier} color="#ffee44" />
        <GroundShadow width={26} height={7} bottom={-2} />
        {/* Legs */}
        <div style={{ position: 'absolute', bottom: 2, left: '50%', marginLeft: -9, width: 6, height: 11, borderRadius: 3, background: '#a06000', border: '1px solid #7a4400' }} />
        <div style={{ position: 'absolute', bottom: 2, left: '50%', marginLeft: 3, width: 6, height: 11, borderRadius: 3, background: '#a06000', border: '1px solid #7a4400' }} />
        {/* Robe — back-shadow layer */}
        <div style={{
          position: 'absolute', top: 38, left: '50%', marginLeft: -16, width: 32, height: 24,
          background: '#a06000', opacity: 0.5, filter: 'blur(1px)',
          clipPath: 'polygon(28% 0%, 72% 0%, 100% 100%, 0% 100%)',
        }} />
        {/* Robe */}
        <div style={{
          position: 'absolute', top: 36, left: '50%', marginLeft: -16, width: 32, height: 24,
          background: 'radial-gradient(ellipse at 40% 30%, #ffe066, #c8860e)', border: '1px solid #a06000',
          clipPath: 'polygon(28% 0%, 72% 0%, 100% 100%, 0% 100%)',
        }} />
        <div style={{
          position: 'absolute', top: 38, left: '50%', marginLeft: -12, width: 9, height: 16,
          background: 'rgba(255,255,255,0.25)', borderRadius: '40%', transform: 'rotate(-6deg)',
        }} />
        {/* Arms */}
        <div style={{ position: 'absolute', top: 38, left: '50%', marginLeft: -19, width: 8, height: 11, borderRadius: 4, background: '#a06000' }} />
        <div style={{ position: 'absolute', top: 37, left: '50%', marginLeft: 12, width: 8, height: 11, borderRadius: 4, background: '#a06000' }} />
        {/* Head */}
        <div style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', width: 17, height: 16, borderRadius: '50%', background: '#f5cba7', border: '1px solid #d4a882' }} />
        <div style={{ position: 'absolute', top: 28, left: '50%', marginLeft: -5, width: 2, height: 2, borderRadius: '50%', background: '#3a2a1a' }} />
        <div style={{ position: 'absolute', top: 28, left: '50%', marginLeft: 1, width: 2, height: 2, borderRadius: '50%', background: '#3a2a1a' }} />
        {/* Hat brim */}
        <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', width: 28, height: 8, borderRadius: '50%', background: '#8a5000' }} />
        {/* Hat cone */}
        <div style={{ position: 'absolute', top: 1, left: '50%', marginLeft: -10, width: 20, height: 22, background: 'radial-gradient(circle at 38% 38%, #ffd700, #b8740a)', clipPath: 'polygon(50% 0%, 12% 100%, 88% 100%)' }} />
        <div style={{ position: 'absolute', top: 6, left: '50%', marginLeft: -6, width: 5, height: 12, background: 'rgba(255,255,255,0.3)', borderRadius: '40%', transform: 'rotate(-8deg)' }} />
        {/* Hat tip */}
        <div style={{
          position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)',
          width: 13, height: 13, background: '#ffcc00', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, lineHeight: 1,
        }}>⚡</div>
        {/* Crackling static arcs */}
        <div className={firing ? 'crackle-flicker' : ''} style={{
          position: 'absolute', top: -8, left: 4, width: 9, height: 2,
          background: '#fff6cc', opacity: 0.75, boxShadow: '0 0 5px #ffee66',
          clipPath: 'polygon(0 50%, 30% 0%, 40% 50%, 70% 0%, 100% 50%, 70% 100%, 60% 50%, 30% 100%)',
        }} />
        <div className={firing ? 'crackle-flicker' : ''} style={{
          position: 'absolute', top: -5, left: 26, width: 9, height: 2,
          background: '#fff6cc', opacity: 0.7, boxShadow: '0 0 5px #ffee66',
          clipPath: 'polygon(0 50%, 30% 0%, 40% 50%, 70% 0%, 100% 50%, 70% 100%, 60% 50%, 30% 100%)',
        }} />
        {/* Staff — tall, held upright, taller than the wizard */}
        <div style={{
          position: 'absolute', top: -10, left: '50%', marginLeft: 15,
          width: 3, height: 52, background: 'linear-gradient(180deg, #c8a000, #7a4f00)', borderRadius: 2,
        }} />
        {/* Staff top crystal */}
        <div className={firing ? 'wand-fire' : ''} style={{
          position: 'absolute', top: -16, left: '50%', marginLeft: 11,
          color: '#ffffff', fontSize: 11, lineHeight: 1, textShadow: '0 0 6px #ffffaa, 0 0 12px #ffee00', userSelect: 'none',
        }}>⚡</div>
        {/* Hand gripping the staff */}
        <div style={{ position: 'absolute', top: 40, left: '50%', marginLeft: 12, width: 9, height: 8, background: '#f5cba7', borderRadius: '50%', border: '1px solid #d4a882' }} />
        <TierSparkles tier={tier} color="#ffee44" />
      </div>
    </div>
  )
}

function IceWizard({ firing, facingLeft = false, tier = 0 }) {
  return (
    <WizardBase
      firing={firing} facingLeft={facingLeft} tier={tier} tierColor="#33ccff"
      robeColor="radial-gradient(ellipse at 40% 30%, #7fdfff, #0e6fa8)" robeShadowColor="#0a4a70"
      hatColor="radial-gradient(circle at 38% 38%, #a0eaff, #0a5f90)" hatBorder="#063a5a"
      hatTipBg="#0a4a70" hatTipIcon="❄" hatTipColor="#e0faff"
      wandGlowIcon="❄" wandGlowColor="#cdf6ff" wandGlowShadow="0 0 5px #66e0ff, 0 0 10px #00aaff"
      footColor="#0a4a70" footBorder="#063a5a"
      decorations={
        <>
          {/* icicles hanging off the hat brim */}
          <div style={{ position: 'absolute', top: 26, left: 8, width: 0, height: 0, borderLeft: '2px solid transparent', borderRight: '2px solid transparent', borderTop: '7px solid #bdf3ff', opacity: 0.9, filter: 'drop-shadow(0 0 2px #66e0ff)' }} />
          <div style={{ position: 'absolute', top: 27, left: 28, width: 0, height: 0, borderLeft: '2px solid transparent', borderRight: '2px solid transparent', borderTop: '6px solid #bdf3ff', opacity: 0.85 }} />
          {/* frost sparkle */}
          <div style={{ position: 'absolute', top: -6, left: 4, width: 4, height: 4, borderRadius: '50%', background: '#eafcff', boxShadow: '0 0 6px #66e0ff' }} />
        </>
      }
    />
  )
}

function ArcaneWizard({ firing, facingLeft = false, tier = 0 }) {
  return (
    <WizardBase
      firing={firing} facingLeft={facingLeft} tier={tier} tierColor="#cc66ff"
      robeColor="radial-gradient(ellipse at 40% 30%, #d9a3ff, #6a12a8)" robeShadowColor="#4a0a80"
      hatColor="radial-gradient(circle at 38% 38%, #e6c2ff, #5a0f96)" hatBorder="#3a0870"
      hatTipBg="#3a0870" hatTipIcon="✵" hatTipColor="#f0d9ff"
      wandGlowIcon="✵" wandGlowColor="#e6c2ff" wandGlowShadow="0 0 5px #cc66ff, 0 0 10px #8800dd"
      footColor="#5a0f96" footBorder="#3a0870"
      auraColor="rgba(170, 68, 255, 0.35)"
      decorations={
        <>
          {/* orbiting arcane runes */}
          <div style={{ position: 'absolute', top: 10, left: -2, width: 5, height: 5, borderRadius: '50%', background: '#e6c2ff', boxShadow: '0 0 6px #cc66ff' }} />
          <div style={{ position: 'absolute', top: 2, left: 34, width: 4, height: 4, borderRadius: '50%', background: '#cc99ff', boxShadow: '0 0 5px #aa44ff' }} />
          <div style={{ position: 'absolute', top: 44, left: 32, width: 4, height: 4, borderRadius: '50%', background: '#e6c2ff', boxShadow: '0 0 5px #cc66ff' }} />
        </>
      }
    />
  )
}

function PoisonWizard({ firing, facingLeft = false, tier = 0 }) {
  return (
    <WizardBase
      firing={firing} facingLeft={facingLeft} tier={tier} tierColor="#88ff22"
      robeColor="radial-gradient(ellipse at 40% 30%, #baff3d, #2e6a08)" robeShadowColor="#1e4a05"
      hatColor="radial-gradient(circle at 38% 38%, #d4ff8c, #1e4a05)" hatBorder="#123300"
      hatTipBg="#123300" hatTipIcon="☣" hatTipColor="#c2ff5c"
      wandGlowIcon="☣" wandGlowColor="#c2ff8c" wandGlowShadow="0 0 6px #99ff33, 0 0 12px #55cc00"
      footColor="#2e6a08" footBorder="#1e4a05"
      auraColor="rgba(140, 255, 50, 0.4)"
      decorations={
        <>
          {/* toxic ooze blotches for a mottled, radioactive texture */}
          <div style={{ position: 'absolute', top: 40, left: 8, width: 10, height: 7, borderRadius: '50%', background: '#0e3300', opacity: 0.45 }} />
          <div style={{ position: 'absolute', top: 45, left: 20, width: 7, height: 5, borderRadius: '50%', background: '#0e3300', opacity: 0.4 }} />
          {/* dripping ooze */}
          <div style={{ position: 'absolute', top: 58, left: 12, width: 3, height: 7, borderRadius: '0 0 50% 50%', background: '#8cff3d', opacity: 0.85, boxShadow: '0 0 4px #99ff33' }} />
          <div style={{ position: 'absolute', top: 59, left: 24, width: 3, height: 6, borderRadius: '0 0 50% 50%', background: '#8cff3d', opacity: 0.8, boxShadow: '0 0 4px #99ff33' }} />
        </>
      }
    />
  )
}

function ShadowWizard({ firing, facingLeft = false, tier = 0 }) {
  return (
    <WizardBase
      firing={firing} facingLeft={facingLeft} tier={tier} tierColor="#aa66ff"
      robeColor="radial-gradient(ellipse at 40% 30%, #4a1a6a, #1a0630)" robeShadowColor="#0d0318"
      hatColor="radial-gradient(circle at 38% 38%, #6a2a9a, #2a0a4a)" hatBorder="#150525"
      hatTipBg="#150525" hatTipIcon="☾" hatTipColor="#dd99ff"
      wandGlowIcon="☾" wandGlowColor="#cc99ff" wandGlowShadow="0 0 6px #aa44ff, 0 0 12px #6600aa"
      footColor="#2a0a4a" footBorder="#150525"
      eyeColor="#ff3366"
      auraColor="rgba(120, 40, 200, 0.4)"
      decorations={
        <>
          {/* wispy shadow tendrils curling off the robe */}
          <div style={{ position: 'absolute', top: 46, left: -5, width: 11, height: 3, borderRadius: 4, background: '#6a2a9a', opacity: 0.6, transform: 'rotate(-20deg)' }} />
          <div style={{ position: 'absolute', top: 52, left: 30, width: 11, height: 3, borderRadius: 4, background: '#6a2a9a', opacity: 0.55, transform: 'rotate(15deg)' }} />
          {/* eerie floating wisp */}
          <div style={{ position: 'absolute', top: -6, left: 26, width: 4, height: 4, borderRadius: '50%', background: '#dd99ff', boxShadow: '0 0 6px #aa44ff', opacity: 0.85 }} />
        </>
      }
    />
  )
}

function BardWizard({ firing, facingLeft = false, tier = 0 }) {
  return (
    <WizardBase
      firing={firing} facingLeft={facingLeft} tier={tier} tierColor="#ffaa33"
      robeColor="radial-gradient(ellipse at 40% 30%, #ffb366, #b35900)" robeShadowColor="#6b3500"
      hatColor="radial-gradient(circle at 38% 38%, #ffcc80, #b35900)" hatBorder="#6b3500"
      hatTipBg="#6b3500" hatTipIcon="♪" hatTipColor="#fff0dd"
      wandGlowIcon="♪" wandGlowColor="#ffe0b3" wandGlowShadow="0 0 5px #ffaa33, 0 0 10px #cc6600"
      footColor="#b35900" footBorder="#6b3500"
      decorations={
        <>
          {/* floating musical notes */}
          <div style={{ position: 'absolute', top: -7, left: 3, fontSize: 9, color: '#ffe0b3', textShadow: '0 0 4px #ff9922' }}>♪</div>
          <div style={{ position: 'absolute', top: 1, left: 30, fontSize: 8, color: '#ffcc88', textShadow: '0 0 4px #ff9922' }}>♫</div>
        </>
      }
    />
  )
}

function Archer() {
  return (
    <div style={{ position: 'relative', width: 36, height: 36 }}>
      {/* Bow — curved arc on the right */}
      <div style={{
        position: 'absolute', top: 8, left: 34,
        width: 16, height: 20,
        border: '3px solid #8B5E3C',
        borderLeft: 'none',
        borderRadius: '0 50% 50% 0',
        boxSizing: 'border-box',
      }} />
      {/* Bow string */}
      <div style={{
        position: 'absolute', top: 8, left: 35,
        width: 2, height: 20,
        background: '#ddd',
        borderRadius: 1,
      }} />
      {/* Arrow shaft — pointing right */}
      <div style={{
        position: 'absolute', top: 17, left: 18,
        width: 20, height: 2,
        background: '#5a3010',
        borderRadius: 1,
      }} />
      {/* Arrow tip — pointing right */}
      <div style={{
        position: 'absolute', top: 13, left: 38,
        width: 0, height: 0,
        borderTop: '5px solid transparent',
        borderBottom: '5px solid transparent',
        borderLeft: '7px solid #bbb',
      }} />
      {/* Left horn — drawn before head so head covers the base */}
      <div style={{
        position: 'absolute', top: -5, left: '50%', marginLeft: -11,
        width: 8, height: 13,
        background: '#3a8a3a',
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        filter: 'drop-shadow(0 1px 0 #1a4a1a) drop-shadow(1px 0 0 #1a4a1a) drop-shadow(-1px 0 0 #1a4a1a)',
      }} />
      {/* Right horn */}
      <div style={{
        position: 'absolute', top: -5, left: '50%', marginLeft: 3,
        width: 8, height: 13,
        background: '#3a8a3a',
        clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
        filter: 'drop-shadow(0 1px 0 #1a4a1a) drop-shadow(1px 0 0 #1a4a1a) drop-shadow(-1px 0 0 #1a4a1a)',
      }} />
      {/* Head — goblin green from above */}
      <div style={{
        position: 'absolute', top: 2, left: 2,
        width: 32, height: 32,
        background: 'radial-gradient(circle at 38% 35%, #5cb85c, #2d6a2d)',
        borderRadius: '50%',
        border: '2px solid #1a4a1a',
      }} />
      {/* Eyes */}
      <div style={{
        position: 'absolute', top: 12, left: '50%',
        marginLeft: -6, width: 5, height: 5,
        background: '#ff2200', borderRadius: '50%',
        boxShadow: '0 0 4px #ff2200',
      }} />
      <div style={{
        position: 'absolute', top: 12, left: '50%',
        marginLeft: 1, width: 5, height: 5,
        background: '#ff2200', borderRadius: '50%',
        boxShadow: '0 0 4px #ff2200',
      }} />
      {/* Hand on bow — goblin green, right side */}
      <div style={{
        position: 'absolute', top: 13, left: 28,
        width: 9, height: 9,
        background: '#3a8a3a',
        borderRadius: '50%',
        border: '1px solid #1a4a1a',
      }} />
    </div>
  )
}

function Enemy() {
  return (
    <div style={{ position: 'relative', width: 28, height: 28 }}>
      {/* Club head — circle from top-down */}
      <div style={{
        position: 'absolute', top: 8, left: -18,
        width: 12, height: 12,
        background: 'radial-gradient(circle at 35% 35%, #6b3f1f, #3a1a00)',
        borderRadius: '50%',
        border: '1px solid #2a0f00',
      }} />
      {/* Club handle — thin horizontal line from top-down */}
      <div style={{
        position: 'absolute', top: 12, left: -6,
        width: 8, height: 4,
        background: 'linear-gradient(90deg, #4a2800, #8B5E3C)',
        borderRadius: 2,
      }} />
      {/* Head — crown viewed from directly above */}
      <div style={{
        position: 'absolute', top: 2, left: 2,
        width: 24, height: 24,
        background: 'radial-gradient(circle at 38% 35%, #5cb85c, #2d6a2d)',
        borderRadius: '50%',
        border: '2px solid #1a4a1a',
      }} />
      {/* Eyes — two red dots visible from above */}
      <div style={{
        position: 'absolute', top: 9, left: '50%',
        marginLeft: -5, width: 4, height: 4,
        background: '#ff2200', borderRadius: '50%',
        boxShadow: '0 0 4px #ff2200',
      }} />
      <div style={{
        position: 'absolute', top: 9, left: '50%',
        marginLeft: 1, width: 4, height: 4,
        background: '#ff2200', borderRadius: '50%',
        boxShadow: '0 0 4px #ff2200',
      }} />
      {/* Hand — green circle covering handle/head join */}
      <div style={{
        position: 'absolute', top: 10, left: 0,
        width: 8, height: 8,
        background: '#3a8a3a',
        borderRadius: '50%',
        border: '1px solid #1a4a1a',
      }} />
    </div>
  )
}

const PROJECTILE_STYLES = {
  fire: { halo: 'rgba(255,120,0,0.55)', haloMid: 'rgba(255,40,0,0.2)', bodyA: '#ffee88', bodyB: '#ff7700', bodyC: '#cc1100', glow1: '#ff6600', glow2: '#ff2200', core: 'radial-gradient(circle, #ffffff, #ffff99)' },
  ice: { halo: 'rgba(0,200,255,0.55)', haloMid: 'rgba(0,120,255,0.2)', bodyA: '#eaffff', bodyB: '#33bbff', bodyC: '#0055aa', glow1: '#00ccff', glow2: '#0088ff', core: 'radial-gradient(circle, #ffffff, #cceeff)' },
  arcane: { halo: 'rgba(170,0,255,0.55)', haloMid: 'rgba(100,0,180,0.2)', bodyA: '#f0d9ff', bodyB: '#aa33ff', bodyC: '#5500aa', glow1: '#aa00ff', glow2: '#7700cc', core: 'radial-gradient(circle, #ffffff, #eeccff)' },
  poison: { halo: 'rgba(60,220,0,0.55)', haloMid: 'rgba(30,120,0,0.2)', bodyA: '#e8ffcc', bodyB: '#66cc00', bodyC: '#225500', glow1: '#66ff00', glow2: '#337700', core: 'radial-gradient(circle, #ffffff, #ddffaa)' },
  shadow: { halo: 'rgba(170,68,255,0.5)', haloMid: 'rgba(90,26,138,0.2)', bodyA: '#e0c2ff', bodyB: '#8833cc', bodyC: '#3a0a5a', glow1: '#aa44ff', glow2: '#6600aa', core: 'radial-gradient(circle, #ffffff, #ddbbff)' },
  bard: { halo: 'rgba(255,170,51,0.5)', haloMid: 'rgba(180,90,10,0.2)', bodyA: '#ffe0b3', bodyB: '#ff9922', bodyC: '#8a4400', glow1: '#ffaa33', glow2: '#cc6600', core: 'radial-gradient(circle, #ffffff, #ffddaa)' },
}

function Fireball({ kind = 'fire' }) {
  const s = PROJECTILE_STYLES[kind] || PROJECTILE_STYLES.fire
  return (
    <div className="fireball" style={{ position: 'relative', width: 22, height: 22 }}>
      {/* Outer halo */}
      <div style={{
        position: 'absolute', top: -3, left: -3, width: 28, height: 28,
        background: `radial-gradient(circle, ${s.halo} 0%, ${s.haloMid} 55%, transparent 75%)`,
        borderRadius: '50%',
        filter: 'blur(3px)',
      }} />
      {/* Main body */}
      <div style={{
        position: 'absolute', top: 2, left: 2, width: 18, height: 18,
        background: `radial-gradient(circle at 38% 35%, ${s.bodyA}, ${s.bodyB}, ${s.bodyC})`,
        borderRadius: '50%',
        boxShadow: `0 0 8px ${s.glow1}, 0 0 16px ${s.glow2}`,
      }} />
      {/* White-hot core */}
      <div style={{
        position: 'absolute', top: 7, left: 7, width: 8, height: 8,
        background: s.core,
        borderRadius: '50%',
      }} />
    </div>
  )
}

function CrystalShard() {
  return (
    <div className="shard-spin" style={{ position: 'relative', width: 22, height: 22 }}>
      {/* Outer glow */}
      <div style={{
        position: 'absolute', top: -3, left: -3, width: 28, height: 28,
        background: 'radial-gradient(circle, rgba(51,255,204,0.5) 0%, rgba(0,170,136,0.2) 55%, transparent 75%)',
        borderRadius: '50%', filter: 'blur(3px)',
      }} />
      {/* Faceted shard body */}
      <div style={{
        position: 'absolute', top: 3, left: 3, width: 16, height: 16,
        background: 'linear-gradient(160deg, #d4fff2, #33ccb3, #0a7a6a)',
        clipPath: 'polygon(50% 0%, 90% 35%, 75% 100%, 25% 100%, 10% 35%)',
        boxShadow: '0 0 8px #33ffcc, 0 0 16px #00aa88',
      }} />
      {/* Bright facet highlight */}
      <div style={{
        position: 'absolute', top: 5, left: 8, width: 7, height: 7,
        background: 'rgba(255,255,255,0.8)',
        clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
      }} />
    </div>
  )
}

function Troll() {
  return (
    <div style={{ position: 'relative', width: 34, height: 34 }}>
      <div style={{
        position: 'absolute', top: 9, left: -22,
        width: 16, height: 16,
        background: 'radial-gradient(circle at 35% 35%, #8a6b4a, #4a3010)',
        borderRadius: '50%',
        border: '1px solid #2a1a00',
      }} />
      <div style={{
        position: 'absolute', top: 15, left: -8,
        width: 10, height: 5,
        background: 'linear-gradient(90deg, #4a2800, #8B5E3C)',
        borderRadius: 2,
      }} />
      <div style={{
        position: 'absolute', top: 2, left: 2,
        width: 30, height: 30,
        background: 'radial-gradient(circle at 38% 35%, #7a8a6a, #3a4a2a)',
        borderRadius: '50%',
        border: '3px solid #1a2a0a',
      }} />
      <div style={{
        position: 'absolute', top: 11, left: '50%',
        marginLeft: -6, width: 5, height: 5,
        background: '#ff4400', borderRadius: '50%',
        boxShadow: '0 0 5px #ff4400',
      }} />
      <div style={{
        position: 'absolute', top: 11, left: '50%',
        marginLeft: 2, width: 5, height: 5,
        background: '#ff4400', borderRadius: '50%',
        boxShadow: '0 0 5px #ff4400',
      }} />
      <div style={{
        position: 'absolute', top: 12, left: 0,
        width: 10, height: 10,
        background: '#3a4a2a',
        borderRadius: '50%',
        border: '1px solid #1a2a0a',
      }} />
    </div>
  )
}

function Scout() {
  return (
    <div style={{ position: 'relative', width: 22, height: 22 }}>
      <div style={{
        position: 'absolute', top: 1, left: 1,
        width: 20, height: 20,
        background: 'radial-gradient(circle at 38% 35%, #baff8a, #4aa83a)',
        borderRadius: '50%',
        border: '2px solid #2a7a1a',
      }} />
      <div style={{
        position: 'absolute', top: 7, left: '50%',
        marginLeft: -4, width: 3, height: 3,
        background: '#ff2200', borderRadius: '50%',
        boxShadow: '0 0 3px #ff2200',
      }} />
      <div style={{
        position: 'absolute', top: 7, left: '50%',
        marginLeft: 1, width: 3, height: 3,
        background: '#ff2200', borderRadius: '50%',
        boxShadow: '0 0 3px #ff2200',
      }} />
    </div>
  )
}

function ArmoredGoblin() {
  return (
    <div style={{ position: 'relative', width: 28, height: 28 }}>
      {/* mace — club head */}
      <div style={{
        position: 'absolute', top: 8, left: -18,
        width: 12, height: 12,
        background: 'radial-gradient(circle at 35% 35%, #9a9a92, #4a4a44)',
        borderRadius: '50%',
        border: '1px solid #2a2a26',
      }} />
      <div style={{
        position: 'absolute', top: 12, left: -6,
        width: 8, height: 4,
        background: 'linear-gradient(90deg, #4a4a44, #8a8a80)',
        borderRadius: 2,
      }} />
      {/* helmet */}
      <div style={{
        position: 'absolute', top: 2, left: 2,
        width: 24, height: 24,
        background: 'radial-gradient(circle at 38% 35%, #8a8a80, #3a3a34)',
        borderRadius: '50%',
        border: '2px solid #232320',
      }} />
      {/* helmet shine */}
      <div style={{
        position: 'absolute', top: 4, left: 5,
        width: 18, height: 6,
        background: 'linear-gradient(90deg, transparent, #c4c4b8, transparent)',
        borderRadius: '50%',
        opacity: 0.6,
      }} />
      {/* eyes */}
      <div style={{
        position: 'absolute', top: 9, left: '50%',
        marginLeft: -5, width: 4, height: 4,
        background: '#ff2200', borderRadius: '50%',
        boxShadow: '0 0 4px #ff2200',
      }} />
      <div style={{
        position: 'absolute', top: 9, left: '50%',
        marginLeft: 1, width: 4, height: 4,
        background: '#ff2200', borderRadius: '50%',
        boxShadow: '0 0 4px #ff2200',
      }} />
      {/* hand */}
      <div style={{
        position: 'absolute', top: 10, left: 0,
        width: 8, height: 8,
        background: '#4a4a44',
        borderRadius: '50%',
        border: '1px solid #232320',
      }} />
    </div>
  )
}

function StormWizard({ firing, facingLeft = false, tier = 0 }) {
  return (
    <div style={{ position: 'relative', width: 44, height: 68, transform: facingLeft ? 'scaleX(-1)' : 'none' }}>
      <div className={firing ? 'wizard-firing' : ''} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <TierAura tier={tier} color="#4488ff" />
        <GroundShadow width={32} height={9} bottom={-2} />
        {/* swirling storm-cloud base instead of legs */}
        <div style={{ position: 'absolute', bottom: 3, left: '50%', marginLeft: -17, width: 16, height: 11, borderRadius: '50%', background: 'radial-gradient(ellipse at 40% 30%, #dce8ff, #3a5a99)' }} />
        <div style={{ position: 'absolute', bottom: 3, left: '50%', marginLeft: 2, width: 16, height: 11, borderRadius: '50%', background: 'radial-gradient(ellipse at 40% 30%, #dce8ff, #3a5a99)' }} />
        <div style={{ position: 'absolute', bottom: 7, left: '50%', transform: 'translateX(-50%)', width: 30, height: 12, borderRadius: '50%', background: 'radial-gradient(ellipse at 40% 30%, #eef4ff, #4466aa)' }} />
        {/* Robe — back-shadow layer */}
        <div style={{
          position: 'absolute', top: 40, left: '50%', marginLeft: -17, width: 34, height: 25,
          background: '#0a1a3a', opacity: 0.5, filter: 'blur(1px)',
          clipPath: 'polygon(28% 0%, 72% 0%, 100% 100%, 0% 100%)',
        }} />
        {/* Robe */}
        <div style={{
          position: 'absolute', top: 38, left: '50%', marginLeft: -17, width: 34, height: 25,
          background: 'radial-gradient(ellipse at 40% 30%, #6fa8ff, #12336a)', border: '1px solid #0a2050',
          clipPath: 'polygon(28% 0%, 72% 0%, 100% 100%, 0% 100%)',
        }} />
        <div style={{
          position: 'absolute', top: 40, left: '50%', marginLeft: -13, width: 9, height: 16,
          background: 'rgba(255,255,255,0.25)', borderRadius: '40%', transform: 'rotate(-6deg)',
        }} />
        {/* Arms */}
        <div style={{ position: 'absolute', top: 40, left: '50%', marginLeft: -20, width: 8, height: 11, borderRadius: 4, background: '#12336a' }} />
        <div style={{ position: 'absolute', top: 39, left: '50%', marginLeft: 13, width: 8, height: 11, borderRadius: 4, background: '#12336a' }} />
        {/* Head */}
        <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', width: 17, height: 16, borderRadius: '50%', background: '#f5cba7', border: '1px solid #d4a882' }} />
        <div style={{ position: 'absolute', top: 30, left: '50%', marginLeft: -5, width: 2, height: 2, borderRadius: '50%', background: '#3a2a1a' }} />
        <div style={{ position: 'absolute', top: 30, left: '50%', marginLeft: 1, width: 2, height: 2, borderRadius: '50%', background: '#3a2a1a' }} />
        {/* Hat brim */}
        <div style={{ position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)', width: 28, height: 8, borderRadius: '50%', background: '#0a2050' }} />
        {/* Hat cone */}
        <div style={{ position: 'absolute', top: 3, left: '50%', marginLeft: -10, width: 20, height: 22, background: 'radial-gradient(circle at 38% 38%, #a0c8ff, #163a80)', clipPath: 'polygon(50% 0%, 12% 100%, 88% 100%)' }} />
        <div style={{ position: 'absolute', top: 8, left: '50%', marginLeft: -6, width: 5, height: 12, background: 'rgba(255,255,255,0.3)', borderRadius: '40%', transform: 'rotate(-8deg)' }} />
        {/* Hat tip */}
        <div style={{
          position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)',
          width: 13, height: 13, background: '#0a2050', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dceeff', fontSize: 8, lineHeight: 1,
        }}>⚡</div>
        {/* Crackling storm arcs, brighten and quicken while firing */}
        <div className={firing ? 'crackle-flicker' : ''} style={{
          position: 'absolute', top: -6, left: 1, width: 12, height: 3,
          background: '#cdeeff', opacity: 0.8, boxShadow: '0 0 8px #66ccff, 0 0 14px #4488ff',
          clipPath: 'polygon(0 50%, 30% 0%, 40% 50%, 70% 0%, 100% 50%, 70% 100%, 60% 50%, 30% 100%)',
        }} />
        <div className={firing ? 'crackle-flicker' : ''} style={{
          position: 'absolute', top: -3, left: 28, width: 12, height: 3,
          background: '#cdeeff', opacity: 0.75, boxShadow: '0 0 8px #66ccff, 0 0 14px #4488ff',
          clipPath: 'polygon(0 50%, 30% 0%, 40% 50%, 70% 0%, 100% 50%, 70% 100%, 60% 50%, 30% 100%)',
        }} />
        {/* Wand */}
        <div style={{
          position: 'absolute', top: 42, left: '50%', marginLeft: 16,
          width: 15, height: 3, background: 'linear-gradient(90deg, #6b3f1f, #c4a065)', borderRadius: 2,
          transform: 'rotate(-40deg)', transformOrigin: 'left center',
        }} />
        <div style={{ position: 'absolute', top: 39, left: '50%', marginLeft: 21, width: 8, height: 7, background: '#f5cba7', borderRadius: '50%', border: '1px solid #d4a882' }} />
        <div className={firing ? 'wand-fire' : ''} style={{
          position: 'absolute', top: 29, left: '50%', marginLeft: 31,
          color: '#cce4ff', fontSize: 9, lineHeight: 1, textShadow: '0 0 5px #6faaff, 0 0 10px #2255dd', userSelect: 'none',
        }}>✺</div>
        <TierSparkles tier={tier} color="#4488ff" centerY={38} />
      </div>
    </div>
  )
}

function CrystalWizard({ firing, facingLeft = false, tier = 0 }) {
  return (
    <div style={{ position: 'relative', width: 40, height: 66, transform: facingLeft ? 'scaleX(-1)' : 'none' }}>
      <div className={firing ? 'wizard-firing' : ''} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <TierAura tier={tier} color="#22ffcc" />
        <GroundShadow width={24} height={7} bottom={-2} />
        {/* crystal shard legs instead of feet */}
        <div style={{ position: 'absolute', bottom: 2, left: '50%', marginLeft: -9, width: 7, height: 12, background: '#0a5a4e', clipPath: 'polygon(50% 0%, 100% 30%, 80% 100%, 20% 100%)' }} />
        <div style={{ position: 'absolute', bottom: 2, left: '50%', marginLeft: 2, width: 7, height: 12, background: '#0a5a4e', clipPath: 'polygon(50% 0%, 100% 30%, 80% 100%, 20% 100%)' }} />
        {/* faceted crystalline torso instead of a round robe */}
        <div style={{
          position: 'absolute', top: 34, left: '50%', marginLeft: -16, width: 32, height: 28,
          background: 'linear-gradient(160deg, #0a7a6a, #054a40)',
          clipPath: 'polygon(50% 0%, 88% 12%, 100% 55%, 78% 100%, 22% 100%, 0% 55%, 12% 12%)',
        }} />
        {/* lit facet */}
        <div style={{
          position: 'absolute', top: 37, left: '50%', marginLeft: -12, width: 16, height: 19,
          background: 'linear-gradient(160deg, #d4fff2, #33ccb3)',
          clipPath: 'polygon(50% 0%, 100% 30%, 80% 100%, 20% 100%, 0% 30%)',
          opacity: 0.85,
        }} />
        {/* shadow facet */}
        <div style={{
          position: 'absolute', top: 42, left: '50%', marginLeft: 4, width: 12, height: 15,
          background: 'linear-gradient(160deg, #0a5a4e, #032a24)',
          clipPath: 'polygon(50% 0%, 100% 35%, 75% 100%, 20% 100%)',
          opacity: 0.8,
        }} />
        {/* Head — crystalline point */}
        <div style={{
          position: 'absolute', top: 21, left: '50%', transform: 'translateX(-50%)',
          width: 20, height: 20,
          background: 'radial-gradient(circle at 38% 38%, #a8ffee, #0a8a78)',
          borderRadius: '50%', border: '2px solid #054a40',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 11, height: 11, background: '#054a40', borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#dcffee', fontSize: 7, lineHeight: 1,
          }}>◆</div>
        </div>
        <div style={{
          position: 'absolute', top: 24, left: '50%', marginLeft: -8, width: 8, height: 4,
          background: 'rgba(255,255,255,0.35)', borderRadius: '50%', transform: 'rotate(-20deg)',
        }} />
        {/* floating orbiting shards */}
        <div style={{ position: 'absolute', top: 20, left: -2, width: 6, height: 8, background: '#7fffe8', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', opacity: 0.9, boxShadow: '0 0 6px #33ffcc' }} />
        <div style={{ position: 'absolute', top: 12, left: 32, width: 5, height: 7, background: '#7fffe8', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', opacity: 0.85, boxShadow: '0 0 5px #33ffcc' }} />
        <div style={{ position: 'absolute', top: 48, left: 30, width: 5, height: 6, background: '#a8ffee', clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', opacity: 0.8, boxShadow: '0 0 5px #33ffcc' }} />
        {/* Wand */}
        <div style={{
          position: 'absolute', top: 40, left: '50%', marginLeft: 15,
          width: 15, height: 3, background: 'linear-gradient(90deg, #6b3f1f, #c4a065)', borderRadius: 2,
          transform: 'rotate(-40deg)', transformOrigin: 'left center',
        }} />
        <div style={{ position: 'absolute', top: 37, left: '50%', marginLeft: 20, width: 8, height: 7, background: '#f5cba7', borderRadius: '50%', border: '1px solid #d4a882' }} />
        <div className={firing ? 'wand-fire' : ''} style={{
          position: 'absolute', top: 27, left: '50%', marginLeft: 30,
          color: '#ccffee', fontSize: 9, lineHeight: 1, textShadow: '0 0 5px #66ffcc, 0 0 10px #00aa88', userSelect: 'none',
        }}>◆</div>
        <TierSparkles tier={tier} color="#22ffcc" />
      </div>
    </div>
  )
}

const WIZARD_COMPONENTS = { fire: Wizard, lightning: LightningWizard, ice: IceWizard, arcane: ArcaneWizard, poison: PoisonWizard, storm: StormWizard, crystal: CrystalWizard, shadow: ShadowWizard, bard: BardWizard }
const ENEMY_COMPONENTS = { goblin: Enemy, archer: Archer, troll: Troll, scout: Scout, armoredGoblin: ArmoredGoblin }

function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// Smooth 2D value noise: sample at a fractional (x, y) and it blends
// continuously between the surrounding random lattice points, instead of
// jumping randomly from cell to cell.
function smoothNoise2D(x, y, seed) {
  const x0 = Math.floor(x), y0 = Math.floor(y)
  const xf = x - x0, yf = y - y0
  const fx = xf * xf * (3 - 2 * xf)
  const fy = yf * yf * (3 - 2 * yf)
  const n00 = seededRandom(x0 * 137 + y0 * 971 + seed)
  const n10 = seededRandom((x0 + 1) * 137 + y0 * 971 + seed)
  const n01 = seededRandom(x0 * 137 + (y0 + 1) * 971 + seed)
  const n11 = seededRandom((x0 + 1) * 137 + (y0 + 1) * 971 + seed)
  const nx0 = n00 + (n10 - n00) * fx
  const nx1 = n01 + (n11 - n01) * fx
  return nx0 + (nx1 - nx0) * fy
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function lerpColor(c1, c2, t) {
  const [r1, g1, b1] = hexToRgb(c1)
  const [r2, g2, b2] = hexToRgb(c2)
  return `rgb(${Math.round(r1 + (r2 - r1) * t)}, ${Math.round(g1 + (g2 - g1) * t)}, ${Math.round(b1 + (b2 - b1) * t)})`
}

// Blends smoothly across every color in the palette, not just two endpoints.
function paletteColor(colors, t) {
  const clamped = Math.max(0, Math.min(0.9999, t))
  const scaled = clamped * (colors.length - 1)
  const i = Math.floor(scaled)
  return lerpColor(colors[i], colors[i + 1], scaled - i)
}

function BreezeOverlay() {
  const streaks = Array.from({ length: 5 }, (_, i) => {
    const seed = i * 53 + 9
    return {
      top: seededRandom(seed) * 100,
      delay: seededRandom(seed + 1) * 8,
      duration: 7 + seededRandom(seed + 2) * 5,
      width: 90 + seededRandom(seed + 3) * 130,
    }
  })
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 5 }}>
      {streaks.map((s, i) => (
        <div key={i} className="breeze-streak" style={{
          position: 'absolute', top: `${s.top}%`, left: -160, width: s.width, height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)',
          animationDuration: `${s.duration}s`, animationDelay: `${s.delay}s`,
          filter: 'blur(1px)',
        }} />
      ))}
    </div>
  )
}

function RainOverlay() {
  const drops = Array.from({ length: 35 }, (_, i) => {
    const seed = i * 43 + 5
    return {
      left: seededRandom(seed) * 100,
      duration: 0.5 + seededRandom(seed + 1) * 0.4,
      delay: seededRandom(seed + 2) * 2,
      length: 10 + seededRandom(seed + 3) * 10,
    }
  })
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 6 }}>
      {drops.map((d, i) => (
        <div key={i} className="rain-drop" style={{
          position: 'absolute', top: -20, left: `${d.left}%`, width: 2, height: d.length,
          background: 'linear-gradient(180deg, transparent, rgba(180,200,255,0.5))',
          animationDuration: `${d.duration}s`, animationDelay: `${d.delay}s`,
        }} />
      ))}
    </div>
  )
}

function SnowOverlay() {
  const flakes = Array.from({ length: 25 }, (_, i) => {
    const seed = i * 61 + 17
    return {
      left: seededRandom(seed) * 100,
      duration: 4 + seededRandom(seed + 1) * 3,
      delay: seededRandom(seed + 2) * 5,
      size: 3 + seededRandom(seed + 3) * 3,
    }
  })
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 6 }}>
      {flakes.map((f, i) => (
        <div key={i} className="snow-flake" style={{
          position: 'absolute', top: -10, left: `${f.left}%`, width: f.size, height: f.size, borderRadius: '50%',
          background: 'rgba(255,255,255,0.85)', boxShadow: '0 0 3px rgba(255,255,255,0.6)',
          animationDuration: `${f.duration}s`, animationDelay: `${f.delay}s`,
        }} />
      ))}
    </div>
  )
}

function EmberOverlay() {
  const embers = Array.from({ length: 20 }, (_, i) => {
    const seed = i * 79 + 23
    return {
      left: seededRandom(seed) * 100,
      duration: 3 + seededRandom(seed + 1) * 3,
      delay: seededRandom(seed + 2) * 5,
      dx: (seededRandom(seed + 3) - 0.5) * 40,
      size: 2 + seededRandom(seed + 4) * 3,
    }
  })
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 6 }}>
      {embers.map((e, i) => (
        <div key={i} className="floating-particle" style={{
          position: 'absolute', bottom: -10, left: `${e.left}%`, width: e.size, height: e.size,
          background: '#ff8833', boxShadow: '0 0 6px #ff6600',
          animationDuration: `${e.duration}s`, animationDelay: `${e.delay}s`,
          '--dx': `${e.dx}px`,
        }} />
      ))}
    </div>
  )
}

function PageBackdrop({ blobs, blobOpacity = 0.3, particleCount = 0 }) {
  const stars = Array.from({ length: 20 }, (_, i) => {
    const seed = i * 71 + 13
    return {
      top: seededRandom(seed) * 100,
      left: seededRandom(seed + 1) * 100,
      size: 2 + seededRandom(seed + 2) * 3,
      delay: seededRandom(seed + 3) * 3,
    }
  })
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const seed = i * 137 + 41
    return {
      left: seededRandom(seed) * 100,
      size: 3 + seededRandom(seed + 1) * 4,
      dx: (seededRandom(seed + 2) - 0.5) * 60,
      duration: 4 + seededRandom(seed + 3) * 5,
      delay: seededRandom(seed + 4) * 6,
      hue: ['#ffcc66', '#cc99ff', '#66ccff', '#ff99cc'][i % 4],
    }
  })
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      {blobs.map((b, i) => (
        <div key={i} className="bg-blob" style={{
          top: `${b.top}%`, left: `${b.left}%`, width: b.size, height: b.size,
          background: b.color, opacity: blobOpacity, animationDelay: `${i * 0.8}s`,
        }} />
      ))}
      {stars.map((s, i) => (
        <div key={i} className="twinkle-star" style={{
          top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size,
          background: 'white', animationDelay: `${s.delay}s`,
        }} />
      ))}
      {particles.map((p, i) => (
        <div key={i} className="floating-particle" style={{
          bottom: -10, left: `${p.left}%`, width: p.size, height: p.size,
          background: p.hue, boxShadow: `0 0 6px ${p.hue}`,
          animationDuration: `${p.duration}s`, animationDelay: `${p.delay}s`,
          '--dx': `${p.dx}px`,
        }} />
      ))}
    </div>
  )
}

function GroundShadow({ width = 24, height = 8, bottom = -3 }) {
  return (
    <div style={{
      position: 'absolute', bottom, left: '50%', transform: 'translateX(-50%)',
      width, height, borderRadius: '50%',
      background: 'radial-gradient(ellipse, rgba(0,0,0,0.4), transparent 72%)',
      pointerEvents: 'none',
    }} />
  )
}

function Tree({ rot = 0 }) {
  return (
    <div style={{ position: 'relative', width: 36, height: 42, transform: `rotate(${rot}deg)`, pointerEvents: 'none' }}>
      <GroundShadow width={26} height={9} bottom={-2} />
      {/* trunk — gradient gives it a rounded, cylindrical look */}
      <div style={{
        position: 'absolute', bottom: 5, left: '50%', marginLeft: -4,
        width: 8, height: 15,
        background: 'linear-gradient(90deg, #2e1c0c 0%, #6b4523 40%, #8a5c30 55%, #4a2f14 100%)',
        borderRadius: 2,
      }} />
      {/* back canopy — deep shadow layer, offset down-right for depth */}
      <div style={{
        position: 'absolute', top: 8, left: 5, width: 28, height: 26,
        background: 'radial-gradient(circle at 65% 70%, #173a10, #0c2408)',
        borderRadius: '50%',
      }} />
      {/* mid canopy — main body */}
      <div style={{
        position: 'absolute', top: 3, left: 6, width: 26, height: 25,
        background: 'radial-gradient(circle at 38% 32%, #5cad3f 0%, #2e7a20 55%, #163e0e 100%)',
        borderRadius: '50%',
        border: '1px solid #0f2e0a',
      }} />
      {/* sunlit highlight clump — top-left, makes it pop */}
      <div style={{
        position: 'absolute', top: 0, left: 9, width: 15, height: 14,
        background: 'radial-gradient(circle at 35% 30%, #a3ea7c, #5cad3f 75%)',
        borderRadius: '50%',
        opacity: 0.95,
      }} />
    </div>
  )
}

function Rock({ rot = 0 }) {
  return (
    <div style={{ position: 'relative', width: 28, height: 22, transform: `rotate(${rot}deg)`, pointerEvents: 'none' }}>
      <GroundShadow width={22} height={7} bottom={-2} />
      {/* base silhouette */}
      <div style={{
        position: 'absolute', top: 3, left: 1, width: 25, height: 17,
        background: '#454540',
        clipPath: 'polygon(8% 100%, 0% 55%, 18% 18%, 52% 0%, 90% 14%, 100% 58%, 84% 100%)',
      }} />
      {/* lit facet — upper-left, catches the light */}
      <div style={{
        position: 'absolute', top: 3, left: 2, width: 17, height: 13,
        background: 'linear-gradient(140deg, #d6d6cc 0%, #a3a39a 60%, #7c7c72 100%)',
        clipPath: 'polygon(6% 100%, 0% 48%, 28% 12%, 68% 0%, 92% 32%, 62% 100%)',
      }} />
      {/* shadow facet — lower-right, away from the light */}
      <div style={{
        position: 'absolute', top: 9, left: 13, width: 14, height: 11,
        background: 'linear-gradient(140deg, #6a6a5e 0%, #454540 60%, #2e2e28 100%)',
        clipPath: 'polygon(0% 30%, 32% 0%, 100% 22%, 88% 100%, 18% 100%)',
      }} />
    </div>
  )
}

function Flowers() {
  return (
    <div style={{ position: 'relative', width: 26, height: 20, pointerEvents: 'none' }}>
      <GroundShadow width={22} height={6} bottom={-1} />
      <div style={{ position: 'absolute', top: 0, left: 2, width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #ffb3d4, #ff6fae)', border: '1px solid #cc3d7a' }} />
      <div style={{ position: 'absolute', top: 6, left: 10, width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #fff2b3, #ffe066)', border: '1px solid #cc9e00' }} />
      <div style={{ position: 'absolute', top: 1, left: 17, width: 6, height: 6, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #c9e9ff, #8ecfff)', border: '1px solid #3d8fcc' }} />
    </div>
  )
}

function GrassTuft({ rot = 0 }) {
  return (
    <div style={{ position: 'relative', pointerEvents: 'none' }}>
      <GroundShadow width={16} height={5} bottom={-2} />
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', transform: `rotate(${rot * 0.3}deg)` }}>
        <div style={{ width: 3, height: 12, background: 'linear-gradient(180deg, #4a9a35, #2e5a20)', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: 3, height: 17, background: 'linear-gradient(180deg, #5cb843, #336024)', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: 3, height: 11, background: 'linear-gradient(180deg, #4a9a35, #2e5a20)', borderRadius: '2px 2px 0 0' }} />
      </div>
    </div>
  )
}

function Pebbles() {
  return (
    <div style={{ position: 'relative', width: 30, height: 14, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: 2, left: 2, width: 6, height: 5, borderRadius: '50%', background: '#5a4326', border: '1px solid #3e2e18' }} />
      <div style={{ position: 'absolute', top: 6, left: 14, width: 5, height: 4, borderRadius: '50%', background: '#6b5230', border: '1px solid #3e2e18' }} />
      <div style={{ position: 'absolute', top: 0, left: 20, width: 4, height: 4, borderRadius: '50%', background: '#5a4326', border: '1px solid #3e2e18' }} />
    </div>
  )
}

function Crack({ rot = 0 }) {
  return (
    <div style={{
      width: 24, height: 3,
      background: 'linear-gradient(90deg, transparent, #4e3a20, transparent)',
      transform: `rotate(${rot}deg)`,
      pointerEvents: 'none',
    }} />
  )
}

function DeadTree({ rot = 0 }) {
  return (
    <div style={{ position: 'relative', width: 32, height: 38, transform: `rotate(${rot}deg)`, pointerEvents: 'none' }}>
      <GroundShadow width={22} height={7} bottom={-2} />
      {/* bare branches */}
      <div style={{ position: 'absolute', bottom: 19, left: '50%', width: 15, height: 2, background: '#1c1815', transform: 'translateX(-92%) rotate(-32deg)', transformOrigin: 'right center' }} />
      <div style={{ position: 'absolute', bottom: 19, left: '50%', width: 15, height: 2, background: '#1c1815', transform: 'translateX(-8%) rotate(32deg)', transformOrigin: 'left center' }} />
      <div style={{ position: 'absolute', bottom: 13, left: '50%', width: 11, height: 2, background: '#1c1815', transform: 'translateX(-88%) rotate(-48deg)', transformOrigin: 'right center' }} />
      <div style={{ position: 'absolute', bottom: 13, left: '50%', width: 11, height: 2, background: '#1c1815', transform: 'translateX(-12%) rotate(48deg)', transformOrigin: 'left center' }} />
      {/* trunk, drawn last to cover branch bases */}
      <div style={{
        position: 'absolute', bottom: 5, left: '50%', marginLeft: -3,
        width: 6, height: 18,
        background: 'linear-gradient(90deg, #14100d, #362a20, #201810)',
        borderRadius: 2,
      }} />
    </div>
  )
}

function MetalDebris({ rot = 0 }) {
  return (
    <div style={{ position: 'relative', width: 28, height: 16, transform: `rotate(${rot}deg)`, pointerEvents: 'none' }}>
      <GroundShadow width={20} height={6} bottom={-2} />
      <div style={{
        position: 'absolute', top: 4, left: 2, width: 20, height: 5,
        background: 'linear-gradient(90deg, #8a8a80, #4a4a44)',
        clipPath: 'polygon(0% 30%, 85% 0%, 100% 50%, 85% 100%, 0% 70%)',
      }} />
      <div style={{
        position: 'absolute', top: 2, left: 20, width: 5, height: 5,
        background: 'radial-gradient(circle at 35% 30%, #cc8844, #6a3a1a)',
        borderRadius: '50%',
      }} />
    </div>
  )
}

function ScorchMark({ rot = 0 }) {
  return (
    <div style={{
      width: 26, height: 16,
      background: 'radial-gradient(ellipse at center, #1a1512 0%, #100d0a 60%, transparent 90%)',
      borderRadius: '50%',
      transform: `rotate(${rot}deg)`,
      pointerEvents: 'none',
    }} />
  )
}

function IceCrystal({ rot = 0 }) {
  return (
    <div style={{ position: 'relative', width: 20, height: 24, transform: `rotate(${rot}deg)`, pointerEvents: 'none' }}>
      <GroundShadow width={16} height={5} bottom={-2} />
      <div style={{
        position: 'absolute', bottom: 2, left: '50%', marginLeft: -6, width: 12, height: 20,
        background: 'linear-gradient(160deg, #e8fbff, #7fd4f0, #2a8fc0)',
        clipPath: 'polygon(50% 0%, 85% 30%, 70% 100%, 30% 100%, 15% 30%)',
        boxShadow: '0 0 6px rgba(150,220,255,0.6)',
      }} />
    </div>
  )
}

function FrozenBush({ rot = 0 }) {
  return (
    <div style={{ position: 'relative', width: 22, height: 16, transform: `rotate(${rot}deg)`, pointerEvents: 'none' }}>
      <GroundShadow width={18} height={5} bottom={-2} />
      <div style={{ position: 'absolute', bottom: 2, left: '50%', marginLeft: -10, width: 20, height: 12, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #4a6a3a, #2a4a22)' }} />
      <div style={{ position: 'absolute', bottom: 8, left: '50%', marginLeft: -8, width: 16, height: 6, borderRadius: '50%', background: 'rgba(255,255,255,0.85)' }} />
    </div>
  )
}

function BogMushroom({ rot = 0 }) {
  return (
    <div style={{ position: 'relative', width: 16, height: 20, transform: `rotate(${rot}deg)`, pointerEvents: 'none' }}>
      <GroundShadow width={12} height={4} bottom={-1} />
      <div style={{ position: 'absolute', bottom: 2, left: '50%', marginLeft: -2, width: 4, height: 9, background: '#c9b896', borderRadius: 2 }} />
      <div style={{ position: 'absolute', bottom: 9, left: '50%', marginLeft: -8, width: 16, height: 9, borderRadius: '50% 50% 20% 20%', background: 'radial-gradient(circle at 35% 30%, #a866c9, #5a2a7a)' }} />
      <div style={{ position: 'absolute', bottom: 12, left: '50%', marginLeft: -4, width: 3, height: 3, borderRadius: '50%', background: '#e8ccff', opacity: 0.7 }} />
    </div>
  )
}

function SwampReed({ rot = 0 }) {
  return (
    <div style={{ position: 'relative', pointerEvents: 'none', transform: `rotate(${rot * 0.3}deg)` }}>
      <GroundShadow width={14} height={4} bottom={-2} />
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
        <div style={{ width: 3, height: 16, background: 'linear-gradient(180deg, #5a6a3a, #2e3a1e)', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: 3, height: 20, background: 'linear-gradient(180deg, #6a7a44, #384a24)', borderRadius: '2px 2px 0 0' }} />
        <div style={{ width: 3, height: 14, background: 'linear-gradient(180deg, #5a6a3a, #2e3a1e)', borderRadius: '2px 2px 0 0' }} />
      </div>
    </div>
  )
}

function LavaRock({ rot = 0 }) {
  return (
    <div style={{ position: 'relative', width: 24, height: 18, transform: `rotate(${rot}deg)`, pointerEvents: 'none' }}>
      <GroundShadow width={18} height={5} bottom={-2} />
      <div style={{
        position: 'absolute', top: 2, left: 1, width: 22, height: 14,
        background: '#1a1210',
        clipPath: 'polygon(10% 100%, 0% 55%, 20% 18%, 55% 0%, 90% 15%, 100% 58%, 85% 100%)',
      }} />
      <div style={{ position: 'absolute', top: 7, left: 5, width: 12, height: 2, background: '#ff6622', boxShadow: '0 0 5px #ff4400', opacity: 0.85, transform: 'rotate(-10deg)' }} />
      <div style={{ position: 'absolute', top: 11, left: 9, width: 8, height: 2, background: '#ff8833', boxShadow: '0 0 4px #ff4400', opacity: 0.8, transform: 'rotate(15deg)' }} />
    </div>
  )
}

function AshPile({ rot = 0 }) {
  return (
    <div style={{
      width: 24, height: 14,
      background: 'radial-gradient(ellipse at center, #4a4038 0%, #2a2420 60%, transparent 90%)',
      borderRadius: '50%',
      transform: `rotate(${rot}deg)`,
      pointerEvents: 'none',
    }} />
  )
}

function GrassTile({ row, col, level }) {
  const seed = row * 137 + col * 971
  const r = seededRandom(seed)
  const rot = (seededRandom(seed + 1) - 0.5) * 40
  if (level === 2) {
    if (r < 0.10) return <DeadTree rot={rot} />
    if (r < 0.22) return <MetalDebris rot={rot} />
    if (r < 0.38) return <ScorchMark rot={rot} />
    return null
  }
  if (level === 3) {
    if (r < 0.12) return <IceCrystal rot={rot} />
    if (r < 0.30) return <FrozenBush rot={rot} />
    return null
  }
  if (level === 4) {
    if (r < 0.12) return <BogMushroom rot={rot} />
    if (r < 0.34) return <SwampReed rot={rot} />
    return null
  }
  if (level === 5) {
    if (r < 0.12) return <LavaRock rot={rot} />
    if (r < 0.28) return <AshPile rot={rot} />
    return null
  }
  if (r < 0.08) return <Tree rot={rot} />
  if (r < 0.18) return <Rock rot={rot} />
  if (r < 0.30) return <Flowers />
  if (r < 0.60) return <GrassTuft rot={rot} />
  return null
}

function PathTile({ row, col }) {
  const seed = row * 211 + col * 337
  const r = seededRandom(seed)
  const rot = (seededRandom(seed + 1) - 0.5) * 40
  if (r < 0.25) return <Pebbles />
  if (r < 0.40) return <Crack rot={rot} />
  return null
}

function makeGrid() {
  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => ({
      type: PATH_CELLS.has(`${row}-${col}`) ? 'path' : 'empty',
      row,
      col,
    }))
  )
}

export default function App() {
  const [grid, setGrid] = useState(makeGrid)
  const [enemies, setEnemies] = useState([])
  const [fireballs, setFireballs] = useState([])
  const [towers, setTowers] = useState([])
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(10)
  const [wave, setWave] = useState(0)
  const [level, setLevel] = useState(1)
  const [gold, setGold] = useState(50)
  const [gameOver, setGameOver] = useState(false)
  const [hoveredTower, setHoveredTower] = useState(null)
  const [selectedTowerKey, setSelectedTowerKey] = useState(null)
  const [firingTowerIds, setFiringTowerIds] = useState(new Set())
  const [selectedType, setSelectedType] = useState('fire')
  const [lightningBolts, setLightningBolts] = useState([])
  const [bursts, setBursts] = useState([])
  const [page, setPage] = useState('home')
  const [packAnimation, setPackAnimation] = useState(null)
  const [leaderboard, setLeaderboard] = useState(null)
  const [leaderboardError, setLeaderboardError] = useState(false)

  useEffect(() => {
    if (page !== 'leaderboard') return
    setLeaderboardError(false)
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => setLeaderboard(data.entries || []))
      .catch(() => setLeaderboardError(true))
  }, [page])
  const [profile, setProfile] = useState(() => {
    try {
      return { ...DEFAULT_PROFILE, ...JSON.parse(localStorage.getItem(PROFILE_KEY)) }
    } catch {
      return DEFAULT_PROFILE
    }
  })

  useEffect(() => { localStorage.setItem(PROFILE_KEY, JSON.stringify(profile)) }, [profile])

  const gameOverHandledRef = useRef(false)
  useEffect(() => {
    if (!gameOver) { gameOverHandledRef.current = false; return }
    if (gameOverHandledRef.current) return
    gameOverHandledRef.current = true
    setProfile(p => {
      const updated = {
        ...p,
        gamesPlayed: p.gamesPlayed + 1,
        bestScore: Math.max(p.bestScore, score),
        bestWave: Math.max(p.bestWave, wave),
        bestLevel: Math.max(p.bestLevel, level),
      }
      let shardsEarned = level > p.bestLevel ? LEVEL_UP_SHARD_REWARD : 0
      const claimed = new Set(p.claimedAchievements)
      ACHIEVEMENTS.forEach(a => {
        if (!claimed.has(a.id) && a.check(updated)) {
          claimed.add(a.id)
          shardsEarned += ACHIEVEMENT_SHARD_REWARD
        }
      })
      return { ...updated, shards: p.shards + shardsEarned, claimedAchievements: [...claimed] }
    })
    if (score > 0) {
      fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: profile.name, score, wave, level }),
      }).catch(() => {
        // leaderboard submission is best-effort — a failed request shouldn't affect gameplay
      })
    }
  }, [gameOver, score, wave, level])

  function upgradeTower(type) {
    setProfile(p => {
      const tier = p.upgrades[type] || 0
      if (tier >= UPGRADE_MAX) return p
      const cost = UPGRADE_COSTS[tier]
      if (p.shards < cost) return p
      return { ...p, shards: p.shards - cost, upgrades: { ...p.upgrades, [type]: tier + 1 } }
    })
  }

  function buyPack(packKey) {
    const pack = PACKS[packKey]
    if (profile.shards < pack.cost) return
    const reward = openPack(packKey, profile)
    setProfile(p => {
      const next = { ...p, shards: p.shards - pack.cost }
      if (reward.kind === 'shards') {
        next.shards += reward.amount
      } else if (reward.kind === 'upgrade') {
        next.upgrades = { ...p.upgrades, [reward.key]: (p.upgrades[reward.key] || 0) + 1 }
      } else if (reward.kind === 'special') {
        next.unlockedSpecials = [...p.unlockedSpecials, reward.key]
      }
      return next
    })
    setPackAnimation({ packName: pack.name, packIcon: pack.icon, reward, stage: 'shake' })
    setTimeout(() => setPackAnimation(a => a && ({ ...a, stage: 'burst' })), 1000)
    setTimeout(() => setPackAnimation(a => a && ({ ...a, stage: 'reveal' })), 1450)
  }

  const towersRef = useRef(towers)
  useEffect(() => { towersRef.current = towers }, [towers])

  const enemiesRef = useRef(enemies)
  useEffect(() => { enemiesRef.current = enemies }, [enemies])

  const fireballsRef = useRef(fireballs)
  useEffect(() => { fireballsRef.current = fireballs }, [fireballs])

  const towerCooldownsRef = useRef({})

  function handleCellClick(row, col) {
    const cost = ALL_TOWER_TYPES[selectedType].cost
    if (grid[row][col].type !== 'empty' || gold < cost || gameOver) return
    setGrid(prev => {
      const next = prev.map(r => r.map(c => ({ ...c })))
      next[row][col].type = 'tower'
      return next
    })
    setTowers(prev => [...prev, { row, col, id: `${row}-${col}`, type: selectedType, upgradeTier: 0 }])
    setGold(prev => prev - cost)
  }

  function upgradeRoundTower(row, col) {
    const tower = towers.find(t => t.row === row && t.col === col)
    if (!tower) return
    const cap = Math.min(UPGRADE_MAX, profile.upgrades[tower.type] || 0)
    const tier = tower.upgradeTier || 0
    if (tier >= cap || gold < ROUND_UPGRADE_COSTS[tier]) return
    setGold(g => g - ROUND_UPGRADE_COSTS[tier])
    setTowers(prev => prev.map(t => (t.row === row && t.col === col) ? { ...t, upgradeTier: tier + 1 } : t))
  }

  function pickEnemyType(i) {
    const m = i % 10
    if (m === 9) return 'scout'
    if (m === 8) return 'troll'
    if (m === 6 || m === 7) return 'archer'
    if (level >= 2 && (m === 4 || m === 5)) return 'armoredGoblin'
    return 'goblin'
  }

  function advanceLevel() {
    setLevel(l => Math.min(TOTAL_LEVELS, l + 1))
    setWave(0)
    setEnemies([])
    setFireballs([])
    setLightningBolts([])
  }

  function spawnWave() {
    if (gameOver) return
    const next = wave + 1
    setWave(next)
    const count = next * 5

    setEnemies(prev => [
      ...prev,
      ...Array.from({ length: count }, (_, i) => {
        const type = pickEnemyType(i)
        const cfg = ENEMY_TYPES[type]
        const dist = -(i * 0.6)
        const pos = pointAtDistance(dist)
        return {
          id: Date.now() + i,
          dist,
          col: pos.col,
          row: pos.row,
          type,
          hp: cfg.hp,
          maxHp: cfg.hp,
          speed: cfg.speed,
          slowedUntil: 0,
          poisonUntil: 0,
          poisonDps: 0,
          vulnerableUntil: 0,
          vulnerableMult: 1,
        }
      }),
    ])
  }

  useEffect(() => {
    if (gameOver) return
    const id = setInterval(() => {
      const now = Date.now()
      const currentTowers = towersRef.current
      const currentEnemies = enemiesRef.current
      const currentFireballs = fireballsRef.current

      // 1. Each wizard checks if it can fire at an enemy
      const newFireballs = [...currentFireballs]
      const newLightningBolts = []
      const newBursts = []
      const lightningDamageMap = new Map()
      const firedIds = new Set()
      currentTowers.forEach(tower => {
        const cfg = ALL_TOWER_TYPES[tower.type]
        if (now - (towerCooldownsRef.current[tower.id] || 0) < cfg.cooldown) return

        if (cfg.hitAll) {
          const targets = currentEnemies.filter(e => e.dist >= 0 && Math.hypot(e.col - tower.col, e.row - tower.row) <= cfg.range)
          if (targets.length === 0) return
          towerCooldownsRef.current[tower.id] = now
          firedIds.add(tower.id)
          const splashDamage = upgradedDamage(cfg.damage, tower.upgradeTier || 0)
          targets.forEach(e => lightningDamageMap.set(e.id, (lightningDamageMap.get(e.id) || 0) + splashDamage))
          newBursts.push({ id: now + Math.random(), x: tower.col, y: tower.row, radius: cfg.range })
        } else if (tower.type === 'lightning') {
          const targets = currentEnemies
            .filter(e => e.dist >= 0 && Math.hypot(e.col - tower.col, e.row - tower.row) <= cfg.range)
            .sort((a, b) => Math.hypot(a.col - tower.col, a.row - tower.row) - Math.hypot(b.col - tower.col, b.row - tower.row))
            .slice(0, LIGHTNING_TARGETS)
          if (targets.length === 0) return
          towerCooldownsRef.current[tower.id] = now
          firedIds.add(tower.id)
          const lightningDamage = upgradedDamage(100, tower.upgradeTier || 0)
          targets.forEach(e => lightningDamageMap.set(e.id, (lightningDamageMap.get(e.id) || 0) + lightningDamage))
          const chainPts = [{ x: tower.col, y: tower.row }]
          targets.forEach(e => {
            const prev = chainPts[chainPts.length - 1]
            jaggify(prev.x, prev.y, e.col, e.row).slice(1).forEach(p => chainPts.push(p))
          })
          newLightningBolts.push({ id: now + Math.random(), path: chainPts })
        } else {
          const target = currentEnemies.find(e => e.dist >= 0 && Math.hypot(e.col - tower.col, e.row - tower.row) <= cfg.range)
          if (!target) return
          towerCooldownsRef.current[tower.id] = now
          firedIds.add(tower.id)
          const angleRad = Math.atan2(target.row - tower.row, target.col - tower.col)
          newFireballs.push({
            id: now + Math.random(),
            x: tower.col + Math.cos(angleRad) * 0.43,
            y: tower.row + Math.sin(angleRad) * 0.43,
            targetId: target.id,
            kind: tower.type,
            tier: tower.upgradeTier || 0,
          })
        }
      })
      if (firedIds.size > 0) {
        setFiringTowerIds(new Set(firedIds))
        setTimeout(() => setFiringTowerIds(new Set()), 450)
      }
      if (newLightningBolts.length > 0) {
        setLightningBolts(newLightningBolts)
        setTimeout(() => setLightningBolts([]), 200)
      }
      if (newBursts.length > 0) {
        setBursts(newBursts)
        setTimeout(() => setBursts([]), 300)
      }

      // 2. Move projectiles toward their target and detect hits
      const hitDamageMap = new Map()
      const hitEffects = new Map()
      const survivingFireballs = []
      newFireballs.forEach(f => {
        const target = currentEnemies.find(e => e.id === f.targetId)
        if (!target) return
        const dx = target.col - f.x
        const dy = target.row - f.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 0.3) {
          const cfg = ALL_TOWER_TYPES[f.kind]
          const dmg = upgradedDamage(cfg.damage, f.tier || 0)
          hitDamageMap.set(f.targetId, (hitDamageMap.get(f.targetId) || 0) + dmg)
          if (f.kind === 'ice') hitEffects.set(f.targetId, { ...(hitEffects.get(f.targetId) || {}), slow: true })
          if (cfg.dot) hitEffects.set(f.targetId, { ...(hitEffects.get(f.targetId) || {}), poison: true, poisonTier: f.tier || 0, dotDps: cfg.dotDps, dotDuration: cfg.dotDuration })
          if (cfg.amplify) hitEffects.set(f.targetId, { ...(hitEffects.get(f.targetId) || {}), amplify: true, amplifyMult: cfg.amplifyMult, amplifyDuration: cfg.amplifyDuration })
          return
        }
        survivingFireballs.push({
          ...f,
          x: f.x + (dx / dist) * FIREBALL_SPEED,
          y: f.y + (dy / dist) * FIREBALL_SPEED,
        })
      })

      // 3. Update enemies
      setEnemies(prev => {
        let killed = 0, livesLost = 0, goldGained = 0
        const next = prev
          .map(e => {
            const effects = hitEffects.get(e.id)
            const slowedUntil = effects?.slow ? now + ICE_SLOW_DURATION : e.slowedUntil
            const poisonUntil = effects?.poison ? now + (effects.dotDuration || POISON_DURATION) : e.poisonUntil
            const poisonDps = effects?.poison ? upgradedDamage(effects.dotDps || POISON_DPS, effects.poisonTier || 0) : e.poisonDps
            const vulnerableUntil = effects?.amplify ? now + effects.amplifyDuration : e.vulnerableUntil
            const vulnerableMult = effects?.amplify ? effects.amplifyMult : e.vulnerableMult
            const speedMult = slowedUntil && now < slowedUntil ? ICE_SLOW_FACTOR : 1
            const poisonTick = poisonUntil && now < poisonUntil ? poisonDps * (50 / 1000) : 0
            const rawDmg = (hitDamageMap.get(e.id) || 0) + (lightningDamageMap.get(e.id) || 0) + poisonTick
            const isVulnerable = vulnerableUntil && now < vulnerableUntil
            const dmg = isVulnerable ? rawDmg * (vulnerableMult || 1) : rawDmg
            const dist = e.dist + e.speed * speedMult
            const pos = pointAtDistance(dist)
            return {
              ...e,
              dist,
              col: pos.col,
              row: pos.row,
              hp: e.hp - dmg,
              slowedUntil,
              poisonUntil,
              poisonDps,
              vulnerableUntil,
              vulnerableMult,
            }
          })
          .filter(e => {
            const cfg = ENEMY_TYPES[e.type]
            if (e.hp <= 0) { killed++; goldGained += cfg.goldReward; return false }
            if (e.dist >= GAME_PATH.total) { livesLost += cfg.livesCost; return false }
            return true
          })
        if (killed > 0) { setScore(s => s + killed); setGold(g => g + goldGained) }
        if (livesLost > 0) setLives(l => {
          const newLives = l - livesLost
          if (newLives <= 0) setGameOver(true)
          return Math.max(0, newLives)
        })
        return next
      })

      // 4. Update fireballs
      setFireballs(survivingFireballs)
    }, 50)
    return () => clearInterval(id)
  }, [gameOver])

  function restart(targetLevel = 1) {
    setGrid(makeGrid())
    setEnemies([])
    setFireballs([])
    setTowers([])
    setScore(0)
    setLives(10)
    setWave(0)
    setLevel(targetLevel)
    setGold(50)
    setGameOver(false)
    setLightningBolts([])
    setSelectedTowerKey(null)
    towerCooldownsRef.current = {}
  }

  function playLevel(targetLevel) {
    restart(targetLevel)
    setPage('game')
  }

  const unlockedAchievements = ACHIEVEMENTS.filter(a => a.check(profile))

  const availableTowerTypes = {
    ...TOWER_TYPES,
    ...Object.fromEntries(Object.entries(SPECIAL_TOWER_TYPES).filter(([key]) => profile.unlockedSpecials.includes(key))),
  }

  const hoveredTowerObj = hoveredTower ? towers.find(t => t.row === hoveredTower.row && t.col === hoveredTower.col) : null
  const hoveredRange = hoveredTowerObj ? ALL_TOWER_TYPES[hoveredTowerObj.type].range : RANGE

  return (
    <div style={{ padding: 24, minHeight: '100vh' }}>
      <nav style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        {[
          { id: 'home', label: '🏠 Home' },
          { id: 'game', label: '▶️ Play' },
          { id: 'levels', label: '🗺️ Levels' },
          { id: 'characters', label: '🧝 Characters' },
          { id: 'shop', label: '🛒 Shop' },
          { id: 'leaderboard', label: '🏆 Leaderboard' },
          { id: 'account', label: '👤 Account' },
        ].map(item => (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              padding: '8px 16px', cursor: 'pointer', borderRadius: 8, fontWeight: 'bold', fontSize: 14,
              background: page === item.id ? '#e74c3c' : '#2a2a40',
              color: 'white', border: page === item.id ? '2px solid #ff8866' : '2px solid #444',
            }}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {page === 'home' && (
        <div style={{ position: 'relative', minHeight: 420 }}>
          <PageBackdrop
            blobs={[
              { top: 2, left: 58, size: 340, color: '#9955ff' },
              { top: 42, left: 2, size: 300, color: '#5577ff' },
              { top: 55, left: 72, size: 260, color: '#ff55aa' },
              { top: 20, left: 30, size: 200, color: '#ff8844' },
            ]}
            blobOpacity={0.4}
            particleCount={22}
          />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 560 }}>
            <h1 style={{ marginBottom: 12 }}>🧙 Wizard War 2 — Defend the Kingdom!</h1>
            <p style={{ fontSize: 16, lineHeight: 1.5 }}>
              Welcome back, <strong>{profile.name}</strong>! Place wizard towers to stop goblins,
              archers, trolls and more from crossing your kingdom. Survive {LEVEL_UNLOCK_WAVE} waves
              to unlock the Scorched Battlefield.
            </p>
          </div>
        </div>
      )}

      {page === 'leaderboard' && (
        <div style={{ position: 'relative', minHeight: 420 }}>
          <PageBackdrop blobs={[
            { top: 4, left: 65, size: 300, color: '#ffcc33' },
            { top: 50, left: 4, size: 260, color: '#ff8833' },
            { top: 65, left: 62, size: 220, color: '#ffee88' },
          ]} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 640 }}>
            <h1 style={{ marginBottom: 8 }}>🏆 Leaderboard</h1>
            <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16, textAlign: 'left' }}>
              The top {leaderboard ? Math.min(leaderboard.length, 100) : 100} runs from every player, worldwide.
            </p>

            {leaderboardError && (
              <div style={{ fontSize: 13, color: '#ff8888' }}>
                Couldn't load the leaderboard right now — check your connection and try again.
              </div>
            )}

            {!leaderboardError && leaderboard === null && (
              <div style={{ fontSize: 13, color: '#aaa' }}>Loading scores…</div>
            )}

            {!leaderboardError && leaderboard !== null && leaderboard.length === 0 && (
              <div style={{ fontSize: 13, color: '#aaa' }}>
                No scores yet — be the first! Play a game and your score will show up here.
              </div>
            )}

            {!leaderboardError && leaderboard && leaderboard.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {leaderboard.map((entry, i) => (
                  <div key={i} className="polish-card" style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '8px 14px', borderRadius: 8,
                    background: i < 3 ? 'linear-gradient(135deg, #5a4a00, #a88000)' : 'linear-gradient(135deg, #1a1a2e, #2a2a40)',
                    border: i < 3 ? '2px solid #ffe066' : '2px solid #333',
                  }}>
                    <div style={{ width: 28, fontWeight: 'bold', fontSize: 14, color: i < 3 ? '#fff6dd' : '#ccc' }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </div>
                    <div style={{ flex: 1, fontWeight: 'bold', fontSize: 13, textAlign: 'left' }}>{entry.name}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>🌊 {entry.wave}</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>🗺️ {entry.level}</div>
                    <div style={{ fontWeight: 'bold', fontSize: 14, color: '#ffe066', minWidth: 50, textAlign: 'right' }}>⭐ {entry.score}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {page === 'account' && (
        <div style={{ position: 'relative', minHeight: 420 }}>
          <PageBackdrop blobs={[
            { top: 8, left: 65, size: 280, color: '#4488ff' },
            { top: 50, left: 8, size: 240, color: '#6644cc' },
            { top: 70, left: 60, size: 200, color: '#4466ff' },
          ]} />
          <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ marginBottom: 12 }}>👤 Account</h1>
          <label style={{ display: 'block', marginBottom: 16, fontSize: 14 }}>
            Your name:{' '}
            <input
              value={profile.name}
              onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
              style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #444', fontSize: 14, marginLeft: 6 }}
            />
          </label>

          <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
            <div className="polish-card" style={{ background: '#1a1a2e', padding: '10px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#aaa' }}>Best Score</div>
              <div style={{ fontSize: 22, fontWeight: 'bold' }}>⭐ {profile.bestScore}</div>
            </div>
            <div className="polish-card" style={{ background: '#1a1a2e', padding: '10px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#aaa' }}>Best Wave</div>
              <div style={{ fontSize: 22, fontWeight: 'bold' }}>🌊 {profile.bestWave}</div>
            </div>
            <div className="polish-card" style={{ background: '#1a1a2e', padding: '10px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#aaa' }}>Games Played</div>
              <div style={{ fontSize: 22, fontWeight: 'bold' }}>🎮 {profile.gamesPlayed}</div>
            </div>
            <div className="polish-card" style={{ background: '#1a1a2e', padding: '10px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#aaa' }}>Furthest Level</div>
              <div style={{ fontSize: 22, fontWeight: 'bold' }}>🗺️ {profile.bestLevel}</div>
            </div>
            <div className="polish-card" style={{ background: '#1a1a2e', padding: '10px 16px', borderRadius: 8 }}>
              <div style={{ fontSize: 12, color: '#aaa' }}>{SHARD_NAME}</div>
              <div style={{ fontSize: 22, fontWeight: 'bold' }}>{SHARD_ICON} {profile.shards}</div>
            </div>
          </div>

          <h2 style={{ marginBottom: 10, fontSize: 18 }}>Achievements ({unlockedAchievements.length}/{ACHIEVEMENTS.length})</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {ACHIEVEMENTS.map(a => {
              const unlocked = a.check(profile)
              return (
                <div key={a.id} className="polish-card" style={{
                  width: 140, padding: 12, borderRadius: 8, textAlign: 'center',
                  background: unlocked ? 'linear-gradient(135deg, #5a4a00, #a88000)' : '#22222e',
                  border: unlocked ? '2px solid #ffe066' : '2px solid #333',
                  opacity: unlocked ? 1 : 0.5,
                }}>
                  <div style={{ fontSize: 26 }}>{a.icon}</div>
                  <div style={{ fontWeight: 'bold', fontSize: 13, marginTop: 4 }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: '#ccc', marginTop: 3 }}>{a.desc}</div>
                </div>
              )
            })}
          </div>
          </div>
        </div>
      )}

      {page === 'characters' && (
        <div style={{ position: 'relative', minHeight: 420 }}>
          <PageBackdrop blobs={[
            { top: 6, left: 70, size: 300, color: '#33cc99' },
            { top: 55, left: 3, size: 260, color: '#9944ff' },
            { top: 40, left: 55, size: 200, color: '#33ccaa' },
          ]} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
          <h1 style={{ marginBottom: 8 }}>🧝 Characters</h1>
          <div style={{
            display: 'inline-block', padding: '6px 14px', borderRadius: 8, marginBottom: 16,
            background: 'linear-gradient(135deg, #2a1a4a, #4a2a7a)', border: '1px solid #9966cc', fontWeight: 'bold',
          }}>
            {SHARD_ICON} {profile.shards} {SHARD_NAME}
          </div>

          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Wizard Towers</h2>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 10, textAlign: 'left' }}>
            Spend {SHARD_NAME} to permanently unlock higher in-game upgrade tiers for a wizard. Click a placed
            tower during a game to actually buy that upgrade with gold — it only lasts for that game and resets next time.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
            {Object.entries(TOWER_TYPES).map(([key, cfg]) => {
              const Comp = WIZARD_COMPONENTS[key]
              const tier = profile.upgrades[key] || 0
              const maxed = tier >= UPGRADE_MAX
              const cost = maxed ? null : UPGRADE_COSTS[tier]
              const canAfford = !maxed && profile.shards >= cost
              return (
                <div key={key} className="polish-card" style={{
                  width: 160, padding: 14, borderRadius: 10, textAlign: 'center',
                  background: 'linear-gradient(135deg, #1a1a2e, #2a2a40)', border: '2px solid #444',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, height: 48, alignItems: 'center' }}>
                    <Comp firing={false} facingLeft={false} tier={tier} />
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: 14 }}>{cfg.label}</div>
                  <div style={{ fontSize: 11, color: cfg.goldColor, marginTop: 3 }}>💰 {cfg.cost} gold</div>
                  <div style={{ fontSize: 11, color: cfg.descColor, marginTop: 1 }}>{cfg.desc}</div>
                  <div style={{ fontSize: 11, color: '#cc99ff', marginTop: 6 }}>
                    In-game cap: Tier {tier}/{UPGRADE_MAX} (up to +{Math.round(tier * UPGRADE_DAMAGE_BONUS * 100)}% dmg)
                  </div>
                  <button
                    onClick={() => upgradeTower(key)}
                    disabled={maxed || !canAfford}
                    style={{
                      marginTop: 8, width: '100%', padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 'bold',
                      cursor: maxed || !canAfford ? 'default' : 'pointer',
                      background: maxed ? '#333' : canAfford ? 'linear-gradient(135deg, #6a2ac2, #9966cc)' : '#2a2a40',
                      color: maxed ? '#888' : canAfford ? 'white' : '#888',
                      border: maxed ? '1px solid #444' : `1px solid ${canAfford ? '#9966cc' : '#444'}`,
                    }}
                  >
                    {maxed ? 'Maxed' : `Upgrade · ${SHARD_ICON} ${cost}`}
                  </button>
                </div>
              )
            })}
          </div>

          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Special Wizards</h2>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 10, textAlign: 'left' }}>
            Only found in Shop packs. Visit the Shop to try your luck!
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
            {Object.entries(SPECIAL_TOWER_TYPES).map(([key, cfg]) => {
              const unlocked = profile.unlockedSpecials.includes(key)
              const Comp = WIZARD_COMPONENTS[key]
              const tier = profile.upgrades[key] || 0
              const maxed = tier >= UPGRADE_MAX
              const cost = maxed ? null : UPGRADE_COSTS[tier]
              const canAfford = !maxed && profile.shards >= cost
              return (
                <div key={key} className="polish-card" style={{
                  width: 160, padding: 14, borderRadius: 10, textAlign: 'center',
                  background: unlocked ? 'linear-gradient(135deg, #1a1a2e, #2a2a40)' : '#181820',
                  border: unlocked ? `2px solid ${cfg.border}` : '2px solid #333',
                  opacity: unlocked ? 1 : 0.6,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, height: 48, alignItems: 'center', fontSize: 32 }}>
                    {unlocked ? <Comp firing={false} facingLeft={false} tier={tier} /> : '🔒'}
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: 14 }}>{unlocked ? cfg.label : '???'}</div>
                  {unlocked ? (
                    <>
                      <div style={{ fontSize: 11, color: cfg.goldColor, marginTop: 3 }}>💰 {cfg.cost} gold</div>
                      <div style={{ fontSize: 11, color: cfg.descColor, marginTop: 1 }}>{cfg.desc}</div>
                      <div style={{ fontSize: 11, color: '#cc99ff', marginTop: 6 }}>
                        In-game cap: Tier {tier}/{UPGRADE_MAX} (up to +{Math.round(tier * UPGRADE_DAMAGE_BONUS * 100)}% dmg)
                      </div>
                      <button
                        onClick={() => upgradeTower(key)}
                        disabled={maxed || !canAfford}
                        style={{
                          marginTop: 8, width: '100%', padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 'bold',
                          cursor: maxed || !canAfford ? 'default' : 'pointer',
                          background: maxed ? '#333' : canAfford ? 'linear-gradient(135deg, #6a2ac2, #9966cc)' : '#2a2a40',
                          color: maxed ? '#888' : canAfford ? 'white' : '#888',
                          border: maxed ? '1px solid #444' : `1px solid ${canAfford ? '#9966cc' : '#444'}`,
                        }}
                      >
                        {maxed ? 'Maxed' : `Upgrade · ${SHARD_ICON} ${cost}`}
                      </button>
                    </>
                  ) : (
                    <div style={{ fontSize: 11, color: '#888', marginTop: 8 }}>Locked — find in a pack</div>
                  )}
                </div>
              )
            })}
          </div>

          <h2 style={{ fontSize: 18, marginBottom: 10 }}>Enemies</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(ENEMY_TYPES).map(([key, cfg]) => {
              const Comp = ENEMY_COMPONENTS[key]
              return (
                <div key={key} className="polish-card" style={{
                  width: 150, padding: 14, borderRadius: 10, textAlign: 'center',
                  background: 'linear-gradient(135deg, #1a1a2e, #2a2a40)', border: '2px solid #444',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, height: 40, alignItems: 'center' }}>
                    <Comp />
                  </div>
                  <div style={{ fontWeight: 'bold', fontSize: 14 }}>{ENEMY_LABELS[key]}</div>
                  <div style={{ fontSize: 11, color: '#ffaa66', marginTop: 3 }}>❤️ {cfg.hp} HP</div>
                  <div style={{ fontSize: 11, color: '#ff8888', marginTop: 1 }}>💔 Costs {cfg.livesCost} {cfg.livesCost === 1 ? 'life' : 'lives'}</div>
                </div>
              )
            })}
          </div>
          </div>
        </div>
      )}

      {page === 'shop' && (
        <div style={{ position: 'relative', minHeight: 420 }}>
          <PageBackdrop blobs={[
            { top: 4, left: 68, size: 300, color: '#ffcc44' },
            { top: 50, left: 6, size: 260, color: '#aa44ff' },
            { top: 65, left: 65, size: 220, color: '#ffaa22' },
          ]} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
          <h1 style={{ marginBottom: 8 }}>🛒 Shop</h1>
          <div style={{
            display: 'inline-block', padding: '6px 14px', borderRadius: 8, marginBottom: 16,
            background: 'linear-gradient(135deg, #2a1a4a, #4a2a7a)', border: '1px solid #9966cc', fontWeight: 'bold',
          }}>
            {SHARD_ICON} {profile.shards} {SHARD_NAME}
          </div>
          <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16, textAlign: 'left' }}>
            Open packs with {SHARD_NAME} for a random reward — bonus shards, a wizard upgrade, or a chance
            to unlock a special wizard ({profile.unlockedSpecials.length}/{Object.keys(SPECIAL_TOWER_TYPES).length} found so far).
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(PACKS).map(([key, pack]) => {
              const canAfford = profile.shards >= pack.cost
              return (
                <div key={key} className="polish-card" style={{
                  width: 220, padding: 16, borderRadius: 10, textAlign: 'center',
                  background: 'linear-gradient(135deg, #1a1a2e, #2a2a40)', border: '2px solid #444',
                }}>
                  <div style={{ fontSize: 40 }}>{pack.icon}</div>
                  <div style={{ fontWeight: 'bold', fontSize: 16, marginTop: 6 }}>{pack.name}</div>
                  <div style={{ fontSize: 12, color: '#aaa', marginTop: 6, minHeight: 48 }}>{pack.desc}</div>
                  <button
                    onClick={() => buyPack(key)}
                    disabled={!canAfford || !!packAnimation}
                    style={{
                      marginTop: 10, width: '100%', padding: '8px 0', borderRadius: 6, fontSize: 13, fontWeight: 'bold',
                      cursor: canAfford ? 'pointer' : 'default',
                      background: canAfford ? 'linear-gradient(135deg, #6a2ac2, #9966cc)' : '#2a2a40',
                      color: canAfford ? 'white' : '#888',
                      border: `1px solid ${canAfford ? '#9966cc' : '#444'}`,
                    }}
                  >
                    Open · {SHARD_ICON} {pack.cost}
                  </button>
                </div>
              )
            })}
          </div>
          </div>
        </div>
      )}

      {packAnimation && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
        }}>
          {packAnimation.stage === 'shake' && (
            <div className="pack-shake" style={{ fontSize: 100 }}>{packAnimation.packIcon}</div>
          )}
          {packAnimation.stage === 'burst' && (
            <div style={{ position: 'relative', width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="pack-burst-flash" style={{
                position: 'absolute', width: 200, height: 200, borderRadius: '50%',
                background: 'radial-gradient(circle, #ffffff, #ffcc44 40%, transparent 70%)',
              }} />
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i / 12) * Math.PI * 2
                const dx = Math.cos(angle) * 130
                const dy = Math.sin(angle) * 130
                return (
                  <div key={i} className="pack-spark" style={{
                    position: 'absolute', width: 8, height: 8, borderRadius: '50%', background: '#ffdd66',
                    '--dx': `${dx}px`, '--dy': `${dy}px`,
                  }} />
                )
              })}
            </div>
          )}
          {packAnimation.stage === 'reveal' && (
            <div className="reward-pop-in" style={{
              padding: 28, borderRadius: 16, textAlign: 'center', minWidth: 260,
              background: 'linear-gradient(135deg, #3a2a00, #7a5a00)', border: '3px solid #ffcc44',
              boxShadow: '0 0 40px rgba(255,204,68,0.5)',
            }}>
              <div style={{ fontWeight: 'bold', fontSize: 14, marginBottom: 10, color: '#ffdd88' }}>{packAnimation.packName} results:</div>
              {packAnimation.reward.kind === 'shards' && (
                <>
                  <div style={{ fontSize: 48 }}>{SHARD_ICON}</div>
                  <div style={{ marginTop: 8, fontSize: 16 }}>+{packAnimation.reward.amount} {SHARD_NAME}</div>
                </>
              )}
              {packAnimation.reward.kind === 'upgrade' && (
                <>
                  <div style={{ fontSize: 48 }}>⬆️</div>
                  <div style={{ marginTop: 8, fontSize: 16 }}>Free upgrade: {packAnimation.reward.label}!</div>
                </>
              )}
              {packAnimation.reward.kind === 'special' && (
                <>
                  <div style={{ fontSize: 48 }}>{packAnimation.reward.icon}</div>
                  <div style={{ marginTop: 8, fontSize: 16, fontWeight: 'bold', color: '#ffee88' }}>New Wizard Unlocked!</div>
                  <div style={{ marginTop: 4, fontSize: 14 }}>{packAnimation.reward.label}</div>
                </>
              )}
              <button
                onClick={() => setPackAnimation(null)}
                style={{ marginTop: 16, padding: '8px 20px', borderRadius: 8, cursor: 'pointer', border: '1px solid #ffcc44', background: 'transparent', color: 'white', fontWeight: 'bold' }}
              >
                Nice!
              </button>
            </div>
          )}
        </div>
      )}

      {page === 'levels' && (
        <div style={{ position: 'relative', minHeight: 420 }}>
          <PageBackdrop blobs={[
            { top: 4, left: 65, size: 300, color: '#4488ff' },
            { top: 50, left: 4, size: 260, color: '#ff8833' },
            { top: 65, left: 62, size: 220, color: '#66cc44' },
          ]} />
          <div style={{ position: 'relative', zIndex: 1, maxWidth: 900 }}>
            <h1 style={{ marginBottom: 8 }}>🗺️ Levels</h1>
            <p style={{ fontSize: 12, color: '#aaa', marginBottom: 16, textAlign: 'left' }}>
              Jump straight into any level you've already reached, or head back home.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
              {Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1).map(levelNum => {
                const cfg = LEVELS[levelNum]
                const unlocked = profile.bestLevel >= levelNum
                return (
                  <div key={levelNum} className="polish-card" style={{
                    width: 170, padding: 14, borderRadius: 10, textAlign: 'center',
                    background: unlocked ? 'linear-gradient(135deg, #1a1a2e, #2a2a40)' : '#181820',
                    border: unlocked ? '2px solid #66aaff' : '2px solid #333',
                    opacity: unlocked ? 1 : 0.6,
                  }}>
                    <div style={{
                      width: '100%', height: 50, borderRadius: 6, marginBottom: 8,
                      background: cfg.swatch, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22,
                    }}>
                      {unlocked ? '🗺️' : '🔒'}
                    </div>
                    <div style={{ fontWeight: 'bold', fontSize: 13 }}>Level {levelNum}</div>
                    <div style={{ fontSize: 12, color: '#ccc', marginTop: 2 }}>{unlocked ? cfg.name : '???'}</div>
                    <button
                      onClick={() => unlocked && playLevel(levelNum)}
                      disabled={!unlocked}
                      style={{
                        marginTop: 10, width: '100%', padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 'bold',
                        cursor: unlocked ? 'pointer' : 'default',
                        background: unlocked ? 'linear-gradient(135deg, #2255cc, #4488ff)' : '#2a2a40',
                        color: unlocked ? 'white' : '#888',
                        border: `1px solid ${unlocked ? '#4488ff' : '#444'}`,
                      }}
                    >
                      {unlocked ? '▶️ Play' : 'Locked'}
                    </button>
                  </div>
                )
              })}
            </div>
            <button
              onClick={() => setPage('home')}
              className="polish-card"
              style={{ padding: '10px 20px', cursor: 'pointer', borderRadius: 8, fontWeight: 'bold', fontSize: 14, background: '#2a2a40', color: 'white', border: '2px solid #444' }}
            >
              🏠 Back to Home
            </button>
          </div>
        </div>
      )}

      {page === 'game' && (
      <>
      <h1 style={{ marginBottom: 12 }}>🧙 Wizard War 2 — Defend the Kingdom!</h1>

      <div style={{ display: 'flex', gap: 24, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <span>🗺️ Level {level}: {LEVELS[level].name}</span>
        <span>❤️ Lives: {lives}</span>
        <span>⭐ Score: {score}</span>
        <span>💰 Gold: {gold}</span>
        <span>🌊 Wave: {wave}</span>
        <button
          onClick={spawnWave}
          disabled={gameOver}
          style={{
            padding: '6px 16px', cursor: 'pointer',
            background: '#e74c3c', color: 'white',
            border: 'none', borderRadius: 6, fontWeight: 'bold', fontSize: 14,
          }}
        >
          Send Wave!
        </button>
        {level < TOTAL_LEVELS && wave >= LEVEL_UNLOCK_WAVE && !gameOver && (
          <button
            onClick={advanceLevel}
            style={{
              padding: '6px 16px', cursor: 'pointer',
              background: 'linear-gradient(135deg, #444, #222)', color: '#ffcc66',
              border: '2px solid #ffcc66', borderRadius: 6, fontWeight: 'bold', fontSize: 14,
            }}
          >
            ⚔️ Next Level: {LEVELS[level + 1].name}
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {Object.entries(availableTowerTypes).map(([key, cfg]) => (
          <button
            key={key}
            onClick={() => setSelectedType(key)}
            style={{
              cursor: 'pointer', borderRadius: 10, padding: '10px 16px',
              background: selectedType === key ? cfg.selectedBg : 'linear-gradient(135deg, #1a1a2e, #2a2a40)',
              border: selectedType === key ? `2px solid ${cfg.border}` : '2px solid #444',
              boxShadow: selectedType === key ? cfg.glow : 'none',
              color: 'white', textAlign: 'left', transition: 'all 0.15s',
              minWidth: 130,
            }}
          >
            <div style={{ fontSize: 28, lineHeight: 1 }}>{cfg.icon}</div>
            <div style={{ fontWeight: 'bold', fontSize: 14, marginTop: 4 }}>{cfg.label}</div>
            <div style={{ fontSize: 11, color: cfg.goldColor, marginTop: 3 }}>💰 {cfg.cost} gold</div>
            <div style={{ fontSize: 11, color: cfg.descColor, marginTop: 1 }}>{cfg.desc}</div>
          </button>
        ))}
      </div>

      {gameOver && (
        <div style={{
          background: '#c0392b', padding: 12, borderRadius: 8,
          marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <strong>Game Over!</strong> Final score: {score}
          <button onClick={restart} style={{ padding: '4px 12px', cursor: 'pointer', borderRadius: 4 }}>
            Restart
          </button>
        </div>
      )}

      <div style={{
        position: 'relative',
        padding: 12,
        borderRadius: 14,
        background: LEVELS[level].frameBg,
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.4)',
        width: 'fit-content',
      }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
        gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
        position: 'relative',
        border: '2px solid #444',
        width: 'fit-content',
        overflow: 'hidden',
      }}>
        {grid.flat().map(cell => {
          const tower = cell.type === 'tower' ? towers.find(t => t.row === cell.row && t.col === cell.col) : null
          const towerCfg = tower ? ALL_TOWER_TYPES[tower.type] : null

          const groundShades = LEVELS[level].groundShades
          const levelPathShades = LEVELS[level].pathShades
          const noiseScale = 0.4
          const grassT = smoothNoise2D(cell.col * noiseScale, cell.row * noiseScale, level * 1000 + 7)
          const grassShade = paletteColor(groundShades, grassT)
          const pathT = smoothNoise2D(cell.col * noiseScale, cell.row * noiseScale, level * 1000 + 71)
          const pathShade = paletteColor(levelPathShades, pathT)

          let facingLeft = false
          if (tower) {
            const range = towerCfg.range
            const target = enemies.find(e => e.dist >= 0 && Math.hypot(e.col - cell.col, e.row - cell.row) <= range)
            if (target) {
              facingLeft = target.col < cell.col
            }
          }

          return (
            <div
              key={`${cell.row}-${cell.col}`}
              onClick={() => {
                if (cell.type === 'tower') {
                  const key = `${cell.row}-${cell.col}`
                  setSelectedTowerKey(prev => (prev === key ? null : key))
                } else {
                  handleCellClick(cell.row, cell.col)
                }
              }}
              onMouseEnter={() => cell.type === 'tower' && setHoveredTower(cell)}
              onMouseLeave={() => cell.type === 'tower' && setHoveredTower(null)}
              style={{
                width: CELL, height: CELL,
                background:
                  cell.type === 'path' ? pathShade :
                  cell.type === 'tower' ? '#1a2a1a' :
                  grassShade,
                border: cell.type === 'tower' ? '1px solid #1a1a1a' : 'none',
                boxShadow: cell.type === 'tower' ? 'none' : 'inset 0 0 6px rgba(0,0,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: cell.type === 'empty' ? 'pointer' : 'default',
                fontSize: 28, userSelect: 'none',
              }}
            >
              {tower ? (() => {
                const firing = firingTowerIds.has(`${cell.row}-${cell.col}`)
                const Comp = WIZARD_COMPONENTS[tower.type] || Wizard
                const towerTier = tower.upgradeTier || 0
                return <Comp firing={firing} facingLeft={facingLeft} tier={towerTier} />
              })() : cell.type === 'empty' ? <GrassTile row={cell.row} col={cell.col} level={level} /> :
                cell.type === 'path' ? <PathTile row={cell.row} col={cell.col} /> : ''}
            </div>
          )
        })}

        {enemies.map(enemy => (
          <div
            key={enemy.id}
            style={{
              position: 'absolute',
              left: enemy.col * CELL + CELL / 2 - 14,
              top: enemy.row * CELL + 6,
              width: 28,
              pointerEvents: 'none',
            }}
          >
            {(() => {
              const Comp = ENEMY_COMPONENTS[enemy.type] || Enemy
              return <Comp />
            })()}
            <div style={{ height: 4, background: '#555', borderRadius: 2, marginTop: 2 }}>
              <div style={{
                width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`,
                height: '100%', background: '#e74c3c', borderRadius: 2,
              }} />
            </div>
          </div>
        ))}

        <svg style={{
          position: 'absolute', top: 0, left: 0,
          width: COLS * CELL, height: ROWS * CELL,
          pointerEvents: 'none',
        }}>
          <defs>
            <filter id="lglow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {hoveredTower && (
            <circle
              cx={hoveredTower.col * CELL + CELL / 2}
              cy={hoveredTower.row * CELL + CELL / 2}
              r={hoveredRange * CELL}
              fill="rgba(255, 170, 0, 0.15)"
              stroke="#ffaa00"
              strokeWidth={2}
              strokeDasharray="6 4"
            />
          )}
          {lightningBolts.map(bolt => {
            const pts = bolt.path.map(p => `${p.x * CELL + CELL / 2},${p.y * CELL + CELL / 2}`).join(' ')
            return (
              <g key={bolt.id}>
                {/* Outer yellow glow */}
                <polyline points={pts} fill="none" stroke="#ffe066" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" filter="url(#lglow)" opacity={0.7} />
                {/* Bright white core */}
                <polyline points={pts} fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            )
          })}
          {bursts.map(burst => {
            const cx = burst.x * CELL + CELL / 2
            const cy = burst.y * CELL + CELL / 2
            const rPixels = burst.radius * CELL
            return (
              <g key={burst.id}>
                <circle cx={cx} cy={cy} r={rPixels} fill="rgba(102, 170, 255, 0.25)" stroke="#66aaff" strokeWidth={4} filter="url(#lglow)" />
                {Array.from({ length: 8 }).map((_, i) => {
                  const a = (i / 8) * Math.PI * 2
                  const ex = burst.x + Math.cos(a) * burst.radius
                  const ey = burst.y + Math.sin(a) * burst.radius
                  const pts = jaggify(burst.x, burst.y, ex, ey, 4).map(p => `${p.x * CELL + CELL / 2},${p.y * CELL + CELL / 2}`).join(' ')
                  return <polyline key={i} points={pts} fill="none" stroke="#cdeeff" strokeWidth={2} strokeLinecap="round" opacity={0.85} />
                })}
              </g>
            )
          })}
        </svg>

        {fireballs.map(f => (
          <div
            key={f.id}
            style={{
              position: 'absolute',
              left: f.x * CELL + CELL / 2 - 11,
              top: f.y * CELL + CELL / 2 - 11,
              pointerEvents: 'none',
            }}
          >
            {f.kind === 'crystal' ? <CrystalShard /> : <Fireball kind={f.kind} />}
          </div>
        ))}

        <BreezeOverlay />
        {level === 2 && <RainOverlay />}
        {level === 3 && <SnowOverlay />}
        {level === 5 && <EmberOverlay />}
      </div>

      {selectedTowerKey && (() => {
        const [selRow, selCol] = selectedTowerKey.split('-').map(Number)
        const selTower = towers.find(t => t.row === selRow && t.col === selCol)
        if (!selTower) return null
        const cfg = ALL_TOWER_TYPES[selTower.type]
        const cap = Math.min(UPGRADE_MAX, profile.upgrades[selTower.type] || 0)
        const roundTier = selTower.upgradeTier || 0
        const maxedRound = roundTier >= cap
        const cost = maxedRound ? null : ROUND_UPGRADE_COSTS[roundTier]
        const canAfford = !maxedRound && gold >= cost
        const panelLeft = Math.max(100, Math.min(COLS * CELL + 12 - 100, selCol * CELL + CELL / 2 + 12))
        return (
          <div style={{
            position: 'absolute', left: panelLeft, top: selRow * CELL + 12,
            transform: 'translate(-50%, -100%)', marginTop: -6,
            zIndex: 20, pointerEvents: 'auto',
            background: 'linear-gradient(135deg, #1a1a2e, #2a2a40)', border: `2px solid ${cfg.border || '#9966cc'}`,
            borderRadius: 10, padding: 12, width: 190, textAlign: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.5)',
          }}>
            <button
              onClick={() => setSelectedTowerKey(null)}
              style={{ position: 'absolute', top: 2, right: 6, background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 15 }}
            >×</button>
            <div style={{ fontWeight: 'bold', fontSize: 13 }}>{cfg.icon} {cfg.label}</div>
            <div style={{ fontSize: 11, color: '#cc99ff', marginTop: 4 }}>
              Round Tier {roundTier}/{cap} · +{Math.round(roundTier * UPGRADE_DAMAGE_BONUS * 100)}% dmg this game
            </div>
            {cap === 0 ? (
              <div style={{ fontSize: 10, color: '#ff8888', marginTop: 8 }}>
                No in-game upgrades yet — spend {SHARD_NAME} on this wizard in the Characters page to unlock some!
              </div>
            ) : maxedRound ? (
              <div style={{ fontSize: 10, color: '#88ff88', marginTop: 8 }}>Maxed out for this round!</div>
            ) : (
              <>
                <button
                  onClick={() => upgradeRoundTower(selRow, selCol)}
                  disabled={!canAfford}
                  style={{
                    marginTop: 8, width: '100%', padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 'bold',
                    cursor: canAfford ? 'pointer' : 'default',
                    background: canAfford ? 'linear-gradient(135deg, #c23a3a, #e05050)' : '#2a2a40',
                    color: canAfford ? 'white' : '#888',
                    border: `1px solid ${canAfford ? '#e05050' : '#444'}`,
                  }}
                >
                  Upgrade this round · 💰 {cost}
                </button>
                {cap < UPGRADE_MAX && (
                  <div style={{ fontSize: 9, color: '#888', marginTop: 6 }}>
                    Buy more {SHARD_NAME} upgrades on the Characters page to raise this cap.
                  </div>
                )}
              </>
            )}
          </div>
        )
      })()}
      </div>
      </>
      )}
    </div>
  )
}
