import Phaser from "phaser";
import { ItemId } from "../systems/GameState";

const ITEM_LABELS: Record<ItemId, string> = {};

const ITEM_COLORS: Record<ItemId, number> = {};

const SLOT_SIZE = 56;
const SLOT_GAP = 8;
const BAR_HEIGHT = 80;

export class InventoryBar {
  private bg: Phaser.GameObjects.Rectangle;
  private slots: Phaser.GameObjects.Container[] = [];
  private onSelect: (item: ItemId) => void;
  private selected: ItemId | null = null;

  constructor(
    scene: Phaser.Scene,
    onSelect: (item: ItemId) => void,
  ) {
    this.onSelect = onSelect;
    const w = scene.scale.width;
    const h = scene.scale.height;
    this.bg = scene.add
      .rectangle(0, h - BAR_HEIGHT, w, BAR_HEIGHT, 0x111111, 0.85)
      .setOrigin(0, 0)
      .setStrokeStyle(2, 0x333333)
      .setDepth(900);
  }

  setItems(items: ItemId[]): void {
    for (const slot of this.slots) slot.destroy();
    this.slots = [];
    items.forEach((item, i) => {
      const x = 16 + i * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;
      const y = (this.bg.y as number) + BAR_HEIGHT / 2;
      const scene = this.bg.scene;
      const bg = scene.add
        .rectangle(0, 0, SLOT_SIZE, SLOT_SIZE, 0x222222)
        .setStrokeStyle(2, 0x666666);
      const icon = scene.add.rectangle(0, 0, 36, 36, ITEM_COLORS[item]);
      const label = scene.add
        .text(0, SLOT_SIZE / 2 + 6, ITEM_LABELS[item], {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#ccc",
        })
        .setOrigin(0.5, 0);
      const slot = scene.add.container(x, y, [bg, icon, label]).setDepth(901);
      slot.setSize(SLOT_SIZE, SLOT_SIZE);
      slot.setInteractive(
        new Phaser.Geom.Rectangle(-SLOT_SIZE / 2, -SLOT_SIZE / 2, SLOT_SIZE, SLOT_SIZE),
        Phaser.Geom.Rectangle.Contains,
      );
      slot.on("pointerdown", () => this.onSelect(item));
      slot.setData("item", item);
      slot.setData("bg", bg);
      this.slots.push(slot);
    });
    this.refreshHighlight();
  }

  setSelected(item: ItemId | null): void {
    this.selected = item;
    this.refreshHighlight();
  }

  private refreshHighlight(): void {
    for (const slot of this.slots) {
      const item = slot.getData("item") as ItemId;
      const bg = slot.getData("bg") as Phaser.GameObjects.Rectangle;
      bg.setStrokeStyle(2, item === this.selected ? 0xffeb6b : 0x666666);
    }
  }
}
