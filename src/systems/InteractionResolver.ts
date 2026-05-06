import { GameState, Flag, ItemId } from "./GameState";
import interactionsData from "../data/interactions.json";

export interface InteractionRule {
  hotspot: string;
  withItem?: ItemId;
  line: string;
  setFlag?: Flag;
  giveItem?: ItemId;
  removeHotspot?: boolean;
}

export interface ResolvedInteraction {
  lineId: string;
  setFlag?: Flag;
  giveItem?: ItemId;
  removeHotspot?: boolean;
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
      (r) => r.hotspot === hotspotId && r.withItem === item,
    );
    if (match) return toResolved(match);
    return FALLBACK_USE_WITH_ITEM ? { lineId: FALLBACK_USE_WITH_ITEM } : null;
  }

  const match = RULES.find((r) => r.hotspot === hotspotId && !r.withItem);
  if (!match) return null;
  return toResolved(match);
}

export function hasItemInteraction(hotspotId: string, item: ItemId): boolean {
  return RULES.some((r) => r.hotspot === hotspotId && r.withItem === item);
}

export function hotspotsForItem(item: ItemId): string[] {
  return RULES.filter((r) => r.withItem === item).map((r) => r.hotspot);
}

function toResolved(r: InteractionRule): ResolvedInteraction {
  return {
    lineId: r.line,
    setFlag: r.setFlag,
    giveItem: r.giveItem,
    removeHotspot: r.removeHotspot,
  };
}
