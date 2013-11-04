var _ = require('underscore');
var Game = require('../game.js')

describe('multi-libs', function() {
  var player1 = "Player1";
  var player2 = "Player2";
  var player3 = "Player3";
  var player4 = "Player4";
  var gameId = "ANewGame";
  var currentGame;

  function createGame() {
    Game.addGame({ id: gameId, name: "some game" });
    currentGame = Game.getGame(gameId);
  }

  function joinCurrentGame(playerId) {
    Game.joinGame(currentGame, { id: playerId, name: playerId });
  }

  function playCard(playerId) {
    var player = _.findWhere(currentGame.players, { id: playerId });
    expect(player.isCzar).toBe(false);
    Game.selectCard(currentGame.id, playerId, player.cards[0]);
    currentGame = Game.getGame(gameId);
  }

  function startGame() {
    createGame();
    joinCurrentGame(player1);
    joinCurrentGame(player2);
    joinCurrentGame(player3);
    joinCurrentGame(player4);
    currentGame = Game.getGame(gameId);
  }

  beforeEach(Game.reset);

  describe('creating a game', function() {
    beforeEach(createGame);

    it('the game isn\'t considered started', function() {
      expect(currentGame.isStarted).toBe(false);
    });

    it('a deck is created', function() {
      expect(currentGame.deck.black.length).toBe(Game.getDeck().black.length);
      expect(currentGame.deck.white.length).toBe(Game.getDeck().white.length);
    });

    it('the game is listed for joining', function() {
      expect(Game.list()[0].id).toBe(gameId);
    });
  });

  describe('4 people join a game', function() {
    beforeEach(startGame);

    it('the game is no longer listed', function() {
      expect(Game.list().length).toBe(0);
    });

    it('the game is started with', function() {
      expect(currentGame.isStarted).toBe(true);
    });

    it('the black card is selected for play', function() {
      expect(currentGame.currentBlackCard).toBeTruthy();
    });

    it('player one is selected as the Card Czar', function() {
      expect(currentGame.players[0].isCzar).toBe(true);
    });

    it('each player has 7 cards drawn', function() {
      expect(currentGame.players[0].cards.length).toBe(7);
      expect(currentGame.players[1].cards.length).toBe(7);
      expect(currentGame.players[2].cards.length).toBe(7);
      expect(currentGame.players[3].cards.length).toBe(7);
    });
  });

  describe('round', function() {
    beforeEach(startGame);

    describe('each player except the czar plays a card', function() {
      beforeEach(function() {
        playCard(player2);
        playCard(player3);
        playCard(player4);
      });

      it('the round is ready for scoring', function() {
        expect(currentGame.isReadyForScoring).toBe(true);
      });

      describe('card czar selects winner', function() {
        var cardId;

        beforeEach(function() {
          cardId = currentGame.players[1].cards[0];
          Game.selectWinner(gameId, cardId);
          currentGame = Game.getGame(gameId);
        });

        it('sets the winning card for the round', function() {
          expect(currentGame.winningCardId).toBe(cardId);
        });

        it('the round is ready for review', function() {
          expect(currentGame.isReadyForReview).toBe(true);
        });

        it('player is given awesome points', function() {
          expect(currentGame.players[1].awesomePoints).toBe(1);
        });

        describe('everyone has reviewed the cards', function() {
          var whiteCardCount;
          var blackCardCount
          var blackCard;

          beforeEach(function() {
            whiteCardCount = currentGame.deck.white.length;
            blackCardCount = currentGame.deck.black.length;
            blackCard = currentGame.currentBlackCard;
            Game.readyForNextRound(gameId, currentGame.players[0].id);
            Game.readyForNextRound(gameId, currentGame.players[1].id);
            Game.readyForNextRound(gameId, currentGame.players[2].id);
            Game.readyForNextRound(gameId, currentGame.players[3].id);
            currentGame = Game.getGame(gameId);
          });

          it("the round is restarted with new czar", function() {
            expect(currentGame.isReadyForScoring).toBe(false);
            expect(currentGame.isReadyForReview).toBe(false);
            expect(currentGame.winningCardId).toBe(null);
            expect(currentGame.players[1].isCzar).toBe(true);
          });

          it("a new black card is selected", function() {
            expect(currentGame.deck.black.length).toBe(blackCardCount - 1);
            expect(currentGame.currentBlackCard).toNotBe(blackCard);
          });

          it("each player (except the czar) is given a new white card", function() {
            expect(currentGame.deck.white.length).toBe(whiteCardCount - 3);
            expect(currentGame.players[0].cards.length).toBe(7);
            expect(currentGame.players[1].cards.length).toBe(7);
            expect(currentGame.players[2].cards.length).toBe(7);
            expect(currentGame.players[3].cards.length).toBe(7);
          });
        });
      });
    });
  });
});
