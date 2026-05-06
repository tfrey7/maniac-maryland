import Phaser from "phaser";
import { Point, Polygon, arrayToPoints, pointInPolygon } from "./Polygon";

export interface HotspotDef {
  id: string;
  label: string;
  polygon: number[][];
  approach: Point;
  pickup?: boolean;
  worldSprite?: { texture: string; x: number; y: number; scale?: number; hidden?: boolean };
}

export interface Hotspot {
  id: string;
  label: string;
  polygon: Polygon;
  approach: Point;
  visible: boolean;
  marker: Phaser.GameObjects.Rectangle;
  outline: Phaser.GameObjects.Polygon;
  worldSprite?: Phaser.GameObjects.Image;
}

export class HotspotManager {
  private hotspots: Hotspot[] = [];
  private hoveredId: string | null = null;
  private outlineEnabled = false;

  constructor(scene: Phaser.Scene, defs: HotspotDef[]) {
    for (const def of defs) {
      const poly = arrayToPoints(def.polygon);
      const xs = poly.map((p) => p.x);
      const ys = poly.map((p) => p.y);
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
      const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
      const w = Math.max(...xs) - Math.min(...xs);
      const h = Math.max(...ys) - Math.min(...ys);
      const marker = scene.add
        .rectangle(cx, cy, w, h, 0xffaa00, 0.0)
        .setStrokeStyle(1, 0xffaa00, 0.0);
      const outline = scene.add.polygon(0, 0, def.polygon, 0xffaa00, 0.15);
      outline.setOrigin(0, 0);
      outline.setStrokeStyle(2, 0xffaa00, 0.6);
      outline.setVisible(false);
      let worldSprite: Phaser.GameObjects.Image | undefined;
      if (def.worldSprite) {
        worldSprite = scene.add
          .image(def.worldSprite.x, def.worldSprite.y, def.worldSprite.texture)
          .setScale(def.worldSprite.scale ?? 1)
          .setDepth(def.worldSprite.y)
          .setVisible(!def.worldSprite.hidden);
      }
      this.hotspots.push({
        id: def.id,
        label: def.label,
        polygon: poly,
        approach: def.approach,
        visible: true,
        marker,
        outline,
        worldSprite,
      });
    }
  }

  setOutlineEnabled(enabled: boolean): void {
    this.outlineEnabled = enabled;
    for (const h of this.hotspots) {
      h.outline.setVisible(enabled && h.visible);
    }
  }

  hitTest(p: Point): Hotspot | null {
    for (const h of this.hotspots) {
      if (h.visible && pointInPolygon(p, h.polygon)) return h;
    }
    return null;
  }

  updateHover(p: Point): Hotspot | null {
    const hit = this.hitTest(p);
    const newId = hit?.id ?? null;
    if (newId !== this.hoveredId) {
      this.hoveredId = newId;
      for (const h of this.hotspots) {
        const isHover = h.id === newId && h.visible;
        h.outline.setVisible(this.outlineEnabled ? h.visible : isHover);
        h.outline.setFillStyle(0xffaa00, isHover ? 0.25 : 0.1);
      }
    }
    return hit;
  }

  showWorldSprite(id: string): void {
    const h = this.hotspots.find((x) => x.id === id);
    h?.worldSprite?.setVisible(true);
  }

  swapWorldSpriteTexture(id: string, textureKey: string): void {
    const h = this.hotspots.find((x) => x.id === id);
    h?.worldSprite?.setTexture(textureKey);
  }

  hide(id: string): void {
    const h = this.hotspots.find((x) => x.id === id);
    if (!h) return;
    h.visible = false;
    h.outline.setVisible(false);
    h.marker.setVisible(false);
    h.worldSprite?.setVisible(false);
  }

  centroidOf(id: string): Point | null {
    const h = this.hotspots.find((x) => x.id === id);
    if (!h || !h.visible) return null;
    return { x: h.marker.x, y: h.marker.y };
  }
}
