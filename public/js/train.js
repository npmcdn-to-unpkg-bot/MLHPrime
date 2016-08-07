var trainState = {
  trained: false,
  trainingData: {
    idle: [],
    up: [],
    down: [],
    left: [],
    right: []
  },

  preload: function(){},

  create: function(){
    game.stage.backgroundColor = "#333";
    var text="Please get into a calm state of mind,\nand then press the spacebar to begin training\n the neural network.";
    this.style={ font: "24px Arial", fill: "#eee", align: "center" };
    this.text = game.add.text(game.world.centerX, game.world.centerY, text, this.style);
    this.text.anchor.setTo(0.5, 0.5);
    this.stage = 0;
    this.total = 0;
    this.timer = game.time.create(false);
    this.timer.loop(1000, this.updateCounter, this);

    this.keys = game.input.keyboard;
    this.keys.addCallbacks(this,function(e){
      if(e.keyCode == 32 && !this.timer.running){
        requestByStage(Math.floor(this.stage));
      }
    });
  },
  requestByStage: function(stage){
    switch(stage){
      case 0:
        this.timer.start();
        $.post('/startTrain/idle', function(data, status){
          this.trainingData.idle.concat(label.reduce(function(prev, cur){
            return prev.concat(cur);
          }));
          setStage(1);
        });
        this.text.setText("Listening");
        break;
      case 1: case 2:
        this.timer.start();
        $.post('/startTrain/up', function(data, status){
          this.trainingData.up = label.reduce(function(prev, cur){
            return prev.concat(cur);
          });
          setStage(stage+1);
        });
        this.text.setText("Listening");
        break;
      case 3: case 4:
        this.timer.start();
        $.post('/startTrain/down', function(data, status){
          this.trainingData.down.concat(label.reduce(function(prev, cur){
            return prev.concat(cur);
          }));
          setStage(stage+1);
        });
        this.text.setText("Listening");
        break;
      case 5: case 6: case 7:
        this.timer.start();
        $.post('/startTrain/left', function(data, status){
          this.trainingData.left.concat(label.reduce(function(prev, cur){
            return prev.concat(cur);
          }));
          setStage(stage+1);
        });
        this.text.setText("Listening");
        break;
      case 8: case 9: case 10:
        this.timer.start();
        $.post('/startTrain/right', function(data, status){
          this.trainingData.right.concat(label.reduce(function(prev, cur){
            return prev.concat(cur);
          }));
          setStage(stage+1);
        });
        this.text.setText("Listening");
        break;
    }
  },
  updateCounter: function(){
    this.text.setTest(this.text + ".");
  },
  setStage: function(stage){
    this.stage = stage;
    switch(stage){
      case 1:
        this.timer.stop();
        this.text.setText("Next, tilt your head up and back \n down again slowly. Press space to begin.");
        break;
      case 6: case 9:
        this.timer.stop();
        this.text.setText("and again..");
        setTimeout(function(){requestByStage(this.stage)}, 1000);
        break;
      case 2: case 4: case 7: case 10:
        this.timer.stop();
        this.text.setText("and once more.");
        setTimeout(function(){requestByStage(this.stage)}, 1000);
        break;
      case 3:
        this.timer.stop();
        this.text.setText("Next, tilt your head down and back \n up again slowly. Press space to begin.");
        break;
      case 5:
        this.timer.stop();
        this.text.setText("Next, turn you head to the left \nand back again slowly. Press space to begin.");
        break;
      case 8:
        this.timer.stop();
        this.text.setText("Lastly, turn you head to the left \nand back again slowly. Press space to begin.");
        break;
      case 11:
        this.trained = true;
        this.text.setText("Good job. Now You're ready to play!");
    }
  },
  update: function(){
  }
};
