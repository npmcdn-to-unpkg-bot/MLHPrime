
var game = new Phaser.Game(600, 600, Phaser.AUTO, '');

game.state.add('play', playState);
game.state.add('puzzle', puzzleState);

game.state.start('play');
