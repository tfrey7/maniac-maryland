import Phaser from "phaser";
import { Point } from "../systems/Polygon";

export type CharacterId = "mcnulty" | "bunk" | "handyman";

export interface CharacterConfig {
  id: CharacterId;
  speed: number;
  texture?: string;
  scale?: number;
  color?: number;
}

type CharacterSprite = Phaser.GameObjects.Image | Phaser.GameObjects.Rectangle;

export class Character {
  readonly id: CharacterId;
  readonly sprite: CharacterSprite;
  private speed: number;
  private target: Point | null = null;
  private onArrive: (() => void) | null = null;

  constructor(scene: Phaser.Scene, x: number, y: number, cfg: CharacterConfig) {
    this.id = cfg.id;
    this.speed = cfg.speed;
    if (cfg.texture) {
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
  }

  stop(): void {
    this.target = null;
    this.onArrive = null;
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
    if (dist <= step) {
      this.sprite.setPosition(this.target.x, this.target.y);
      const cb = this.onArrive;
      this.target = null;
      this.onArrive = null;
      if (cb) cb();
    } else {
      this.sprite.setPosition(
        this.sprite.x + (dx / dist) * step,
        this.sprite.y + (dy / dist) * step,
      );
    }
  }
}
