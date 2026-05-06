import Phaser from "phaser";

const W = 1280;
const H = 720;
const PAN = 140;
const PAN_DURATION = 3500;
const ASPHALT_COLOR = 0x102020;

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  create(): void {
    const black = this.add
      .rectangle(0, 0, W, H, 0x000000)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1000);

    const text = this.add
      .bitmapText(W / 2, H / 2, "pixel", "READY?", 64)
      .setOrigin(0.5)
      .setTint(0xffffff)
      .setScrollFactor(0)
      .setDepth(1001);

    const onReady = () => {
      text.setText("OMAR COMIN'!");
      if (this.cache.audio.exists("speech:omar_comin")) {
        this.sound.play("speech:omar_comin", { volume: 0.8 });
      }

      const playMusic = () => {
        if (!this.sound.get("theme")?.isPlaying) {
          this.sound.play("theme", { loop: true, volume: 0.35 });
        }
      };
      if (this.sound.locked) this.sound.once("unlocked", playMusic);
      else playMusic();

      this.time.delayedCall(900, () => {
        const flash = this.add
          .rectangle(0, 0, W, H, 0xffffff)
          .setOrigin(0, 0)
          .setScrollFactor(0)
          .setDepth(2000)
          .setAlpha(0);
        this.tweens.add({
          targets: flash,
          alpha: 1,
          duration: 150,
          onComplete: () => {
            black.destroy();
            text.destroy();
            this.startTitle();
            this.tweens.add({
              targets: flash,
              alpha: 0,
              duration: 500,
              onComplete: () => flash.destroy(),
            });
          },
        });
      });
    };

    this.input.once("pointerdown", onReady);
    this.input.keyboard?.once("keydown", onReady);
  }

  private startTitle(): void {
    const cam = this.cameras.main;
    cam.setBounds(0, 0, W, H + PAN);
    cam.setScroll(0, PAN);

    this.add.image(0, 0, "title_sky").setOrigin(0, 0).setScrollFactor(0, 0);
    this.add.image(0, 0, "title_skyline").setOrigin(0, 0).setScrollFactor(0, 0.35);
    this.add.image(0, -220, "title_buildings").setOrigin(0, 0).setScrollFactor(0, 0.65);
    this.add.rectangle(0, H, W, 300, ASPHALT_COLOR).setOrigin(0, 0).setScrollFactor(0, 1);
    this.add.image(0, 0, "title_road").setOrigin(0, 0).setScrollFactor(0, 1);

    const logo = this.add
      .image(W / 2, 220, "title_logo")
      .setOrigin(0.5)
      .setScale(0.75)
      .setScrollFactor(0)
      .setAlpha(0);

    const tagline = this.add
      .bitmapText(W / 2, 380, "pixel", "A POINT-AND-CLICK INVESTIGATION", 20)
      .setOrigin(0.5)
      .setTint(0xf4e3b8)
      .setScrollFactor(0)
      .setAlpha(0);

    const prompt = this.add
      .bitmapText(W / 2, 660, "pixel", "CLICK OR PRESS ANY KEY", 24)
      .setOrigin(0.5)
      .setTint(0xffffff)
      .setScrollFactor(0)
      .setAlpha(0);

    this.tweens.add({
      targets: cam,
      scrollY: 0,
      duration: PAN_DURATION,
      ease: "Sine.easeOut",
    });

    this.tweens.add({
      targets: [logo, tagline],
      alpha: 1,
      duration: 700,
      delay: PAN_DURATION - 1000,
    });

    this.tweens.add({
      targets: prompt,
      alpha: 1,
      duration: 500,
      delay: PAN_DURATION - 300,
      onComplete: () => {
        this.tweens.add({
          targets: prompt,
          alpha: 0.3,
          duration: 700,
          yoyo: true,
          repeat: -1,
        });
      },
    });

    const start = () => this.scene.start("KitchenScene");
    this.input.once("pointerdown", start);
    this.input.keyboard?.once("keydown", start);
  }
}
