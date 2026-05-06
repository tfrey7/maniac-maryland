import { GameState, Flag, ItemId } from "./GameState";
import interactionsData from "../data/interactions.json";

export interface InteractionRule {
  hotspot: string;
  withItem?: ItemId;
  requireFlag?: Flag;
  requireNotFlag?: Flag;
  line?: string;
  setFlag?: Flag;
  giveItem?: ItemId;
  removeItem?: ItemId;
  removeHotspot?: boolean;
  showWorldSprite?: boolean;
  swapWorldSprite?: string;
  playAnim?: string;
  postWalk?: { dx?: number; dy?: number };
}

export interface ResolvedInteraction {
  lineId?: string;
  setFlag?: Flag;
  giveItem?: ItemId;
  removeItem?: ItemId;
  removeHotspot?: boolean;
  showWorldSprite?: boolean;
  swapWorldSprite?: string;
  playAnim?: string;
  postWalk?: { dx?: number; dy?: number };
}

const RULES = interactionsData.interactions as InteractionRule[];
const FALLBACK_USE_WITH_ITEM = (interactionsData as { fallbackUseWithItem?: string })
  .fallbackUseWithItem;
export const SOLVE_CONDITION = interactionsData.solveCondition as Flag[];

export function resolve(
  hotspotId: string,
  state: GameState,
): ResolvedInteraction | null {
  const item = state.activeItem;

  if (item) {
    const match = RULES.find(
      (r) =>
        r.hotspot === hotspotId &&
        r.withItem === item &&
        flagsMatch(r, state),
    );
    if (match) return toResolved(match);
    return FALLBACK_USE_WITH_ITEM ? { lineId: FALLBACK_USE_WITH_ITEM } : null;
  }

  const match = RULES.find(
    (r) => r.hotspot === hotspotId && !r.withItem && flagsMatch(r, state),
  );
  if (!match) return null;
  return toResolved(match);
}

export function hasItemInteraction(hotspotId: string, item: ItemId): boolean {
  return RULES.some((r) => r.hotspot === hotspotId && r.withItem === item);
}

export function hotspotsForItem(item: ItemId): string[] {
  return RULES.filter((r) => r.withItem === item).map((r) => r.hotspot);
}

function flagsMatch(r: InteractionRule, state: GameState): boolean {
  if (r.requireFlag && !state.hasFlag(r.requireFlag)) return false;
  if (r.requireNotFlag && state.hasFlag(r.requireNotFlag)) return false;
  return true;
}

function toResolved(r: InteractionRule): ResolvedInteraction {
  return {
    lineId: r.line,
    setFlag: r.setFlag,
    giveItem: r.giveItem,
    removeItem: r.removeItem,
    removeHotspot: r.removeHotspot,
    showWorldSprite: r.showWorldSprite,
    swapWorldSprite: r.swapWorldSprite,
    playAnim: r.playAnim,
    postWalk: r.postWalk,
  };
}
