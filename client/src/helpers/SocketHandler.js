export default class SocketHandler {
  constructor(scene) {
    scene.socket.on("createNewPlayer", (player) => {
      scene.GameHandler.setPlayer(player);

      scene.DeckHandler.createPlayerDeck(player.deck);
    });

    scene.socket.on(
      "startGame",
      (decks, remaining, playerNames, currentPlayerTurn) => {
        scene.GameHandler.displayPlayerNames(playerNames);
        scene.GameHandler.changeGameState("Start", currentPlayerTurn);

        // set opponent and remaining cards
        scene.DeckHandler.createOpponentDecks(decks);
        scene.DeckHandler.createRemainingCards(remaining);
      }
    );

    // change turn to next player
    scene.socket.on("nextTurn", (playerNum) => {
      scene.GameHandler.changeTurn(playerNum);
    });

    // another player is guessing
    // create an outline on the card that's being guessed
    scene.socket.on("createOutline", (playerNum, cardPos) => {
      let opponentCard = scene.DeckHandler.getOpponentCard(playerNum, cardPos);
      scene.GameHandler.createOutline(opponentCard);
      scene.GameHandler.currentGuessingCard = opponentCard;
    });

    // another player guessed a card
    // display the guess
    scene.socket.on("displayGuess", (guess) => {
      scene.GameHandler.displayGuess(guess);
    });

    // player made a correct guess
    scene.socket.on("correctGuess", (correctValue) => {
      console.log("Correct guess");
      scene.GameHandler.displayCorrectValue(correctValue);
    });

    // player made an incorrect guess
    scene.socket.on("incorrectGuess", () => {
      console.log("Incorrect guess");
    });

    // a player has lost
    scene.socket.on("playerLost", (playerNum) => {
      if (playerNum === scene.GameHandler.playerNum) {
        scene.GameHandler.playerHasLost();
      } else {
        scene.GameHandler.opponentHasLost(playerNum);
      }
    });

    // game has ended
    // this player has lost
    scene.socket.on("playerLoss", (winningPlayer) => {
      scene.GameHandler.gameEndLoss(winningPlayer);
    });

    //game has ended
    // this player has won
    scene.socket.on("playerWin", () => {
      scene.GameHandler.gameEndWin();
    });

    scene.socket.on("disconnected", (data) => {
      const { playerId, numPlayers } = data;
    });
  }
}
