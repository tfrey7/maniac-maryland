import Phaser from "phaser";
import mcnultyUrl from "../../assets/characters/mcnulty.png";
import bunkUrl from "../../assets/characters/bunk.png";
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
    this.load.image("mcnulty_sprite", mcnultyUrl);
    this.load.image("bunk_sprite", bunkUrl);
    this.load.image("handyman_sprite", handymanUrl);
    this.load.image("kitchen_bg", kitchenBgUrl);
    this.load.bitmapFont("pixel", atariPngUrl, atariXmlUrl);
    this.load.audio("theme", themeUrl);
  }

  create(): void {
    this.scene.start("TitleScene");
  }
}
