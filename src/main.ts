import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { KitchenScene } from "./scenes/KitchenScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#000000",
  width: 1280,
  height: 720,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, KitchenScene],
};

new Phaser.Game(config);
