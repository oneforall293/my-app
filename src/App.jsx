import { useState, useEffect, useRef } from 'react'
import './App.css'

const COLS = 14
const ROWS = 9
const PATH_ROW = 4
const CELL = 56
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

function Wizard({ firing, angle = 0 }) {
  return (
    <div className={firing ? 'wizard-firing' : ''} style={{ position: 'relative', width: 44, height: 48, rotate: `${angle}deg`, transition: 'rotate 0.08s ease-out' }}>
      {/* Robe seen from above — oval peeking out under the hat */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        width: 40, height: 32,
        background: 'radial-gradient(ellipse at 40% 30%, #7b3dbe, #4a1a8a)',
        borderRadius: '50%',
        border: '1px solid #3a0a7a',
      }} />
      {/* Hat brim — big circle, top-down view */}
      <div style={{
        position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
        width: 36, height: 36,
        background: 'radial-gradient(circle at 38% 38%, #6535b0, #2e0a72)',
        borderRadius: '50%',
        border: '2px solid #1e005a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Hat cone tip — small dark circle in the centre */}
        <div style={{
          width: 14, height: 14,
          background: '#1a0050',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ffd700', fontSize: 9, lineHeight: 1,
        }}>★</div>
      </div>
      {/* Wand stick — poking out from right hand */}
      <div style={{
        position: 'absolute',
        top: 28, left: '50%', marginLeft: 18,
        width: 16, height: 3,
        background: 'linear-gradient(90deg, #6b3f1f, #c4a065)',
        borderRadius: 2,
        transform: 'rotate(-35deg)',
        transformOrigin: 'left center',
      }} />
      {/* Hand gripping the wand — drawn after wand so it covers the overlap */}
      <div style={{
        position: 'absolute',
        top: 25, left: '50%', marginLeft: 15,
        width: 10, height: 8,
        background: '#f5cba7',
        borderRadius: '50%',
        border: '1px solid #d4a882',
      }} />
      {/* Wand tip glow */}
      <div className={firing ? 'wand-fire' : ''} style={{
        position: 'absolute',
        top: 14, left: '50%', marginLeft: 27,
        color: '#ffe066', fontSize: 9, lineHeight: 1,
        textShadow: '0 0 5px #ffd700, 0 0 10px #ff8800',
        userSelect: 'none',
      }}>✦</div>
      {/* Left foot */}
      <div style={{
        position: 'absolute', bottom: 1, left: '50%',
        marginLeft: -8, width: 7, height: 7,
        background: '#2e0a72', borderRadius: '50%',
        border: '1px solid #1a0050',
      }} />
      {/* Right foot */}
      <div style={{
        position: 'absolute', bottom: 1, left: '50%',
        marginLeft: 1, width: 7, height: 7,
        background: '#2e0a72', borderRadius: '50%',
        border: '1px solid #1a0050',
      }} />
    </div>
  )
}

function LightningWizard({ firing, angle = 0 }) {
  return (
    <div className={firing ? 'wizard-firing' : ''} style={{ position: 'relative', width: 44, height: 48, rotate: `${angle}deg`, transition: 'rotate 0.08s ease-out' }}>
      {/* Robe — yellow */}
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        width: 40, height: 32,
        background: 'radial-gradient(ellipse at 40% 30%, #ffe066, #c8860e)',
        borderRadius: '50%',
        border: '1px solid #a06000',
      }} />
      {/* Hat brim */}
      <div style={{
        position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
        width: 36, height: 36,
        background: 'radial-gradient(circle at 38% 38%, #ffd700, #b8740a)',
        borderRadius: '50%',
        border: '2px solid #8a5000',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Hat tip — lightning bolt */}
        <div style={{
          width: 14, height: 14,
          background: '#ffcc00',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 9, lineHeight: 1,
        }}>⚡</div>
      </div>
      {/* Staff — tall stick poking out from right side */}
      <div style={{
        position: 'absolute',
        top: 6, left: '50%', marginLeft: 17,
        width: 4, height: 30,
        background: 'linear-gradient(180deg, #c8a000, #7a4f00)',
        borderRadius: 2,
        transform: 'rotate(10deg)',
        transformOrigin: 'top center',
      }} />
      {/* Staff top crystal */}
      <div className={firing ? 'wand-fire' : ''} style={{
        position: 'absolute',
        top: 1, left: '50%', marginLeft: 15,
        color: '#ffffff', fontSize: 11, lineHeight: 1,
        textShadow: '0 0 6px #ffffaa, 0 0 12px #ffee00',
        userSelect: 'none',
      }}>⚡</div>
      {/* Hand gripping the staff */}
      <div style={{
        position: 'absolute',
        top: 25, left: '50%', marginLeft: 15,
        width: 10, height: 8,
        background: '#f5cba7',
        borderRadius: '50%',
        border: '1px solid #d4a882',
      }} />
      {/* Left foot */}
      <div style={{
        position: 'absolute', bottom: 1, left: '50%',
        marginLeft: -8, width: 7, height: 7,
        background: '#a06000', borderRadius: '50%',
        border: '1px solid #7a4400',
      }} />
      {/* Right foot */}
      <div style={{
        position: 'absolute', bottom: 1, left: '50%',
        marginLeft: 1, width: 7, height: 7,
        background: '#a06000', borderRadius: '50%',
        border: '1px solid #7a4400',
      }} />
    </div>
  )
}

