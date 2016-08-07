
var game = new Phaser.Game(800, 800, Phaser.AUTO, '');

game.state.add('train', trainState);
game.state.add('play', playState);
game.state.add('puzzle', puzzleState);

game.state.start('train');
