import Phaser from "phaser";
import { Character } from "../entities/Character";
import { GameState, ItemId } from "../systems/GameState";
import { DialogueManager } from "../systems/DialogueManager";
import { HotspotManager, HotspotDef, Hotspot } from "../systems/HotspotManager";
import { resolve, SOLVE_CONDITION, Verb } from "../systems/InteractionResolver";
import { Polygon, arrayToPoints, clampToPolygon } from "../systems/Polygon";
import { Cursor } from "../ui/Cursor";
import { InventoryBar } from "../ui/InventoryBar";
import sceneData from "../data/kitchen.scene.json";

const FOLLOW_OFFSET = 80;

export class KitchenScene extends Phaser.Scene {
  private state!: GameState;
  private mcnulty!: Character;
  private bunk!: Character;
  private handyman!: Character;
  private hotspots!: HotspotManager;
  private dialogue!: DialogueManager;
  private cursor!: Cursor;
  private inventoryBar!: InventoryBar;
  private walkable!: Polygon;
  private bunkRetargetTimer = 0;
  private solved = false;

  constructor() {
    super({ key: "KitchenScene" });
  }

  create(): void {
    this.add.image(0, 0, "kitchen_bg").setOrigin(0, 0);
    this.walkable = arrayToPoints(sceneData.walkable);
    this.drawWalkableHint();
    this.sound.play("theme", { loop: true, volume: 0.35 });

    this.state = new GameState();

    this.mcnulty = new Character(this, sceneData.spawn.mcnulty.x, sceneData.spawn.mcnulty.y, {
      id: "mcnulty",
      texture: "mcnulty_walk",
      walkAnimKey: "mcnulty-walk",
      idleAnimKey: "mcnulty-idle",
      scale: 0.7,
      speed: 220,
    });
    this.bunk = new Character(this, sceneData.spawn.bunk.x, sceneData.spawn.bunk.y, {
      id: "bunk",
      texture: "bunk_walk",
      walkAnimKey: "bunk-walk",
      idleAnimKey: "bunk-idle",
      scale: 0.7,
      speed: 200,
    });
    this.handyman = new Character(this, sceneData.spawn.handyman.x, sceneData.spawn.handyman.y, {
      id: "handyman",
      texture: "handyman_sprite",
      scale: 0.9,
      speed: 0,
    });

    this.hotspots = new HotspotManager(this, sceneData.hotspots as HotspotDef[]);
    this.dialogue = new DialogueManager(this, [this.mcnulty, this.bunk, this.handyman]);
    this.cursor = new Cursor(this);
    this.inventoryBar = new InventoryBar(this, (item) => this.onInventoryClick(item));

    this.input.mouse?.disableContextMenu();
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.onPointerDown(p));

