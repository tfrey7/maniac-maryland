import Phaser from "phaser";
import mcnultyUrl from "../../assets/characters/mcnulty.png";
import bunkUrl from "../../assets/characters/bunk.png";
import handymanUrl from "../../assets/characters/handyman.png";
import atariPngUrl from "../../assets/fonts/atari-classic.png";
import atariXmlUrl from "../../assets/fonts/atari-classic.xml?url";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    this.load.image("mcnulty_sprite", mcnultyUrl);
    this.load.image("bunk_sprite", bunkUrl);
    this.load.image("handyman_sprite", handymanUrl);
    this.load.bitmapFont("pixel", atariPngUrl, atariXmlUrl);
    const g = this.add.graphics();
    g.fillStyle(0x2a2622, 1);
    g.fillRect(0, 0, 1280, 720);
    g.fillStyle(0x3a322c, 1);
    g.fillRect(0, 480, 1280, 240);
    g.fillStyle(0x5a4a3e, 1);
    g.fillRect(120, 220, 200, 320);
    g.fillStyle(0x88aabb, 1);
    g.fillRect(820, 80, 320, 240);
    g.lineStyle(4, 0xffffff, 0.6);
    g.strokeRect(820, 80, 320, 240);
    g.lineBetween(820, 80, 1140, 320);
    g.lineBetween(820, 320, 1140, 80);
    g.fillStyle(0x6b5a4a, 1);
    g.fillRect(400, 360, 380, 120);
    g.fillStyle(0xddc8a8, 1);
    g.fillRect(420, 100, 300, 180);
    g.lineStyle(2, 0x000000, 0.7);
    for (let i = 0; i < 4; i++) {
      g.strokeRect(440 + (i % 2) * 140, 120 + Math.floor(i / 2) * 80, 120, 60);
    }
    g.generateTexture("kitchen_placeholder", 1280, 720);
    g.destroy();
  }

  create(): void {
    this.scene.start("KitchenScene");
  }
}
