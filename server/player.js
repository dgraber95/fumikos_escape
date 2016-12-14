"use strict";

/* 
	Constants 
	We made these "var" instead of "const" because node.js is 
	outdated on the lab computers
	*/
var PLAYER_RUN_VELOCITY = 4;
var PLAYER_RUN_SPEED = 5;
var PLAYER_RUN_MAX = 3;
var PLAYER_FALL_VELOCITY = 0.5;
var PLAYER_JUMP_SPEED = 10;
var PLAYER_JUMP_BREAK_VELOCITY= 0.10;
var PLAYER_WON_GAME_X_POS = 111000;
var SCREEN_POS_X = 512;
var FLOOR_Y_POS = 610;
const LEVEL_LENGTH = 11229;

/**
 * @module exports the Player class
 */
module.exports = exports = Player;


/**
 * @constructor Player
 * Creates a player
 */
function Player(position,socket ) {
	this.animationTimer = 0;
	this.animationCounter = 0;
	this.frameLength = 8;
	//animation dependent
	this.numberOfSprites = 0; // how man y frames are there in the animation
	this.spriteWidth = 23; // width of each frame
	this.spriteHeight = 34; // height of each frame
	this.widthInGame = 46;
	this.heightInGame = 68;
	this.xPlaceInImage = 0; // this should CHANGE for the same animation
	this.yPlaceInImage = 0; // this should NOT change for the same animation
	this.animation = "stand still"; // this will keep track of the animation
	this.velocity = {x: 0, y: 0};
	this.screenPos= {x: 512, y: position.y};
	this.levelPos= {x: position.x, y: position.y};
	this.direction = {left:false, down:false, right:false, up:false};
	this.noDir = {left:false, down:false, right:false, up:false};
	this.id = 'player';
	this.send = {levelPos:this.levelPos, screenPos:this.screenPos, direction: this.noDir,
	sx:this.xPlaceInImage+this.spriteWidth*this.animationCounter, sy:this.yPlaceInImage,
	swidth:this.spriteWidth, sheight:this.spriteHeight, width:this.widthInGame,
	height:this.heightInGame, animation:this.animationCounter,
	velocity:this.velocity, wonGame:this.wonGame,id:this.id};

	this.socket = socket;

	this.jumping = false;
	this.falling=false;
	this.crouching = "no";
	this.floorYPostion = FLOOR_Y_POS;
	this.jumpingTime = 0;
	this.facing = "left";
	this.wonGame = false;
}



/**
 * @function update
 * Updates the player based on the supplied input
 * @param {DOMHighResTimeStamp} elapedTime
 * @param {Input} input object defining input, must have
 * boolean properties: up, left, right, down
 */
Player.prototype.update = function() {
	// Left key pressed
	if(this.direction.left){
		if(this.jumping || this.falling){
			if(this.velocity.x > -PLAYER_RUN_VELOCITY){
				this.velocity.x -= 0.2;// TODO: magic numbers
			}
		}
		else{
			this.velocity.x = -PLAYER_RUN_VELOCITY;
			this.changeAnimation("moving left");
			this.facing = "left";
		}
	}

	// Right key pressed
	else if(this.direction.right){
		if(this.jumping || this.falling){
			if(this.velocity.x < PLAYER_RUN_VELOCITY){
				this.velocity.x += 0.2;// TODO: magic numbers
			}
		}
		else{
			this.velocity.x = PLAYER_RUN_VELOCITY;
			this.changeAnimation("moving right");
			this.facing = "right";
		}
	}

	// Jumping or falling
	if(this.jumping || this.falling){
		this.changeAnimation("moving up");
		this.velocity.y += PLAYER_FALL_VELOCITY;
		if(this.velocity.y > 0){
			this.jumping=false;
			this.falling=true;
		}

		// TODO: Change this once the tile interactions are working
		if (this.levelPos.y > this.floorYPostion)
		{
			this.levelPos.y = this.floorYPostion;
			this.screenPos.y = this.floorYPostion;
			this.velocity.y = 0;
			this.jumping = false;
			this.falling=false;
		}
	}

	// Beginning to jump
	else if(this.direction.up){
		this.velocity.y -= PLAYER_JUMP_SPEED;
		this.jumping=true;
	}

	// Standing still
	else{
		if(!this.direction.right && !this.direction.left){
			this.velocity.x = 0;
			this.changeAnimation("stand still");
		}
	}

	// Move player
	this.levelPos.x += this.velocity.x;
	this.levelPos.y += this.velocity.y;
	this.screenPos.y += this.velocity.y;

	// Prevent player from walking off screen
	if(this.levelPos.x <= 0){
		this.levelPos.x = 0;
	}
	else if(this.levelPos.x >= LEVEL_LENGTH - this.widthInGame){
		this.levelPos.x = LEVEL_LENGTH - this.widthInGame;
	}

	// Prevent background from moving too far
	if(this.levelPos.x <= SCREEN_POS_X ){
		this.screenPos.x = this.levelPos.x;
	}
	else if(this.levelPos.x >= LEVEL_LENGTH - 512){// TODO: magic numbers
		this.screenPos.x = 1024 - (LEVEL_LENGTH - this.levelPos.x);// TODO: magic numbers
	}
	else{
		this.screenPos.x = SCREEN_POS_X;
	}


	// Update animations
	this.animationTimer++;
	if (this.animationTimer>this.frameLength)
	{
	  if(this.animation=="stand still") this.animationCounter=0;
	  else if(this.animation!="moving up"){
		this.animationCounter++;
	  }
	  this.animationTimer = 0;
	}

	if (this.animationCounter >= this.numberOfSprites){
		if(this.animation!="stand still"){
			this.animationCounter = 3;	// TODO: magic numbers
		}
		else{
		this.animationCounter = 0;
		}
	}
	if(this.jumping==true) this.xPlaceInImage = this.spriteWidth*5;
	else if(this.falling==true) this.xPlaceInImage = this.spriteWidth*6;
	else this.xPlaceInImage = 0;

	// Check if player 1 won the game
	if(Math.floor(this.levelPos.x) > PLAYER_WON_GAME_X_POS)// TODO: magic numbers
	{
		this.wonGame = true;
  	}

	this.send = {levelPos:this.levelPos, screenPos:this.screenPos, direction: this.noDir,
	sx:this.xPlaceInImage+this.spriteWidth*this.animationCounter, sy:this.yPlaceInImage,
	swidth:this.spriteWidth, sheight:this.spriteHeight, width:this.widthInGame,
	height:this.heightInGame, animation:this.animationCounter,
	velocity:this.velocity,wonGame:this.wonGame, id:this.id};
}


Player.prototype.changeAnimation = function(x)
{
	this.animation = x;
	if (this.animation == "stand still"){
		this.numberOfSprites = 0;
		this.animationTimer = 0;
		this.animationCounter = 0;
	}
	else{
		this.numberOfSprites = 5;// TODO: magic numbers
		switch(this.animation)
		{
			case "moving up":
				this.animationCounter=0;
			break;
			case "moving down":
  				this.yPlaceInImage =this.spriteHeight*0;
  				break;
			case "moving left":
				if(this.jumping==false && this.falling==false){
            		this.yPlaceInImage =this.spriteHeight*1;
          		}
				break;
			case "moving right":
				this.yPlaceInImage =this.spriteHeight*0;
				break;
		}
	}
}