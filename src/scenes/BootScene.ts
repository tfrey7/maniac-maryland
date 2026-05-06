import Phaser from "phaser";
import mcnultyWalkUrl from "../../assets/characters/mcnulty-walk-sheet.png";
import mcnultyIdleUrl from "../../assets/characters/mcnulty-idle-sheet.png";
import bunkWalkUrl from "../../assets/characters/bunk-walk-sheet.png";
import bunkIdleUrl from "../../assets/characters/bunk-idle-sheet.png";
import handymanUrl from "../../assets/characters/handyman.png";
import kitchenBgUrl from "../../assets/backgrounds/kitchen.png";
import atariPngUrl from "../../assets/fonts/atari-classic.png";
import atariXmlUrl from "../../assets/fonts/atari-classic.xml?url";
import themeUrl from "../../assets/audio/Midnight_at_the_Precinct.mp3";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    this.load.spritesheet("mcnulty_walk", mcnultyWalkUrl, { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("mcnulty_idle", mcnultyIdleUrl, { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("bunk_walk", bunkWalkUrl, { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("bunk_idle", bunkIdleUrl, { frameWidth: 256, frameHeight: 256 });
    this.load.image("handyman_sprite", handymanUrl);
    this.load.image("kitchen_bg", kitchenBgUrl);
    this.load.bitmapFont("pixel", atariPngUrl, atariXmlUrl);
    this.load.audio("theme", themeUrl);
  }

  create(): void {
    this.anims.create({
      key: "mcnulty-walk",
      frames: this.anims.generateFrameNumbers("mcnulty_walk", { start: 0, end: 3 }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "mcnulty-idle",
      frames: this.anims.generateFrameNumbers("mcnulty_idle", { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: "bunk-walk",
      frames: this.anims.generateFrameNumbers("bunk_walk", { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "bunk-idle",
      frames: this.anims.generateFrameNumbers("bunk_idle", { start: 0, end: 3 }),
      frameRate: 4,
      repeat: -1,
    });
    this.scene.start("TitleScene");
  }
}
