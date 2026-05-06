import Phaser from "phaser";
import { Character } from "../entities/Character";

export class SpeechBubble {
  private text: Phaser.GameObjects.Text;
  private bg: Phaser.GameObjects.Rectangle;
  private container: Phaser.GameObjects.Container;
  private follow: Character | null = null;

  constructor(scene: Phaser.Scene) {
    this.bg = scene.add.rectangle(0, 0, 200, 32, 0x000000, 0.85);
    this.bg.setStrokeStyle(2, 0xffffff);
    this.text = scene.add
      .text(0, 0, "", {
        fontFamily: "monospace",
        fontSize: "18px",
        color: "#fff",
        align: "center",
        wordWrap: { width: 360 },
      })
      .setOrigin(0.5, 0.5);
    this.container = scene.add.container(0, 0, [this.bg, this.text]);
    this.container.setDepth(1000).setVisible(false);
  }

  show(speaker: Character, line: string): void {
    this.follow = speaker;
    this.text.setText(line);
    const w = Math.max(140, this.text.width + 24);
    const h = this.text.height + 16;
    this.bg.setSize(w, h);
    this.container.setVisible(true);
    this.reposition();
  }

  hide(): void {
    this.container.setVisible(false);
    this.follow = null;
  }

  update(): void {
    if (this.follow) this.reposition();
  }

  private reposition(): void {
    if (!this.follow) return;
    this.container.setPosition(this.follow.x, this.follow.y - 110);
  }
}
