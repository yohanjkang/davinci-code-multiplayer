import Phaser from "phaser";
import SocketHandler from "../helpers/SocketHandler";
import GameHandler from "../helpers/GameHandler";
import DeckHandler from "../helpers/DeckHandler";
import InteractivityHandler from "../helpers/InteractivityHandler";

export default class Game extends Phaser.Scene {
  constructor() {
    super({ key: "Game" });

    this.width = 0;
    this.height = 0;
  }

  init(data) {
    console.log(data);
    this.socket = data.socket;
    this.roomKey = data.roomKey;
    this.playerName = data.playerName;
  }

  preload() {
    this.load.html("game-html", "../../../index.html");

    let { width, height } = this.sys.game.canvas;
    this.width = width;
    this.height = height;

    console.log(width, height);

    this.load.image("card-black", "../../src/assets/card-black.png");
    this.load.image("card-white", "../../src/assets/card-white.png");
    this.load.image(
      "card-white-faded",
      "../../src/assets/card-white-faded.png"
    );
    this.load.image(
      "card-black-faded",
      "../../src/assets/card-black-faded.png"
    );
    this.load.image("background-gray", "../../src/assets/background-gray.png");
    this.load.image("background", "../../src/assets/main-background-2.png");
    this.load.image("card-outline", "../../src/assets/card-outline.png");

    this.load.audio("theme", "../../src/assets/audio/raindrop-flower.mp3");
  }

  create() {
    // // music
    // this.song = this.sound.add("theme", { volume: 0.5 });
    // this.song.loop = true;
    // this.song.play();

    this.cardOutline = this.add.image(0, 0, "card-outline").setVisible(false);
    this.cardOutline.setScale(0.5);

    this.SocketHandler = new SocketHandler(this);
    this.GameHandler = new GameHandler(this);
    this.DeckHandler = new DeckHandler(this);
    this.InteractivityHandler = new InteractivityHandler(this);

    this.socket.emit("createPlayer", this.roomKey, this.playerName);
  }

  update() {}
}
