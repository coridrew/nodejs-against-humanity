var _ = require('underscore');
var cards = require('./cards.js');

var gameList = [];

function getDeck() {
  return cards.getDeck();
}

function removeFromArray(array, item) {
  var index = array.indexOf(item);
  if(index != -1) array.splice(index, 1);
}

function list() {
  return toInfo(_.filter(gameList, function(x) {
    return x.players.length < 4;
  }));
}

function listAll() {
  return toInfo(gameList);
}

function toInfo(fullGameList) {
  return _.map(fullGameList, function(game) {
    return { id: game.id, name: game.name, players: game.players.length };
  }); 
}

function addGame(game) {
  game.players = [];
  game.history = [];
  game.isOver = false;
  game.winnerId = null;
  game.winningCardId = null;
  game.isStarted = false;
  game.deck = getDeck();
  game.currentBlackCard = "";
  game.isReadyForScoring = false;
  game.isReadyForReview = false;
  game.pointsToWin = 5;
  gameList.push(game);
  return game;
}

function getGame(gameId) {
  return _.find(gameList, function(x) { return x.id == gameId; });
}

function joinGame(game, player) {
  game.players.push({
    id: player.id,
    name: player.name,
    isReady: false,
    selectedWhiteCardId: null,
    awesomePoints: 0,
    isCzar: false
  });

  if(game.players.length == 4) {
    startGame(game);
  }

  return game;
}

function startGame(game) {
  game.isStarted = true;
  setCurrentBlackCard(game);
  game.players[0].isCzar = true;
  _.each(game.players, function(player) {
    player.cards = [];
    for(var i = 0; i < 7; i++) {
      drawWhiteCard(game, player);
    }
  });
}

function roundEnded(game) {
  game.winnerId = null;
  game.winningCardId = null;
  game.isReadyForScoring = false;
  game.isReadyForReview = false;

  setCurrentBlackCard(game);

  _.each(game.players, function(player) {
    if(!player.isCzar) {
      removeFromArray(player.cards, player.selectedWhiteCardId);
      drawWhiteCard(game, player);
    }

    player.isReady = false;
    player.selectedWhiteCardId = null;
  });

  if(game.players[0].isCzar == true) {
    game.players[0].isCzar = false;
    game.players[1].isCzar = true;
    game.players[1].isReady = false;
  }
  else if(game.players[1].isCzar == true) {
    game.players[1].isCzar = false;
    game.players[2].isCzar = true;
    game.players[2].isReady = false;
  }
  else if(game.players[2].isCzar == true) {
    game.players[2].isCzar = false;
    game.players[3].isCzar = true;
    game.players[3].isReady = false;
  }
  else if(game.players[3].isCzar == true) {
    game.players[3].isCzar = false;
    game.players[0].isCzar = true;
    game.players[0].isReady = false;
  }
}

function drawWhiteCard(game, player) {
  var whiteIndex = Math.floor(Math.random() * game.deck.white.length);
  player.cards.push(game.deck.white[whiteIndex]);
  game.deck.white.splice(whiteIndex, 1);
}

function setCurrentBlackCard(game) {
  var index = Math.floor(Math.random() * game.deck.black.length);
  game.currentBlackCard = game.deck.black[index];
  game.deck.black.splice(index, 1);
}

function getPlayer(gameId, playerId) {
  var game = getGame(gameId);
  return _.find(game.players, function(x) { return x.id == playerId; });
}

function getPlayerByCardId(gameId, cardId) {
  var game = getGame(gameId);
  return _.findWhere(game.players, { selectedWhiteCardId: cardId });
}

function readyForNextRound(gameId, playerId) {
  var player = getPlayer(gameId, playerId);
  player.isReady = true;

  var game = getGame(gameId);
  var allReady = _.every(game.players, function(x) {
    return x.isReady;
  });

  if(allReady) roundEnded(game);
}

function selectCard(gameId, playerId, whiteCardId) {
  var player = getPlayer(gameId, playerId);
  player.selectedWhiteCardId = whiteCardId;
  player.isReady = false;

  var game = getGame(gameId);

  var readyPlayers = _.filter(game.players, function (x) {
    return x.selectedWhiteCardId;
  });

  if(readyPlayers.length == 3) game.isReadyForScoring = true;
}

function selectWinner(gameId, cardId) {
  var player = getPlayerByCardId(gameId, cardId);
  var game = getGame(gameId);
  game.winningCardId = cardId;
  game.isReadyForReview = true;
  player.awesomePoints = player.awesomePoints + 1;
  game.history.push({ black: game.currentBlackCard, white: cardId, winner: player.name });
  if(player.awesomePoints == game.pointsToWin) {
    var game = getGame(gameId);
    game.isOver = true;
    game.winnerId = player.id;
  }
}

function reset(){
  gameList = [];
}

exports.list = list;
exports.listAll = listAll;
exports.addGame = addGame;
exports.getGame = getGame;
exports.getPlayer = getPlayer;
exports.joinGame = joinGame;
exports.readyForNextRound = readyForNextRound;
exports.reset = reset;
exports.roundEnded = roundEnded;
exports.selectCard = selectCard;
exports.selectWinner = selectWinner;
exports.removeFromArray = removeFromArray;
exports.getDeck = getDeck;
