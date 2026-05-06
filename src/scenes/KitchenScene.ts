import Phaser from "phaser";
import { Character } from "../entities/Character";
import { GameState, ItemId } from "../systems/GameState";
import { DialogueManager } from "../systems/DialogueManager";
import { HotspotManager, HotspotDef, Hotspot } from "../systems/HotspotManager";
import { resolve, SOLVE_CONDITION } from "../systems/InteractionResolver";
import { Polygon, Point, arrayToPoints, clampToPolygon } from "../systems/Polygon";
import { Cursor } from "../ui/Cursor";
import { GhostLayer } from "../ui/GhostLayer";
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
  private ghosts!: GhostLayer;
  private walkable!: Polygon;
  private bunkRetargetTimer = 0;
  private solved = false;
  private intro = true;

  constructor() {
    super({ key: "KitchenScene" });
  }

  create(): void {
    this.add.image(0, 0, "kitchen_bg").setOrigin(0, 0);
    this.walkable = arrayToPoints(sceneData.walkable);
    this.drawWalkableHint();
    if (!this.sound.get("theme")?.isPlaying) {
      this.sound.play("theme", { loop: true, volume: 0.35 });
    }

    this.state = new GameState();

    this.mcnulty = new Character(this, sceneData.spawn.mcnulty.x, sceneData.spawn.mcnulty.y, {
      id: "mcnulty",
      texture: "mcnulty_walk",
      walkAnimKey: "mcnulty-walk",
      idleAnimKey: "mcnulty-idle",
      scale: 1.68,
      speed: 220,
    });
    this.bunk = new Character(this, sceneData.spawn.bunk.x, sceneData.spawn.bunk.y, {
      id: "bunk",
      texture: "bunk_walk",
      walkAnimKey: "bunk-walk",
      idleAnimKey: "bunk-idle",
      scale: 1.68,
      speed: 200,
    });
    this.handyman = new Character(this, sceneData.spawn.handyman.x, sceneData.spawn.handyman.y, {
      id: "handyman",
      texture: "handyman_idle",
      idleAnimKey: "handyman-idle",
      scale: 1.728,
      speed: 0,
    });

    this.hotspots = new HotspotManager(this, sceneData.hotspots as HotspotDef[]);
    this.dialogue = new DialogueManager(this, [this.mcnulty, this.bunk, this.handyman]);
    this.cursor = new Cursor(this);
    this.inventoryBar = new InventoryBar(this, (item) => this.onInventoryClick(item));
    this.ghosts = new GhostLayer(this, this.hotspots);

    this.giveItem("duffel_bag");

    this.input.mouse?.disableContextMenu();
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => this.onPointerMove(p));
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => this.onPointerDown(p));

    this.add
      .text(16, 12, "Click anything to interact. Pick up items into your inventory, then click an item to ready it — glowing markers show where it goes.", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#ddd",
        backgroundColor: "#000000aa",
        padding: { x: 6, y: 3 },
      })
      .setDepth(2000);

    this.playIntro();
  }

  private playIntro(): void {
    const path = sceneData.intro;
    this.walkPath(this.bunk, path.bunk);
    this.walkPath(this.mcnulty, path.mcnulty, () => {
      this.dialogue.speakLine(path.lineId, () => {
        this.intro = false;
      });
    });
  }

  private walkPath(character: Character, waypoints: Point[], onComplete?: () => void): void {
    const step = (i: number): void => {
      if (i >= waypoints.length) {
        onComplete?.();
        return;
      }
      character.walkTo(waypoints[i], () => step(i + 1));
    };
    step(0);
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
    this.cursor.setLabel(hit ? hit.label : "");
  }

  private onPointerDown(p: Phaser.Input.Pointer): void {
    if (this.solved || this.intro) return;
    if (p.y > this.scale.height - 80) return;
    const point = { x: p.worldX, y: p.worldY };
    const hit = this.hotspots.hitTest(point);

    if (hit) {
      this.handleHotspotClick(hit);
    } else {
      const dest = clampToPolygon(point, this.walkable);
      this.mcnulty.walkTo(dest);
      this.clearActiveItem();
    }
  }

  private handleHotspotClick(hot: Hotspot): void {
    const dest = clampToPolygon(hot.approach, this.walkable);
    this.mcnulty.walkTo(dest, () => this.runInteraction(hot));
  }

  private runInteraction(hot: Hotspot): void {
    const result = resolve(hot.id, this.state);
    if (!result) {
      this.clearActiveItem();
      return;
    }

    const applyEffects = (): void => {
      if (result.setFlag) this.state.setFlag(result.setFlag);
      if (result.giveItem) this.giveItem(result.giveItem);
      if (result.removeItem) this.removeItem(result.removeItem);
      if (result.showWorldSprite) this.hotspots.showWorldSprite(hot.id);
      if (result.removeHotspot) this.hotspots.hide(hot.id);
      this.clearActiveItem();
    };
    if (result.lineId) {
      this.dialogue.speakLine(result.lineId, applyEffects);
    } else {
      applyEffects();
    }
  }

  private onInventoryClick(item: ItemId): void {
    if (this.state.activeItem === item) {
      this.clearActiveItem();
      return;
    }
    this.state.activeItem = item;
    this.inventoryBar.setSelected(item);
    this.ghosts.setActiveItem(item);
  }

  private giveItem(item: ItemId): void {
    this.state.addItem(item);
    this.inventoryBar.setItems(this.state.items());
  }

  private removeItem(item: ItemId): void {
    this.state.removeItem(item);
    this.inventoryBar.setItems(this.state.items());
  }

  private clearActiveItem(): void {
    this.state.activeItem = null;
    this.inventoryBar.setSelected(null);
    this.ghosts.setActiveItem(null);
  }

  private updateBunkFollow(deltaMs: number): void {
    if (this.intro) return;
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
    if (SOLVE_CONDITION.length === 0) return;
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
