import Card from "./Card";

export default class DeckHandler {
  constructor(scene) {
    this.playerDeck = [];
    this.playerDeckPositions = [];
    this.opponent1Deck = [];
    this.opponent2Deck = [];
    this.opponent3Deck = [];
    this.playerXInit = scene.width / 2 - 250;
    this.playerYInit = 575;
    this.cardGap = 100;

    this.createPlayerDeck = (deck) => {
      for (let i = 0; i < deck.length; i++) {
        let card = new Card({
          scene: scene,
          x: this.playerXInit + i * this.cardGap,
          y: this.playerYInit,
          color: deck[i].color,
          value: deck[i].value,
          owner: "player",
        });

        // allow user to reposition cards
        card.setInteractive({ draggable: true });
        card.on("pointerover", () => {
          card.setScale(card.originalScale * 1.2);
        });
        card.on("pointerout", () => {
          card.setScale(card.originalScale);
        });

        // save player deck
        this.playerDeck.push(card);
        this.playerDeckPositions.push({
          x: this.playerXInit + i * this.cardGap,
          y: 600,
        });
      }
    };

    this.createOpponentDecks = (decks) => {
      let deck, xInit, yInit;
      let newDeck = [];

      // enemy left
      deck = decks[0];
      console.log(deck);
      xInit = 125;
      yInit = 100;

      deck.forEach((deckCard, index) => {
        let card = new Card({
          scene: scene,
          x: xInit,
          y: yInit + index * this.cardGap,
          color: deckCard.color,
          value: "<",
          owner: deckCard.owner,
          cardPos: deckCard.cardPos,
        });

        card.setAngle(-90);
        newDeck.push(card);
      });

      this.opponent1Deck = {
        opponentDeck: newDeck,
        isNextPlayer: true,
        numPlayer: (scene.GameHandler.playerNum + 1) % 4,
      };
      newDeck = [];

      this.makeOpponentDeckInteractable(this.opponent1Deck.opponentDeck);

      // enemy top
      deck = decks[1];

      xInit = scene.width / 2 + 250;
      yInit = 125;
      deck.forEach((deckCard, index) => {
        let card = new Card({
          scene: scene,
          x: xInit - index * this.cardGap,
          y: yInit,
          color: deckCard.color,
          value: "<",
          owner: deckCard.owner,
          cardPos: deckCard.cardPos,
        });

        newDeck.push(card);
      });

      this.opponent2Deck = {
        opponentDeck: newDeck,
        isNextPlayer: false,
        numPlayer: (scene.GameHandler.playerNum + 2) % 4,
      };
      newDeck = [];

      // enemy right
      deck = decks[2];
      xInit = scene.width - 125;
      yInit = 600;
      deck.forEach((deckCard, index) => {
        let card = new Card({
          scene: scene,
          x: xInit,
          y: yInit - index * this.cardGap,
          color: deckCard.color,
          value: "<",
          owner: deckCard.owner,
          cardPos: deckCard.cardPos,
        });

        card.setAngle(90);
        newDeck.push(card);
      });

      this.opponent3Deck = {
        opponentDeck: newDeck,
        isNextPlayer: false,
        numPlayer: (scene.GameHandler.playerNum + 3) % 4,
      };
    };

    this.createRemainingCards = (remaining) => {
      new Card({
        scene: scene,
        x: scene.width / 2 - 50,
        y: scene.height / 2,
        color: remaining[0].color,
        value: remaining[0].value,
      });

      new Card({
        scene: scene,
        x: scene.width / 2 + 50,
        y: scene.height / 2,
        color: remaining[1].color,
        value: remaining[1].value,
      });
    };

    this.makeOpponentDeckInteractable = (deck) => {
      deck.forEach((card) => {
        card.setInteractive();
        card.on("pointerdown", () => {
          scene.GameHandler.startGuess(card.owner, card.cardPos);
        });

        card.on("pointerover", () => {
          card.setScale(card.originalScale * 1.2);
        });

        card.on("pointerout", () => {
          card.setScale(card.originalScale);
        });
      });
    };

    this.disableOpponentDeckInteractable = () => {
      let deck;
      if (this.opponent1Deck.isNextPlayer) {
        deck = this.opponent1Deck.opponentDeck;
      } else if (this.opponent2Deck.isNextPlayer) {
        deck = this.opponent2Deck.opponentDeck;
      } else if (this.opponent3Deck.isNextPlayer) {
        deck = this.opponent3Deck.opponentDeck;
      }

      deck.forEach((card) => {
        card.removeInteractive();
      });
    };

    this.repositionCard = (x, y, gameObject) => {
      let closest = this.playerDeckPositions.reduce((a, b) => {
        return this.distance(x, y, a.x, a.y) < this.distance(x, y, b.x, b.y)
          ? a
          : b;
      });

      let posIndex = this.playerDeckPositions.indexOf(closest);
      let gameObjectIndex = this.playerDeck.indexOf(gameObject);

      if (posIndex === this.playerDeck.indexOf(gameObject)) {
        console.log("same card");
        return false;
      }

      if (
        this.playerDeck[posIndex].value === gameObject.value ||
        gameObject.value === ":)"
      ) {
        // Switch array indeces
        this.arrayMove(this.playerDeck, gameObjectIndex, posIndex);

        // Update card positions
        this.placePlayerDeck();

        return true;
      }

      return false;
    };

    this.getOpponentCard = (owner, cardPos) => {
      if (this.opponent1Deck.numPlayer === owner) {
        return this.opponent1Deck.opponentDeck[cardPos];
      } else if (this.opponent2Deck.numPlayer === owner) {
        return this.opponent2Deck.opponentDeck[cardPos];
      } else if (this.opponent3Deck.numPlayer === owner) {
        return this.opponent3Deck.opponentDeck[cardPos];
      } else {
        return this.playerDeck[cardPos];
      }
    };

    this.placePlayerDeck = () => {
      this.playerDeck.forEach((element, index) => {
        element.x = this.playerXInit + index * 100;
        element.y = this.playerYInit;
      });
    };

    this.getPlayerDeck = () => {
      return this.playerDeck;
    };

    // player is done rearranging cards
    this.disablePlayerDeck = () => {
      this.playerDeck.forEach((element) => {
        element.removeInteractive();
      });
    };

    // player has lost
    // fade out cards
    this.disablePlayerDeckLost = () => {
      this.playerDeck.forEach((element) => {
        if (element.color === "card-black")
          element.list[0].setTexture("card-black-faded");
        else element.list[0].setTexture("card-white-faded");
      });
    };

    // opponent has lost
    // fade out cards
    this.disableOpponentDeckLost = (numPlayer) => {
      let deck;
      if (this.opponent1Deck.numPlayer === numPlayer) {
        deck = this.opponent1Deck.opponentDeck;
        if (this.opponent1Deck.isNextPlayer) {
          this.opponent2Deck.isNextPlayer = true;
          this.makeOpponentDeckInteractable(this.opponent2Deck.opponentDeck);
        }
      } else if (this.opponent2Deck.numPlayer === numPlayer) {
        deck = this.opponent2Deck.opponentDeck;
        if (this.opponent2Deck.isNextPlayer) {
          this.opponent3Deck.isNextPlayer = true;
          this.makeOpponentDeckInteractable(this.opponent3Deck.opponentDeck);
        }
      } else if (this.opponent3Deck.numPlayer === numPlayer) {
        deck = this.opponent3Deck.opponentDeck;
      }

      deck.forEach((card) => {
        if (card.color === "card-black")
          card.list[0].setTexture("card-black-faded");
        else card.list[0].setTexture("card-white-faded");

        card.removeInteractive();
      });
    };

    /////////////////////////////////////////////////////
    ///////////////////////UTIL//////////////////////////
    /////////////////////////////////////////////////////
    this.distance = (point1x, point1y, point2x, point2y) => {
      var dist =
        Math.pow(point1x - point2x, 2) + Math.pow(point1y - point2y, 2);
      return dist;
    };

    this.arrayMove = (array, fromIndex, toIndex) => {
      let element = array[fromIndex];
      array.splice(fromIndex, 1);
      array.splice(toIndex, 0, element);
    };
  }
}
