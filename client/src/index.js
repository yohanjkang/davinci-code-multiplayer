import Phaser from "phaser";
import Game from "./scenes/game";
import Lobby from "./scenes/lobby";

const ratio = Math.max(
  window.innerWidth / window.innerHeight,
  window.innerHeight / window.innerWidth
);
const DEFAULT_HEIGHT = 720; // any height you want
const DEFAULT_WIDTH = ratio * DEFAULT_HEIGHT;

const config = {
  type: Phaser.AUTO,
  transparent: true,
  dom: {
    createContainer: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
  },
};

const game = new Phaser.Game(config);
game.scene.add("Game", Game);
game.scene.add("Lobby", Lobby);
game.scene.start("Lobby");