    this.add
      .text(16, 12, "Right-click: look · Left-click: walk/use · Click inventory item, then a hotspot, to use.", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#ddd",
        backgroundColor: "#000000aa",
        padding: { x: 6, y: 3 },
      })
      .setDepth(2000);
  }

  update(time: number, deltaMs: number): void {
    this.mcnulty.update(time, deltaMs);
    this.bunk.update(time, deltaMs);
    this.handyman.update(time, deltaMs);
    this.dialogue.update();
    this.updateBunkFollow(deltaMs);
    this.checkSolved();
  }

  private drawWalkableHint(): void {
    const g = this.add.graphics();
    g.lineStyle(1, 0xffffff, 0.08);
    g.beginPath();
    const pts = this.walkable;
    g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.closePath();
    g.strokePath();
  }

  private onPointerMove(p: Phaser.Input.Pointer): void {
    const hit = this.hotspots.updateHover({ x: p.worldX, y: p.worldY });
    if (this.state.activeItem) {
      this.cursor.setVerb("useItem", hit ? hit.label : "");
    } else if (hit) {
      this.cursor.setVerb("look", hit.label);
    } else {
      this.cursor.setVerb("walk");
    }
  }

  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (this.solved) return;
    if (p.y > this.scale.height - 80) return;
    const point = { x: p.worldX, y: p.worldY };
    const hit = this.hotspots.hitTest(point);
    const verb: Verb = p.rightButtonDown() && !this.state.activeItem ? "look" : "use";

    if (hit) {
      this.handleHotspotClick(hit, verb);
    } else if (verb === "use") {
      const dest = clampToPolygon(point, this.walkable);
      this.mcnulty.walkTo(dest);
      this.clearActiveItem();
    }
  }

  private handleHotspotClick(hot: Hotspot, verb: Verb): void {
    const dest = clampToPolygon(hot.approach, this.walkable);
    this.mcnulty.walkTo(dest, () => this.runInteraction(hot, verb));
  }

  private runInteraction(hot: Hotspot, verb: Verb): void {
    const result = resolve(verb, hot.id, this.state);
    if (!result) {
      this.clearActiveItem();
      return;
    }

    this.dialogue.speakLine(result.lineId, () => {
      if (result.setFlag) this.state.setFlag(result.setFlag);
      if (result.giveItem) this.giveItem(result.giveItem);
      if (result.removeHotspot) this.hotspots.hide(hot.id);
      this.clearActiveItem();
    });
  }

  private onInventoryClick(item: ItemId): void {
    if (this.state.activeItem === item) {
      this.clearActiveItem();
      return;
    }
    this.state.activeItem = item;
    this.inventoryBar.setSelected(item);
  }

  private giveItem(item: ItemId): void {
    this.state.addItem(item);
    this.inventoryBar.setItems(this.state.items());
  }

  private clearActiveItem(): void {
    this.state.activeItem = null;
    this.inventoryBar.setSelected(null);
  }

  private updateBunkFollow(deltaMs: number): void {
    this.bunkRetargetTimer -= deltaMs;
    if (this.bunkRetargetTimer > 0) return;
    this.bunkRetargetTimer = 1500;
    if (this.dialogue.isSpeaking()) return;
    const target = this.followTargetForBunk();
    const dx = target.x - this.bunk.x;
    const dy = target.y - this.bunk.y;
    if (Math.hypot(dx, dy) > 30 && !this.bunk.isMoving()) {
      this.bunk.walkTo(clampToPolygon(target, this.walkable));
    }
  }

  private followTargetForBunk(): { x: number; y: number } {
    const offset = this.mcnulty.x > this.scale.width / 2 ? -FOLLOW_OFFSET : FOLLOW_OFFSET;
    return { x: this.mcnulty.x + offset, y: this.mcnulty.y };
  }

  private checkSolved(): void {
    if (this.solved) return;
    if (!this.state.isSolved(SOLVE_CONDITION)) return;
    if (this.dialogue.isSpeaking()) return;
    this.solved = true;
    this.state.setFlag("solved");
    this.dialogue.whenIdle(() => this.playCutscene());
  }

  private playCutscene(): void {
    this.bunk.stop();
    this.mcnulty.stop();
    this.cameras.main.zoomTo(1.15, 800);
    this.cameras.main.pan(this.mcnulty.x, this.mcnulty.y - 40, 800);
    this.dialogue.speakLine("cutscene", () => this.showEndCard());
  }

  private showEndCard(): void {
    const w = this.scale.width;
    const h = this.scale.height;
    const overlay = this.add.rectangle(0, 0, w, h, 0x000000, 0).setOrigin(0, 0).setDepth(3000);
    const title = this.add
      .text(w / 2, h / 2, "End of Proof of Concept", {
        fontFamily: "monospace",
        fontSize: "32px",
        color: "#fff",
        align: "center",
      })
      .setOrigin(0.5)
      .setDepth(3001)
      .setAlpha(0);
    this.tweens.add({ targets: overlay, fillAlpha: 0.85, duration: 1200 });
    this.tweens.add({ targets: title, alpha: 1, duration: 1200, delay: 400 });
  }
}