function IceWizard({ firing, angle = 0 }) {
  return (
    <div className={firing ? 'wizard-firing' : ''} style={{ position: 'relative', width: 44, height: 48, rotate: `${angle}deg`, transition: 'rotate 0.08s ease-out' }}>
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        width: 40, height: 32,
        background: 'radial-gradient(ellipse at 40% 30%, #7fdfff, #0e6fa8)',
        borderRadius: '50%',
        border: '1px solid #0a4a70',
      }} />
      <div style={{
        position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
        width: 36, height: 36,
        background: 'radial-gradient(circle at 38% 38%, #a0eaff, #0a5f90)',
        borderRadius: '50%',
        border: '2px solid #063a5a',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 14, height: 14,
          background: '#0a4a70',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#e0faff', fontSize: 9, lineHeight: 1,
        }}>❄</div>
      </div>
      <div style={{
        position: 'absolute',
        top: 28, left: '50%', marginLeft: 18,
        width: 16, height: 3,
        background: 'linear-gradient(90deg, #6b3f1f, #c4a065)',
        borderRadius: 2,
        transform: 'rotate(-35deg)',
        transformOrigin: 'left center',
      }} />
      <div style={{
        position: 'absolute',
        top: 25, left: '50%', marginLeft: 15,
        width: 10, height: 8,
        background: '#f5cba7',
        borderRadius: '50%',
        border: '1px solid #d4a882',
      }} />
      <div className={firing ? 'wand-fire' : ''} style={{
        position: 'absolute',
        top: 14, left: '50%', marginLeft: 27,
        color: '#cdf6ff', fontSize: 9, lineHeight: 1,
        textShadow: '0 0 5px #66e0ff, 0 0 10px #00aaff',
        userSelect: 'none',
      }}>❄</div>
      <div style={{
        position: 'absolute', bottom: 1, left: '50%',
        marginLeft: -8, width: 7, height: 7,
        background: '#0a4a70', borderRadius: '50%',
        border: '1px solid #063a5a',
      }} />
      <div style={{
        position: 'absolute', bottom: 1, left: '50%',
        marginLeft: 1, width: 7, height: 7,
        background: '#0a4a70', borderRadius: '50%',
        border: '1px solid #063a5a',
      }} />
    </div>
  )
}

