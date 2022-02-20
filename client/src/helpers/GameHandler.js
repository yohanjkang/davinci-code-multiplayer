export default class GameHandler {
  constructor(scene) {
    this.gameState = "Initializing";
    this.playerNum = 0;
    this.playerId = "";
    this.isPlayersTurn = false;
    this.playerDeck = [];
    this.scene = scene;

    // opponent
    this.currentGuessingCard = {};

    // UI
    this.waitingText = "";
    this.dropZone = null;
    this.optionsContainer = null;
    this.guessOptions = [];
    this.guessDisplay = null;

    this.changeTurn = (playerNum) => {};

    this.changeGameState = (gameState) => {
      this.gameState = gameState;
      console.log(`GameState: ${this.gameState}`);

      if (gameState === "Waiting") {
        scene.DeckHandler.disablePlayerDeck();
        this.readyButton.classList.add("hidden");
        this.dropZone.setActive(false).setVisible(false);
        this.waitingText.classList.remove("hidden");
      } else if (gameState === "Start") {
        this.roomCode.classList.add("hidden");
        this.waitingText.classList.add("hidden");
      }
    };

    this.setPlayer = (data) => {
      let { deck, playerNum, playerId } = data;
      this.playerDeck = deck;
      this.playerNum = playerNum;
      this.playerId = playerId;
      console.log(this.playerDeck, this.playerNum, this.playerId);
    };

    this.createPreGameState = () => {
      this.createDropZone();

      // ready button
      this.readyButton = document.getElementById("ready-button");
      this.readyButton.classList.remove("hidden");
      this.readyButton.addEventListener("click", () => {
        var newDeck = scene.DeckHandler.getPlayerDeck().map((card) => {
          return { value: card.value, color: card.color };
        });
        scene.socket.emit("playerReady", newDeck, scene.roomKey);

        this.changeGameState("Waiting");
      });

      // waiting state
      this.waitingText = document.getElementById("waiting-text");

      // room code
      this.roomCode = document.getElementById("room-code");
      this.roomCode.classList.remove("hidden");
      document.getElementById("room-code-text").innerText = scene.roomKey;

      // guess options
      this.optionsContainer = document.querySelector(".guess-choices");
      this.guessOptions = document.querySelectorAll(".guess-choice");
      this.guessDisplay = document.querySelector(".choice-display");

      this.guessOptions.forEach((element) => {
        element.addEventListener("click", () => {
          let guess = element.innerHTML;
          this.optionsContainer.classList.add("hidden");
          scene.socket.emit("endingGuess", guess, this.scene.roomKey);
        });
      });
    };

    this.createDropZone = () => {
      this.dropZone = scene.add
        .zone(scene.width / 2, 600, 600, 100)
        .setRectangleDropZone(600, 100);

      //temp
      //   let dropZoneOutline = scene.add.graphics();
      //   dropZoneOutline.lineStyle(4, 0xff69b4);
      //   dropZoneOutline.strokeRect(
      //     dropZone.x - dropZone.input.hitArea.width / 2,
      //     dropZone.y - dropZone.input.hitArea.height / 2,
      //     dropZone.input.hitArea.width,
      //     dropZone.input.hitArea.height
      //   );
      //   dropZone.setData("outline", dropZoneOutline);

      return this.dropZone;
    };

    this.displayPlayerNames = (names) => {
      document.querySelectorAll(".player-name-text").forEach((e) => {
        e.classList.remove("hidden");
      });
      const playerName = document.getElementById("player-this");
      const leftOpponent = document.getElementById("player-left");
      const topOpponent = document.getElementById("player-top");
      const rightOpponent = document.getElementById("player-right");

      playerName.innerText = names[this.playerNum];
      leftOpponent.innerText = names[(this.playerNum + 1) % 4] || "no name";
      topOpponent.innerText = names[(this.playerNum + 2) % 4] || "no name";
      rightOpponent.innerText = names[(this.playerNum + 3) % 4] || "no name";
    };

    this.startGuess = (owner, cardPos) => {
      //   if (scene.GameHandler.isPlayersTurn) {
      // Show options
      this.optionsContainer.classList.remove("hidden");

      // Inform all players current player is guessing
      this.scene.socket.emit(
        "startingGuess",
        owner,
        cardPos,
        this.scene.roomKey
      );
      //   }
    };

    this.createOutline = (card) => {
      this.scene.cardOutline.setVisible(true);
      this.scene.cardOutline.x = card.x;
      this.scene.cardOutline.y = card.y;

      this.scene.cardOutline.setAngle(
        this.playerNum % 2 === card.owner % 2 || card.owner === "player"
          ? 0
          : 90
      );
    };

    this.displayGuess = (guess) => {
      // display guess to players
      this.guessDisplay.classList.remove("hidden");
      this.guessDisplay.innerHTML = guess;
      setTimeout(() => {
        this.guessDisplay.classList.add("hidden");
        this.scene.cardOutline.setVisible(false);
      }, 1500);
    };

    this.displayCorrectValue = (correctValue) => {
      this.currentGuessingCard.updateValue(correctValue);
      this.currentGuessingCard = {};
    };

    // this player has lost
    this.playerHasLost = () => {
      this.changeGameState("Lost");
      scene.DeckHandler.disableOpponentDeckInteractable();
      scene.DeckHandler.disablePlayerDeckLost();
    };

    // a player has lost
    this.opponentHasLost = (playerNum) => {
      scene.DeckHandler.disableOpponentDeckLost(playerNum);
    };

    this.createPreGameState();
  }
}
