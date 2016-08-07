var playState = {

    cursors: null,
    player: null,
    walls: null,
    puzzles: null,
    scareTraps: null,
    scare: null,
    time: null,
    scarePic: null,
    scream: null,
    mazeMatrix: null,
    delta: null,

	preload: function() {
      game.load.spritesheet('player', 'assets/player.png', 14, 21);

      game.load.image('tileset', 'assets/background.png')
      game.load.image('background', 'assets/background.png');
      game.load.image('wall', 'assets/wall.png');
			game.load.image('scare', 'assets/jumpscare.png');
      game.load.image('door', 'assets/doors.png');
      game.load.image('trap', 'assets/trap.png');

      game.load.audio('scream', 'assets/scream.m4a');
    },

    create: function() {
      game.physics.startSystem(Phaser.Physics.ARCADE);

      game.add.tileSprite(0, 0, 800, 800, 'background');
      game.world.setBounds(0, 0, 800, 800);

      this.player = game.add.sprite(47, 47, 'player');
      game.physics.arcade.enable(this.player);
      this.player.anchor.setTo(0.5, 0.5);
      this.player.scale.set(1.3, 1.3);
      this.player.body.collideWorldBounds=true;

      this.player.animations.add('right', [0, 1, 2, 3], 12, true);
      this.player.animations.add('left', [4, 5, 6, 7], 12, true);
      this.player.animations.add('up', [8, 9, 10, 11], 12, true);
      this.player.animations.add('down', [12, 13, 14, 15], 12, true);

      this.cursors = game.input.keyboard.createCursorKeys();
      game.camera.follow(this.player);

      this.scare = false;
      this.scarePic = game.add.sprite(-150, -150, 'scare');
			this.scarePic.scale.set(1.7, 1.7);
      this.scarePic.kill();
  		this.scream = game.add.audio('scream', 5);
      this.time = 0;
      this.delta = 0;
    },

    createMaze: function(x,y) {
    	var n=x*y-1;
    	var horiz =[]; for (var j= 0; j<x+1; j++) horiz[j]= [],
    	    verti =[]; for (var j= 0; j<x+1; j++) verti[j]= [],
    	    here = [Math.floor(Math.random()*x), Math.floor(Math.random()*y)],
    	    path = [here],
    	    unvisited = [];
    	for (var j = 0; j<x+2; j++) {
    		unvisited[j] = [];
    		for (var k= 0; k<y+1; k++)
    			unvisited[j].push(j>0 && j<x+1 && k>0 && (j != here[0]+1 || k != here[1]+1));
    	}
    	while (0<n) {
    		var potential = [[here[0]+1, here[1]], [here[0],here[1]+1],
    		    [here[0]-1, here[1]], [here[0],here[1]-1]];
    		var neighbors = [];
    		for (var j = 0; j < 4; j++)
    			if (unvisited[potential[j][0]+1][potential[j][1]+1])
    				neighbors.push(potential[j]);
    		if (neighbors.length) {
    			n = n-1;
    			next= neighbors[Math.floor(Math.random()*neighbors.length)];
    			unvisited[next[0]+1][next[1]+1]= false;
    			if (next[0] == here[0])
    				horiz[next[0]][(next[1]+here[1]-1)/2]= true;
    			else
    				verti[(next[0]+here[0]-1)/2][next[1]]= true;
    			path.push(here = next);
    		} else
    			here = path.pop();
    	}
      var dX, dY, n;
      switch(Math.floor(Math.random()*2)){
        case 0:
          n = Math.floor(Math.random()*2);
          dX = Math.floor(Math.random()*x);
          dY = n*(y-1);
          this.door = game.add.sprite((dX*2+1)*32, ((dY+n)*2)*32, 'door');
          horiz[dX][dY] = true;
          break;
        case 1:
          n = Math.floor(Math.random()*2);
          dX = n*(x-1);
          dY = Math.floor(Math.random()*y);
          this.door = game.add.sprite(((dX+n)*2)*32, (dY*2+1)*32, 'door');
          verti[dX][dY] = true;
          break;
      }
      this.mazeMatrix = {x: x, y: y, horiz: horiz, verti: verti, dX: dX, dY:dY};
    	
      return this.mazeMatrix;
    },

    displayMaze: function(m) {
	  this.walls = game.add.group();
    this.walls.enableBody = true;

    	for (var j= 0; j<m.x*2+1; j++) {
    		if (0 == j%2){
    			for (var k=0; k<m.y*2+1; k++){
    				if (0 == k%2 && (j != m.dX || k != m.dY)){
    					var innerWall = this.walls.create(j*32, k*32, 'wall');
              innerWall.body.immovable = true;
            }else{
    					if (!(j>0 && m.verti[Math.floor(j/2-1)][Math.floor(k/2)])){
    						var hWall = this.walls.create(j*32, k*32, 'wall');
                hWall.body.immovable = true;
              }
            }
          }
    		}else{
    			for (var k=0; k<m.y*2+1; k++){
    				if (0 == k%2){
    					if (!(k>0 && m.horiz[Math.floor((j-1)/2)][Math.floor(k/2-1)])){
                var vWall = this.walls.create(j*32, k*32, 'wall');
                vWall.body.immovable = true;
              }
            }
          }
        }
    	}
    	return;
    },

    renderOtherPlayers: function(otherPlayers) {
    	for (var key in otherPlayers) {
		   if (otherPlayers.hasOwnProperty(key)) {
		      var otherPlayer = otherPlayers[key];

		   }
		}
    },

    setMaze: function(mazeMatrix) {	
      	this.displayMaze(this.mazeMatrix);
    },

    update: function() {
    	this.delta++;
        game.physics.arcade.collide(this.player, this.walls);

        var that = this;

        if(this.scareTraps){
	        this.scareTraps.forEach(function(trap, i){
	        	if(Phaser.Rectangle.intersects(that.player.getBounds(), trap.getBounds())) {
	        		that.activateScare();
	        		trap.destroy();
	        		that.scareTraps.splice(i, 1);
	        	}
	        }) ;
	    }

        this.player.body.velocity.y = 0;
        this.player.body.velocity.x = 0;

        if(this.cursors.up.isDown)
        {
            this.player.body.velocity.y = -150;
            if(this.player.dirX == 0) this.player.animations.play('up');
            this.player.dirY = -1;
            if(!this.cursors.left.isDown && !this.cursors.right.isDown) {
                this.player.dirX = 0;
            }
        }
        else if(this.cursors.down.isDown)
        {
            this.player.body.velocity.y = 150;
            if(this.player.dirX == 0) this.player.animations.play('down');
            this.player.dirY = 1;
            if(!this.cursors.left.isDown && !this.cursors.right.isDown) {
                this.player.dirX = 0;
            }
        }

        if(this.cursors.right.isDown)
        {
            this.player.body.velocity.x = 150;
            this.player.animations.play('right');
            this.player.dirX = 1;
            if(!this.cursors.up.isDown && !this.cursors.down.isDown) {
                this.player.dirY = 0;
            }
        }
        else if(this.cursors.left.isDown)
        {
            this.player.body.velocity.x = -150;
            this.player.animations.play('left');
            this.player.dirX = -1;
            if(!this.cursors.up.isDown && !this.cursors.down.isDown) {
                this.player.dirY = 0;
            }
        }
        else if(!this.cursors.up.isDown && !this.cursors.down.isDown && !this.cursors.left.isDown && !this.cursors.right.isDown)
        {
            this.player.animations.stop();
            if(this.player.dirX == 1) this.player.frame = 2;
            else if(this.player.dirX == -1) this.player.frame = 5;
            else if(this.player.dirX == 0) {
                if(this.player.dirY == -1) this.player.frame = 10;
                else if(this.player.dirY == 1) this.player.frame = 13;
            }
        }

        if(this.delta > 15) {
        	this.delta = 0;
        	var evt = document.createEvent("CustomEvent");
        	evt.initCustomEvent("playerUpdate", true, true, this.getPlayerData());
        	evt.eventName = "playerUpdate";
        	var playerEl = document.getElementById("player");
        	playerEl.dispatchEvent(evt);
        }

    	if(this.scare) {
    		this.time++;
    		if(this.time > 50) {
    			this.time = 0;
    			this.scare = false;
    			this.scarePic.kill();
    		}
    	}
    },

    getPlayerData: function() {
    	return {
    		x: this.player.x,
    		y: this.player.y,
    		dirX: this.player.dirX,
    		dirY: this.player.dirY,
    		dx: this.player.body.velocity.x,
    		dy: this.player.body.velocity.y
    	};
    },

    activateScare: function() {
      this.scream.play();
      setTimeout(function(){
      	if(this.scream)
      		this.scream.stop();
      }, 1000);
		this.scare = true;
		this.scarePic.reset(0, 0);
    },

    activatePuzzle: function() {
    	game.state.start('puzzle');
    },

    spawnScareTraps: function() {
    	this.scareTraps = [];
    	var trapCoords = [];
    	for(var i = 0; i < 3; i++) {
	    	var x = Math.floor(Math.random() * 12);
	    	var y = Math.floor(Math.random() * 12);
	    	while(this.mazeMatrix.horiz[x][y] || this.mazeMatrix.verti[x][y] || trapCoords.filter(function(trap){
	    		return trap.x = x && trap.y == y;
	    	}).length > 0) {
	    		x = Math.floor(Math.random() * 12);
	    		y = Math.floor(Math.random() * 12);
	    	}
	    	var trap = game.add.sprite(x * game.world.width/12, y * game.world.height/12, 'trap');
	    	this.scareTraps.push(trap);
	    	trapCoords.push({x: x, y : y});
	    }
    }
};
