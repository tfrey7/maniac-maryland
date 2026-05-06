import Phaser from "phaser";
import { Point } from "../systems/Polygon";

export type CharacterId = "mcnulty" | "bunk" | "handyman";

export interface CharacterConfig {
  id: CharacterId;
  speed: number;
  texture?: string;
  walkAnimKey?: string;
  idleAnimKey?: string;
  scale?: number;
  color?: number;
}

type CharacterSprite =
  | Phaser.GameObjects.Sprite
  | Phaser.GameObjects.Image
  | Phaser.GameObjects.Rectangle;

export class Character {
  readonly id: CharacterId;
  readonly sprite: CharacterSprite;
  private speed: number;
  private target: Point | null = null;
  private onArrive: (() => void) | null = null;
  private walkAnimKey: string | null = null;
  private idleAnimKey: string | null = null;
  private idleTimer: Phaser.Time.TimerEvent | null = null;
  private idlePhaseMs = Math.floor(Math.random() * 1500);

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: CharacterConfig) {
    this.id = cfg.id;
    this.speed = cfg.speed;
    if (cfg.texture && (cfg.walkAnimKey || cfg.idleAnimKey)) {
      const spr = scene.add.sprite(x, y, cfg.texture, 0).setOrigin(0.5, 1);
      spr.setScale(cfg.scale ?? 1);
      spr.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      this.sprite = spr;
      this.walkAnimKey = cfg.walkAnimKey ?? null;
      this.idleAnimKey = cfg.idleAnimKey ?? null;
      if (this.idleAnimKey) this.enterIdle();
    } else if (cfg.texture) {
      const img = scene.add.image(x, y, cfg.texture).setOrigin(0.5, 1);
      img.setScale(cfg.scale ?? 1);
      img.texture.setFilter(Phaser.Textures.FilterMode.NEAREST);
      this.sprite = img;
    } else {
      this.sprite = scene.add
        .rectangle(x, y, 36, 80, cfg.color ?? 0x888888)
        .setOrigin(0.5, 1)
        .setStrokeStyle(2, 0x000000);
    }
  }

  get x(): number {
    return this.sprite.x;
  }

  get y(): number {
    return this.sprite.y;
  }

  position(): Point {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  walkTo(target: Point, onArrive?: () => void): void {
    this.target = target;
    this.onArrive = onArrive ?? null;
    this.cancelIdle();
    if (this.walkAnimKey && this.sprite instanceof Phaser.GameObjects.Sprite) {
      this.sprite.play(this.walkAnimKey, true);
    }
  }

  stop(): void {
    this.target = null;
    this.onArrive = null;
    this.stopWalkAnim();
  }

  private stopWalkAnim(): void {
    if (!(this.sprite instanceof Phaser.GameObjects.Sprite)) return;
    if (this.idleAnimKey) {
      this.enterIdle();
    } else if (this.walkAnimKey) {
      this.sprite.stop();
      this.sprite.setFrame(0);
    }
  }

  private enterIdle(): void {
    if (!(this.sprite instanceof Phaser.GameObjects.Sprite) || !this.idleAnimKey) return;
    this.cancelIdle();
    this.sprite.play(this.idleAnimKey);
    this.sprite.anims.pause();
    this.scheduleIdleTwitch();
  }

  private scheduleIdleTwitch(): void {
    if (!(this.sprite instanceof Phaser.GameObjects.Sprite) || !this.idleAnimKey) return;
    const sprite = this.sprite;
    const idleKey = this.idleAnimKey;
    const delayMs = 1500 + this.idlePhaseMs + Math.random() * 3000;
    this.idleTimer = sprite.scene.time.delayedCall(delayMs, () => {
      this.idleTimer = null;
      if (this.target) return;
      sprite.play({ key: idleKey, repeat: 0 });
      sprite.once("animationcomplete-" + idleKey, () => {
        if (this.target) return;
        this.enterIdle();
      });
    });
  }

  private cancelIdle(): void {
    if (this.idleTimer) {
      this.idleTimer.remove(false);
      this.idleTimer = null;
    }
    if (this.idleAnimKey && this.sprite instanceof Phaser.GameObjects.Sprite) {
      this.sprite.off("animationcomplete-" + this.idleAnimKey);
    }
  }

  isMoving(): boolean {
    return this.target !== null;
  }

  update(_time: number, deltaMs: number): void {
    if (!this.target) return;
    const dx = this.target.x - this.sprite.x;
    const dy = this.target.y - this.sprite.y;
    const dist = Math.hypot(dx, dy);
    const step = (this.speed * deltaMs) / 1000;
    if (this.sprite instanceof Phaser.GameObjects.Sprite && Math.abs(dx) > 0.5) {
      this.sprite.setFlipX(dx < 0);
    }
    if (dist <= step) {
      this.sprite.setPosition(this.target.x, this.target.y);
      const cb = this.onArrive;
      this.target = null;
      this.onArrive = null;
      this.stopWalkAnim();
      if (cb) cb();
    } else {
      this.sprite.setPosition(
        this.sprite.x + (dx / dist) * step,
        this.sprite.y + (dy / dist) * step,
      );
    }
  }
}
