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
            game.camera.follow(player);

            scare = false;
            scarePic = game.add.sprite(0, 0, 'scare');
			scarePic.scale.set(2, 2);
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
    	this.displayMaze({x: x, y: y, horiz: horiz, verti: verti});
      return;
    },

    displayMaze: function(m) {
	  walls = game.add.group();
      walls.enableBody = true;

    	for (var j= 0; j<m.x*2+1; j++) {
    		if (0 == j%2){
    			for (var k=0; k<m.y*2+1; k++){
    				if (0 == k%2){
    					var innerWall = walls.create(j*32, k*32, 'wall');
              innerWall.body.immovable = true;
            }else{
    					if (!(j>0 && m.verti[Math.floor(j/2-1)][Math.floor(k/2)])){
    						var hWall = walls.create(j*32, k*32, 'wall');
                hWall.body.immovable = true;
              }
            }
          }
    		}else{
    			for (var k=0; k<m.y*2+1; k++){
    				if (0 == k%2){
    					if (!(k>0 && m.horiz[Math.floor((j-1)/2)][Math.floor(k/2-1)])){
                var vWall = walls.create(j*32, k*32, 'wall');
                vWall.body.immovable = true;
              }
            }
          }
        }
    	}
    	return;
    },

    update: function() {
        game.physics.arcade.collide(player, walls);

        player.body.velocity.y = 0;
        player.body.velocity.x = 0;

        if(cursors.up.isDown)
        {
          this.activateScare();
          player.body.velocity.y = -150;
          if(player.dirX == 0) player.animations.play('up');
          player.dirY = -1;
          if(!cursors.left.isDown && !cursors.right.isDown) {
              player.dirX = 0;
          }
        }
        else if(cursors.down.isDown)
        {
            player.body.velocity.y = 150;
            if(player.dirX == 0) player.animations.play('down');
            player.dirY = 1;
            if(!cursors.left.isDown && !cursors.right.isDown) {
                player.dirX = 0;
            }
        }

        if(cursors.right.isDown)
        {
            player.body.velocity.x = 150;
            player.animations.play('right');
            player.dirX = 1;
            if(!cursors.up.isDown && !cursors.down.isDown) {
                player.dirY = 0;
            }
        }
        else if(cursors.left.isDown)
        {
            player.body.velocity.x = -150;
            player.animations.play('left');
            player.dirX = -1;
            if(!cursors.up.isDown && !cursors.down.isDown) {
                player.dirY = 0;
            }
        }
        else if(!cursors.up.isDown && !cursors.down.isDown && !cursors.left.isDown && !cursors.right.isDown)
        {
            player.animations.stop();
            if(player.dirX == 1) player.frame = 2;
            else if(player.dirX == -1) player.frame = 5;
            else if(player.dirX == 0) {
                if(player.dirY == -1) player.frame = 10;
                else if(player.dirY == 1) player.frame = 13;
            }
        }

    	if(scare) {
    		time++;
    		if(time > 50) {
    			time = 0;
    			scare = false;
    			scarePic.kill();
    		}
    	}
    },

    activateScare: function() {
      var scream = game.add.audio('scream', 5);
      scream.play();
      setTimeout(function(){scream.stop();}, 1000);
    	scare = true;
    	scarePic.reset(0, 0);
    },

    activatePuzzle: function() {
    	game.state.start('puzzle');
    },
};
