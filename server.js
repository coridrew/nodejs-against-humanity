var express = require('express');
var app = express()
var server = require('http').createServer(app);
var Game = require('./game.js')
var players = { };
var io = require('socket.io').listen(server);
var _ = require('underscore');

server.listen(process.env.PORT || 3000);

app.set('view engine', 'ejs');
app.set('view options', { layout: false });
app.use(express.methodOverride());
app.use(express.bodyParser());  
app.use(app.router);
app.use('/public', express.static('public'));

function json(o, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.write(JSON.stringify(o));
  res.end();
}

function returnGame(gameId, res) { json(gameViewModel(gameId), res); }

function broadcastGame(gameId) {
  for(var player in players[gameId]) {
    players[gameId][player].emit("updateGame", gameViewModel(gameId));
  }
}

function gameViewModel(gameId) {
  var game = Game.getGame(gameId);
  var viewModel = JSON.parse(JSON.stringify(game));
  delete viewModel.deck;
  return viewModel;
}

io.sockets.on('connection', function(socket) {
  socket.on('connectToGame', function(data) {
    if(!players[data.gameId]) players[data.gameId] = { };
    socket.gameId = data.gameId;
    socket.playerId = data.playerId;
    players[data.gameId][data.playerId] = socket;
    broadcastGame(data.gameId);
  });

  socket.on('disconnect', function() {
    delete players[socket.gameId][socket.playerId];
  });
});

app.get('/', function (req, res) { res.render('index'); });
app.get('/game', function (req, res) { res.render('game'); });
app.get('/list', function (req, res) { json(Game.list(), res); });
app.get('/listall', function (req, res) { json(Game.listAll(), res); });
app.post('/add', function (req, res) { json(Game.addGame(req.body), res); });
app.get('/gamebyid', function (req, res) { json(Game.getGame(req.query.id), res); });

app.post('/joingame', function (req, res) {
  var game = Game.getGame(req.body.gameId);

  if(game.isStarted) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify({ error: "too many players" }));
    res.end();
    return null;
  }	
  
  game = Game.joinGame(game, { id: req.body.playerId, name: req.body.playerName });
  returnGame(req.body.gameId, res);
});

app.post('/selectcard', function(req, res) {
  Game.selectCard(req.body.gameId, req.body.playerId, req.body.whiteCardId);
  broadcastGame(req.body.gameId);
  returnGame(req.body.gameId, res);
});

app.post('/selectWinner', function(req, res) {
  Game.selectWinner(req.body.gameId, req.body.cardId);
  broadcastGame(req.body.gameId);
  returnGame(req.body.gameId, res);
});

app.post('/readyForNextRound', function(req, res){
  Game.readyForNextRound(req.body.gameId, req.body.playerId);
  broadcastGame(req.body.gameId);
  returnGame(req.body.gameId, res);
});
