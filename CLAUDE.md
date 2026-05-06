# Maniac Maryland

Point-and-click adventure proof-of-concept. One scene: McNulty and Bunk re-investigate the kitchen from *The Wire* S1E4. The puzzle is to measure the window and the fridge with the tape measure; the dialogue is canon. End state plays a short cutscene and an end card.

## Stack & commands

- Phaser 3 + Vite + TypeScript (strict). Vitest for unit tests.
- `npm run dev` — local server on :5173
- `npm run build` — typecheck (`tsc --noEmit`) then production build
- `npm run test` — run vitest once

## Architecture

```
src/
  main.ts                  Phaser config, scene registration
  scenes/
    BootScene.ts           Generates the placeholder kitchen texture, then starts KitchenScene
    KitchenScene.ts        Wires systems together, handles input, drives the puzzle
  entities/Character.ts    Walking rectangle + name tag (placeholder sprite)
  systems/
    GameState.ts           Flags, inventory, active item. Flag/ItemId are unions — extend here
    HotspotManager.ts      Polygon hotspots, hover/hit-test, hide-on-pickup
    DialogueManager.ts     Speech bubble queue with onDone callbacks and whenIdle hook
    InteractionResolver.ts Pure function: (verb, hotspot, state) → line + side effects
    Polygon.ts             pointInPolygon + clampToPolygon for walkable areas
  ui/
    Cursor.ts              Verb-sensitive cursor label
    InventoryBar.ts        Bottom strip; click to select active item
    SpeechBubble.ts        Follows the speaking character
  data/
    kitchen.scene.json     Spawns, walkable polygon, hotspot polygons + approach points
    interactions.json      Verb × hotspot (× withItem) → line + flag/item/removeHotspot
    dialogue.json          lineId → { speaker, text } or array for multi-line
```

Data flow: `KitchenScene` reads JSON at import time → `HotspotManager` builds hotspots → click triggers `walkTo(approach)` → on arrival, `InteractionResolver.resolve()` returns a `lineId` + side effects → `DialogueManager.speakLine()` plays it → callback applies flags/items.

## Adding content

- **New hotspot**: add to `kitchen.scene.json` (`polygon`, `approach`), then add `look`/`use` rules to `interactions.json`, then add lines to `dialogue.json`.
- **New flag or item**: extend the `Flag` / `ItemId` union in `GameState.ts`. JSON references are validated by the cast in `InteractionResolver.ts` — a typo will fail at runtime, not compile time.
- **New solve condition**: edit `solveCondition` in `interactions.json`.

## Scope guardrails (POC — do not expand without being asked)

- One scene, one puzzle. Don't add scene transitions, save/load, menus, settings, audio, or a second room.
- Two verbs (`look`, `use`). Don't add a SCUMM verb grid, talk trees, or combine-items-on-items.
- Placeholder rectangles for characters and a generated background are intentional. Real art is produced via the `generate-character` skill into `assets/characters/` and `scripts/gen-image.sh` (uses `OPENAI_API_KEY`); don't swap in a different art pipeline.
- Don't introduce frameworks: no state library, no ECS, no scene graph abstraction, no router. Systems are deliberately small classes.
- Don't add backwards-compat shims, feature flags, or "future hooks." If something needs to change, change it.

## Style

- Strict TS, narrow string-literal unions for ids (`CharacterId`, `Flag`, `ItemId`, `Verb`).
- Terse code, no comments unless the *why* is non-obvious.
- Pure functions where reasonable (`InteractionResolver.resolve`, `Polygon.*`) — these are the things with tests.
- When tests exist for a system, keep them passing; when adding logic to `InteractionResolver` or `Polygon`, add a vitest case.
