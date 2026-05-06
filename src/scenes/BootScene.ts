import Phaser from "phaser";
import mcnultyWalkUrl from "../../assets/characters/mcnulty-walk-sheet.png";
import mcnultyIdleUrl from "../../assets/characters/mcnulty-idle-sheet.png";
import bunkWalkUrl from "../../assets/characters/bunk-walk-sheet.png";
import bunkIdleUrl from "../../assets/characters/bunk-idle-sheet.png";
import handymanIdleUrl from "../../assets/characters/handyman-idle-sheet.png";
import kitchenBgUrl from "../../assets/backgrounds/kitchen.png";
import atariPngUrl from "../../assets/fonts/atari-classic.png";
import atariXmlUrl from "../../assets/fonts/atari-classic.xml?url";
import themeUrl from "../../assets/audio/background_music.mp3";
import speechManifest from "../../assets/audio/speech/manifest.json";

const speechUrls = import.meta.glob("../../assets/audio/speech/*.ogg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload(): void {
    this.load.spritesheet("mcnulty_walk", mcnultyWalkUrl, { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("mcnulty_idle", mcnultyIdleUrl, { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("bunk_walk", bunkWalkUrl, { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("bunk_idle", bunkIdleUrl, { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("handyman_idle", handymanIdleUrl, { frameWidth: 256, frameHeight: 256 });
    this.load.image("kitchen_bg", kitchenBgUrl);
    this.load.bitmapFont("pixel", atariPngUrl, atariXmlUrl);
    this.load.audio("theme", themeUrl);

    for (const [lineId, filename] of Object.entries(speechManifest as Record<string, string>)) {
      const url = speechUrls[`../../assets/audio/speech/${filename}`];
      if (url) this.load.audio(`speech:${lineId}`, url);
    }
  }

  create(): void {
    this.anims.create({
      key: "mcnulty-walk",
      frames: this.anims.generateFrameNumbers("mcnulty_walk", { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "mcnulty-idle",
      frames: this.anims.generateFrameNumbers("mcnulty_idle", { start: 0, end: 7 }),
      frameRate: 6,
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
      frames: this.anims.generateFrameNumbers("bunk_idle", { start: 0, end: 7 }),
      frameRate: 6,
      repeat: -1,
    });
    this.anims.create({
      key: "handyman-idle",
      frames: this.anims.generateFrameNumbers("handyman_idle", { start: 0, end: 7 }),
      frameRate: 6,
      repeat: -1,
    });
    this.scene.start("TitleScene");
  }
}
