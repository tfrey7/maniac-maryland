import { GameState, Flag, ItemId } from "./GameState";
import interactionsData from "../data/interactions.json";

export type Verb = "look" | "use";

export interface InteractionRule {
  verb: Verb;
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
const FALLBACK_USE_WITH_ITEM = interactionsData.fallbackUseWithItem as string;
export const SOLVE_CONDITION = interactionsData.solveCondition as Flag[];

export function resolve(
  verb: Verb,
  hotspotId: string,
  state: GameState,
): ResolvedInteraction | null {
  const item = verb === "use" ? state.activeItem : null;

  if (item) {
    const match = RULES.find(
      (r) => r.verb === verb && r.hotspot === hotspotId && r.withItem === item,
    );
    if (match) {
      return {
        lineId: match.line,
        setFlag: match.setFlag,
        giveItem: match.giveItem,
        removeHotspot: match.removeHotspot,
      };
    }
    return { lineId: FALLBACK_USE_WITH_ITEM };
  }

  const match = RULES.find(
    (r) => r.verb === verb && r.hotspot === hotspotId && !r.withItem,
  );
  if (!match) return null;
  return {
    lineId: match.line,
    setFlag: match.setFlag,
    giveItem: match.giveItem,
    removeHotspot: match.removeHotspot,
  };
}
