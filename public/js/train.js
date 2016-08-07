var trainState = {
  preload: function(){},

  create: function(){
    game.stage.backgroundColor = "#333";
    var text="Please get into a calm state of mind,\nand then press the spacebar to begin training\n the neural network.";
    this.style={ font: "24px Arial", fill: "#eee", align: "center" };
    this.text = game.add.text(game.world.centerX, game.world.centerY, text, this.style);
    this.text.anchor.setTo(0.5, 0.5);
    this.stage = 0;
    this.total = 0;

    this.keys = game.input.keyboard;
    this.keys.addCallbacks(this,function(e){
      if(e.keyCode == 32 && this.stage%2 === 0){
        switch(this.stage){
          case 0:
            this.timer.start();
            $.post('/startTrain/idle', function(data, status){
              ///
              setStage(2);
            });
            this.text.setText("0");
            break;
          case 2: case 4:
            this.total = 0;
            this.text.setText(0);
            break;
        }
      }
    });
    this.timer = game.time.create(false);
    this.timer.loop(1000, this.updateCounter, this);
  },
  updateCounter: function(){
    this.total++;
    this.text.setText(this.total);
  },
  setStage: function(stage){
    this.stage = stage;
    switch(2)}{
      this.timer.stop();
      this.total = 0;
      this.text.setText("Next, turn your head to the right and back \nagain slowly. Press space to begin.");
    }
  },
  update: function(){
    switch(this.stage){
      case 1:
        if(this.timer.seconds > 5){
          this.timer.destroy();
          this.stage++;
          this.total = 0;
          this.text.setText("Next, turn your head to the right \nslowly three times. Press space to begin.");
        } break;
      case 3:
        this.text.setText(this.total);
        if(this.total > 2){
          this.total = 0;
          this.stage++;
          this.text.setText("Next, turn your head to the left \nslowly three times. Press space to begin.");
        } break;

    }
  }
};
