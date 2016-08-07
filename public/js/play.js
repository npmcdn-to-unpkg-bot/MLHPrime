var playState = {

    cursors: null,
    player: null,
    walls: null,
    puzzles: null,
    scare: null,
    time: null,
    scarePic: null,

	preload: function() {
      game.load.spritesheet('player', 'assets/player.png', 14, 21);

      game.load.image('tileset', 'assets/background.png')
      game.load.image('background', 'assets/background.png');
      game.load.image('wall', 'assets/wall.png');
			game.load.image('scare', 'assets/jumpscare.png');

      game.load.audio('scream', 'assets/scream.m4a');
    },

    create: function() {
            game.physics.startSystem(Phaser.Physics.ARCADE);

            game.add.tileSprite(0, 0, 800, 800, 'background');
            game.world.setBounds(0, 0, 800, 800);
            this.createMaze(12, 12);

            player = game.add.sprite(32, 32, 'player');
            game.physics.arcade.enable(player);
            player.anchor.setTo(0.5, 0.5);
            player.scale.set(1.3, 1.3);
            player.body.collideWorldBounds=true;

            player.animations.add('right', [0, 1, 2, 3], 12, true);
            player.animations.add('left', [4, 5, 6, 7], 12, true);
            player.animations.add('up', [8, 9, 10, 11], 12, true);
            player.animations.add('down', [12, 13, 14, 15], 12, true);

            cursors = game.input.keyboard.createCursorKeys();
            game.camera.follow(this.player);

            scare = false;
            scarePic = game.add.sprite(-150, -150, 'scare');
			      scarePic.scale.set(1.7, 1.7);
            scarePic.kill();
            time = 0;
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
      switch(Math.floor(Math.random()*2)){
        case 0:
          horiz[Math.floor(Math.random()*x)][Math.floor(Math.random()*2)*game.world.bounds.height] = true;
          break;
        case 1:
          verti[Math.floor(Math.random()*2)*game.world.bounds.width][Math.floor(Math.random()*y)] = true;
          break;
      }
    	this.displayMaze({x: x, y: y, horiz: horiz, verti: verti});
      return;
    },

    displayMaze: function(m) {
	  this.walls = game.add.group();
      this.walls.enableBody = true;

    	for (var j= 0; j<m.x*2+1; j++) {
    		if (0 == j%2){
    			for (var k=0; k<m.y*2+1; k++){
    				if (0 == k%2){
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

    update: function() {
        game.physics.arcade.collide(this.player, this.walls);

        this.player.body.velocity.y = 0;
        this.player.body.velocity.x = 0;

        if(this.cursors.up.isDown)
        {
        	this.activateScare();
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

    	if(this.scare) {
    		time++;
    		if(time > 50) {
    			time = 0;
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
      var scream = game.add.audio('scream', 5);
      scream.play();
      setTimeout(function(){scream.stop();}, 1000);
    	this.scare = true;
    	this.scarePic.reset(0, 0);
    },

    activatePuzzle: function() {
    	game.state.start('puzzle');
    },
};
