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
    this.currentGuessingPlayer = {};

    // UI
    this.waitingText = "";
    this.dropZone = null;
    this.optionsContainer = null;
    this.guessOptions = [];
    this.guessDisplay = null;

    this.changeTurn = (playerNum) => {
      this.isPlayersTurn = this.playerNum === playerNum;

      if (Object.keys(this.currentGuessingPlayer).length !== 0) {
        this.currentGuessingPlayer.playerText.classList.remove(
          "this-player-chosen"
        );
      }

      if (this.playerName.playerNum === playerNum) {
        this.playerName.playerText.classList.add("this-player-chosen");
        this.currentGuessingPlayer = this.playerName;
      } else if (this.leftOpponent.playerNum === playerNum) {
        this.leftOpponent.playerText.classList.add("this-player-chosen");
        this.currentGuessingPlayer = this.leftOpponent;
      } else if (this.topOpponent.playerNum === playerNum) {
        this.topOpponent.playerText.classList.add("this-player-chosen");
        this.currentGuessingPlayer = this.topOpponent;
      } else if (this.rightOpponent.playerNum === playerNum) {
        this.rightOpponent.playerText.classList.add("this-player-chosen");
        this.currentGuessingPlayer = this.rightOpponent;
      }
    };

    this.changeGameState = (gameState, currentPlayerTurn) => {
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
        this.changeTurn(currentPlayerTurn);
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
      this.optionsContainer = document.getElementById(
        "guess-choices-container"
      );
      this.guessOptions = document.querySelectorAll(".guess-choice");
      this.guessDisplay = document.querySelector(".choice-display");
      this.xButton = document.getElementById("x-button");

      this.guessOptions.forEach((element) => {
        element.addEventListener("click", () => {
          let guess = element.innerHTML;
          this.optionsContainer.style.display = "none";
          scene.socket.emit("endingGuess", guess, this.scene.roomKey);
        });
      });

      this.xButton.addEventListener("click", () => {
        this.optionsContainer.style.display = "none";
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
      this.playerNames = names;

      document.querySelectorAll(".player-name-text").forEach((e) => {
        e.classList.remove("hidden");
      });

      this.playerName = {
        playerText: document.getElementById("player-this"),
        playerNum: this.playerNum,
      };
      this.leftOpponent = {
        playerText: document.getElementById("player-left"),
        playerNum: (this.playerNum + 1) % 4,
      };
      this.topOpponent = {
        playerText: document.getElementById("player-top"),
        playerNum: (this.playerNum + 2) % 4,
      };
      this.rightOpponent = {
        playerText: document.getElementById("player-right"),
        playerNum: (this.playerNum + 3) % 4,
      };

      this.playerName.playerText.innerText = names[this.playerNum];
      this.leftOpponent.playerText.innerText =
        names[(this.playerNum + 1) % 4] || "no name";
      this.topOpponent.playerText.innerText =
        names[(this.playerNum + 2) % 4] || "no name";
      this.rightOpponent.playerText.innerText =
        names[(this.playerNum + 3) % 4] || "no name";
    };

    this.startGuess = (owner, cardPos) => {
      if (!scene.GameHandler.isPlayersTurn) return;

      // Show options
      this.optionsContainer.classList.remove("hidden");
      this.optionsContainer.style.display = "flex";

      // Inform all players current player is guessing
      this.scene.socket.emit(
        "startingGuess",
        owner,
        cardPos,
        this.scene.roomKey
      );
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
      this.currentGuessingCard.removeInteractive();
      this.currentGuessingCard = {};
    };

    // this player has lost
    this.playerHasLost = () => {
      this.changeGameState("Lost");
      scene.DeckHandler.disableOpponentDeckInteractable();
      scene.DeckHandler.disablePlayerDeckLost();
    };

    this.gameEndLoss = (winningPlayer) => {
      let display = document.getElementById("end-game-display");
      display.classList.remove("hidden");
      document.getElementById(
        "end-game-text"
      ).innerText = `${this.playerNames[winningPlayer]} Wins!`;
    };

    this.gameEndWin = () => {
      let display = document.getElementById("end-game-display");
      display.classList.remove("hidden");
      document.getElementById("end-game-text").innerText = "You Win!";
    };

    // a player has lost
    this.opponentHasLost = (playerNum) => {
      // fade out opponent cards
      scene.DeckHandler.disableOpponentDeckLost(playerNum);

      // fade out opponent name
      if (this.leftOpponent.playerNum === playerNum) {
        this.leftOpponent.playerText.classList.add("lost");
      } else if (this.topOpponent.playerNum === playerNum) {
        this.topOpponent.playerText.classList.add("lost");
      } else if (this.rightOpponent.playerNum === playerNum) {
        this.rightOpponent.playerText.classList.add("lost");
      }
    };

    this.createPreGameState();
  }
}
