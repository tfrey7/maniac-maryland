import Phaser from "phaser";
import { ItemId } from "../systems/GameState";

const ITEM_LABELS: Record<ItemId, string> = {
  duffel_bag: "duffel bag",
};

const ICON_SIZE = 44;
const SLOT_SIZE = 56;
const SLOT_GAP = 8;
const BAR_HEIGHT = 80;

interface Slot {
  item: ItemId;
  hit: Phaser.GameObjects.Rectangle;
  border: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
}

export class InventoryBar {
  private bg: Phaser.GameObjects.Rectangle;
  private slots: Slot[] = [];
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
    for (const slot of this.slots) {
      slot.hit.destroy();
      slot.border.destroy();
      slot.icon.destroy();
      slot.label.destroy();
    }
    this.slots = [];
    const scene = this.bg.scene;
    const barY = this.bg.y as number;
    items.forEach((item, i) => {
      const cx = 16 + i * (SLOT_SIZE + SLOT_GAP) + SLOT_SIZE / 2;
      const cy = barY + BAR_HEIGHT / 2 - 6;
      const hit = scene.add
        .rectangle(cx, barY + BAR_HEIGHT / 2, SLOT_SIZE, BAR_HEIGHT, 0x000000, 0.001)
        .setDepth(901)
        .setInteractive({ useHandCursor: true });
      const border = scene.add
        .rectangle(cx, cy, SLOT_SIZE, SLOT_SIZE, 0x222222)
        .setStrokeStyle(2, 0x666666)
        .setDepth(901);
      const icon = scene.add
        .image(cx, cy, `item:${item}`)
        .setDisplaySize(ICON_SIZE, ICON_SIZE)
        .setDepth(902);
      const label = scene.add
        .text(cx, cy + SLOT_SIZE / 2 + 4, ITEM_LABELS[item], {
          fontFamily: "monospace",
          fontSize: "10px",
          color: "#ccc",
        })
        .setOrigin(0.5, 0)
        .setDepth(902);
      hit.on("pointerdown", () => this.onSelect(item));
      this.slots.push({ item, hit, border, icon, label });
    });
    this.refreshHighlight();
  }

  setSelected(item: ItemId | null): void {
    this.selected = item;
    this.refreshHighlight();
  }

  private refreshHighlight(): void {
    for (const slot of this.slots) {
      slot.border.setStrokeStyle(2, slot.item === this.selected ? 0xffeb6b : 0x666666);
    }
  }
}
