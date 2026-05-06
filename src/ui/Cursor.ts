import Phaser from "phaser";

export type Verb = "walk" | "look" | "use" | "useItem";

export class Cursor {
  private text: Phaser.GameObjects.Text;
  private verb: Verb = "walk";
  private label = "";

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

  setVerb(verb: Verb, label = ""): void {
    this.verb = verb;
    this.label = label;
    this.refresh();
  }

  private refresh(): void {
    if (this.verb === "walk") {
      this.text.setText("");
      return;
    }
    const verbWord = this.verb === "look" ? "Look at" : "Use";
    this.text.setText(this.label ? `${verbWord} ${this.label}` : verbWord);
  }
}