function ArcaneWizard({ firing, angle = 0 }) {
  return (
    <div className={firing ? 'wizard-firing' : ''} style={{ position: 'relative', width: 44, height: 48, rotate: `${angle}deg`, transition: 'rotate 0.08s ease-out' }}>
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        width: 40, height: 32,
        background: 'radial-gradient(ellipse at 40% 30%, #d9a3ff, #6a12a8)',
        borderRadius: '50%',
        border: '1px solid #4a0a80',
      }} />
      <div style={{
        position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
        width: 36, height: 36,
        background: 'radial-gradient(circle at 38% 38%, #e6c2ff, #5a0f96)',
        borderRadius: '50%',
        border: '2px solid #3a0870',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 14, height: 14,
          background: '#3a0870',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#f0d9ff', fontSize: 9, lineHeight: 1,
        }}>✵</div>
      </div>
      <div style={{
        position: 'absolute',
        top: 28, left: '50%', marginLeft: 18,
        width: 16, height: 3,
        background: 'linear-gradient(90deg, #6b3f1f, #c4a065)',
        borderRadius: 2,
        transform: 'rotate(-35deg)',
        transformOrigin: 'left center',
      }} />
      <div style={{
        position: 'absolute',
        top: 25, left: '50%', marginLeft: 15,
        width: 10, height: 8,
        background: '#f5cba7',
        borderRadius: '50%',
        border: '1px solid #d4a882',
      }} />
      <div className={firing ? 'wand-fire' : ''} style={{
        position: 'absolute',
        top: 14, left: '50%', marginLeft: 27,
        color: '#e6c2ff', fontSize: 9, lineHeight: 1,
        textShadow: '0 0 5px #cc66ff, 0 0 10px #8800dd',
        userSelect: 'none',
      }}>✵</div>
      <div style={{
        position: 'absolute', bottom: 1, left: '50%',
        marginLeft: -8, width: 7, height: 7,
        background: '#5a0f96', borderRadius: '50%',
        border: '1px solid #3a0870',
      }} />
      <div style={{
        position: 'absolute', bottom: 1, left: '50%',
        marginLeft: 1, width: 7, height: 7,
        background: '#5a0f96', borderRadius: '50%',
        border: '1px solid #3a0870',
      }} />
    </div>
  )
}

