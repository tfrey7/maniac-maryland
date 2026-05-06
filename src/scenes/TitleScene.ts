import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#1a1410");

    this.add
      .bitmapText(640, 280, "pixel", "MANIAC MARYLAND", 64)
      .setOrigin(0.5)
      .setTint(0xf4e3b8);

    this.add
      .bitmapText(640, 380, "pixel", "A POINT-AND-CLICK INVESTIGATION", 20)
      .setOrigin(0.5)
      .setTint(0xa89a82);

    const prompt = this.add
      .bitmapText(640, 540, "pixel", "CLICK OR PRESS ANY KEY", 24)
      .setOrigin(0.5)
      .setTint(0xffffff);

    this.tweens.add({
      targets: prompt,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
    });

    const start = () => this.scene.start("KitchenScene");
    this.input.once("pointerdown", start);
    this.input.keyboard?.once("keydown", start);
  }
}
