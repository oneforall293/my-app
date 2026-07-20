# Wizard War 2 — Handoff Notes

Read this first if you're picking up this project in a new session. It'll catch you up fast.

## What This Is

A tower defense game Win is building in Shipyard (a summer coding course). It's a Vite + React app.
Win is 11 and new to coding — explain things in plain language, give him real choices when there's
a decision to make, and check his understanding instead of just building for him.

- **Code:** `~/shipyard/my-app/src/App.jsx` (one big file, everything lives here)
- **Run it locally:** `cd ~/shipyard/my-app && npm run dev`
- **Live site:** https://my-app-ten-xi-24.vercel.app — pushing to `main` on GitHub auto-deploys it via Vercel. No separate deploy command needed. After a push, wait ~1 minute then refresh the site.

## How The Game Works

Goblins and other enemies walk across a horizontal path on a grid. Win places wizard towers next to
the path; towers auto-fire at enemies in range. Killing enemies earns gold, gold buys more towers.
Losing lives (enemies that reach the end) too many times ends the game.

Key pieces in the code:
- `TOWER_TYPES` — one object holding every wizard's cost, range, damage, cooldown, and card styling. Add a new wizard type here first.
- `ENEMY_TYPES` — same idea for enemies: hp, speed, how many lives it costs if it gets through, gold reward for killing it.
- `pickEnemyType(i)` — decides which enemy type spawns at each position in a wave.
- The big `useEffect` with `setInterval` — this is the game loop, runs every 50ms: towers fire, projectiles move, damage/effects get applied, enemies move.

## What We Built Today (2026-07-16)

1. Gave the Lightning Wizard its own gold cost (25) instead of sharing the base tower price.
2. Added three new wizard towers:
   - **Ice Wizard** (30 gold) — 150 dmg, slows the enemy it hits for 2 seconds.
   - **Arcane Wizard** (45 gold) — the strongest one, 500 dmg in a single big hit.
   - **Poison Wizard** (35 gold) — 50 dmg on hit, then the enemy keeps losing HP over time.
3. Added two new enemies that start appearing from wave 2 onward:
   - **Troll** — tanky, 4000 HP, slow, costs you 6 lives if it gets through.
   - **Scout** — fragile, 400 HP, fast, costs 1 life.
4. Refactored so every tower/enemy's stats live in one config object (`TOWER_TYPES` / `ENEMY_TYPES`) instead of scattered if/else checks — this makes adding more types later much easier.
5. Tested it by actually running the game in a browser (placed towers, sent waves, watched enemies take damage) instead of just checking it builds.

## Rough Edges / Things Worth Knowing

- **Poison balance:** during testing, a poison-hit goblin survived at ~3% HP because the tower switched to a new target before finishing it off (poison stops ticking once its 3-second timer runs out). Not a bug — just something to maybe tune if Win wants poison to reliably finish enemies off.
- **Gold is tight:** starting gold is 50, and the Arcane Wizard alone costs 45. Feels appropriately "save up for the big one," but worth checking it still feels fun after a few more waves.
- No sound effects yet.
- No way to sell or upgrade a tower once placed.
- No "boss" enemy yet — Troll is the toughest thing right now.

## What's Next — Ask Win To Pick

Good next options to offer him (don't just pick one — give him the tradeoffs like usual):
1. **Balance pass** — playtest a full run and tune numbers (costs, damage, HP) so it feels fair and fun.
2. **Tower upgrades** — let Win click a placed tower to upgrade it (more damage/range) for extra gold, instead of only building new ones.
3. **A boss enemy** — a rare, very tough enemy for late waves, to give trolls competition for "scariest thing on the path."
4. **Sound effects** — simple fire/zap/hit sounds using the Web Audio API or small sound files.

## Exact Next Step

Ask Win which of the four options above he wants to do next, using the usual "here are 2-4 choices
with tradeoffs" style. Don't start coding until he picks.
