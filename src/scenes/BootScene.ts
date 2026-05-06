import Phaser from "phaser";
import mcnultyWalkUrl from "../../assets/characters/mcnulty-walk-sheet.png";
import mcnultyIdleUrl from "../../assets/characters/mcnulty-idle-sheet.png";
import mcnultyTapeMeasureUrl from "../../assets/characters/mcnulty-tape-measure-sheet.png";
import bunkWalkUrl from "../../assets/characters/bunk-walk-sheet.png";
import bunkIdleUrl from "../../assets/characters/bunk-idle-sheet.png";
import handymanIdleUrl from "../../assets/characters/handyman-idle-sheet.png";
import kitchenBgUrl from "../../assets/backgrounds/kitchen.png";
import titleSkyUrl from "../../assets/backgrounds/title-sky.png";
import titleSkylineUrl from "../../assets/backgrounds/title-skyline.png";
import titleBuildingsUrl from "../../assets/backgrounds/title-buildings.png";
import titleRoadUrl from "../../assets/backgrounds/title-road.png";
import titleLogoUrl from "../../assets/ui/title-logo.png";
import duffelBagIconUrl from "../../assets/items/duffel_bag.png";
import duffelBagWorldUrl from "../../assets/items/duffel_bag-world.png";
import duffelBagOpenWorldUrl from "../../assets/items/duffel_bag_open-world.png";
import duffelBagOpenEmptyWorldUrl from "../../assets/items/duffel_bag_open_empty-world.png";
import tapeMeasureIconUrl from "../../assets/items/tape_measure.png";
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
    this.load.spritesheet("mcnulty_walk", mcnultyWalkUrl, { frameWidth: 180, frameHeight: 180 });
    this.load.spritesheet("mcnulty_idle", mcnultyIdleUrl, { frameWidth: 180, frameHeight: 180 });
    this.load.spritesheet("mcnulty_tape_measure", mcnultyTapeMeasureUrl, { frameWidth: 180, frameHeight: 180 });
    this.load.spritesheet("bunk_walk", bunkWalkUrl, { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("bunk_idle", bunkIdleUrl, { frameWidth: 256, frameHeight: 256 });
    this.load.spritesheet("handyman_idle", handymanIdleUrl, { frameWidth: 256, frameHeight: 256 });
    this.load.image("kitchen_bg", kitchenBgUrl);
    this.load.image("title_sky", titleSkyUrl);
    this.load.image("title_skyline", titleSkylineUrl);
    this.load.image("title_buildings", titleBuildingsUrl);
    this.load.image("title_road", titleRoadUrl);
    this.load.image("title_logo", titleLogoUrl);
    this.load.image("item:duffel_bag", duffelBagIconUrl);
    this.load.image("item:duffel_bag_world", duffelBagWorldUrl);
    this.load.image("item:duffel_bag_open_world", duffelBagOpenWorldUrl);
    this.load.image("item:duffel_bag_open_empty_world", duffelBagOpenEmptyWorldUrl);
    this.load.image("item:tape_measure", tapeMeasureIconUrl);
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
      key: "mcnulty-tape-measure",
      frames: this.anims.generateFrameNumbers("mcnulty_tape_measure", { start: 0, end: 3 }),
      frameRate: 6,
      repeat: 0,
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
