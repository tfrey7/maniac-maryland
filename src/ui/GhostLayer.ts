import Phaser from "phaser";
import { ItemId } from "../systems/GameState";
import { HotspotManager } from "../systems/HotspotManager";
import { hotspotsForItem } from "../systems/InteractionResolver";

const RING_RADIUS = 22;
const RING_COLOR = 0xffeb6b;

interface Marker {
  graphic: Phaser.GameObjects.Arc;
  tween: Phaser.Tweens.Tween;
}

export class GhostLayer {
  private scene: Phaser.Scene;
  private hotspots: HotspotManager;
  private markers: Marker[] = [];

  constructor(scene: Phaser.Scene, hotspots: HotspotManager) {
    this.scene = scene;
    this.hotspots = hotspots;
  }

  setActiveItem(item: ItemId | null): void {
    this.clear();
    if (!item) return;
    for (const hotspotId of hotspotsForItem(item)) {
      const c = this.hotspots.centroidOf(hotspotId);
      if (!c) continue;
      const ring = this.scene.add
        .circle(c.x, c.y, RING_RADIUS, RING_COLOR, 0)
        .setStrokeStyle(3, RING_COLOR, 0.85)
        .setDepth(800);
      const tween = this.scene.tweens.add({
        targets: ring,
        scale: { from: 0.85, to: 1.15 },
        alpha: { from: 0.6, to: 1 },
        duration: 700,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.markers.push({ graphic: ring, tween });
    }
  }

  private clear(): void {
    for (const m of this.markers) {
      m.tween.stop();
      m.graphic.destroy();
    }
    this.markers = [];
  }
}
