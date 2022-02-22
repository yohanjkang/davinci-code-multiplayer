const express = require("express");
var app = express();
const http = require("http").createServer(app);
const cors = require("cors");
const path = require("path");
const serveStatic = require("serve-static");
const { Server } = require("http");

let deckPlayer0 = [];
let deckPlayer1 = [];
let deckPlayer2 = [];
let deckPlayer3 = [];
let remaining = [];

// card information
const defaultCards = [-1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const defaultColors = ["card-white", "card-black"];

// game rooms
const gameRooms = {
  //   roomKey: {
  //     players: {},
  //     playerHands: [],
  //     numPlayers: 0,
  //     numReadyPlayers: 0,
  //     // during game
  //     currentPlayerTurn: 0,
  //     lostPlayers: [],
  //     currentGuessingCardValue: null,
  //     ownerOfGuessingCard: null,
  //   },
};

const io = require("socket.io")(http, {
  cors: {
    // origin: "https://davinci-code-game.herokuapp.com/",
    origin: "http://localhost:8080",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(serveStatic(__dirname + "/client/dist"));

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // add user to room
  socket.on("joinRoom", (roomKey) => {
    socket.join(roomKey);

    const roomInfo = gameRooms[roomKey];
    roomInfo.players[socket.id] = {
      deck: roomInfo.playerHands[roomInfo.numPlayers],
      playerNum: roomInfo.numPlayers,
      playerId: socket.id,
      cardsRevealed: 0,
    };

    // update number of players in room
    roomInfo.numPlayers = Object.keys(roomInfo.players).length - 1;

    // set initial state
    socket.emit("setState", roomInfo);
  });

  socket.on("isKeyValid", (input) => {
    Object.keys(gameRooms).includes(input)
      ? socket.emit("keyIsValid", input)
      : socket.emit("keyNotValid");
  });

  // get a random code for the room
  socket.on("getRoomCode", async () => {
    let key = codeGenerator();
    Object.keys(gameRooms).includes(key) ? (key = codeGenerator()) : key;

    // create a room
    gameRooms[key] = {
      // pre-game states
      roomKey: key,
      players: {},
      playerHands: [],
      remaining: [],
      numPlayers: 0,
      numReadyPlayers: 0,

      // during-game states
      currentPlayerTurn: 0,
      lostPlayers: [],
    };
    socket.emit("roomCreated", key);
    createCards(key);

    // add player to room
    socket.join(key);
  });

  socket.on("createPlayer", (key, playerName) => {
    console.log(key);
    const roomInfo = gameRooms[key];

    roomInfo.players[socket.id] = {
      deck: roomInfo.playerHands[roomInfo.numPlayers],
      playerNum: roomInfo.numPlayers,
      playerId: socket.id,
      playerName: playerName,
      cardsRevealed: 0,
    };

    // update number of players in room
    roomInfo.numPlayers = Object.keys(roomInfo.players).length - 1;

    // set initial state
    socket.emit("setState", roomInfo);

    // send deck to new player
    socket.emit("createNewPlayer", roomInfo.players[socket.id]);
  });

  // send previous players to new player
  //   socket.to(roomKey).emit("currentPlayers", players);

  // player is ready
  socket.on("playerReady", (newDeck, roomKey) => {
    const roomInfo = gameRooms[roomKey];

    // update new player deck
    roomInfo.players[socket.id].deck = newDeck;
    roomInfo.playerHands[roomInfo.players[socket.id].playerNum] = newDeck;
    console.log(roomInfo.players[socket.id].deck);

    roomInfo.numReadyPlayers++;

    // all players are ready
    // start game
    if (roomInfo.numReadyPlayers >= 4) {
      console.log("STARTING GAME");

      let playerNames = [];
      for (const [key, value] of Object.entries(roomInfo.players)) {
        playerNames.push(value.playerName);
      }
      console.log(playerNames);

      for (const [key, value] of Object.entries(roomInfo.players)) {
        // console.log(value.playerId);

        let deck = hideOpponentDecks(value.playerId, roomKey);
        io.to(value.playerId).emit(
          "startGame",
          deck,
          roomInfo.remaining,
          playerNames,
          roomInfo.currentPlayerTurn
        );
      }
    }
  });

  // player is beginning to guess
  socket.on("startingGuess", (playerNum, cardPos, roomKey) => {
    io.to(roomKey).emit("createOutline", playerNum, cardPos);
    gameRooms[roomKey].currentGuessingCardValue =
      gameRooms[roomKey].playerHands[playerNum][cardPos].value;
    gameRooms[roomKey].ownerOfGuessingCard = playerNum;
  });

  // player guessed a number
  socket.on("endingGuess", (guess, roomKey) => {
    io.to(roomKey).emit("displayGuess", guess);

    const roomInfo = gameRooms[roomKey];

    // player guess is correct
    // display card value to all players
    if (guess === roomInfo.currentGuessingCardValue.toString()) {
      io.to(roomKey).emit("correctGuess", guess);

      // increased cards revealed of player
      for (const [key, value] of Object.entries(roomInfo.players)) {
        if (value.playerNum === roomInfo.ownerOfGuessingCard) {
          value.cardsRevealed++;

          // all player's cards were revealed
          if (value.cardsRevealed === 6) {
            roomInfo.lostPlayers.push(value.playerNum);
            if (roomInfo.lostPlayers.length === 3) {
              handleGameEnd(roomInfo);
            } else {
              io.to(roomKey).emit("playerLost", value.playerNum);
            }
          }
          break;
        }
      }
    }
    // player guess is incorrect
    else {
      io.to(roomKey).emit("incorrectGuess");
      // change turns
      do {
        roomInfo.currentPlayerTurn = (roomInfo.currentPlayerTurn + 1) % 4;
      } while (roomInfo.lostPlayers.includes(roomInfo.currentPlayerTurn));

      io.to(roomKey).emit("nextTurn", roomInfo.currentPlayerTurn);
    }

    // reset variables
    roomInfo.currentGuessingCard = {};
    roomInfo.ownerOfGuessingCard = -1;
  });

  socket.on("disconnect", () => {
    let roomKey = getPlayerRoomKey(socket.id);
    const roomInfo = gameRooms[roomKey];

    if (roomInfo) {
      console.log(`User disconnected: ${socket.id}`);
      delete roomInfo.players[socket.id];
      roomInfo.numPlayers = Object.keys(roomInfo.players).length;

      // inform other players that a user disconnected
      io.to(roomKey).emit("disconnected", {
        playerId: socket.id,
        rumPlayers: roomInfo.numPlayers,
      });
    }
  });
});

const port = process.env.PORT || 3000;

http.listen(port, () => {
  console.log("SERVER RUNNING");
});

const createCards = (roomKey) => {
  const roomInfo = gameRooms[roomKey];

  let blackDeck = [];
  let whiteDeck = [];

  // create cards
  for (let j of defaultCards) {
    let card = { value: j, color: defaultColors[0] };
    whiteDeck.push(card);
    card = { value: j, color: defaultColors[1] };
    blackDeck.push(card);
  }

  // shuffle deck
  shuffleDeck(blackDeck);
  shuffleDeck(whiteDeck);

  dividePlayerHands(whiteDeck);
  dividePlayerHands(blackDeck);

  deckPlayer0.sort((a, b) => sortFunction(a, b));
  deckPlayer1.sort((a, b) => sortFunction(a, b));
  deckPlayer2.sort((a, b) => sortFunction(a, b));
  deckPlayer3.sort((a, b) => sortFunction(a, b));

  roomInfo.playerHands.push(deckPlayer0);
  roomInfo.playerHands.push(deckPlayer1);
  roomInfo.playerHands.push(deckPlayer2);
  roomInfo.playerHands.push(deckPlayer3);

  roomInfo.remaining = remaining;

  roomInfo.playerHands.forEach((deck) => {
    deck.forEach((card) => {
      if (card.value === -1) card.value = ":)";
    });
  });

  deckPlayer0 = [];
  deckPlayer1 = [];
  deckPlayer2 = [];
  deckPlayer3 = [];
  remaining = [];
};

const shuffleDeck = (deck) => {
  for (let i = deck.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * i);
    let temp = deck[i];
    deck[i] = deck[j];
    deck[j] = temp;
  }
};

const dividePlayerHands = (deck) => {
  remaining.push(...deck.splice(-1));
  const fourPartIndex = Math.ceil(deck.length / 4);

  deckPlayer0.push(...deck.splice(-fourPartIndex));
  deckPlayer1.push(...deck.splice(-fourPartIndex));
  deckPlayer2.push(...deck.splice(-fourPartIndex));
  deckPlayer3.push(...deck);
};

const sortFunction = (a, b) => {
  if (a.value > b.value) return 1;
  else return -1;
};

const hideOpponentDecks = (socketId, roomKey) => {
  let decks = [];
  let playerNum = gameRooms[roomKey].players[socketId].playerNum;
  console.log(playerNum);

  for (let i = 0; i < 3; i++) {
    playerNum = (playerNum + 1) % 4;
    let hiddenArray = [];
    gameRooms[roomKey].playerHands[playerNum].forEach((card, index) => {
      hiddenArray.push({
        value: card.value,
        color: card.color,
        owner: playerNum,
        cardPos: index,
      });
    });
    decks.push(hiddenArray);
  }

  return decks;
};

const handleGameEnd = (roomInfo) => {
  let winningPlayer;
  console.log("lostPlayers:", roomInfo.lostPlayers);
  for (const [key, value] of Object.entries(roomInfo.players)) {
    console.log("value", value.playerNum);
    if (!roomInfo.lostPlayers.includes(value.playerNum)) {
      winningPlayer = value.playerNum;
      break;
    }
  }

  console.log("winningPlayer:", winningPlayer);
  for (const [key, value] of Object.entries(roomInfo.players)) {
    if (value.playerNum === winningPlayer) {
      io.to(value.playerId).emit("playerWin");
    } else {
      io.to(value.playerId).emit("playerLoss", winningPlayer);
    }
  }
};

const getPlayerRoomKey = (socketId) => {
  console.log(gameRooms);
  if (Object.keys(gameRooms).length <= 0) return -1;

  let roomKey;
  for (let keys1 in gameRooms) {
    for (let keys2 in gameRooms[keys1]) {
      Object.keys(gameRooms[keys1][keys2]).map((element) => {
        if (element === socketId) {
          roomKey = keys1;
        }
      });
    }
  }
  return roomKey;
};

const codeGenerator = () => {
  let code = "";
  let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return code;
};
