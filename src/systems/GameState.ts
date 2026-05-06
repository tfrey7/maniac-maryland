export type Flag = "solved";

export type ItemId = "duffel_bag";

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

  removeItem(item: ItemId): void {
    this.inventory.delete(item);
    if (this.activeItem === item) this.activeItem = null;
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
