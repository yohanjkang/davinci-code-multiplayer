import Phaser from "phaser";
import io from "socket.io-client";

export default class Lobby extends Phaser.Scene {
  constructor() {
    super("Lobby");
    this.state = {};
    this.hasBeenSet = false;
    this.playerName = "";

    this.startGame = () => {
      this.playerName = this.playerName.toUpperCase();
      document.querySelector(".lobby-menu").classList.add("hidden");
      this.scene.start("Game", {
        socket: this.socket,
        roomKey: this.roomKey,
        playerName: this.playerName,
      });
      this.scene.stop("Lobby");
    };
  }

  preload() {
    this.load.html("game-html", "../../../index.html");
  }

  create() {
    const scene = this;

    scene.socket = io.connect("https://davinci-code-game.herokuapp.com/");

    // player name
    scene.playerNameInput = document.getElementById("player-name-input");
    scene.playerNameInput.addEventListener("change", (event) => {
      scene.playerName = event.target.value;
    });

    // host button
    scene.hostButton = document.getElementById("host-lobby-button");
    scene.hostButton.addEventListener("click", () => {
      console.log("clicking");
      if (scene.playerName === "") {
        scene.errorMessage.innerText = "Name cannot be empty.";
        return;
      }
      scene.socket.emit("getRoomCode");
    });

    // room code input
    scene.inputElement = document.getElementById("enterRoom-id");
    scene.inputElement.addEventListener("click", (event) => {
      console.log("clicking");

      if (scene.playerName === "") {
        scene.errorMessage.innerText = "Name cannot be empty.";
        return;
      }

      if (event.target.name === "enterRoom") {
        const input = document.getElementById("code-form-id");
        const value = input.value.toUpperCase();
        scene.socket.emit("isKeyValid", value);
      }
    });

    // error message
    scene.errorMessage = document.getElementById("error-message");

    scene.socket.on("roomCreated", (roomKey) => {
      scene.roomKey = roomKey;
      this.startGame();
    });

    scene.socket.on("keyNotValid", () => {
      scene.errorMessage.innerText = "Room does not exist.";
    });

    scene.socket.on("keyIsValid", (input) => {
      scene.socket.emit("joinRoom", input);
      scene.roomKey = input;
      this.startGame();
    });
  }
}