function PoisonWizard({ firing, angle = 0 }) {
  return (
    <div className={firing ? 'wizard-firing' : ''} style={{ position: 'relative', width: 44, height: 48, rotate: `${angle}deg`, transition: 'rotate 0.08s ease-out' }}>
      <div style={{
        position: 'absolute', top: 12, left: '50%', transform: 'translateX(-50%)',
        width: 40, height: 32,
        background: 'radial-gradient(ellipse at 40% 30%, #9dff5c, #3a7a0e)',
        borderRadius: '50%',
        border: '1px solid #2a5a08',
      }} />
      <div style={{
        position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)',
        width: 36, height: 36,
        background: 'radial-gradient(circle at 38% 38%, #c2ff8c, #2e6a08)',
        borderRadius: '50%',
        border: '2px solid #1e4a05',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 14, height: 14,
          background: '#1e4a05',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#d9ffb3', fontSize: 9, lineHeight: 1,
        }}>☠</div>
      </div>
      <div style={{
        position: 'absolute',
        top: 28, left: '50%', marginLeft: 18,
        width: 16, height: 3,
        background: 'linear-gradient(90deg, #6b3f1f, #c4a065)',
        borderRadius: 2,
        transform: 'rotate(-35deg)',
        transformOrigin: 'left center',
      }} />
      <div style={{
        position: 'absolute',
        top: 25, left: '50%', marginLeft: 15,
        width: 10, height: 8,
        background: '#f5cba7',
        borderRadius: '50%',
        border: '1px solid #d4a882',
      }} />
      <div className={firing ? 'wand-fire' : ''} style={{
        position: 'absolute',
        top: 14, left: '50%', marginLeft: 27,
        color: '#c2ff8c', fontSize: 9, lineHeight: 1,
        textShadow: '0 0 5px #99ff33, 0 0 10px #559900',
        userSelect: 'none',
      }}>☠</div>
      <div style={{
        position: 'absolute', bottom: 1, left: '50%',
        marginLeft: -8, width: 7, height: 7,
        background: '#2e6a08', borderRadius: '50%',
        border: '1px solid #1e4a05',
      }} />
      <div style={{
        position: 'absolute', bottom: 1, left: '50%',
        marginLeft: 1, width: 7, height: 7,
        background: '#2e6a08', borderRadius: '50%',
        border: '1px solid #1e4a05',
      }} />
    </div>
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

const WIZARD_COMPONENTS = { fire: Wizard, lightning: LightningWizard, ice: IceWizard, arcane: ArcaneWizard, poison: PoisonWizard }
const ENEMY_COMPONENTS = { goblin: Enemy, archer: Archer, troll: Troll, scout: Scout }

function seededRandom(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

const GRASS_SHADES = ['#2d5a27', '#2a5624', '#336024', '#275320']
const PATH_SHADES = ['#7a5c3a', '#725434', '#80613f', '#6c4f30']

function Tree({ rot = 0 }) {
  return (
    <div style={{ position: 'relative', width: 34, height: 34, transform: `rotate(${rot}deg)`, pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', top: 4, left: 4, width: 26, height: 26,
        background: 'radial-gradient(circle at 35% 32%, #5cad3f, #1e5a16)',
        borderRadius: '50%',
        border: '2px solid #133e0e',
      }} />
      <div style={{
        position: 'absolute', top: 12, left: 13, width: 8, height: 8,
        background: 'radial-gradient(circle at 35% 32%, #4a9a30, #164d10)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute', bottom: 2, left: '50%', marginLeft: -3,
        width: 6, height: 6, background: '#5a3a1a', borderRadius: '50%',
        border: '1px solid #3a2410',
      }} />
    </div>
  )
}

function Rock({ rot = 0 }) {
  return (
    <div style={{
      width: 20, height: 15,
      background: 'radial-gradient(circle at 35% 30%, #a3a39a, #5c5c54)',
      borderRadius: '45% 55% 50% 50% / 55% 50% 55% 45%',
      border: '1px solid #3f3f38',
      transform: `rotate(${rot}deg)`,
      pointerEvents: 'none',
    }} />
  )
}

function Flowers() {
  return (
    <div style={{ position: 'relative', width: 26, height: 18, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', top: 0, left: 2, width: 6, height: 6, borderRadius: '50%', background: '#ff6fae', border: '1px solid #cc3d7a' }} />
      <div style={{ position: 'absolute', top: 6, left: 10, width: 6, height: 6, borderRadius: '50%', background: '#ffe066', border: '1px solid #cc9e00' }} />
      <div style={{ position: 'absolute', top: 1, left: 17, width: 6, height: 6, borderRadius: '50%', background: '#8ecfff', border: '1px solid #3d8fcc' }} />
    </div>
  )
}

function GrassTuft({ rot = 0 }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', transform: `rotate(${rot * 0.3}deg)`, pointerEvents: 'none' }}>
      <div style={{ width: 3, height: 12, background: '#3a7a2a', borderRadius: '2px 2px 0 0' }} />
      <div style={{ width: 3, height: 17, background: '#4a9a35', borderRadius: '2px 2px 0 0' }} />
      <div style={{ width: 3, height: 11, background: '#3a7a2a', borderRadius: '2px 2px 0 0' }} />
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

function GrassTile({ row, col }) {
  const seed = row * 137 + col * 971
  const r = seededRandom(seed)
  const rot = (seededRandom(seed + 1) - 0.5) * 40
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
      type: row === PATH_ROW ? 'path' : 'empty',
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
  const [gold, setGold] = useState(50)
  const [gameOver, setGameOver] = useState(false)
  const [hoveredTower, setHoveredTower] = useState(null)
  const [firingTowerIds, setFiringTowerIds] = useState(new Set())
  const [selectedType, setSelectedType] = useState('fire')
  const [lightningBolts, setLightningBolts] = useState([])

  const towersRef = useRef(towers)
  useEffect(() => { towersRef.current = towers }, [towers])

  const enemiesRef = useRef(enemies)
  useEffect(() => { enemiesRef.current = enemies }, [enemies])

  const fireballsRef = useRef(fireballs)
  useEffect(() => { fireballsRef.current = fireballs }, [fireballs])

  const towerCooldownsRef = useRef({})

  function handleCellClick(row, col) {
    const cost = TOWER_TYPES[selectedType].cost
    if (grid[row][col].type !== 'empty' || gold < cost || gameOver) return
    setGrid(prev => {
      const next = prev.map(r => r.map(c => ({ ...c })))
      next[row][col].type = 'tower'
      return next
    })
    setTowers(prev => [...prev, { row, col, id: `${row}-${col}`, type: selectedType }])
    setGold(prev => prev - cost)
  }

  function pickEnemyType(i) {
    const m = i % 10
    if (m === 9) return 'scout'
    if (m === 8) return 'troll'
    if (m === 6 || m === 7) return 'archer'
    return 'goblin'
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
        return {
          id: Date.now() + i,
          col: -(i * 0.6),
          row: PATH_ROW,
          type,
          hp: cfg.hp,
          maxHp: cfg.hp,
          speed: cfg.speed,
          slowedUntil: 0,
          poisonUntil: 0,
          poisonDps: 0,
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
      const lightningDamageMap = new Map()
      const firedIds = new Set()
      currentTowers.forEach(tower => {
        const cfg = TOWER_TYPES[tower.type]
        if (now - (towerCooldownsRef.current[tower.id] || 0) < cfg.cooldown) return

        if (tower.type === 'lightning') {
          const targets = currentEnemies
            .filter(e => e.col >= 0 && Math.abs(e.col - tower.col) <= cfg.range)
            .sort((a, b) => Math.abs(a.col - tower.col) - Math.abs(b.col - tower.col))
            .slice(0, LIGHTNING_TARGETS)
          if (targets.length === 0) return
          towerCooldownsRef.current[tower.id] = now
          firedIds.add(tower.id)
          targets.forEach(e => lightningDamageMap.set(e.id, (lightningDamageMap.get(e.id) || 0) + 100))
          const chainPts = [{ x: tower.col, y: tower.row }]
          targets.forEach(e => {
            const prev = chainPts[chainPts.length - 1]
            jaggify(prev.x, prev.y, e.col, e.row).slice(1).forEach(p => chainPts.push(p))
          })
          newLightningBolts.push({ id: now + Math.random(), path: chainPts })
        } else {
          const target = currentEnemies.find(e => e.col >= 0 && Math.abs(e.col - tower.col) <= cfg.range)
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
          const cfg = TOWER_TYPES[f.kind]
          hitDamageMap.set(f.targetId, (hitDamageMap.get(f.targetId) || 0) + cfg.damage)
          if (f.kind === 'ice') hitEffects.set(f.targetId, { ...(hitEffects.get(f.targetId) || {}), slow: true })
          if (f.kind === 'poison') hitEffects.set(f.targetId, { ...(hitEffects.get(f.targetId) || {}), poison: true })
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
            const poisonUntil = effects?.poison ? now + POISON_DURATION : e.poisonUntil
            const poisonDps = effects?.poison ? POISON_DPS : e.poisonDps
            const speedMult = slowedUntil && now < slowedUntil ? ICE_SLOW_FACTOR : 1
            const poisonTick = poisonUntil && now < poisonUntil ? poisonDps * (50 / 1000) : 0
            const dmg = (hitDamageMap.get(e.id) || 0) + (lightningDamageMap.get(e.id) || 0) + poisonTick
            return {
              ...e,
              col: e.col + e.speed * speedMult,
              hp: e.hp - dmg,
              slowedUntil,
              poisonUntil,
              poisonDps,
            }
          })
          .filter(e => {
            const cfg = ENEMY_TYPES[e.type]
            if (e.hp <= 0) { killed++; goldGained += cfg.goldReward; return false }
            if (e.col >= COLS) { livesLost += cfg.livesCost; return false }
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

  function restart() {
    setGrid(makeGrid())
    setEnemies([])
    setFireballs([])
    setTowers([])
    setScore(0)
    setLives(10)
    setWave(0)
    setGold(50)
    setGameOver(false)
    setLightningBolts([])
    towerCooldownsRef.current = {}
  }

  return (
    <div style={{ padding: 24, minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 12 }}>🧙 Wizard War 2 — Defend the Kingdom!</h1>

      <div style={{ display: 'flex', gap: 24, marginBottom: 10, alignItems: 'center', flexWrap: 'wrap' }}>
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
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {Object.entries(TOWER_TYPES).map(([key, cfg]) => (
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
        padding: 12,
        borderRadius: 14,
        background: 'linear-gradient(135deg, #2a2015, #1a1510)',
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
          const towerCfg = tower ? TOWER_TYPES[tower.type] : null

          const shadeSeed = cell.row * 137 + cell.col * 971
          const grassShade = GRASS_SHADES[Math.floor(seededRandom(shadeSeed + 2) * GRASS_SHADES.length)]
          const pathShadeSeed = cell.row * 211 + cell.col * 337
          const pathShade = PATH_SHADES[Math.floor(seededRandom(pathShadeSeed + 2) * PATH_SHADES.length)]

          const hoveredTowerObj = hoveredTower ? towers.find(t => t.row === hoveredTower.row && t.col === hoveredTower.col) : null
          const hoveredRange = hoveredTowerObj ? TOWER_TYPES[hoveredTowerObj.type].range : RANGE
          const inRange = hoveredTower !== null &&
            cell.row === PATH_ROW &&
            Math.abs(cell.col - hoveredTower.col) <= hoveredRange

          let wizardAngle = 0
          if (tower) {
            const range = towerCfg.range
            const target = enemies.find(e => e.col >= 0 && Math.abs(e.col - cell.col) <= range)
            if (target) {
              wizardAngle = Math.atan2(target.row - cell.row, target.col - cell.col) * 180 / Math.PI - 90
            } else {
              wizardAngle = Math.atan2(PATH_ROW - cell.row, range) * 180 / Math.PI - 90
            }
          }

          return (
            <div
              key={`${cell.row}-${cell.col}`}
              onClick={() => handleCellClick(cell.row, cell.col)}
              onMouseEnter={() => cell.type === 'tower' && setHoveredTower(cell)}
              onMouseLeave={() => cell.type === 'tower' && setHoveredTower(null)}
              style={{
                width: CELL, height: CELL,
                background:
                  inRange ? '#a0522d' :
                  cell.type === 'path' ? pathShade :
                  cell.type === 'tower' ? '#1a2a1a' :
                  grassShade,
                border: inRange ? '1px solid #ffaa00' : '1px solid #1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: cell.type === 'empty' ? 'pointer' : 'default',
                fontSize: 28, userSelect: 'none',
              }}
            >
              {tower ? (() => {
                const firing = firingTowerIds.has(`${cell.row}-${cell.col}`)
                const Comp = WIZARD_COMPONENTS[tower.type] || Wizard
                return <Comp firing={firing} angle={wizardAngle} />
              })() : cell.type === 'empty' ? <GrassTile row={cell.row} col={cell.col} /> :
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
            <Fireball kind={f.kind} />
          </div>
        ))}
      </div>
      </div>
    </div>
  )
}
