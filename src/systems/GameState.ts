export type Flag =
  | "examined_window"
  | "examined_fridge"
  | "measured_window"
  | "measured_fridge"
  | "solved";

export type ItemId = "tape_measure";

export class GameState {
  private flags = new Set<Flag>();
  private inventory = new Set<ItemId>();
  activeItem: ItemId | null = null;

  setFlag(flag: Flag): void {
    this.flags.add(flag);
  }

  hasFlag(flag: Flag): boolean {
    return this.flags.has(flag);
  }

  addItem(item: ItemId): void {
    this.inventory.add(item);
  }

  hasItem(item: ItemId): boolean {
    return this.inventory.has(item);
  }

  items(): ItemId[] {
    return [...this.inventory];
  }

  isSolved(condition: Flag[]): boolean {
    return condition.every((f) => this.flags.has(f));
  }
}
