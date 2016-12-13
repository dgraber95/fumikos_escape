const WIDTH = 5121;
const HEIGHT = 786;

module.exports = exports = Game;

const Player = require('./player.js');
const Enemy = require('./enemy.js');
const HidingObjects = require('./hiding-objects.js');

/**
 * @class Game

 * @param {Object} io is a Socket.io server instance
 * @param {Array} sockets the two players' server sockets
 * @param {integer} room a unique identifier for this game
 */
function Game(io, sockets, room) {
  this.io = io;
  this.room = room;
  this.state = new Uint8Array(WIDTH * HEIGHT);
  this.time = Date.now();
  this.enemyFire = [];
  this.enemyBombs = [];
  this.players = [];
  this.hidingObjects = new HidingObjects();

    // Initialize the player
  this.players.push(new Player(
      {x: 512, y: 610},
      sockets[0]
  ));

  this.players.push(new Enemy(
    {x: 700, y: 610},
    sockets[1]
  ));

  this.players.forEach(function(player) {
	  
    // Join the room
    player.socket.join(room);

    // Handle disconnect events
    player.socket.on('disconnect', function() {
      // Broadcast to the other player that they disconnected
      io.to(room).emit('player disconnected');
    });

    // Handle steering events
    player.socket.on('keyDown', function(direction) {
      player.direction.left = player.direction.left | direction.left;
      player.direction.down = player.direction.down | direction.down;
      player.direction.right = player.direction.right | direction.right;
      player.direction.up = player.direction.up | direction.up;
    });

    // Handle steering events
    player.socket.on('keyUp', function(direction) {
      player.direction.left = player.direction.left & direction.left;
      player.direction.down = player.direction.down & direction.down;
      player.direction.right = player.direction.right & direction.right;
      player.direction.up = player.direction.up & direction.up;
    });

	player.socket.on('fire',function(reticulePosition){
		player.reticulePosition = reticulePosition;
	});
	
    //return player;
  });

  //this.io.to(this.room).emit('draw');

  // Place player on the screen
  // this.io.to(this.room).emit('render', {
  //   player: this.players[0].send,
  //   enemy: this.players[1].send
  // });

  // Start the game
  var game = this;
  // We use setInterval to update the game every 60
  // seconds.  When the game is over, we can stop
  // the update process with clearInterval.
  this.interval = setInterval(function() {
    game.update();
  }, 1000/60);
  this.io.to(this.room).emit('game on');
}

/**
 * @function update()
 * Advances the game by one step, moving players
 * and determining crashes.
 */
Game.prototype.update = function(newTime) {
  var state = this.state;
  var interval = this.interval;
  var room = this.room;
  var io = this.io;
  
  //Update hiding objects
  this.hidingObjects.update(this.players[0], this.time);
  this.time = Date.now();
  
  // Update players
  this.players.forEach(function(player, i, players) {
    var otherPlayer = players[(i+1)%2];



      player.update();
	


    // Check for collision with walls
    // if(player.position.x < 0 || player.position.x > WIDTH || player.position.y < 0 || player.position.y > HEIGHT) {
    //   console.log("went out of bounds");
    //   player.socket.emit('defeat');
    //   otherPlayer.socket.emit('defeat');
    //   clearInterval(interval);
    // }
  });
  
  for (var i = 0 ; i < this.enemyFire.length ; i++)
  {
	  this.enemyFire[i].update();
	  
	  //remove the shot at this condtion, it could be hitting an opject or going out of the screen
	  if (this.enemyFire[i].timer>40)
	  {
		  this.enemyFire.splice(i,1);
		  i--;
	  }
  }
  
  // Broadcast updated game state
  // io.to(room).emit('move', {
  //   player: this.players[0].send,
  //   enemy: this.players[1].position
  // });

  this.players[0].socket.emit('render', {
    current: this.players[0].send,
    other: this.players[1].send
  }, this.hidingObjects);

  this.players[1].socket.emit('render', {
    other: this.players[0].send,
    current: this.players[1].send
  }, this.hidingObjects);
}
