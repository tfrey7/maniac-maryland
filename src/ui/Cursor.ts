import Phaser from "phaser";

export class Cursor {
  private text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(0, 0, "", {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#ffeb6b",
        backgroundColor: "#000000aa",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0, 1)
      .setDepth(2000);
    scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      this.text.setPosition(p.worldX + 14, p.worldY - 4);
    });
  }

  setLabel(label: string): void {
    this.text.setText(label);
  }
}
