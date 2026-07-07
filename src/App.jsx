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

function Fireball() {
  return (
    <div className="fireball" style={{ position: 'relative', width: 22, height: 22 }}>
      {/* Outer halo */}
      <div style={{
        position: 'absolute', top: -3, left: -3, width: 28, height: 28,
        background: 'radial-gradient(circle, rgba(255,120,0,0.55) 0%, rgba(255,40,0,0.2) 55%, transparent 75%)',
        borderRadius: '50%',
        filter: 'blur(3px)',
      }} />
      {/* Main body */}
      <div style={{
        position: 'absolute', top: 2, left: 2, width: 18, height: 18,
        background: 'radial-gradient(circle at 38% 35%, #ffee88, #ff7700, #cc1100)',
        borderRadius: '50%',
        boxShadow: '0 0 8px #ff6600, 0 0 16px #ff2200',
      }} />
      {/* White-hot core */}
      <div style={{
        position: 'absolute', top: 7, left: 7, width: 8, height: 8,
        background: 'radial-gradient(circle, #ffffff, #ffff99)',
        borderRadius: '50%',
      }} />
    </div>
  )
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

  const towersRef = useRef(towers)
  useEffect(() => { towersRef.current = towers }, [towers])

  const enemiesRef = useRef(enemies)
  useEffect(() => { enemiesRef.current = enemies }, [enemies])

  const fireballsRef = useRef(fireballs)
  useEffect(() => { fireballsRef.current = fireballs }, [fireballs])

  const towerCooldownsRef = useRef({})

  function handleCellClick(row, col) {
    if (grid[row][col].type !== 'empty' || gold < TOWER_COST || gameOver) return
    setGrid(prev => {
      const next = prev.map(r => r.map(c => ({ ...c })))
      next[row][col].type = 'tower'
      return next
    })
    setTowers(prev => [...prev, { row, col, id: `${row}-${col}` }])
    setGold(prev => prev - TOWER_COST)
  }

  function spawnWave() {
    if (gameOver) return
    const next = wave + 1
    setWave(next)
    const count = next * 5

    setEnemies(prev => [
      ...prev,
      ...Array.from({ length: count }, (_, i) => {
        const isArcher = i % 5 === 4
        return {
          id: Date.now() + i,
          col: -(i * 0.6),
          row: PATH_ROW,
          type: isArcher ? 'archer' : 'goblin',
          hp:    isArcher ? 2000 : 1000,
          maxHp: isArcher ? 2000 : 1000,
          speed: isArcher ? SPEED * 0.8 : SPEED,
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
      const firedIds = new Set()
      currentTowers.forEach(tower => {
        if (now - (towerCooldownsRef.current[tower.id] || 0) < COOLDOWN) return
        const target = currentEnemies.find(e => e.col >= 0 && Math.abs(e.col - tower.col) <= RANGE)
        if (!target) return
        towerCooldownsRef.current[tower.id] = now
        firedIds.add(tower.id)
        const angleRad = Math.atan2(target.row - tower.row, target.col - tower.col)
        newFireballs.push({
          id: now + Math.random(),
          x: tower.col + Math.cos(angleRad) * 0.43,
          y: tower.row + Math.sin(angleRad) * 0.43,
          targetId: target.id,
        })
      })
      if (firedIds.size > 0) {
        setFiringTowerIds(new Set(firedIds))
        setTimeout(() => setFiringTowerIds(new Set()), 450)
      }

      // 2. Move fireballs toward their target and detect hits
      const hitEnemyIds = new Set()
      const survivingFireballs = []
      newFireballs.forEach(f => {
        const target = currentEnemies.find(e => e.id === f.targetId)
        if (!target) return
        const dx = target.col - f.x
        const dy = target.row - f.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 0.3) {
          hitEnemyIds.add(f.targetId)
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
          .map(e => ({
            ...e,
            col: e.col + e.speed,
            hp: hitEnemyIds.has(e.id) ? e.hp - DAMAGE : e.hp,
          }))
          .filter(e => {
            if (e.hp <= 0) { killed++; goldGained += 5; return false }
            if (e.col >= COLS) { livesLost += e.type === 'archer' ? 4 : 1; return false }
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
    towerCooldownsRef.current = {}
  }

  return (
    <div style={{ padding: 24, minHeight: '100vh' }}>
      <h1 style={{ marginBottom: 12 }}>🧙 Wizard War 2</h1>

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

      <p style={{ color: '#888', fontSize: 13, marginBottom: 12 }}>
        Click green cells to place wizards (💰{TOWER_COST} each). They shoot fireballs at enemies on the path!
      </p>

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
        display: 'grid',
        gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
        gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
        position: 'relative',
        border: '2px solid #444',
        width: 'fit-content',
        overflow: 'hidden',
      }}>
        {grid.flat().map(cell => {
          const inRange = hoveredTower !== null &&
            cell.row === PATH_ROW &&
            Math.abs(cell.col - hoveredTower.col) <= RANGE

          let wizardAngle = 0
          if (cell.type === 'tower') {
            const target = enemies.find(e => e.col >= 0 && Math.abs(e.col - cell.col) <= RANGE)
            if (target) {
              wizardAngle = Math.atan2(target.row - cell.row, target.col - cell.col) * 180 / Math.PI - 90
            } else {
              wizardAngle = Math.atan2(PATH_ROW - cell.row, RANGE) * 180 / Math.PI - 90
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
                  cell.type === 'path' ? '#7a5c3a' :
                  cell.type === 'tower' ? '#1a2a1a' :
                  '#2d5a27',
                border: inRange ? '1px solid #ffaa00' : '1px solid #1a1a1a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: cell.type === 'empty' ? 'pointer' : 'default',
                fontSize: 28, userSelect: 'none',
              }}
            >
              {cell.type === 'tower' ? <Wizard firing={firingTowerIds.has(`${cell.row}-${cell.col}`)} angle={wizardAngle} /> : ''}
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
            {enemy.type === 'archer' ? <Archer /> : <Enemy />}
            <div style={{ height: 4, background: '#555', borderRadius: 2, marginTop: 2 }}>
              <div style={{
                width: `${Math.max(0, (enemy.hp / enemy.maxHp) * 100)}%`,
                height: '100%', background: '#e74c3c', borderRadius: 2,
              }} />
            </div>
          </div>
        ))}

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
            <Fireball />
          </div>
        ))}
      </div>
    </div>
  )
}
